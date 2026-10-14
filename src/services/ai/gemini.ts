import { GoogleGenAI } from '@google/genai';
import { ExtractedFacts, ExtractedFactsSchema, CitizenProfile } from '@/schemas/citizen';
import { Scheme } from '@/schemas/scheme';
import { EligibilityStatus } from '../rules/types';
import {
  SYSTEM_INSTRUCTION_EXTRACTION,
  buildExtractionUserPrompt,
  SYSTEM_INSTRUCTION_EXPLANATION,
  buildExplanationUserPrompt,
} from './prompts';
import { extractionCache, explanationCache } from './cache';
import { logger } from '@/lib/logger';

// Default model name configured from environment variable
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let clientInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return null;
  }
  if (!clientInstance) {
    clientInstance = new GoogleGenAI({ apiKey });
  }
  return clientInstance;
}

/**
 * Fallback heuristic extractor when running without API keys (e.g. offline tests or local evaluation).
 */
export function heuristicExtract(
  text: string,
  current?: CitizenProfile,
): ExtractedFacts {
  const lower = text.toLowerCase();
  const profile: CitizenProfile = { ...(current || {}) };
  const confidence: Record<string, number> = {};

  // AP resident check
  if (
    lower.includes('andhra') ||
    lower.includes('ap') ||
    lower.includes('ఆంధ్ర') ||
    lower.includes('guntur') ||
    lower.includes('krishna') ||
    lower.includes('vijayawada') ||
    lower.includes('visakhapatnam') ||
    lower.includes('కృష్ణా') ||
    lower.includes('గుంటూరు') ||
    lower.includes('ఆంధ్రప్రదేశ్')
  ) {
    profile.is_andhra_pradesh_resident = true;
    confidence.is_andhra_pradesh_resident = 0.95;
  }

  // Age extraction
  const ageMatch = text.match(/(?:age|వయస్సు|उम्र|aged|years? old)\s*[:=]?\s*(\d{1,3})/i) ||
                   text.match(/(\d{1,3})\s*(?:years? old|ఏళ్ళ|సంవత్సరాల|साल)/i);
  if (ageMatch && ageMatch[1]) {
    const ageNum = parseInt(ageMatch[1], 10);
    if (ageNum >= 0 && ageNum <= 120) {
      profile.age = ageNum;
      confidence.age = 0.9;
    }
  }

  // Land acres extraction
  const landMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:acres?|ఎకరాలు|एकड़)/i);
  if (landMatch && landMatch[1]) {
    profile.land_ownership_acres = parseFloat(landMatch[1]);
    confidence.land_ownership_acres = 0.9;
  }

  // Income extraction
  const incomeMatch = text.match(/(?:income|ఆదాయం|आय|salary)\s*[:=]?\s*(?:₹|rs\.?|inr)?\s*(\d+)/i) ||
                     text.match(/(?:₹|rs\.?)\s*(\d+)/i);
  if (incomeMatch && incomeMatch[1]) {
    profile.annual_income = parseInt(incomeMatch[1], 10);
    confidence.annual_income = 0.85;
  }

  // Occupation extraction
  if (lower.includes('farmer') || lower.includes('రైతు') || lower.includes('किसान') || lower.includes('agriculture')) {
    profile.occupation = 'FARMER';
    confidence.occupation = 0.95;
  } else if (lower.includes('weaver') || lower.includes('నేతన్న') || lower.includes('చేనేత') || lower.includes('बुनकर')) {
    profile.occupation = 'WEAVER';
    confidence.occupation = 0.95;
  } else if (lower.includes('widow') || lower.includes('వితంతువు') || lower.includes('विधवा')) {
    profile.occupation = 'WIDOW';
    confidence.occupation = 0.9;
  }

  // Gender extraction
  if (lower.includes('woman') || lower.includes('female') || lower.includes('మహిళ') || lower.includes('స్త్రీ') || lower.includes('महिला') || lower.includes('mother') || lower.includes('తల్లి')) {
    profile.gender = 'FEMALE';
    confidence.gender = 0.9;
  } else if (lower.includes('man') || lower.includes('male') || lower.includes('పురుషుడు') || lower.includes('पुरुष')) {
    profile.gender = 'MALE';
    confidence.gender = 0.9;
  }

  // Caste extraction
  if (lower.includes(' bc') || lower.includes('బీసీ') || lower.includes('पिछड़ा')) {
    profile.caste_category = 'BC';
    confidence.caste_category = 0.9;
  } else if (lower.includes(' sc') || lower.includes('ఎస్సీ')) {
    profile.caste_category = 'SC';
    confidence.caste_category = 0.9;
  } else if (lower.includes(' st') || lower.includes('ఎస్టీ')) {
    profile.caste_category = 'ST';
    confidence.caste_category = 0.9;
  }

  // White ration card / Rice card
  if (lower.includes('white ration card') || lower.includes('rice card') || lower.includes('రేషన్ కార్డు') || lower.includes('రాషన్ కార్డ్') || lower.includes('రైస్ కార్డు')) {
    profile.has_white_ration_card = true;
    confidence.has_white_ration_card = 0.9;
  }

  // School going children
  if (lower.includes('school') || lower.includes('బడి') || lower.includes('పాఠశాల') || lower.includes('बच्चे') || lower.includes('స్కూల్')) {
    profile.has_school_going_children = true;
    confidence.has_school_going_children = 0.85;
  }

  const missingCritical: string[] = [];
  if (profile.is_andhra_pradesh_resident === undefined) missingCritical.push('is_andhra_pradesh_resident');
  if (profile.age === undefined) missingCritical.push('age');
  if (profile.occupation === undefined) missingCritical.push('occupation');

  let followUp = null;
  if (missingCritical.includes('age')) {
    followUp = {
      field: 'age',
      question: {
        en: 'Could you please confirm your age?',
        te: 'దయచేసి మీ వయస్సు ఎంతో నిర్ధారించగలరా?',
        hi: 'क्या आप कृपया अपनी आयु बता सकते हैं?',
      },
    };
  } else if (missingCritical.includes('occupation')) {
    followUp = {
      field: 'occupation',
      question: {
        en: 'What is your primary occupation or source of livelihood?',
        te: 'మీ ప్రధాన వృత్తి లేదా జీవనోపాధి ఏమిటి?',
        hi: 'आपका मुख्य व्यवसाय या आजीविका का साधन क्या है?',
      },
    };
  }

  return {
    profile,
    confidence,
    missing_critical_fields: missingCritical,
    follow_up_question: followUp,
  };
}

/**
 * Extracts structured facts from user input using Gemini API with schema validation.
 */
export async function extractCitizenFacts(
  userInput: string,
  currentProfile?: CitizenProfile,
  language: 'en' | 'te' | 'hi' = 'en',
): Promise<ExtractedFacts> {
  const cacheKey = `extract:${language}:${userInput}`;
  const cached = extractionCache.get(cacheKey) as ExtractedFacts | null;
  if (cached) {
    logger.info('Returning cached extraction result');
    return cached;
  }

  const client = getGeminiClient();
  if (!client) {
    logger.info('Gemini API key not configured. Using deterministic heuristic extraction fallback.');
    const result = heuristicExtract(userInput, currentProfile);
    extractionCache.set(cacheKey, result);
    return result;
  }

  try {
    const prompt = buildExtractionUserPrompt(userInput, currentProfile, language);
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_EXTRACTION,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const rawText = response.text || '';
    logger.info('Gemini extraction raw response received');

    // Parse untrusted model output safely
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      // Regex extraction fallback if enclosed in code blocks
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedJson = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Model did not return valid JSON');
      }
    }

    const validated = ExtractedFactsSchema.parse(parsedJson);
    extractionCache.set(cacheKey, validated);
    return validated;
  } catch (err) {
    logger.error('Gemini extraction error, falling back to heuristic extractor', err);
    const fallback = heuristicExtract(userInput, currentProfile);
    extractionCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Generates an empathetic plain-language explanation for a scheme outcome.
 */
export async function generateSchemeExplanation(
  scheme: Scheme,
  decision: EligibilityStatus,
  matchedRules: string[],
  unmatchedRules: string[],
  missingFacts: string[],
  language: 'en' | 'te' | 'hi' = 'en',
): Promise<string> {
  const cacheKey = `explain:${scheme.id}:${decision}:${language}:${matchedRules.join(',')}`;
  const cached = explanationCache.get(cacheKey);
  if (cached) return cached;

  const client = getGeminiClient();
  if (!client) {
    // Deterministic plain-language fallback
    let fallbackText = '';
    const schemeName = scheme.name[language] || scheme.name.en;

    if (decision === 'LIKELY_ELIGIBLE') {
      if (language === 'te') {
        fallbackText = `మీరు ${schemeName} పథకానికి కావలసిన ముఖ్య నిబంధనలను సంతృప్తిపరిచారు (${matchedRules.join(', ')}). మీరు ఈ పథకం ద్వారా లబ్ధి పొందవచ్చు. గ్రామ/వార్డు సచివాలయాన్ని సంప్రదించి అవసరమైన పత్రాలను సమర్పించండి. దరఖాస్తుకు ముందు అధికారులతో నిర్ధారించుకోండి.`;
      } else if (language === 'hi') {
        fallbackText = `आप ${schemeName} योजना के आवश्यक मानदंडों को पूरा करते हैं (${matchedRules.join(', ')}). आप इस योजना का लाभ उठाने के पात्र हैं। कृपया अपने ग्राम/वार्ड सचिवालय में जरूरी दस्तावेज जमा करें। आवेदन से पहले कार्यालय से पुष्टि अवश्य करें।`;
      } else {
        fallbackText = `You appear to satisfy the core eligibility criteria for ${schemeName} (${matchedRules.join(', ')}). You can proceed to gather the required documents and submit your application at your local Grama/Ward Sachivalayam. Always verify with the office before applying.`;
      }
    } else if (decision === 'POSSIBLY_ELIGIBLE') {
      if (language === 'te') {
        fallbackText = `మీరు కొన్ని అర్హతలను చేరుకున్నారు, కానీ కొన్ని వివరాలు (${missingFacts.join(', ')}) ఇంకా నిర్ధారించబడలేదు. మీ సచివాలయ అధికారిని సంప్రదించి మీ రికార్డులను పరిశీలించండి.`;
      } else if (language === 'hi') {
        fallbackText = `आप कुछ मानदंडों को पूरा करते हैं, परंतु कुछ विवरणों (${missingFacts.join(', ')}) का सत्यापन बाकी है। कृपया सचिवालय से संपर्क करें।`;
      } else {
        fallbackText = `You meet key conditions, but some criteria (${missingFacts.join(', ')}) require confirmation at your local office.`;
      }
    } else {
      if (language === 'te') {
        fallbackText = `ప్రస్తుత వివరాల ప్రకారం మీ అర్హత స్పష్టంగా లేదు. సరైన సమాచారం కోసం మీ స్థానిక గ్రామ సచివాలయంలో సంప్రదించండి.`;
      } else if (language === 'hi') {
        fallbackText = `वर्तमान जानकारी के अनुसार पात्रता स्पष्ट नहीं है। कृपया अपने नजदीकी ग्राम सचिवालय से मार्गदर्शन प्राप्त करें।`;
      } else {
        fallbackText = `Based on the provided information, eligibility could not be confirmed. Please check with your Grama Sachivalayam office.`;
      }
    }

    explanationCache.set(cacheKey, fallbackText);
    return fallbackText;
  }

  try {
    const prompt = buildExplanationUserPrompt(
      scheme,
      decision,
      matchedRules,
      unmatchedRules,
      missingFacts,
      language,
    );

    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_EXPLANATION,
        temperature: 0.2,
      },
    });

    const result = response.text || '';
    explanationCache.set(cacheKey, result);
    return result;
  } catch (err) {
    logger.error('Gemini explanation error, using fallback template', err);
    const fallback = `Assessment for ${scheme.name[language] || scheme.name.en}: ${decision}. Verify with your local Grama Sachivalayam before applying.`;
    return fallback;
  }
}

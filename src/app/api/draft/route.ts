import { NextRequest, NextResponse } from 'next/server';
import { DraftRequestSchema } from '@/schemas/api';
import { getSchemeById } from '@/services/data/schemes';
import { createErrorResponse, AppError } from '@/lib/errors';
import { redactSensitiveData } from '@/lib/redactor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = DraftRequestSchema.safeParse(body);
    if (!validated.success) {
      throw new AppError('Invalid draft request payload', 'VALIDATION_ERROR', 400, validated.error.format());
    }

    const { scheme_id, language, profile, applicant_name, district, mandal, village_ward } =
      validated.data;

    const scheme = getSchemeById(scheme_id);
    if (!scheme) {
      throw new AppError(`Scheme ${scheme_id} not found`, 'SCHEME_NOT_FOUND', 404);
    }

    const schemeName = scheme.name[language] || scheme.name.en;
    const dateStr = new Date().toISOString().split('T')[0];

    // Build plain text draft application
    const lines = [
      '=====================================================================',
      '                   SEVASETU (సేవాసేతు)                              ',
      '      PRE-FILLED CITIZEN DRAFT WELFARE APPLICATION ASSISTANCE FORM   ',
      '=====================================================================',
      '',
      `Date Generated: ${dateStr}`,
      `Scheme Name: ${schemeName}`,
      `Official Government Portal: ${scheme.official_source_url}`,
      `Scheme Data Last Verified: ${scheme.last_verified_date} (${scheme.data_status})`,
      '',
      '---------------------------------------------------------------------',
      'IMPORTANT CITIZEN NOTICE:                                           ',
      'Verify with the office before applying.                              ',
      'SevaSetu is an informational aid, not an official government service.  ',
      'Take this pre-filled draft to your nearest Grama/Ward Sachivalayam.  ',
      '---------------------------------------------------------------------',
      '',
      '1. APPLICANT DETAILS (దరఖాస్తుదారు వివరాలు):',
      `   Full Name: ${applicant_name || '__________________________'}`,
      `   Age: ${profile.age !== undefined ? `${profile.age} years` : '____________'}`,
      `   Gender: ${profile.gender || '____________'}`,
      `   Caste / Category: ${profile.caste_category || '____________'}`,
      `   Occupation: ${profile.occupation || '____________'}`,
      `   Annual Household Income: ${profile.annual_income !== undefined ? `₹${profile.annual_income}` : '____________'}`,
      `   Land Owned / Cultivated: ${profile.land_ownership_acres !== undefined ? `${profile.land_ownership_acres} Acres` : 'N/A'}`,
      `   White Ration Card / Rice Card: ${profile.has_white_ration_card ? 'YES' : 'NO / Not Specified'}`,
      `   District: ${district || 'Andhra Pradesh'}`,
      `   Mandal: ${mandal || '__________________________'}`,
      `   Village / Ward: ${village_ward || '__________________________'}`,
      `   Identity Document: [Aadhaar card to be verified in person at Sachivalayam]`,
      '',
      '2. CHECKLIST OF REQUIRED DOCUMENTS (అవసరమైన పత్రాలు):',
      ...scheme.required_documents.map(
        (doc, idx) =>
          `   [ ] ${idx + 1}. ${doc.name[language] || doc.name.en} (${doc.is_mandatory ? 'MANDATORY' : 'OPTIONAL'}) - ${doc.purpose[language] || doc.purpose.en}`,
      ),
      '',
      '3. SUBMISSION STEPS & DESIGNATED OFFICE:',
      `   Target Office: ${scheme.office_contact_info.office_name}`,
      `   Department: ${scheme.office_contact_info.department}`,
      `   Toll-free Helpline: ${scheme.office_contact_info.helpline}`,
      '',
      ...scheme.submission_steps.map(
        (step) =>
          `   Step ${step.step_number}: ${step.title[language] || step.title.en}\n     Instructions: ${step.instructions[language] || step.instructions.en}\n     Office: ${step.office}\n`,
      ),
      '4. DECLARATION:',
      '   I hereby declare that the particulars stated above are true to the best of my knowledge.',
      '',
      '',
      '   Applicant Signature / Thumb Impression: ___________________________',
      '=====================================================================',
    ];

    const draftText = redactSensitiveData(lines.join('\n'));

    return new NextResponse(draftText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="sevasetu-draft-${scheme.id}.txt"`,
      },
    });
  } catch (err) {
    return createErrorResponse(err, 'Failed to generate pre-filled draft application');
  }
}

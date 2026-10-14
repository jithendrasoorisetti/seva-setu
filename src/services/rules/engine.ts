import { RuleDefinition } from '@/schemas/rules';
import { CitizenProfile } from '@/schemas/citizen';
import { Scheme } from '@/schemas/scheme';
import {
  EligibilityStatus,
  RuleEvaluationResult,
  SchemeEvaluationResult,
} from './types';

/**
 * Pure function to evaluate a single rule node against a citizen profile.
 */
export function evaluateRule(
  rule: RuleDefinition,
  profile: CitizenProfile,
): RuleEvaluationResult {
  const desc = rule.description || `${rule.type} on ${(rule as { field?: string }).field || 'condition'}`;

  switch (rule.type) {
    case 'numeric_max': {
      const val = profile[rule.field as keyof CitizenProfile];
      if (val === undefined || val === null) {
        return {
          passed: false,
          isIndeterminate: true,
          missingField: rule.field,
          description: desc,
        };
      }
      const numVal = Number(val);
      const passed = !isNaN(numVal) && numVal <= rule.value;
      return {
        passed,
        isIndeterminate: false,
        description: desc,
      };
    }

    case 'numeric_min': {
      const val = profile[rule.field as keyof CitizenProfile];
      if (val === undefined || val === null) {
        return {
          passed: false,
          isIndeterminate: true,
          missingField: rule.field,
          description: desc,
        };
      }
      const numVal = Number(val);
      const passed = !isNaN(numVal) && numVal >= rule.value;
      return {
        passed,
        isIndeterminate: false,
        description: desc,
      };
    }

    case 'equals': {
      const val = profile[rule.field as keyof CitizenProfile];
      if (val === undefined || val === null) {
        return {
          passed: false,
          isIndeterminate: true,
          missingField: rule.field,
          description: desc,
        };
      }
      let passed = false;
      if (typeof val === 'string' && typeof rule.value === 'string') {
        passed = val.trim().toUpperCase() === rule.value.trim().toUpperCase();
      } else {
        passed = val === rule.value;
      }
      return {
        passed,
        isIndeterminate: false,
        description: desc,
      };
    }

    case 'one_of': {
      const val = profile[rule.field as keyof CitizenProfile];
      if (val === undefined || val === null) {
        return {
          passed: false,
          isIndeterminate: true,
          missingField: rule.field,
          description: desc,
        };
      }
      const normalizedVal = typeof val === 'string' ? val.trim().toUpperCase() : val;
      const passed = rule.values.some((v) => {
        if (typeof v === 'string' && typeof normalizedVal === 'string') {
          return v.trim().toUpperCase() === normalizedVal;
        }
        return v === normalizedVal;
      });
      return {
        passed,
        isIndeterminate: false,
        description: desc,
      };
    }

    case 'boolean_true': {
      const val = profile[rule.field as keyof CitizenProfile];
      if (val === undefined || val === null) {
        return {
          passed: false,
          isIndeterminate: true,
          missingField: rule.field,
          description: desc,
        };
      }
      return {
        passed: val === true,
        isIndeterminate: false,
        description: desc,
      };
    }

    case 'all': {
      let anyIndeterminate = false;
      let missingField: string | undefined;

      for (const childRule of rule.rules) {
        const childRes = evaluateRule(childRule, profile);
        if (!childRes.passed && !childRes.isIndeterminate) {
          // Hard failure
          return {
            passed: false,
            isIndeterminate: false,
            description: desc,
          };
        }
        if (childRes.isIndeterminate) {
          anyIndeterminate = true;
          if (!missingField && childRes.missingField) {
            missingField = childRes.missingField;
          }
        }
      }

      if (anyIndeterminate) {
        return {
          passed: false,
          isIndeterminate: true,
          missingField,
          description: desc,
        };
      }

      return {
        passed: true,
        isIndeterminate: false,
        description: desc,
      };
    }

    case 'any': {
      let anyPassed = false;
      let anyIndeterminate = false;
      let missingField: string | undefined;

      for (const childRule of rule.rules) {
        const childRes = evaluateRule(childRule, profile);
        if (childRes.passed) {
          anyPassed = true;
          break;
        }
        if (childRes.isIndeterminate) {
          anyIndeterminate = true;
          if (!missingField && childRes.missingField) {
            missingField = childRes.missingField;
          }
        }
      }

      if (anyPassed) {
        return {
          passed: true,
          isIndeterminate: false,
          description: desc,
        };
      }

      if (anyIndeterminate) {
        return {
          passed: false,
          isIndeterminate: true,
          missingField,
          description: desc,
        };
      }

      return {
        passed: false,
        isIndeterminate: false,
        description: desc,
      };
    }

    default: {
      return {
        passed: false,
        isIndeterminate: false,
        description: 'Unknown rule type',
      };
    }
  }
}

/**
 * Collect all leaf-level rules and details for a scheme
 */
function collectLeafResults(
  rule: RuleDefinition,
  profile: CitizenProfile,
  matched: string[],
  unmatched: string[],
  missing: string[],
) {
  if (rule.type === 'all' || rule.type === 'any') {
    for (const child of rule.rules) {
      collectLeafResults(child, profile, matched, unmatched, missing);
    }
    return;
  }

  const res = evaluateRule(rule, profile);
  const desc = rule.description || `${rule.field}`;
  if (res.passed) {
    matched.push(desc);
  } else if (res.isIndeterminate) {
    if (res.missingField && !missing.includes(res.missingField)) {
      missing.push(res.missingField);
    }
  } else {
    unmatched.push(desc);
  }
}

/**
 * Deterministically evaluates a scheme for a citizen profile.
 * Core principle: LLM never decides eligibility.
 */
export function evaluateScheme(
  scheme: Scheme,
  profile: CitizenProfile,
): SchemeEvaluationResult {
  const topResult = evaluateRule(scheme.eligibility_rules, profile);
  const matchedRules: string[] = [];
  const unmatchedRules: string[] = [];
  const missingFacts: string[] = [];

  collectLeafResults(
    scheme.eligibility_rules,
    profile,
    matchedRules,
    unmatchedRules,
    missingFacts,
  );

  let status: EligibilityStatus;
  let decisionRule = '';

  if (topResult.passed) {
    status = 'LIKELY_ELIGIBLE';
    decisionRule = `All ${matchedRules.length} eligibility criteria satisfied.`;
  } else if (!topResult.isIndeterminate) {
    status = 'NOT_ELIGIBLE';
    decisionRule = unmatchedRules.length > 0
      ? `Did not satisfy: ${unmatchedRules[0]}`
      : 'Did not meet official criteria.';
  } else {
    // Indeterminate case: check how many critical facts were missing
    if (matchedRules.length > 0 && missingFacts.length <= 2) {
      status = 'POSSIBLY_ELIGIBLE';
      decisionRule = `Met key criteria (${matchedRules[0]}), but needs verification of ${missingFacts.join(', ')}.`;
    } else {
      status = 'CHECK_WITH_OFFICE';
      decisionRule = missingFacts.length > 0
        ? `Missing verification for ${missingFacts.join(', ')}. Consult Grama Sachivalayam.`
        : 'Consult village office for documentation confirmation.';
    }
  }

  const totalRules = matchedRules.length + unmatchedRules.length + missingFacts.length;
  const score = totalRules > 0 ? matchedRules.length / totalRules : 0;

  return {
    scheme_id: scheme.id,
    status,
    score,
    matched_rules: matchedRules,
    unmatched_rules: unmatchedRules,
    missing_facts: missingFacts,
    decision_rule: decisionRule,
  };
}

/**
 * Evaluates all schemes in data source and sorts by eligibility priority.
 */
export function evaluateAllSchemes(
  schemes: Scheme[],
  profile: CitizenProfile,
): SchemeEvaluationResult[] {
  const results = schemes.map((s) => evaluateScheme(s, profile));

  const priorityOrder: Record<EligibilityStatus, number> = {
    LIKELY_ELIGIBLE: 1,
    POSSIBLY_ELIGIBLE: 2,
    CHECK_WITH_OFFICE: 3,
    NOT_ELIGIBLE: 4,
  };

  return results.sort((a, b) => {
    const priorityDiff = priorityOrder[a.status] - priorityOrder[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    return b.score - a.score;
  });
}

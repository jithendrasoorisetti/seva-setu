export type EligibilityStatus =
  | 'LIKELY_ELIGIBLE'
  | 'POSSIBLY_ELIGIBLE'
  | 'CHECK_WITH_OFFICE'
  | 'NOT_ELIGIBLE';

export interface RuleEvaluationResult {
  passed: boolean;
  isIndeterminate: boolean; // Fact was missing/undefined
  missingField?: string;
  description: string;
}

export interface SchemeEvaluationResult {
  scheme_id: string;
  status: EligibilityStatus;
  score: number; // 0 to 1
  matched_rules: string[];
  unmatched_rules: string[];
  missing_facts: string[];
  decision_rule: string;
}

import { AkadCategory } from "./akad";

export type RuleSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";

export type ValidationStatus = "COMPLIANT" | "NON_COMPLIANT" | "WARNING" | "NEEDS_MANUAL_REVIEW";

export interface ShariaRuleDefinition {
  ruleCode: string;
  title: string;
  akadCategory: AkadCategory | "GLOBAL";
  severity: RuleSeverity;
  description: string;
  dsnMuiRef?: string;
  aaoifiRef?: string;
  remediationGuidance: string;
  validator: (payload: Record<string, unknown>) => {
    isCompliant: boolean;
    reason?: string;
    suggestedCorrection?: string;
  };
}

export interface RuleEvaluationResult {
  ruleCode: string;
  title: string;
  severity: RuleSeverity;
  isCompliant: boolean;
  message: string;
  suggestedCorrection?: string;
  dsnMuiRef?: string;
}

export interface ContractValidationReport {
  contractId?: string;
  contractNumber?: string;
  akadCategory: AkadCategory;
  status: ValidationStatus;
  overallScore: number; // 0 - 100
  evaluatedAt: string;
  totalRulesChecked: number;
  criticalViolations: number;
  warnings: number;
  results: RuleEvaluationResult[];
}


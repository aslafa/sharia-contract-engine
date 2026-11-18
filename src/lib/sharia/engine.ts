import { AkadCategory } from "@/types/akad";
import { ContractValidationReport, RuleEvaluationResult, ValidationStatus } from "@/types/sharia";
import { SHARIA_RULES_REGISTRY } from "./rules-registry";

/**
 * Sharia Rule Evaluation Engine
 * Validates contract parameters against Fatwa DSN-MUI and AAOIFI standards.
 */
export class ShariaRuleEngine {
  /**
   * Evaluates a contract payload against all active rules applicable to its Akad.
   */
  public static evaluate(
    akadCategory: AkadCategory,
    payload: Record<string, unknown>,
    options?: { contractId?: string; contractNumber?: string }
  ): ContractValidationReport {
    const applicableRules = SHARIA_RULES_REGISTRY.filter(
      (rule) => rule.akadCategory === akadCategory || rule.akadCategory === "GLOBAL"
    );

    const results: RuleEvaluationResult[] = [];
    let criticalViolations = 0;
    let warnings = 0;

    for (const rule of applicableRules) {
      const evaluation = rule.validator(payload);

      if (!evaluation.isCompliant) {
        if (rule.severity === "CRITICAL") {
          criticalViolations++;
        } else {
          warnings++;
        }
      }

      results.push({
        ruleCode: rule.ruleCode,
        title: rule.title,
        severity: rule.severity,
        isCompliant: evaluation.isCompliant,
        message: evaluation.isCompliant ? "Kepatuhan Terpenuhi Sesuai Fatwa." : (evaluation.reason || "Pelanggaran Syariah."),
        suggestedCorrection: evaluation.suggestedCorrection,
        dsnMuiRef: rule.dsnMuiRef,
      });
    }

    let status: ValidationStatus = "COMPLIANT";
    if (criticalViolations > 0) {
      status = "NON_COMPLIANT";
    } else if (warnings > 0) {
      status = "WARNING";
    }

    // Calculate Sharia Compliance Index (0 - 100)
    const totalRules = applicableRules.length;
    const passedCount = totalRules - (criticalViolations + warnings);
    const overallScore = totalRules > 0 ? Math.round((passedCount / totalRules) * 100) : 100;

    return {
      contractId: options?.contractId,
      contractNumber: options?.contractNumber,
      akadCategory,
      status,
      overallScore,
      evaluatedAt: new Date().toISOString(),
      totalRulesChecked: totalRules,
      criticalViolations,
      warnings,
      results,
    };
  }
}


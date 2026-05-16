"use client";

import { useState, useEffect } from "react";
import type { SmartValidation } from "@/lib/ai-validator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface SmartValidatorDialogProps {
  goals: { title: string; description: string }[];
  open: boolean;
  onClose: () => void;
  onAcceptSuggestion: (index: number, newTitle: string) => void;
  onProceed: () => void;
}

const CRITERIA_LABELS: Record<string, string> = {
  specific: "Specific",
  measurable: "Measurable",
  achievable: "Achievable",
  relevant: "Relevant",
  timeBound: "Time-bound",
};

function getScoreCls(score: number): string {
  if (score <= 2) return "bg-red-50 text-red-700";
  if (score === 3) return "bg-yellow-50 text-yellow-700";
  return "bg-green-50 text-green-700";
}

export function SmartValidatorDialog({
  goals,
  open,
  onClose,
  onAcceptSuggestion,
  onProceed,
}: SmartValidatorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<SmartValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewedIndices, setReviewedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open && goals.length > 0) {
      setLoading(true);
      setValidation(null);
      setError(null);
      setReviewedIndices(new Set());

      fetch("/api/validate-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Validation failed");
          }
          return res.json();
        })
        .then((data: SmartValidation) => {
          setValidation(data);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, goals]);

  const allPassed = validation?.goals.every((g) => g.passed) ?? false;
  const failedGoals = validation?.goals.filter((g) => !g.passed) ?? [];
  const allReviewed =
    failedGoals.length === 0 || failedGoals.every((g) => reviewedIndices.has(g.index));

  function cleanSuggestion(raw: string): string {
    // Strip common AI preambles like "Define a specific goal, such as '...'"
    let cleaned = raw.trim();
    // Extract quoted content if the suggestion is wrapped in quotes
    const quotedMatch = cleaned.match(/['""]([^'""]+)['""]\.?$/);
    if (quotedMatch) {
      cleaned = quotedMatch[1].trim();
    }
    // Remove trailing period if present
    cleaned = cleaned.replace(/\.$/, "").trim();
    return cleaned;
  }

  function handleAcceptSuggestion(index: number, suggestion: string) {
    onAcceptSuggestion(index, cleanSuggestion(suggestion));
    setReviewedIndices((prev) => new Set([...prev, index]));
  }

  function handleDismiss(index: number) {
    setReviewedIndices((prev) => new Set([...prev, index]));
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl w-[85vw] max-h-[90vh] overflow-y-auto p-8 bg-white border border-[#E8E2D6]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-semibold tracking-tight text-[#1A1A1A]">
            <Sparkles className="h-5 w-5" style={{ color: "#C45A2D" }} />
            SMART Goal Validation
          </DialogTitle>
          <DialogDescription className="text-sm text-[#5C564C]">
            AI is evaluating your goals against SMART criteria before submission.
          </DialogDescription>
        </DialogHeader>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#C45A2D" }} />
            <p className="text-sm text-[#A89F91]">Analyzing your goals against SMART criteria...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <AlertTriangle className="h-8 w-8 text-[#C08B30]" />
            <p className="text-sm text-[#5C564C]">{error}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="border-[#E8E2D6] text-[#5C564C]">
                Cancel
              </Button>
              <Button onClick={onProceed} className="text-white border-0" style={{ backgroundColor: "#C45A2D" }}>
                Submit Anyway
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {validation && !loading && (
          <div className="flex flex-col gap-4">
            {/* Summary */}
            {allPassed ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-700">All goals meet SMART criteria!</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-700">
                  {failedGoals.length} goal{failedGoals.length > 1 ? "s" : ""} could be improved. Review suggestions below.
                </p>
              </div>
            )}

            {/* Per-goal results */}
            {validation.goals.map((goal) => {
              const borderColor = goal.passed
                ? "border-green-200"
                : reviewedIndices.has(goal.index)
                  ? "border-[#E8E2D6]"
                  : "border-yellow-200";

              return (
                <div
                  key={goal.index}
                  className={`border ${borderColor} rounded-xl bg-white overflow-hidden`}
                >
                  <div className="px-4 py-3 border-b border-[#F5F1EA] flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[#1A1A1A]">{goal.title}</h3>
                    {/* Score badge */}
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-mono text-[10px] font-semibold tabular-nums ${getScoreCls(goal.score)}`}>
                      {goal.score}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex flex-col gap-3">
                    {/* Criteria checklist */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(goal.criteria).map(([key, met]) => (
                        <div key={key} className="flex items-center gap-1 text-xs">
                          {met ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#3D9A5F]" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-[#D94F3D]" />
                          )}
                          <span className={met ? "text-[#3D9A5F]" : "text-[#D94F3D]"}>
                            {CRITERIA_LABELS[key] || key}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Issues and suggestion for failed goals */}
                    {!goal.passed && (
                      <>
                        {goal.issues.length > 0 && (
                          <div className="text-xs text-[#A89F91]">
                            Issues: {goal.issues.join(", ")}
                          </div>
                        )}
                        <div className="bg-[#FEFCF9] rounded-xl p-3 border border-[#E8E2D6]">
                          <p className="text-xs font-medium text-[#5C564C] mb-1">
                            Suggested improvement:
                          </p>
                          <p className="text-sm text-[#1A1A1A]">{goal.suggestion}</p>
                          {!reviewedIndices.has(goal.index) && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDismiss(goal.index)}
                                className="text-xs h-7 border-[#E8E2D6] text-[#5C564C]"
                              >
                                Keep Original
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptSuggestion(goal.index, goal.suggestion)}
                                className="text-xs h-7 text-white border-0"
                                style={{ backgroundColor: "#C45A2D" }}
                              >
                                Accept Suggestion
                              </Button>
                            </div>
                          )}
                          {reviewedIndices.has(goal.index) && (
                            <p className="text-xs text-[#A89F91] mt-2">Reviewed</p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Passed indicator */}
                    {goal.passed && (
                      <div className="flex items-center gap-1 text-xs text-[#3D9A5F]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Meets SMART criteria
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Footer actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-[#E8E2D6]">
              <Button variant="outline" onClick={onClose} className="border-[#E8E2D6] text-[#5C564C]">
                Cancel
              </Button>
              {!allPassed && (
                <Button
                  variant="outline"
                  onClick={onProceed}
                  disabled={!allReviewed}
                  className="border-[#E8E2D6] text-[#5C564C]"
                >
                  Submit Anyway
                </Button>
              )}
              <Button
                onClick={onProceed}
                disabled={!allPassed && !allReviewed}
                className="text-white border-0"
                style={{ backgroundColor: "#C45A2D" }}
              >
                {allPassed ? "Submit" : "Proceed"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

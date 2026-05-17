"use client";

import { useState, useRef } from "react";
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
  onAcceptSuggestion: (index: number, newTitle: string, newDescription: string) => void;
  onProceed: () => void;
}

const CRITERIA_LABELS: Record<string, string> = {
  specific: "Specific",
  measurable: "Measurable",
  achievable: "Achievable",
  relevant: "Relevant",
  timeBound: "Time-bound",
};

function getScoreColor(score: number): string {
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
  const hasValidated = useRef(false);

  // Validate only ONCE when dialog opens — not on every re-render
  const prevOpen = useRef(false);
  if (open && !prevOpen.current && !hasValidated.current) {
    prevOpen.current = true;
    hasValidated.current = true;
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
        if (!res.ok) throw new Error("Validation failed");
        return res.json();
      })
      .then((data: SmartValidation) => setValidation(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  if (!open && prevOpen.current) {
    prevOpen.current = false;
    hasValidated.current = false;
  }

  const allPassed = validation?.goals.every((g) => g.passed) ?? false;
  const failedGoals = validation?.goals.filter((g) => !g.passed) ?? [];
  const allReviewed = failedGoals.length === 0 || failedGoals.every((g) => reviewedIndices.has(g.index));

  function handleAccept(index: number, suggestion: string, suggestedDesc: string) {
    onAcceptSuggestion(index, suggestion, suggestedDesc);
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
            AI evaluation against Specific, Measurable, Achievable, Relevant, Time-bound criteria.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#C45A2D" }} />
            <p className="text-sm text-[#A89F91]">Analyzing goals...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <AlertTriangle className="h-8 w-8 text-[#C08B30]" />
            <p className="text-sm text-[#5C564C]">{error}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={onProceed} className="text-white" style={{ backgroundColor: "#C45A2D" }}>Submit Anyway</Button>
            </div>
          </div>
        )}

        {validation && !loading && (
          <div className="flex flex-col gap-4">
            {allPassed ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-700">All goals meet SMART criteria!</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-700">
                  {failedGoals.length} goal{failedGoals.length > 1 ? "s" : ""} need improvement.
                </p>
              </div>
            )}

            {validation.goals.map((goal) => (
              <div key={goal.index} className={`border rounded-xl bg-white overflow-hidden ${goal.passed ? "border-green-200" : reviewedIndices.has(goal.index) ? "border-[#E8E2D6]" : "border-yellow-200"}`}>
                <div className="px-5 py-3 border-b border-[#F5F1EA] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">Goal {goal.index + 1}: {goal.title}</h3>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${getScoreColor(goal.score)}`}>
                    {goal.score}/5
                  </span>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(goal.criteria).map(([key, met]) => (
                      <div key={key} className="flex items-center gap-1.5 text-sm">
                        {met ? <CheckCircle2 className="h-4 w-4 text-[#3D9A5F]" /> : <XCircle className="h-4 w-4 text-[#D94F3D]" />}
                        <span className={met ? "text-[#3D9A5F]" : "text-[#D94F3D]"}>{CRITERIA_LABELS[key]}</span>
                      </div>
                    ))}
                  </div>

                  {!goal.passed && (
                    <div className="bg-[#FEFCF9] rounded-xl p-4 border border-[#E8E2D6] space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8C8578]">Suggested Improvement</p>
                      <div>
                        <p className="text-xs text-[#8C8578] mb-0.5">Title:</p>
                        <p className="text-sm font-medium text-[#1A1A1A]">{goal.suggestion}</p>
                      </div>
                      {goal.suggestedDescription && (
                        <div>
                          <p className="text-xs text-[#8C8578] mb-0.5">Description:</p>
                          <p className="text-sm text-[#5C564C]">{goal.suggestedDescription}</p>
                        </div>
                      )}
                      {!reviewedIndices.has(goal.index) && (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" onClick={() => handleDismiss(goal.index)} className="text-xs h-8 border-[#E8E2D6]">
                            Keep Original
                          </Button>
                          <Button size="sm" onClick={() => handleAccept(goal.index, goal.suggestion, goal.suggestedDescription)} className="text-xs h-8 text-white" style={{ backgroundColor: "#C45A2D" }}>
                            Accept Suggestion
                          </Button>
                        </div>
                      )}
                      {reviewedIndices.has(goal.index) && (
                        <p className="text-xs text-[#3D9A5F]">✓ Reviewed</p>
                      )}
                    </div>
                  )}

                  {goal.passed && (
                    <p className="text-xs text-[#3D9A5F] flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> SMART criteria met</p>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E2D6]">
              <Button variant="outline" onClick={onClose} className="border-[#E8E2D6]">Cancel</Button>
              {!allPassed && (
                <Button variant="outline" onClick={onProceed} disabled={!allReviewed} className="border-[#E8E2D6]">
                  Submit Anyway
                </Button>
              )}
              <Button onClick={onProceed} disabled={!allPassed && !allReviewed} className="text-white" style={{ backgroundColor: "#C45A2D" }}>
                {allPassed ? "Submit Goals" : "Proceed"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { GoalCycle, GoalSheet, Goal, Checkin } from "@/lib/types";
import { UOM_LABELS } from "@/lib/constants";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, Loader2, MessageSquare, CheckCircle2 } from "lucide-react";

/* ── Goal status dot + label ── */
function GoalStatusDot({ status }: { status: string }) {
  const map: Record<string, { dot: string; label: string }> = {
    not_started: { dot: "bg-[#A89F91]", label: "Not Started" },
    on_track: { dot: "bg-[#3D9A5F]", label: "On Track" },
    completed: { dot: "bg-[#3D9A5F]", label: "Completed" },
  };
  const s = map[status] || map.not_started;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#5C564C]">
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} shrink-0`} />
      {s.label}
    </span>
  );
}

/* ── Check-in status ── */
function CheckinStatusDot({ done }: { done: boolean }) {
  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[#3D9A5F]">
        <CheckCircle2 className="h-3.5 w-3.5" /> Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#A89F91]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#A89F91] shrink-0" />
      Pending
    </span>
  );
}

interface CheckinsViewProps {
  cycle: GoalCycle;
  sheets: GoalSheet[];
  existingCheckins: Checkin[];
  managerId: string;
}

function computeProgressScore(goals: Goal[]): number {
  if (!goals || goals.length === 0) return 0;
  let weightedScore = 0;
  let totalWeight = 0;

  for (const goal of goals) {
    const achievement = goal.achievements?.[0];
    const actual = achievement?.actual_value ?? 0;
    const target = goal.target_value || 1;
    const pct = Math.min((actual / target) * 100, 100);
    weightedScore += pct * goal.weightage;
    totalWeight += goal.weightage;
  }

  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-[#3D9A5F]";
  if (score >= 50) return "text-[#C08B30]";
  if (score > 0) return "text-[#D94F3D]";
  return "text-[#A89F91]";
}

export function CheckinsView({
  cycle,
  sheets,
  existingCheckins,
  managerId,
}: CheckinsViewProps) {
  const [selectedSheet, setSelectedSheet] = useState<GoalSheet | null>(null);
  const [comment, setComment] = useState("");
  const [progressOverride, setProgressOverride] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const checkinMap = new Map(
    existingCheckins.map((c) => [c.employee_id, c])
  );

  function openCheckin(sheet: GoalSheet) {
    setSelectedSheet(sheet);
    const existing = checkinMap.get(sheet.employee_id);
    if (existing) {
      setComment(existing.comment);
      setProgressOverride(
        existing.progress_score !== null ? String(existing.progress_score) : ""
      );
    } else {
      setComment("");
      const score = computeProgressScore(sheet.goals || []);
      setProgressOverride(String(score));
    }
  }

  async function saveCheckin() {
    if (!selectedSheet) return;
    if (!comment.trim()) {
      toast.error("Please add a check-in comment");
      return;
    }
    setLoading(true);
    try {
      const existing = checkinMap.get(selectedSheet.employee_id);
      const score = progressOverride !== "" ? parseInt(progressOverride) : null;

      if (existing) {
        const { error } = await supabase
          .from("checkins")
          .update({
            comment,
            progress_score: score,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("checkins").insert({
          manager_id: managerId,
          employee_id: selectedSheet.employee_id,
          cycle_id: cycle.id,
          comment,
          progress_score: score,
        });
        if (error) throw error;
      }

      toast.success("Check-in saved");
      setSelectedSheet(null);
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to save check-in";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
          Team Check-ins
        </h1>
        <p className="text-sm text-[#A89F91] mt-1">
          {cycle.name} &middot; Window: {cycle.checkin_open} to {cycle.checkin_close}
        </p>
      </div>

      {/* Table card */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl">
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-base font-semibold text-[#1A1A1A]">
            Approved Goal Sheets ({sheets.length})
          </h2>
          <p className="text-xs text-[#A89F91] mt-1">
            Review progress and add structured check-in comments for each team member.
          </p>
        </div>

        <div className="px-5 pb-5">
          <table className="w-full mt-4">
            <thead>
              <tr>
                {["Employee", "Department", "Goals", "Progress", "Check-in", ""].map(
                  (h, hi) => (
                    <th
                      key={hi}
                      className={`text-xs text-[#A89F91] uppercase tracking-wider font-medium pb-3 border-b border-[#F5F1EA] ${
                        hi === 5 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {sheets.map((sheet) => {
                const score = computeProgressScore(sheet.goals || []);
                const existing = checkinMap.get(sheet.employee_id);
                return (
                  <tr
                    key={sheet.id}
                    className="border-b border-[#F5F1EA] last:border-b-0 hover:bg-[#FEFCF9] transition-colors"
                  >
                    <td className="py-3.5 text-sm font-medium text-[#1A1A1A]">
                      {sheet.employee?.full_name}
                    </td>
                    <td className="py-3.5 text-sm text-[#5C564C]">
                      {sheet.employee?.department?.name || "—"}
                    </td>
                    <td className="py-3.5 text-sm text-[#5C564C] font-mono tabular-nums">
                      {sheet.goals?.length || 0}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-20 h-1.5 rounded-full bg-[#F5F1EA] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#1A1A1A]"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-mono tabular-nums font-medium ${scoreColor(score)}`}
                        >
                          {score}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <CheckinStatusDot done={!!existing} />
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => openCheckin(sheet)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E2D6] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1A1A] hover:bg-[#FEFCF9] transition-colors"
                      >
                        {existing ? (
                          <>
                            <Eye className="h-3.5 w-3.5" /> View
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-3.5 w-3.5" /> Check-in
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sheets.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center text-sm text-[#A89F91] py-12"
                  >
                    No approved goal sheets for this cycle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check-in Dialog */}
      <Dialog
        open={!!selectedSheet}
        onOpenChange={(open) => {
          if (!open) setSelectedSheet(null);
        }}
      >
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-8 bg-white border border-[#E8E2D6] rounded-xl">
          {selectedSheet && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold text-[#1A1A1A]">
                  Check-in: {selectedSheet.employee?.full_name}
                </DialogTitle>
                <DialogDescription className="text-sm text-[#A89F91]">
                  {cycle.name} &middot;{" "}
                  <span className="font-mono tabular-nums">
                    {selectedSheet.goals?.length || 0}
                  </span>{" "}
                  goals
                </DialogDescription>
              </DialogHeader>

              {/* Goals progress */}
              <div className="mt-6">
                <h3 className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mb-3">
                  Goal Progress
                </h3>
                <div className="space-y-6">
                  {selectedSheet.goals?.map((goal: Goal, i: number) => {
                    const achievement = goal.achievements?.[0];
                    const actual = achievement?.actual_value ?? 0;
                    const pct =
                      goal.target_value > 0
                        ? Math.min(
                            Math.round((actual / goal.target_value) * 100),
                            100
                          )
                        : 0;
                    return (
                      <div key={goal.id} className="py-4 border-b border-[#F5F1EA] last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-[#F5F1EA] text-[11px] font-semibold text-[#5C564C] font-mono shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-base font-semibold text-[#1A1A1A]">
                              {goal.title}
                            </span>
                          </div>
                          <GoalStatusDot status={achievement?.status || goal.status} />
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs text-[#A89F91] mb-2 ml-7">
                          <div>
                            UoM: <span className="text-[#5C564C]">{UOM_LABELS[goal.uom]}</span>
                          </div>
                          <div>
                            Weight:{" "}
                            <span className="text-[#5C564C] font-mono tabular-nums">
                              {goal.weightage}%
                            </span>
                          </div>
                          <div>
                            Planned:{" "}
                            <span className="text-[#5C564C] font-mono tabular-nums">
                              {goal.target_value}
                            </span>
                          </div>
                          <div>
                            Actual:{" "}
                            <span
                              className={`font-medium font-mono tabular-nums ${
                                actual >= goal.target_value ? "text-[#3D9A5F]" : "text-[#C08B30]"
                              }`}
                            >
                              {actual}
                            </span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full bg-[#F5F1EA] overflow-hidden ml-7">
                          <div
                            className="h-full rounded-full bg-[#1A1A1A] transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {achievement?.notes && (
                          <p className="text-xs text-[#A89F91] italic mt-2 ml-7">
                            Employee note: {achievement.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manager check-in form */}
              <div className="border-t border-[#F5F1EA] pt-5 mt-6 space-y-4">
                <h3 className="text-xs text-[#A89F91] uppercase tracking-wider font-medium">
                  Manager Check-in
                </h3>
                <div>
                  <Label className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mb-1.5 block">
                    Progress Score (0-100)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={progressOverride}
                    onChange={(e) => setProgressOverride(e.target.value)}
                    className="w-32 bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] font-mono tabular-nums focus:border-[#1A1A1A] focus:ring-0"
                  />
                  <p className="text-xs text-[#A89F91] mt-1.5">
                    Auto-computed from actuals, override if needed.
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mb-1.5 block">
                    Check-in Comment
                  </Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Performance observations, guidance, blockers discussed..."
                    rows={4}
                    className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#A89F91] focus:border-[#1A1A1A] focus:ring-0 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedSheet(null)}
                    className="rounded-lg border border-[#E8E2D6] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#FEFCF9] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCheckin}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1A1A1A]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Check-in
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

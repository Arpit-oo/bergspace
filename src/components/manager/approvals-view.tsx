"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { GoalSheet, Goal } from "@/lib/types";
import { UOM_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Pencil,
} from "lucide-react";

/* ── Status dot + label ── */
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { dot: string; text: string; bg: string; label: string }> = {
    draft: { dot: "bg-[#A89F91]", text: "text-[#5C564C]", bg: "bg-white border border-[#E8E2D6]", label: "Draft" },
    submitted: { dot: "bg-[#C08B30]", text: "text-[#C08B30]", bg: "bg-yellow-50", label: "Submitted" },
    approved: { dot: "bg-[#3D9A5F]", text: "text-[#3D9A5F]", bg: "bg-green-50", label: "Approved" },
    returned: { dot: "bg-[#D94F3D]", text: "text-[#D94F3D]", bg: "bg-red-50", label: "Returned" },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} shrink-0`} />
      {s.label}
    </span>
  );
}

interface ApprovalsViewProps {
  sheets: GoalSheet[];
  managerId: string;
}

export function ApprovalsView({ sheets, managerId }: ApprovalsViewProps) {
  const [selectedSheet, setSelectedSheet] = useState<GoalSheet | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [editingGoals, setEditingGoals] = useState<Record<string, Partial<Goal>>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const pendingSheets = sheets.filter((s) => s.status === "submitted");
  const otherSheets = sheets.filter((s) => s.status !== "submitted");

  async function approveSheet(sheet: GoalSheet) {
    setLoading(true);
    try {
      for (const [goalId, edits] of Object.entries(editingGoals)) {
        if (Object.keys(edits).length > 0) {
          await supabase.from("goals").update(edits).eq("id", goalId);
        }
      }

      const { error } = await supabase
        .from("goal_sheets")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: managerId,
          is_locked: true,
        })
        .eq("id", sheet.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: sheet.employee_id,
        type: "goal_approved",
        title: "Goal Sheet Approved",
        message: `Your goal sheet for ${sheet.cycle?.name} has been approved.`,
        link: "/dashboard/goals",
      });

      // Teams notification
      try {
        await fetch("/api/notifications/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "goal_approved",
            employeeName: sheet.employee?.full_name,
            cycleName: sheet.cycle?.name,
          }),
        });
      } catch {}

      toast.success("Goal sheet approved and locked");
      setSelectedSheet(null);
      setEditingGoals({});
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to approve";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function returnSheet(sheet: GoalSheet) {
    if (!returnReason.trim()) {
      toast.error("Please provide a reason for returning");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("goal_sheets")
        .update({
          status: "returned",
          returned_at: new Date().toISOString(),
          return_reason: returnReason,
        })
        .eq("id", sheet.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: sheet.employee_id,
        type: "goal_returned",
        title: "Goal Sheet Returned",
        message: `Your goal sheet was returned: ${returnReason}`,
        link: "/dashboard/goals",
      });

      // Teams notification
      try {
        await fetch("/api/notifications/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "goal_returned",
            employeeName: sheet.employee?.full_name,
            cycleName: sheet.cycle?.name,
            reason: returnReason,
          }),
        });
      } catch {}

      toast.success("Goal sheet returned to employee");
      setReturnDialogOpen(false);
      setReturnReason("");
      setSelectedSheet(null);
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to return";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function updateGoalInline(goalId: string, field: string, value: string | number) {
    setEditingGoals((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value },
    }));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
        Approvals
      </h1>

      {pendingSheets.length === 0 && otherSheets.length === 0 && (
        <div className="bg-white border border-[#E8E2D6] rounded-xl py-12 text-center text-sm text-[#A89F91]">
          No pending approvals.
        </div>
      )}

      {/* Pending */}
      {pendingSheets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs text-[#A89F91] uppercase tracking-wider font-medium">
            Pending Review ({pendingSheets.length})
          </h2>
          {pendingSheets.map((sheet) => (
            <div
              key={sheet.id}
              className="bg-white border border-[#E8E2D6] rounded-xl px-5 py-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    {sheet.employee?.full_name}
                  </p>
                  <p className="text-xs text-[#A89F91] mt-0.5">
                    {sheet.employee?.department?.name} &middot; {sheet.cycle?.name} &middot;{" "}
                    <span className="font-mono tabular-nums">
                      {sheet.goals?.length || 0}
                    </span>{" "}
                    goals
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <StatusPill status={sheet.status} />
                  <button
                    onClick={() => setSelectedSheet(sheet)}
                    className="inline-flex items-center gap-1.5 bg-[#1A1A1A] text-white rounded-lg px-3.5 py-2 text-xs font-medium hover:bg-[#1A1A1A]/90 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Already reviewed */}
      {otherSheets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs text-[#A89F91] uppercase tracking-wider font-medium">
            Previously Reviewed
          </h2>
          {otherSheets.map((sheet) => (
            <div
              key={sheet.id}
              className="bg-white border border-[#E8E2D6] rounded-xl px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {sheet.employee?.full_name}
                  </p>
                  <p className="text-xs text-[#A89F91] mt-0.5">
                    {sheet.cycle?.name} &middot;{" "}
                    <span className="font-mono tabular-nums">
                      {sheet.goals?.length || 0}
                    </span>{" "}
                    goals
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <StatusPill status={sheet.status} />
                  <button
                    onClick={() => setSelectedSheet(sheet)}
                    className="p-1.5 rounded-md text-[#A89F91] hover:text-[#1A1A1A] hover:bg-[#F5F1EA] transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog
        open={!!selectedSheet}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSheet(null);
            setEditingGoals({});
          }
        }}
      >
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-8 bg-white border border-[#E8E2D6] rounded-xl">
          {selectedSheet && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold text-[#1A1A1A]">
                  {selectedSheet.employee?.full_name}&apos;s Goal Sheet
                </DialogTitle>
                <DialogDescription className="text-sm text-[#A89F91]">
                  {selectedSheet.cycle?.name} &middot;{" "}
                  <span className="font-mono tabular-nums">
                    {selectedSheet.goals?.length || 0}
                  </span>{" "}
                  goals &middot; Total weightage:{" "}
                  <span className="font-mono tabular-nums">
                    {selectedSheet.goals?.reduce(
                      (sum: number, g: Goal) => sum + g.weightage,
                      0
                    )}%
                  </span>
                </DialogDescription>
              </DialogHeader>

              {/* Goal list */}
              <div className="mt-6 space-y-6">
                {selectedSheet.goals?.map((goal: Goal, i: number) => (
                  <div key={goal.id} className="py-4 border-b border-[#F5F1EA] last:border-b-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-[#F5F1EA] text-[11px] font-semibold text-[#5C564C] font-mono shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-base font-semibold text-[#1A1A1A]">
                        {goal.title}
                      </span>
                      {goal.is_from_shared && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                          Shared
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-sm text-[#5C564C] mb-3 ml-[30px]">
                        {goal.description}
                      </p>
                    )}
                    <div className="grid grid-cols-4 gap-4 ml-[30px]">
                      <div>
                        <span className="block text-xs uppercase tracking-wider font-medium text-[#A89F91] mb-1">UoM</span>
                        <span className="text-sm text-[#5C564C]">{UOM_LABELS[goal.uom]}</span>
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-wider font-medium text-[#A89F91] mb-1">Thrust Area</span>
                        <span className="text-sm text-[#5C564C]">{goal.thrust_area?.name || "—"}</span>
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-wider font-medium text-[#A89F91] mb-1">Target Value</span>
                        {selectedSheet.status === "submitted" ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              defaultValue={goal.target_value}
                              onChange={(e) =>
                                updateGoalInline(
                                  goal.id,
                                  "target_value",
                                  parseFloat(e.target.value)
                                )
                              }
                              className="h-8 w-24 px-2 bg-white border-[#E8E2D6] rounded text-sm font-mono tabular-nums text-[#1A1A1A] focus:border-[#1A1A1A] focus:ring-0"
                            />
                            <Pencil className="h-3 w-3 text-[#A89F91]" />
                          </div>
                        ) : (
                          <span className="text-[#1A1A1A] font-mono tabular-nums text-lg font-bold">
                            {goal.target_value}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-wider font-medium text-[#A89F91] mb-1">Weight</span>
                        {selectedSheet.status === "submitted" ? (
                          <Input
                            type="number"
                            defaultValue={goal.weightage}
                            onChange={(e) =>
                              updateGoalInline(
                                goal.id,
                                "weightage",
                                parseFloat(e.target.value)
                              )
                            }
                            className="h-8 w-20 px-2 bg-white border-[#E8E2D6] rounded text-sm font-mono tabular-nums text-[#1A1A1A] focus:border-[#1A1A1A] focus:ring-0"
                          />
                        ) : (
                          <span className="text-[#1A1A1A] font-mono tabular-nums text-lg font-bold">
                            {goal.weightage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              {selectedSheet.status === "submitted" && (
                <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-[#F5F1EA]">
                  <button
                    onClick={() => setReturnDialogOpen(true)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D94F3D] bg-white px-4 py-2.5 text-sm font-medium text-[#D94F3D] hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <XCircle className="h-4 w-4" /> Return for Rework
                  </button>
                  <button
                    onClick={() => approveSheet(selectedSheet)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#3D9A5F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#3D9A5F]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Approve &amp; Lock
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-xl p-6 bg-white border border-[#E8E2D6] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#1A1A1A]">Return Goal Sheet</DialogTitle>
            <DialogDescription className="text-sm text-[#A89F91]">
              Provide a reason for returning this goal sheet.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="e.g., Please adjust weightage for Goal 2 to align with department priorities..."
            rows={4}
            className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#A89F91] focus:border-[#1A1A1A] focus:ring-0 resize-none"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setReturnDialogOpen(false)}
              className="rounded-lg border border-[#E8E2D6] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#FEFCF9] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedSheet && returnSheet(selectedSheet)}
              disabled={loading || !returnReason.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94F3D] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D94F3D]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Return Sheet
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

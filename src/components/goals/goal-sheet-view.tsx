"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Profile, GoalCycle, GoalSheet, Goal, ThrustArea } from "@/lib/types";
import {
  MAX_GOALS_PER_SHEET,
  MIN_WEIGHTAGE,
  REQUIRED_TOTAL_WEIGHTAGE,
  UOM_LABELS,
} from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  Send,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Info,
} from "lucide-react";
import { SmartValidatorDialog } from "@/components/goals/smart-validator-dialog";

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

interface GoalSheetViewProps {
  profile: Profile;
  cycle: GoalCycle;
  goalSheet: GoalSheet | null;
  thrustAreas: ThrustArea[];
}

interface GoalFormData {
  id?: string;
  title: string;
  description: string;
  thrust_area_id: string;
  uom: string;
  target_value: string;
  weightage: string;
  is_from_shared: boolean;
}

const emptyGoal: GoalFormData = {
  title: "",
  description: "",
  thrust_area_id: "",
  uom: "numeric",
  target_value: "",
  weightage: "",
  is_from_shared: false,
};

export function GoalSheetView({
  profile,
  cycle,
  goalSheet: initialSheet,
  thrustAreas,
}: GoalSheetViewProps) {
  const [sheet, setSheet] = useState<GoalSheet | null>(initialSheet);
  const [goals, setGoals] = useState<GoalFormData[]>(
    initialSheet?.goals?.map((g: Goal) => ({
      id: g.id,
      title: g.title,
      description: g.description || "",
      thrust_area_id: g.thrust_area_id || "",
      uom: g.uom,
      target_value: String(g.target_value),
      weightage: String(g.weightage),
      is_from_shared: g.is_from_shared,
    })) || []
  );
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validatorOpen, setValidatorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const totalWeightage = goals.reduce(
    (sum, g) => sum + (parseFloat(g.weightage) || 0),
    0
  );
  const isWeightageValid = totalWeightage === REQUIRED_TOTAL_WEIGHTAGE;
  const canEdit =
    !sheet || sheet.status === "draft" || sheet.status === "returned";
  const isLocked = sheet?.is_locked || false;

  const validationErrors = useCallback(() => {
    const errors: string[] = [];
    if (goals.length === 0) errors.push("Add at least one goal");
    if (goals.length > MAX_GOALS_PER_SHEET)
      errors.push(`Maximum ${MAX_GOALS_PER_SHEET} goals allowed`);
    if (totalWeightage !== REQUIRED_TOTAL_WEIGHTAGE)
      errors.push(`Total weightage must be ${REQUIRED_TOTAL_WEIGHTAGE}% (currently ${totalWeightage}%)`);

    goals.forEach((g, i) => {
      const w = parseFloat(g.weightage) || 0;
      if (w < MIN_WEIGHTAGE) errors.push(`Goal ${i + 1}: weightage must be at least ${MIN_WEIGHTAGE}%`);
      if (!g.title.trim()) errors.push(`Goal ${i + 1}: title is required`);
      if (!g.target_value) errors.push(`Goal ${i + 1}: target value is required`);
    });

    return errors;
  }, [goals, totalWeightage]);

  function addGoal() {
    if (goals.length >= MAX_GOALS_PER_SHEET) {
      toast.error(`Maximum ${MAX_GOALS_PER_SHEET} goals allowed`);
      return;
    }
    setGoals([...goals, { ...emptyGoal }]);
  }

  function removeGoal(index: number) {
    if (goals[index].is_from_shared) {
      toast.error("Cannot remove shared goals");
      return;
    }
    setGoals(goals.filter((_, i) => i !== index));
  }

  function updateGoal(index: number, field: keyof GoalFormData, value: string) {
    const updated = [...goals];
    if (goals[index].is_from_shared && field !== "weightage") {
      toast.error("Shared goals can only modify weightage");
      return;
    }
    updated[index] = { ...updated[index], [field]: value };
    setGoals(updated);
  }

  async function saveGoals() {
    setLoading(true);
    try {
      let sheetId = sheet?.id;

      if (!sheetId) {
        const { data: newSheet, error: sheetError } = await supabase
          .from("goal_sheets")
          .insert({
            employee_id: profile.id,
            cycle_id: cycle.id,
            status: "draft",
          })
          .select()
          .single();

        if (sheetError) throw sheetError;
        sheetId = newSheet.id;
        setSheet(newSheet);
      }

      const existingIds = goals.filter((g) => g.id).map((g) => g.id);
      if (sheet?.goals) {
        const removedIds = sheet.goals
          .filter((g: Goal) => !existingIds.includes(g.id))
          .map((g: Goal) => g.id);

        if (removedIds.length > 0) {
          await supabase.from("goals").delete().in("id", removedIds);
        }
      }

      for (let i = 0; i < goals.length; i++) {
        const g = goals[i];
        const goalData = {
          goal_sheet_id: sheetId,
          title: g.title,
          description: g.description || null,
          thrust_area_id: g.thrust_area_id || null,
          uom: g.uom,
          target_value: parseFloat(g.target_value) || 0,
          weightage: parseFloat(g.weightage) || 0,
          sort_order: i,
          is_from_shared: g.is_from_shared,
        };

        if (g.id) {
          await supabase.from("goals").update(goalData).eq("id", g.id);
        } else {
          const { data } = await supabase
            .from("goals")
            .insert(goalData)
            .select()
            .single();
          if (data) {
            const updated = [...goals];
            updated[i] = { ...updated[i], id: data.id };
            setGoals(updated);
          }
        }
      }

      toast.success("Goals saved successfully");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to save goals";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function submitForApproval() {
    const errors = validationErrors();
    if (errors.length > 0) {
      errors.forEach((e) => toast.error(e));
      return;
    }

    setLoading(true);
    try {
      let sheetId = sheet?.id;

      if (!sheetId) {
        const { data: newSheet, error: sheetError } = await supabase
          .from("goal_sheets")
          .insert({
            employee_id: profile.id,
            cycle_id: cycle.id,
            status: "draft",
          })
          .select()
          .single();

        if (sheetError) throw sheetError;
        sheetId = newSheet.id;
        setSheet(newSheet);
      }

      for (let i = 0; i < goals.length; i++) {
        const g = goals[i];
        const goalData = {
          goal_sheet_id: sheetId,
          title: g.title,
          description: g.description || null,
          thrust_area_id: g.thrust_area_id || null,
          uom: g.uom,
          target_value: parseFloat(g.target_value) || 0,
          weightage: parseFloat(g.weightage) || 0,
          sort_order: i,
          is_from_shared: g.is_from_shared,
        };

        if (g.id) {
          await supabase.from("goals").update(goalData).eq("id", g.id);
        } else {
          const { data } = await supabase
            .from("goals")
            .insert(goalData)
            .select()
            .single();
          if (data) {
            const updated = [...goals];
            updated[i] = { ...updated[i], id: data.id };
            setGoals(updated);
          }
        }
      }

      const { error } = await supabase
        .from("goal_sheets")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", sheetId);

      if (error) throw error;

      if (profile.manager_id) {
        await supabase.from("notifications").insert({
          user_id: profile.manager_id,
          type: "goal_submitted",
          title: "Goal Sheet Submitted",
          message: `${profile.full_name} submitted their goal sheet for ${cycle.name}`,
          link: `/dashboard/approvals`,
        });
      }

      // Teams + Email + Telegram notifications
      if (profile.manager_id) {
        const notifBody = { type: "goal_submitted", recipientId: profile.manager_id, employeeName: profile.full_name, cycleName: cycle.name, goalCount: goals.length, sheetId };
        try {
          await Promise.allSettled([
            fetch("/api/notifications/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(notifBody) }),
            fetch("/api/notifications/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(notifBody) }),
            fetch("/api/notifications/telegram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(notifBody) }),
          ]);
        } catch {}
      }

      setSheet((prev) =>
        prev
          ? { ...prev, status: "submitted" as const, submitted_at: new Date().toISOString() }
          : prev
      );
      toast.success("Goal sheet submitted for approval!");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to submit";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteGoalSheet() {
    if (!sheet) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("goal_sheets")
        .delete()
        .eq("id", sheet.id);
      if (error) throw error;
      toast.success("Goal sheet deleted. You can create a new one.");
      setSheet(null);
      setGoals([]);
      setDeleteDialogOpen(false);
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete goal sheet";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
            My Goals
          </h1>
          <p className="text-sm text-[#A89F91] mt-1">
            {cycle.name} &middot; {cycle.start_date} to {cycle.end_date}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {sheet && <StatusPill status={sheet.status} />}
          {isLocked && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E8E2D6] px-2.5 py-0.5 text-[11px] font-medium text-[#A89F91]">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
        </div>
      </div>

      {/* Return reason banner */}
      {sheet?.status === "returned" && (
        <div className="flex gap-3 items-start rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-[#D94F3D] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#D94F3D]">
              Returned by Manager
            </p>
            <p className="text-sm text-[#D94F3D]/80 mt-1">
              {sheet.return_reason || "Your goal sheet was returned by your manager. Edit your goals and resubmit."}
            </p>
          </div>
        </div>
      )}

      {/* Submitted banner */}
      {sheet?.status === "submitted" && (
        <div className="flex items-center gap-3 rounded-xl bg-yellow-50 border border-yellow-100 px-4 py-3">
          <Info className="h-4 w-4 text-[#C08B30] shrink-0" />
          <p className="text-sm font-medium text-[#C08B30]">
            Goal sheet submitted. Waiting for manager approval.
          </p>
        </div>
      )}

      {/* Approved banner */}
      {sheet?.status === "approved" && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-[#3D9A5F] shrink-0" />
          <p className="text-sm font-medium text-[#3D9A5F]">
            Goal sheet approved and locked. Achievement tracking available during check-in windows.
          </p>
        </div>
      )}

      {/* Weightage Summary */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[#1A1A1A]">
            Total Weightage:{" "}
            <span className="font-mono tabular-nums">{totalWeightage}%</span>
          </span>
          <span className="text-xs text-[#A89F91] font-mono tabular-nums">
            {goals.length} / {MAX_GOALS_PER_SHEET} goals
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[#F5F1EA] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${Math.min(totalWeightage, 100)}%`,
              backgroundColor: "#C45A2D",
            }}
          />
        </div>
        <div className="mt-2">
          {isWeightageValid ? (
            <span className="text-xs text-[#3D9A5F] flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Valid
            </span>
          ) : (
            <span className="text-xs text-[#D94F3D] flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Must equal 100%
            </span>
          )}
        </div>
      </div>

      {/* Goals */}
      <div className="space-y-4">
        {goals.map((goal, index) => (
          <div
            key={index}
            className="bg-white border border-[#E8E2D6] rounded-xl px-7 py-6"
          >
            {/* Goal header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-[#F5F1EA] text-xs font-semibold text-[#5C564C] font-mono">
                  {index + 1}
                </span>
                <span className="text-base font-semibold text-[#1A1A1A]">
                  {goal.title || "Untitled Goal"}
                </span>
                {goal.is_from_shared && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                    Shared
                  </span>
                )}
              </div>
              {canEdit && !goal.is_from_shared && (
                <button
                  onClick={() => removeGoal(index)}
                  className="p-1.5 rounded-md text-[#A89F91] hover:text-[#D94F3D] hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="col-span-2">
                <Label className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mb-1.5 block">
                  Title
                </Label>
                <Input
                  value={goal.title}
                  onChange={(e) => updateGoal(index, "title", e.target.value)}
                  disabled={!canEdit || goal.is_from_shared}
                  placeholder="e.g., Increase quarterly revenue by 20%"
                  className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#A89F91] focus:border-[#1A1A1A] focus:ring-0"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mb-1.5 block">
                  Description
                </Label>
                <Textarea
                  value={goal.description}
                  onChange={(e) => updateGoal(index, "description", e.target.value)}
                  disabled={!canEdit || goal.is_from_shared}
                  placeholder="Detailed description of the goal..."
                  rows={2}
                  className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#A89F91] focus:border-[#1A1A1A] focus:ring-0 resize-none"
                />
              </div>
              <div>
                <Label className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mb-1.5 block">
                  Thrust Area
                </Label>
                <select
                  value={goal.thrust_area_id}
                  onChange={(e) => updateGoal(index, "thrust_area_id", e.target.value)}
                  disabled={!canEdit || goal.is_from_shared}
                  className="w-full h-10 rounded-lg border border-[#E8E2D6] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#C45A2D] focus:ring-1 focus:ring-[#C45A2D] disabled:opacity-50"
                >
                  <option value="">Select thrust area</option>
                  {thrustAreas.map((ta) => <option key={ta.id} value={ta.id}>{ta.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mb-1.5 block">
                  Unit of Measurement
                </Label>
                <select
                  value={goal.uom}
                  onChange={(e) => updateGoal(index, "uom", e.target.value)}
                  disabled={!canEdit || goal.is_from_shared}
                  className="w-full h-10 rounded-lg border border-[#E8E2D6] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#C45A2D] focus:ring-1 focus:ring-[#C45A2D] disabled:opacity-50"
                >
                  {Object.entries(UOM_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mb-1.5 block">
                  Target Value
                </Label>
                <Input
                  type="number"
                  value={goal.target_value}
                  onChange={(e) => updateGoal(index, "target_value", e.target.value)}
                  disabled={!canEdit || goal.is_from_shared}
                  placeholder="e.g., 100"
                  className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] font-mono tabular-nums placeholder:text-[#A89F91] focus:border-[#1A1A1A] focus:ring-0"
                />
              </div>
              <div>
                <Label className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mb-1.5 block">
                  Weightage (%)
                  {parseFloat(goal.weightage) > 0 &&
                    parseFloat(goal.weightage) < MIN_WEIGHTAGE && (
                      <span className="text-[#D94F3D] ml-1 normal-case tracking-normal">
                        Min {MIN_WEIGHTAGE}%
                      </span>
                    )}
                </Label>
                <Input
                  type="number"
                  min={MIN_WEIGHTAGE}
                  max={100}
                  value={goal.weightage}
                  onChange={(e) => updateGoal(index, "weightage", e.target.value)}
                  disabled={!canEdit}
                  placeholder={`Min ${MIN_WEIGHTAGE}%`}
                  className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] font-mono tabular-nums placeholder:text-[#A89F91] focus:border-[#1A1A1A] focus:ring-0"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={addGoal}
            disabled={goals.length >= MAX_GOALS_PER_SHEET}
            className="inline-flex items-center gap-1.5 bg-white border border-[#E8E2D6] rounded-lg px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#FEFCF9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" /> Add Goal
          </button>

          <div className="flex gap-3">
            {sheet && (sheet.status === "draft" || sheet.status === "returned" || sheet.status === "submitted") && (
              <button
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D94F3D] bg-white px-4 py-2.5 text-sm font-medium text-[#D94F3D] hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" /> Delete Goal Sheet
              </button>
            )}

            <button
              onClick={saveGoals}
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-white border border-[#E8E2D6] rounded-lg px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#FEFCF9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Draft
            </button>

            <button
              disabled={loading || !isWeightageValid || goals.length === 0}
              onClick={() => {
                const errors = validationErrors();
                if (errors.length > 0) {
                  errors.forEach((e) => toast.error(e));
                  return;
                }
                setValidatorOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#C45A2D" }}
            >
              <Send className="h-4 w-4" /> Submit for Approval
            </button>

            <SmartValidatorDialog
              goals={goals.map((g) => ({
                title: g.title,
                description: g.description,
              }))}
              open={validatorOpen}
              onClose={() => setValidatorOpen(false)}
              onAcceptSuggestion={(index, newTitle, newDescription) => {
                const updated = [...goals];
                updated[index] = { ...updated[index], title: newTitle, description: newDescription || updated[index].description };
                setGoals(updated);
              }}
              onProceed={() => {
                setValidatorOpen(false);
                setDialogOpen(true);
              }}
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-xl p-6 bg-white border border-[#E8E2D6] rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold text-[#1A1A1A]">Submit Goal Sheet?</DialogTitle>
                  <DialogDescription className="text-sm text-[#5C564C]">
                    This will send your goal sheet to your manager for review.
                    You won&apos;t be able to edit until they return it.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-1.5 text-sm text-[#1A1A1A]">
                  <p>
                    <span className="font-medium">Goals:</span>{" "}
                    <span className="font-mono tabular-nums">{goals.length}</span>
                  </p>
                  <p>
                    <span className="font-medium">Total Weightage:</span>{" "}
                    <span className="font-mono tabular-nums">{totalWeightage}%</span>
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setDialogOpen(false)}
                    className="rounded-lg border border-[#E8E2D6] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#FEFCF9] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setDialogOpen(false);
                      submitForApproval();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: "#C45A2D" }}
                  >
                    <Send className="h-4 w-4" /> Confirm Submit
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent className="max-w-xl p-6 bg-white border border-[#E8E2D6] rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold text-[#D94F3D]">Delete Goal Sheet?</DialogTitle>
                  <DialogDescription className="text-sm text-[#5C564C]">
                    Delete this goal sheet? All goals will be removed. You can create a new one.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setDeleteDialogOpen(false)}
                    className="rounded-lg border border-[#E8E2D6] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#FEFCF9] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteGoalSheet}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94F3D] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D94F3D]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </div>
  );
}

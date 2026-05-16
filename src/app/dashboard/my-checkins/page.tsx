"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { GoalCycle, GoalSheet, Goal } from "@/lib/types";
import { UOM_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Lock, Clock } from "lucide-react";

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

export default function MyCheckinsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cycle, setCycle] = useState<GoalCycle | null>(null);
  const [goalSheet, setGoalSheet] = useState<GoalSheet | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [edits, setEdits] = useState<
    Record<string, { actual_value: number | null; status: string; notes: string }>
  >({});
  const [isWithinWindow, setIsWithinWindow] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "employee") {
      router.push("/dashboard");
      return;
    }

    setUserId(user.id);
    setUserRole(profile.role);

    const { data: activeCycle } = await supabase
      .from("goal_cycles")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!activeCycle) {
      setCycle(null);
      setLoading(false);
      return;
    }

    setCycle(activeCycle);

    const today = new Date().toISOString().split("T")[0];
    setIsWithinWindow(
      today >= activeCycle.checkin_open && today <= activeCycle.checkin_close
    );

    const { data: sheet } = await supabase
      .from("goal_sheets")
      .select("*, goals(*, achievements(*))")
      .eq("employee_id", user.id)
      .eq("cycle_id", activeCycle.id)
      .eq("status", "approved")
      .single();

    setGoalSheet(sheet);

    if (sheet?.goals) {
      const initialEdits: Record<
        string,
        { actual_value: number | null; status: string; notes: string }
      > = {};
      for (const goal of sheet.goals) {
        const ach = goal.achievements?.[0];
        initialEdits[goal.id] = {
          actual_value: ach?.actual_value ?? null,
          status: ach?.status || goal.status,
          notes: ach?.notes || "",
        };
      }
      setEdits(initialEdits);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateEdit(
    goalId: string,
    field: "actual_value" | "status" | "notes",
    value: string | number | null
  ) {
    setEdits((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value },
    }));
  }

  async function saveAll() {
    if (!goalSheet || !cycle) return;
    setSaving(true);
    try {
      for (const goal of goalSheet.goals || []) {
        const edit = edits[goal.id];
        if (!edit) continue;

        const existingAch = goal.achievements?.[0];
        if (existingAch) {
          const { error } = await supabase
            .from("achievements")
            .update({
              actual_value: edit.actual_value,
              status: edit.status,
              notes: edit.notes,
              updated_by: userId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingAch.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("achievements").insert({
            goal_id: goal.id,
            cycle_id: cycle.id,
            actual_value: edit.actual_value,
            status: edit.status,
            notes: edit.notes,
            updated_by: userId,
          });
          if (error) throw error;
        }
      }
      toast.success("Check-in saved successfully");
      router.refresh();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to save check-in";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#A89F91]" />
      </div>
    );
  }

  if (userRole !== "employee") return null;

  if (!cycle) {
    return (
      <div className="text-center py-12">
        <h2 className="text-base font-semibold text-[#1A1A1A]">
          No Active Goal Cycle
        </h2>
        <p className="text-sm text-[#A89F91] mt-2">
          Contact your admin to set up a goal cycle.
        </p>
      </div>
    );
  }

  if (!goalSheet) {
    return (
      <div className="text-center py-12">
        <h2 className="text-base font-semibold text-[#1A1A1A]">
          No Approved Goal Sheet
        </h2>
        <p className="text-sm text-[#A89F91] mt-2">
          Your goal sheet for {cycle.name} has not been approved yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
            My Check-ins
          </h1>
          <p className="text-sm text-[#A89F91] mt-1">
            {cycle.name} &middot; Window: {cycle.checkin_open} to {cycle.checkin_close}
          </p>
        </div>
        {isWithinWindow ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-[#3D9A5F]">
            <Clock className="h-3 w-3" /> Window Open
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-[#D94F3D]">
            <Lock className="h-3 w-3" /> Window Closed
          </span>
        )}
      </div>

      {/* Goal cards */}
      <div className="space-y-4">
        {goalSheet.goals?.map((goal: Goal, i: number) => {
          const edit = edits[goal.id];
          const actual = edit?.actual_value ?? 0;
          const pct =
            goal.target_value > 0
              ? Math.min(Math.round((actual / goal.target_value) * 100), 100)
              : 0;

          return (
            <div
              key={goal.id}
              className="bg-white border border-[#E8E2D6] rounded-xl px-5 py-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-[#F5F1EA] text-xs font-semibold text-[#5C564C] font-mono shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-[#1A1A1A]">
                    {goal.title}
                  </span>
                </div>
                <GoalStatusDot status={edit?.status || goal.status} />
              </div>

              {goal.description && (
                <p className="text-xs text-[#A89F91] mb-3">
                  {goal.description}
                </p>
              )}

              {/* Meta row */}
              <div className="grid grid-cols-3 gap-2 text-xs text-[#A89F91] mb-3">
                <div>UoM: <span className="text-[#5C564C]">{UOM_LABELS[goal.uom]}</span></div>
                <div>
                  Weight:{" "}
                  <span className="text-[#5C564C] font-mono tabular-nums">
                    {goal.weightage}%
                  </span>
                </div>
                <div>
                  Target:{" "}
                  <span className="text-[#5C564C] font-mono tabular-nums">
                    {goal.target_value}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-[#F5F1EA] overflow-hidden mb-1">
                <div
                  className="h-full rounded-full bg-[#1A1A1A] transition-all duration-300 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] text-[#A89F91] font-mono tabular-nums mb-4">
                {pct}% complete
              </p>

              {/* Inputs row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mb-1.5 block">
                    Actual Value
                  </Label>
                  <Input
                    type="number"
                    value={edit?.actual_value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? null : parseFloat(e.target.value);
                      updateEdit(goal.id, "actual_value", val);
                    }}
                    disabled={!isWithinWindow}
                    className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] font-mono tabular-nums focus:border-[#1A1A1A] focus:ring-0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mb-1.5 block">
                    Status
                  </Label>
                  <Select
                    value={edit?.status || goal.status}
                    onValueChange={(value: string | null) => {
                      if (value) updateEdit(goal.id, "status", value);
                    }}
                    disabled={!isWithinWindow}
                  >
                    <SelectTrigger className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="on_track">On Track</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mb-1.5 block">
                    Notes
                  </Label>
                  <Textarea
                    value={edit?.notes || ""}
                    onChange={(e) =>
                      updateEdit(goal.id, "notes", e.target.value)
                    }
                    disabled={!isWithinWindow}
                    rows={1}
                    placeholder="Optional notes..."
                    className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#A89F91] focus:border-[#1A1A1A] focus:ring-0 resize-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      {isWithinWindow && (
        <div className="flex justify-end">
          <button
            onClick={saveAll}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#C45A2D" }}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save All Check-ins
          </button>
        </div>
      )}

      {/* Window closed banner */}
      {!isWithinWindow && (
        <div className="flex items-center gap-3 rounded-xl bg-yellow-50 border border-yellow-100 px-4 py-3">
          <Lock className="h-4 w-4 text-[#C08B30] shrink-0" />
          <p className="text-sm text-[#C08B30]">
            The check-in window is currently closed. You can view your goals but
            cannot make edits. The window is open from {cycle.checkin_open} to{" "}
            {cycle.checkin_close}.
          </p>
        </div>
      )}
    </div>
  );
}

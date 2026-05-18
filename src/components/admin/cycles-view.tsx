"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { GoalCycle, QuarterPreset } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
import { Plus, Loader2, Calendar, Power } from "lucide-react";

interface CyclesViewProps {
  cycles: GoalCycle[];
  userId: string;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getPresetDates(preset: QuarterPreset, year: number, quarter: number) {
  if (preset === "calendar_year") {
    const startMonth = (quarter - 1) * 3;
    return {
      start_date: formatDate(new Date(year, startMonth, 1)),
      end_date: formatDate(new Date(year, startMonth + 3, 0)),
      submission_deadline: formatDate(new Date(year, startMonth, 15)),
      checkin_open: formatDate(new Date(year, startMonth + 2, 20)),
      checkin_close: formatDate(new Date(year, startMonth + 3, 0)),
    };
  }
  if (preset === "fiscal_apr_mar") {
    const startMonth = ((quarter - 1) * 3 + 3) % 12;
    const startYear = startMonth >= 3 ? year : year + 1;
    return {
      start_date: formatDate(new Date(startYear, startMonth, 1)),
      end_date: formatDate(new Date(startYear, startMonth + 3, 0)),
      submission_deadline: formatDate(new Date(startYear, startMonth, 15)),
      checkin_open: formatDate(new Date(startYear, startMonth + 2, 20)),
      checkin_close: formatDate(new Date(startYear, startMonth + 3, 0)),
    };
  }
  return null;
}

export function CyclesView({ cycles, userId }: CyclesViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [preset, setPreset] = useState<QuarterPreset>("calendar_year");
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState(1);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [checkinOpen, setCheckinOpen] = useState("");
  const [checkinClose, setCheckinClose] = useState("");

  const router = useRouter();
  const supabase = createClient();

  function applyPreset(p: QuarterPreset, y: number, q: number) {
    const dates = getPresetDates(p, y, q);
    if (dates) {
      setStartDate(dates.start_date);
      setEndDate(dates.end_date);
      setSubmissionDeadline(dates.submission_deadline);
      setCheckinOpen(dates.checkin_open);
      setCheckinClose(dates.checkin_close);
    }
    const presetLabel = p === "calendar_year" ? "CY" : "FY";
    setName(`${presetLabel} ${y} Q${q}`);
  }

  function handlePresetChange(value: string | null) {
    if (!value) return;
    const p = value as QuarterPreset;
    setPreset(p);
    if (p !== "custom") {
      applyPreset(p, year, quarter);
    }
  }

  function handleYearChange(y: number) {
    setYear(y);
    if (preset !== "custom") applyPreset(preset, y, quarter);
  }

  function handleQuarterChange(value: string | null) {
    if (!value) return;
    const q = parseInt(value);
    setQuarter(q);
    if (preset !== "custom") applyPreset(preset, year, q);
  }

  function resetForm() {
    const y = new Date().getFullYear();
    const q = 1;
    const p: QuarterPreset = "calendar_year";
    setPreset(p);
    setYear(y);
    setQuarter(q);
    const dates = getPresetDates(p, y, q);
    if (dates) {
      setStartDate(dates.start_date);
      setEndDate(dates.end_date);
      setSubmissionDeadline(dates.submission_deadline);
      setCheckinOpen(dates.checkin_open);
      setCheckinClose(dates.checkin_close);
    }
    setName(`CY ${y} Q${q}`);
  }

  async function handleCreate() {
    if (!name || !startDate || !endDate || !submissionDeadline || !checkinOpen || !checkinClose) {
      toast.error("Please fill all date fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("goal_cycles").insert({
        name,
        preset,
        year,
        quarter,
        start_date: startDate,
        end_date: endDate,
        submission_deadline: submissionDeadline,
        checkin_open: checkinOpen,
        checkin_close: checkinClose,
        is_active: false,
        created_by: userId,
      });

      if (error) throw error;
      toast.success("Cycle created successfully");
      setDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to create cycle";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(cycle: GoalCycle) {
    setTogglingId(cycle.id);
    try {
      if (!cycle.is_active) {
        await supabase
          .from("goal_cycles")
          .update({ is_active: false })
          .eq("is_active", true);
      }

      const { error } = await supabase
        .from("goal_cycles")
        .update({ is_active: !cycle.is_active })
        .eq("id", cycle.id);

      if (error) throw error;
      toast.success(
        cycle.is_active ? "Cycle deactivated" : "Cycle activated"
      );
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to toggle cycle";
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Goal Cycles</h1>
        <Button
          onClick={() => { resetForm(); setDialogOpen(true); }}
          className="gap-1.5 text-white border-0"
          style={{ backgroundColor: "#C45A2D" }}
        >
          <Plus className="h-4 w-4" /> New Cycle
        </Button>
      </div>

      <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E2D6]">
          <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">All Cycles</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F5F1EA]">
                {["Name", "Preset", "Start", "End", "Submission Deadline", "Check-in Window", "Status", "Actions"].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#A89F91] ${i === 7 ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cycles.map((cycle) => (
                <tr
                  key={cycle.id}
                  className="border-b border-[#F5F1EA] hover:bg-[#FEFCF9] transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">{cycle.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs text-[#5C564C] border border-[#E8E2D6] capitalize">
                      {cycle.preset.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#1A1A1A]">{cycle.start_date}</td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#1A1A1A]">{cycle.end_date}</td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#1A1A1A]">{cycle.submission_deadline}</td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#1A1A1A]">
                    {cycle.checkin_open} &mdash; {cycle.checkin_close}
                  </td>
                  <td className="px-4 py-3">
                    {cycle.is_active ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3D9A5F]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3D9A5F]" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A89F91]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A89F91]" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(cycle)}
                      disabled={togglingId === cycle.id}
                      className="gap-1.5 border-[#E8E2D6] text-[#5C564C] text-xs"
                    >
                      {togglingId === cycle.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Power className="h-3 w-3" />
                      )}
                      {cycle.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
              {cycles.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-[#A89F91] text-sm py-12">
                    <div className="border border-dashed border-[#E8E2D6] rounded-xl mx-4 py-8">
                      No cycles created yet.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Cycle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl w-[85vw] max-h-[90vh] overflow-y-auto p-8 bg-white border border-[#E8E2D6]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-semibold tracking-tight text-[#1A1A1A]">
              <Calendar className="h-5 w-5" style={{ color: "#C45A2D" }} /> Create Goal Cycle
            </DialogTitle>
            <DialogDescription className="text-[#5C564C] text-sm">
              Choose a preset or configure custom dates for the cycle.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-[#1A1A1A]">Preset</Label>
                <select
                  value={preset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full h-10 rounded-lg border border-[#E8E2D6] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#C45A2D] focus:ring-1 focus:ring-[#C45A2D]"
                >
                  <option value="calendar_year">Calendar Year</option>
                  <option value="fiscal_apr_mar">Fiscal (Apr-Mar)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-[#1A1A1A]">Year</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => handleYearChange(parseInt(e.target.value) || new Date().getFullYear())}
                  className="border-[#E8E2D6] font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-[#1A1A1A]">Quarter</Label>
                <select
                  value={String(quarter)}
                  onChange={(e) => handleQuarterChange(e.target.value)}
                  className="w-full h-10 rounded-lg border border-[#E8E2D6] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#C45A2D] focus:ring-1 focus:ring-[#C45A2D]"
                >
                  <option value="1">Q1</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-[#1A1A1A]">Cycle Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., CY 2026 Q1"
                className="border-[#E8E2D6] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-[#1A1A1A]">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-[#E8E2D6] font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-[#1A1A1A]">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-[#E8E2D6] font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-[#1A1A1A]">Submission Deadline</Label>
              <Input
                type="date"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="border-[#E8E2D6] font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-[#1A1A1A]">Check-in Open</Label>
                <Input
                  type="date"
                  value={checkinOpen}
                  onChange={(e) => setCheckinOpen(e.target.value)}
                  className="border-[#E8E2D6] font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-[#1A1A1A]">Check-in Close</Label>
                <Input
                  type="date"
                  value={checkinClose}
                  onChange={(e) => setCheckinClose(e.target.value)}
                  className="border-[#E8E2D6] font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-[#E8E2D6] text-[#5C564C]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="text-white border-0"
                style={{ backgroundColor: "#C45A2D" }}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Cycle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  Profile,
  GoalCycle,
  Department,
  Goal,
  Achievement,
} from "@/lib/types";
import { UOM_LABELS, SHEET_STATUS_LABELS, SHEET_STATUS_COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download, FileSpreadsheet, Users, CheckCircle2, Clock } from "lucide-react";
import * as XLSX from "xlsx";

interface GoalSheetWithRelations {
  id: string;
  employee_id: string;
  cycle_id: string;
  status: string;
  employee?: Profile;
  goals?: (Goal & { achievements?: Achievement[] })[];
}

interface CheckinRecord {
  id: string;
  manager_id: string;
  employee_id: string;
  cycle_id: string;
  employee?: Profile;
  manager?: Profile;
}

interface ReportsViewProps {
  profile: Profile;
  cycles: GoalCycle[];
  activeCycle: GoalCycle | null;
  departments: Department[];
  employees: Profile[];
  goalSheets: Record<string, unknown>[];
  checkins: Record<string, unknown>[];
  managers: Record<string, unknown>[];
}

function StatusDot({ status, label }: { status: string; label: string }) {
  const isGood = status === "approved";
  const isBad = status === "returned";
  const dotColor = isGood ? "#3D9A5F" : isBad ? "#D94F3D" : "#A89F91";
  const textColor = isGood ? "text-[#3D9A5F]" : isBad ? "text-[#D94F3D]" : "text-[#A89F91]";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
      {label}
    </span>
  );
}

export function ReportsView({
  profile,
  cycles,
  activeCycle,
  departments,
  employees,
  goalSheets,
  checkins,
  managers,
}: ReportsViewProps) {
  const [selectedCycleId, setSelectedCycleId] = useState(activeCycle?.id || "");
  const [selectedDeptId, setSelectedDeptId] = useState("all");
  const [activeTab, setActiveTab] = useState<"achievement" | "completion">("achievement");
  const [detailSheetIndex, setDetailSheetIndex] = useState<number | null>(null);

  const sheets = goalSheets as unknown as GoalSheetWithRelations[];
  const checkinRecords = checkins as unknown as CheckinRecord[];

  const filteredSheets = useMemo(() => {
    return sheets.filter((s) => {
      if (selectedDeptId !== "all" && s.employee?.department_id !== selectedDeptId) return false;
      return true;
    });
  }, [sheets, selectedDeptId]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (selectedDeptId !== "all" && e.department_id !== selectedDeptId) return false;
      return true;
    });
  }, [employees, selectedDeptId]);

  const achievementRows = useMemo(() => {
    return filteredSheets.map((sheet, idx) => {
      const goals = sheet.goals || [];
      const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
      const weightedTarget = goals.reduce((sum, g) => sum + g.target_value * (g.weightage / 100), 0);
      let weightedActual = 0;
      let goalsWithAchievements = 0;
      goals.forEach((g) => {
        const latestAchievement = g.achievements?.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )?.[0];
        if (latestAchievement?.actual_value != null) {
          weightedActual += latestAchievement.actual_value * (g.weightage / 100);
          goalsWithAchievements++;
        }
      });
      const achievementPct = weightedTarget > 0 ? (weightedActual / weightedTarget) * 100 : 0;
      return {
        sheetIndex: idx,
        employeeName: sheet.employee?.full_name || "Unknown",
        department: sheet.employee?.department?.name || "—",
        managerName: sheet.employee?.manager?.full_name || "—",
        status: sheet.status,
        goalCount: goals.length,
        totalWeightage,
        weightedTarget: Math.round(weightedTarget * 100) / 100,
        weightedActual: Math.round(weightedActual * 100) / 100,
        achievementPct: Math.round(achievementPct),
        goalsWithAchievements,
      };
    });
  }, [filteredSheets]);

  const chartData = useMemo(() => {
    const CHART_COLORS = ["#C45A2D", "#3B7DD8", "#3D9A5F", "#8B5FC7", "#C08B30"];
    const deptMap = new Map<string, { total: number; count: number }>();
    achievementRows.forEach((row) => {
      const dept = row.department || "Unknown";
      const existing = deptMap.get(dept) || { total: 0, count: 0 };
      existing.total += row.achievementPct;
      existing.count += 1;
      deptMap.set(dept, existing);
    });
    return Array.from(deptMap.entries()).map(([dept, data], i) => ({
      department: dept,
      achievement: Math.round(data.total / data.count),
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [achievementRows]);

  const checkinCompletion = useMemo(() => {
    const employeeCheckinMap = new Map<string, boolean>();
    checkinRecords.forEach((c) => { employeeCheckinMap.set(c.employee_id, true); });
    return filteredEmployees.map((emp) => ({
      employeeName: emp.full_name,
      department: emp.department?.name || "—",
      hasCheckin: employeeCheckinMap.has(emp.id),
      sheet: sheets.find((s) => s.employee_id === emp.id),
    }));
  }, [filteredEmployees, checkinRecords, sheets]);

  const managerCheckinCompletion = useMemo(() => {
    const managerList = managers as unknown as Profile[];
    return managerList.map((mgr) => {
      const mgrEmployees = employees.filter((e) => e.manager_id === mgr.id);
      const mgrCheckins = checkinRecords.filter((c) => c.manager_id === mgr.id);
      const checkedEmployeeIds = new Set(mgrCheckins.map((c) => c.employee_id));
      const completedCount = mgrEmployees.filter((e) => checkedEmployeeIds.has(e.id)).length;
      return {
        managerName: mgr.full_name,
        department: mgr.department?.name || "—",
        totalReports: mgrEmployees.length,
        completed: completedCount,
        pending: mgrEmployees.length - completedCount,
      };
    });
  }, [managers, employees, checkinRecords]);

  function exportAchievementReport() {
    const data = achievementRows.map((row) => ({
      "Employee Name": row.employeeName,
      Department: row.department,
      "Sheet Status": SHEET_STATUS_LABELS[row.status] || row.status,
      "Goal Count": row.goalCount,
      "Total Weightage": row.totalWeightage,
      "Weighted Target": row.weightedTarget,
      "Weighted Actual": row.weightedActual,
      "Achievement %": row.achievementPct,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Achievement Report");
    XLSX.writeFile(wb, `achievement-report-${selectedCycleId}.xlsx`);
  }

  function exportCheckinReport() {
    const data = checkinCompletion.map((row) => ({
      "Employee Name": row.employeeName,
      Department: row.department,
      "Check-in Completed": row.hasCheckin ? "Yes" : "No",
      "Sheet Status": row.sheet ? SHEET_STATUS_LABELS[row.sheet.status] || row.sheet.status : "No Sheet",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Check-in Completion");
    XLSX.writeFile(wb, `checkin-report-${selectedCycleId}.xlsx`);
  }

  function exportCSV() {
    const data = achievementRows.map((row) => ({
      "Employee Name": row.employeeName,
      Department: row.department,
      "Sheet Status": SHEET_STATUS_LABELS[row.status] || row.status,
      "Goal Count": row.goalCount,
      "Total Weightage": row.totalWeightage,
      "Weighted Target": row.weightedTarget,
      "Weighted Actual": row.weightedActual,
      "Achievement %": row.achievementPct,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Achievement Report");
    XLSX.writeFile(wb, `achievement-report-${selectedCycleId}.csv`, { bookType: "csv" });
  }

  const completionStats = useMemo(() => {
    const total = filteredEmployees.length;
    const withSheet = filteredSheets.length;
    const approved = filteredSheets.filter((s) => s.status === "approved").length;
    const withCheckin = checkinCompletion.filter((c) => c.hasCheckin).length;
    return { total, withSheet, approved, withCheckin };
  }, [filteredEmployees, filteredSheets, checkinCompletion]);

  const statCards = [
    { icon: Users, value: completionStats.total, label: "TOTAL EMPLOYEES", color: "#C45A2D" },
    { icon: FileSpreadsheet, value: completionStats.withSheet, label: "SHEETS CREATED", color: "#C08B30" },
    { icon: CheckCircle2, value: completionStats.approved, label: "APPROVED", color: "#3D9A5F" },
    { icon: Clock, value: completionStats.withCheckin, label: "CHECK-INS DONE", color: "#A855F7" },
  ];

  const tabs = [
    { key: "achievement" as const, label: "Achievement Report" },
    { key: "completion" as const, label: "Completion Dashboard" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Reports</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="w-[180px] h-10 rounded-lg border border-[#E8E2D6] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#C45A2D] focus:ring-1 focus:ring-[#C45A2D]"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            className="w-[200px] h-10 rounded-lg border border-[#E8E2D6] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#C45A2D] focus:ring-1 focus:ring-[#C45A2D]"
          >
            <option value="">Select Cycle</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.is_active ? " (Active)" : ""}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white border border-[#E8E2D6] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              <div>
                <p className="text-4xl font-semibold font-mono tabular-nums text-[#1A1A1A] leading-none">
                  {stat.value}
                </p>
                <p className="text-xs text-[#A89F91] uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-[#E8E2D6]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm transition-colors ${
                activeTab === tab.key
                  ? "text-[#1A1A1A] font-medium border-b-2 border-[#1A1A1A]"
                  : "text-[#A89F91] border-b-2 border-transparent hover:text-[#5C564C]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Achievement Report Tab */}
        {activeTab === "achievement" && (
          <div className="flex flex-col gap-4">
            {/* Achievement by Department Chart */}
            {chartData.length > 0 && (
              <div className="bg-white border border-[#E8E2D6] rounded-xl p-5">
                <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A] mb-4">Achievement % by Department</h2>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" />
                      <XAxis
                        dataKey="department"
                        tick={{ fontSize: 12, fill: "#8C8578" }}
                        axisLine={{ stroke: "#E8E2D6" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#8C8578" }}
                        axisLine={{ stroke: "#E8E2D6" }}
                        tickLine={false}
                        domain={[0, 100]}
                        unit="%"
                      />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Achievement"]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E8E2D6",
                          fontSize: "13px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                      />
                      <Bar dataKey="achievement" radius={[4, 4, 0, 0]} maxBarSize={56}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8E2D6] flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">Planned vs Actual Achievement</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 border-[#E8E2D6] text-[#5C564C] text-xs">
                    <Download className="h-3 w-3" /> CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportAchievementReport} className="gap-1.5 border-[#E8E2D6] text-[#5C564C] text-xs">
                    <Download className="h-3 w-3" /> Excel
                  </Button>
                </div>
              </div>
              {achievementRows.length === 0 ? (
                <div className="text-center text-[#A89F91] text-sm py-8 mx-4 my-4 border border-dashed border-[#E8E2D6] rounded-xl">
                  No goal sheets found for the selected filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F5F1EA]">
                      {["Employee", "Department", "Status", "Goals", "Weighted Target", "Weighted Actual", "Achievement %"].map((h, i) => (
                        <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#A89F91] ${i >= 3 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {achievementRows.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-[#F5F1EA] hover:bg-[#FEFCF9] transition-colors cursor-pointer"
                        onClick={() => setDetailSheetIndex(row.sheetIndex)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">{row.employeeName}</td>
                        <td className="px-4 py-3 text-sm text-[#5C564C]">{row.department}</td>
                        <td className="px-4 py-3">
                          <StatusDot status={row.status} label={SHEET_STATUS_LABELS[row.status] || row.status} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-[#1A1A1A]">{row.goalCount}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-[#1A1A1A]">{row.weightedTarget}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-[#1A1A1A]">{row.weightedActual}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono font-semibold tabular-nums ${
                            row.achievementPct >= 80 ? "text-[#3D9A5F]" : row.achievementPct >= 50 ? "text-[#C08B30]" : "text-[#D94F3D]"
                          }`}>
                            {row.achievementPct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completion Dashboard Tab */}
        {activeTab === "completion" && (
          <div className="flex flex-col gap-6 pt-4">
            {/* Employee check-in completion */}
            <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8E2D6] flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">Employee Check-in Completion</h2>
                <Button variant="outline" size="sm" onClick={exportCheckinReport} className="gap-1.5 border-[#E8E2D6] text-[#5C564C] text-xs">
                  <Download className="h-3 w-3" /> Export
                </Button>
              </div>
              {checkinCompletion.length === 0 ? (
                <div className="text-center text-[#A89F91] text-sm py-8 mx-4 my-4 border border-dashed border-[#E8E2D6] rounded-xl">
                  No employees found for the selected filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F5F1EA]">
                      {["Employee", "Department", "Sheet Status", "Check-in"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A89F91]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {checkinCompletion.map((row, i) => (
                      <tr key={i} className="border-b border-[#F5F1EA] hover:bg-[#FEFCF9] transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">{row.employeeName}</td>
                        <td className="px-4 py-3 text-sm text-[#5C564C]">{row.department}</td>
                        <td className="px-4 py-3">
                          {row.sheet ? (
                            <StatusDot status={row.sheet.status} label={SHEET_STATUS_LABELS[row.sheet.status] || row.sheet.status} />
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A89F91]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#A89F91]" /> No Sheet
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.hasCheckin ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3D9A5F]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3D9A5F]" /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D94F3D]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D94F3D]" /> Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>

            {/* Manager check-in completion */}
            {profile.role === "admin" && managerCheckinCompletion.length > 0 && (
              <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E8E2D6]">
                  <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">Manager Check-in Completion</h2>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F5F1EA]">
                      {["Manager", "Department", "Direct Reports", "Completed", "Pending", "Completion Rate"].map((h, i) => (
                        <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#A89F91] ${i >= 2 && i <= 4 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {managerCheckinCompletion.map((row, i) => {
                      const rate = row.totalReports > 0 ? Math.round((row.completed / row.totalReports) * 100) : 0;
                      return (
                        <tr key={i} className="border-b border-[#F5F1EA] hover:bg-[#FEFCF9] transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">{row.managerName}</td>
                          <td className="px-4 py-3 text-sm text-[#5C564C]">{row.department}</td>
                          <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-[#1A1A1A]">{row.totalReports}</td>
                          <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-[#1A1A1A]">{row.completed}</td>
                          <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-[#1A1A1A]">{row.pending}</td>
                          <td className="px-4 py-3">
                            <span className={`font-mono font-semibold tabular-nums ${
                              rate === 100 ? "text-[#3D9A5F]" : rate >= 50 ? "text-[#C08B30]" : "text-[#D94F3D]"
                            }`}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Employee Detail Dialog */}
      <Dialog open={detailSheetIndex !== null} onOpenChange={(open) => { if (!open) setDetailSheetIndex(null); }}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-8 bg-white border border-[#E8E2D6] rounded-xl">
          {detailSheetIndex !== null && (() => {
            const sheet = filteredSheets[detailSheetIndex];
            if (!sheet) return null;
            const goals = sheet.goals || [];
            const row = achievementRows.find((r) => r.sheetIndex === detailSheetIndex);
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{sheet.employee?.full_name || "Employee"}</DialogTitle>
                  <DialogDescription>
                    {sheet.employee?.department?.name || "—"} &middot; Manager: {sheet.employee?.manager?.full_name || "—"}
                  </DialogDescription>
                </DialogHeader>
                <div className="-mx-4 px-4 space-y-6">
                  {goals.length === 0 ? (
                    <p className="text-sm text-[#8C8578] py-4">No goals defined.</p>
                  ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#F5F1EA]">
                          {["Goal", "Target", "Actual", "%", "Status"].map((h) => (
                            <th key={h} className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-[#8C8578]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {goals.map((g) => {
                          const latest = g.achievements?.sort(
                            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                          )?.[0];
                          const actual = latest?.actual_value;
                          const pct = g.target_value > 0 && actual != null
                            ? Math.round((actual / g.target_value) * 100)
                            : 0;
                          return (
                            <tr key={g.id} className="border-b border-[#F5F1EA]">
                              <td className="px-2 py-2">
                                <p className="text-sm font-medium text-[#1A1A1A] leading-tight">{g.title}</p>
                                <p className="text-xs text-[#8C8578]">Weight: {g.weightage}%</p>
                              </td>
                              <td className="px-2 py-2 font-mono text-xs tabular-nums text-[#1A1A1A]">{g.target_value}</td>
                              <td className="px-2 py-2 font-mono text-xs tabular-nums text-[#1A1A1A]">{actual ?? "—"}</td>
                              <td className="px-2 py-2">
                                <span className={`font-mono text-xs font-semibold tabular-nums ${
                                  pct >= 80 ? "text-[#3D9A5F]" : pct >= 50 ? "text-[#C08B30]" : "text-[#D94F3D]"
                                }`}>
                                  {pct}%
                                </span>
                              </td>
                              <td className="px-2 py-2">
                                <StatusDot status={latest?.status || g.status} label={latest?.status || g.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  )}
                  {row && (
                    <div className="mt-4 p-3 bg-[#F5F1EA] rounded-lg">
                      <p className="text-xs text-[#5C564C]">
                        Overall Achievement: <span className={`font-mono font-semibold ${
                          row.achievementPct >= 80 ? "text-[#3D9A5F]" : row.achievementPct >= 50 ? "text-[#C08B30]" : "text-[#D94F3D]"
                        }`}>{row.achievementPct}%</span>
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter showCloseButton />
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

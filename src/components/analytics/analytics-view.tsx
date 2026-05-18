"use client";

import { useMemo } from "react";
import {
  GoalCycle,
  Department,
  ThrustArea,
  Profile,
  Goal,
  Achievement,
} from "@/lib/types";
import { UOM_LABELS } from "@/lib/constants";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

/* Chart palette per design spec */
const CHART_COLORS = ["#C45A2D", "#3B7DD8", "#3D9A5F", "#8B5FC7", "#C08B30"];
const PIE_COLORS = [
  "#C45A2D", "#3B7DD8", "#3D9A5F", "#8B5FC7", "#C08B30",
  "#F97316", "#06B6D4", "#84CC16", "#E879F9", "#FBBF24",
];

const axisTickStyle = { fontSize: 12, fill: "#8C8578" };
const gridProps = { stroke: "#E8E2D6", strokeDasharray: "3 3" };

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white border border-[#E8E2D6] rounded-lg shadow-lg p-3">
      <p className="text-xs font-medium text-[#1A1A1A] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-[#5C564C]">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-mono tabular-nums font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

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
  manager?: { full_name: string };
}

interface AnalyticsViewProps {
  cycles: GoalCycle[];
  departments: Department[];
  goalSheets: Record<string, unknown>[];
  thrustAreas: ThrustArea[];
  checkins: Record<string, unknown>[];
  managers: Record<string, unknown>[];
  employees: Record<string, unknown>[];
}

export function AnalyticsView({
  cycles,
  departments,
  goalSheets: rawSheets,
  thrustAreas,
  checkins: rawCheckins,
  managers: rawManagers,
  employees: rawEmployees,
}: AnalyticsViewProps) {
  const sheets = rawSheets as unknown as GoalSheetWithRelations[];
  const checkins = rawCheckins as unknown as CheckinRecord[];
  const managerList = rawManagers as unknown as Profile[];
  const employeeList = rawEmployees as unknown as Profile[];

  const qoqData = useMemo(() => {
    return cycles.map((cycle) => {
      const cycleSheets = sheets.filter((s) => s.cycle_id === cycle.id);
      let totalTarget = 0;
      let totalActual = 0;
      let goalCount = 0;
      cycleSheets.forEach((sheet) => {
        (sheet.goals || []).forEach((goal) => {
          totalTarget += goal.target_value * (goal.weightage / 100);
          goalCount++;
          const latest = goal.achievements?.sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )?.[0];
          if (latest?.actual_value != null) {
            totalActual += latest.actual_value * (goal.weightage / 100);
          }
        });
      });
      const achievementPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
      return { name: cycle.name, achievement: achievementPct, employees: cycleSheets.length, goals: goalCount };
    });
  }, [cycles, sheets]);

  const thrustAreaData = useMemo(() => {
    const map = new Map<string, number>();
    sheets.forEach((sheet) => {
      (sheet.goals || []).forEach((goal) => {
        const name = goal.thrust_area?.name || "Unassigned";
        map.set(name, (map.get(name) || 0) + 1);
      });
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [sheets]);

  const uomData = useMemo(() => {
    const map = new Map<string, number>();
    sheets.forEach((sheet) => {
      (sheet.goals || []).forEach((goal) => {
        const label = UOM_LABELS[goal.uom] || goal.uom;
        map.set(label, (map.get(label) || 0) + 1);
      });
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [sheets]);

  const deptCompletionData = useMemo(() => {
    return departments.map((dept) => {
      const deptEmployees = employeeList.filter((e) => e.department_id === dept.id);
      const deptSheets = sheets.filter((s) => s.employee?.department_id === dept.id);
      const approvedSheets = deptSheets.filter((s) => s.status === "approved");
      const submittedOrApproved = deptSheets.filter((s) => s.status === "submitted" || s.status === "approved");
      const completionRate = deptEmployees.length > 0 ? Math.round((approvedSheets.length / deptEmployees.length) * 100) : 0;
      const submissionRate = deptEmployees.length > 0 ? Math.round((submittedOrApproved.length / deptEmployees.length) * 100) : 0;
      return { name: dept.name, completion: completionRate, submission: submissionRate, employees: deptEmployees.length };
    });
  }, [departments, sheets, employeeList]);

  const managerEffectiveness = useMemo(() => {
    return managerList.map((mgr) => {
      const mgrEmployees = employeeList.filter((e) => e.manager_id === mgr.id);
      const mgrCheckins = checkins.filter((c) => c.manager_id === mgr.id);
      const checkedEmployeeIds = new Set(mgrCheckins.map((c) => c.employee_id));
      const completedCount = mgrEmployees.filter((e) => checkedEmployeeIds.has(e.id)).length;
      const rate = mgrEmployees.length > 0 ? Math.round((completedCount / mgrEmployees.length) * 100) : 0;
      return { name: mgr.full_name, rate, completed: completedCount, total: mgrEmployees.length };
    });
  }, [managerList, employeeList, checkins]);

  const totalGoals = sheets.reduce((sum, s) => sum + (s.goals?.length || 0), 0);
  const totalApproved = sheets.filter((s) => s.status === "approved").length;
  const totalCheckins = checkins.length;

  const summaryStats = [
    { value: sheets.length, label: "TOTAL SHEETS" },
    { value: totalGoals, label: "TOTAL GOALS" },
    { value: totalApproved, label: "APPROVED" },
    { value: totalCheckins, label: "CHECK-INS" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Analytics</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="bg-white border border-[#E8E2D6] rounded-xl p-5">
            <p className="text-4xl font-semibold font-mono tabular-nums text-[#1A1A1A] leading-none">
              {stat.value}
            </p>
            <p className="text-xs text-[#A89F91] uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* QoQ Achievement Trends */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E2D6]">
          <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">Quarter-over-Quarter Achievement Trends</h2>
        </div>
        <div className="p-5">
          {qoqData.length === 0 ? (
            <div className="text-center text-[#A89F91] text-sm py-8 border border-dashed border-[#E8E2D6] rounded-xl">
              No cycle data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={qoqData}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" tick={axisTickStyle} />
                <YAxis unit="%" tick={axisTickStyle} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#5C564C" }} />
                <Line
                  type="monotone"
                  dataKey="achievement"
                  stroke="#C45A2D"
                  strokeWidth={2}
                  name="Achievement %"
                  dot={{ r: 4, fill: "#C45A2D" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thrust Area Distribution */}
        <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E2D6]">
            <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">Goals by Thrust Area</h2>
          </div>
          <div className="p-5">
            {thrustAreaData.length === 0 ? (
              <div className="text-center text-[#A89F91] text-sm py-8 border border-dashed border-[#E8E2D6] rounded-xl">
                No goal data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={thrustAreaData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: PieLabelRenderProps) =>
                      `${name ?? ""} ${(((percent as number | undefined) ?? 0) * 100).toFixed(0)}%`
                    }
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {thrustAreaData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* UoM Distribution */}
        <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E2D6]">
            <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">Goals by Unit of Measurement</h2>
          </div>
          <div className="p-5">
            {uomData.length === 0 ? (
              <div className="text-center text-[#A89F91] text-sm py-8 border border-dashed border-[#E8E2D6] rounded-xl">
                No goal data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={uomData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: PieLabelRenderProps) =>
                      `${name ?? ""} ${(((percent as number | undefined) ?? 0) * 100).toFixed(0)}%`
                    }
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {uomData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Department Completion Rates */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E2D6]">
          <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">Department Completion Rates</h2>
        </div>
        <div className="p-5">
          {deptCompletionData.length === 0 ? (
            <div className="text-center text-[#A89F91] text-sm py-8 border border-dashed border-[#E8E2D6] rounded-xl">
              No department data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={deptCompletionData} barSize={32}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" tick={axisTickStyle} />
                <YAxis unit="%" tick={axisTickStyle} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#5C564C" }} />
                <Bar
                  dataKey="submission"
                  fill="#C08B30"
                  name="Submission Rate %"
                  radius={[4, 4, 0, 0]}
                  label={{ position: "top", fill: "#8C8578", fontSize: 12 }}
                />
                <Bar
                  dataKey="completion"
                  fill="#3D9A5F"
                  name="Approval Rate %"
                  radius={[4, 4, 0, 0]}
                  label={{ position: "top", fill: "#8C8578", fontSize: 12 }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Manager Effectiveness */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E2D6]">
          <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">Manager Effectiveness: Check-in Completion Rates</h2>
        </div>
        <div className="p-5">
          {managerEffectiveness.length === 0 ? (
            <div className="text-center text-[#A89F91] text-sm py-8 border border-dashed border-[#E8E2D6] rounded-xl">
              No manager data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={managerEffectiveness} barSize={32}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" tick={axisTickStyle} />
                <YAxis unit="%" tick={axisTickStyle} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#5C564C" }} />
                <Bar
                  dataKey="rate"
                  fill="#8B5FC7"
                  name="Check-in Completion %"
                  radius={[4, 4, 0, 0]}
                  label={{ position: "top", fill: "#8C8578", fontSize: 12 }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Goal Distribution by Status */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E2D6]">
          <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">Goal Distribution by Status</h2>
        </div>
        <div className="p-5">
          {(() => {
            const statusCounts = sheets.flatMap(s => s.goals || []).reduce((acc, g) => {
              const s = g.status || "not_started";
              acc[s] = (acc[s] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            const statusData = [
              { name: "Completed", value: statusCounts["completed"] || 0, color: "#3D9A5F" },
              { name: "On Track", value: statusCounts["on_track"] || 0, color: "#C08B30" },
              { name: "Not Started", value: statusCounts["not_started"] || 0, color: "#A89F91" },
            ].filter(d => d.value > 0);

            return statusData.length === 0 ? (
              <div className="text-center text-[#A89F91] text-sm py-8 border border-dashed border-[#E8E2D6] rounded-xl">No goal data.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }: PieLabelRenderProps) => `${name} ${((percent as number) * 100).toFixed(0)}%`}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      {/* Completion Heatmap — Department × Quarter */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E2D6]">
          <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">Completion Rates Heatmap</h2>
          <p className="text-xs text-[#A89F91] mt-1">Percentage of approved goal sheets per department per quarter</p>
        </div>
        <div className="p-5 overflow-x-auto">
          {(() => {
            const deptNames = departments.map(d => d.name);
            const cycleNames = cycles.slice(0, 4).map(c => c.name);
            const heatData: Record<string, Record<string, number>> = {};
            deptNames.forEach(dept => {
              heatData[dept] = {};
              cycleNames.forEach(cycle => {
                const deptObj = departments.find(d => d.name === dept);
                const cycleObj = cycles.find(c => c.name === cycle);
                if (!deptObj || !cycleObj) { heatData[dept][cycle] = 0; return; }
                const deptEmps = employeeList.filter(p => p.department_id === deptObj.id && p.role === "employee");
                const approved = sheets.filter(s => deptEmps.some(e => e.id === s.employee_id) && s.cycle_id === cycleObj.id && s.status === "approved").length;
                heatData[dept][cycle] = deptEmps.length > 0 ? Math.round((approved / deptEmps.length) * 100) : 0;
              });
            });
            return (
              <table className="w-full">
                <thead><tr>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-[#A89F91] pb-3 pr-4 w-40">Department</th>
                  {cycleNames.map(c => <th key={c} className="text-center text-xs font-medium uppercase tracking-wider text-[#A89F91] pb-3 px-3 font-mono">{c}</th>)}
                </tr></thead>
                <tbody>
                  {deptNames.map(dept => (
                    <tr key={dept} className="border-t border-[#F5F1EA]">
                      <td className="py-3 pr-4 text-sm font-medium text-[#1A1A1A]">{dept}</td>
                      {cycleNames.map(cycle => {
                        const val = heatData[dept]?.[cycle] || 0;
                        const bg = val >= 80 ? "bg-green-50 text-green-700" : val >= 50 ? "bg-yellow-50 text-yellow-700" : val > 0 ? "bg-red-50 text-red-700" : "bg-[#F5F1EA] text-[#A89F91]";
                        return <td key={cycle} className="py-3 px-3 text-center"><span className={`inline-block font-mono text-xs font-bold px-3 py-1 rounded ${bg}`}>{val > 0 ? `${val}%` : "—"}</span></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
          <div className="flex items-center gap-4 mt-4 text-xs text-[#A89F91]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-50 border border-green-200" /> ≥80%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-50 border border-yellow-200" /> 50-79%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 border border-red-200" /> &lt;50%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

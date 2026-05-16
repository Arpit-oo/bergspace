"use client";

import { Profile, GoalCycle } from "@/lib/types";

/* ── Status dot + label ── */
function StatusDot({ status }: { status: string }) {
  const map: Record<string, { dot: string; label: string }> = {
    not_started: { dot: "bg-[#A89F91]", label: "Not Started" },
    draft: { dot: "bg-[#A89F91]", label: "Draft" },
    submitted: { dot: "bg-[#C08B30]", label: "Submitted" },
    approved: { dot: "bg-[#3D9A5F]", label: "Approved" },
    returned: { dot: "bg-[#D94F3D]", label: "Returned" },
  };
  const s = map[status] || map.not_started;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[#5C564C]">
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} shrink-0`} />
      {s.label}
    </span>
  );
}

interface TeamViewProps {
  teamMembers: Profile[];
  teamSheets: Record<string, unknown>[];
  activeCycle: GoalCycle | null;
}

export function TeamView({
  teamMembers,
  teamSheets,
  activeCycle,
}: TeamViewProps) {
  const sheetMap = new Map(
    teamSheets.map((s) => [s.employee_id as string, s])
  );

  const stats = {
    total: teamMembers.length,
    submitted: teamSheets.filter((s) => s.status === "submitted").length,
    approved: teamSheets.filter((s) => s.status === "approved").length,
    noSheet: teamMembers.length - teamSheets.length,
  };

  const statCards: { label: string; value: number }[] = [
    { label: "Team Members", value: stats.total },
    { label: "Pending Review", value: stats.submitted },
    { label: "Approved", value: stats.approved },
    { label: "Not Started", value: stats.noSheet },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
          My Team
        </h1>
        {activeCycle && (
          <span className="inline-flex items-center rounded-full border border-[#E8E2D6] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#5C564C]">
            {activeCycle.name}
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((sc) => (
          <div
            key={sc.label}
            className="bg-white border border-[#E8E2D6] rounded-xl px-5 py-4"
          >
            <p className="text-3xl font-semibold font-mono tabular-nums text-[#1A1A1A] leading-none">
              {sc.value}
            </p>
            <p className="text-xs text-[#A89F91] uppercase tracking-wider font-medium mt-2">
              {sc.label}
            </p>
          </div>
        ))}
      </div>

      {/* Team table */}
      <div className="bg-white border border-[#E8E2D6] rounded-xl">
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">
            Team Members
          </h2>
        </div>
        <div className="px-5 pb-5">
          <table className="w-full mt-4">
            <thead>
              <tr>
                {["Employee", "Department", "Status", "Goals"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs text-[#A89F91] uppercase tracking-wider font-medium pb-3 border-b border-[#F5F1EA]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => {
                const sheet = sheetMap.get(member.id);
                const status = sheet
                  ? (sheet.status as string)
                  : "not_started";
                const goalCount = sheet
                  ? ((sheet.goals as { count: number }[])?.[0]?.count || 0)
                  : 0;
                const initials = member.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <tr
                    key={member.id}
                    className="group border-b border-[#F5F1EA] last:border-b-0 hover:bg-[#FEFCF9] transition-colors"
                  >
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#F5F1EA] flex items-center justify-center text-[11px] font-semibold text-[#5C564C] shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">
                            {member.full_name}
                          </p>
                          <p className="text-xs text-[#A89F91]">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-sm text-[#5C564C]">
                      {member.department?.name || "—"}
                    </td>
                    <td className="py-3.5">
                      <StatusDot status={status} />
                    </td>
                    <td className="py-3.5 text-sm text-[#5C564C] font-mono tabular-nums">
                      {goalCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

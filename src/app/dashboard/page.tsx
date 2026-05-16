import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SHEET_STATUS_LABELS } from "@/lib/constants";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, department:departments(*)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  const role = profile.role || "employee";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ─── MANAGER DASHBOARD ─────────────────────────────────────────────
  if (role === "manager") {
    // Team members
    const { data: teamMembers } = await supabase
      .from("profiles")
      .select("*, department:departments(*)")
      .eq("manager_id", user.id)
      .eq("is_active", true);

    const teamIds = (teamMembers || []).map((m) => m.id);

    // Active cycle
    const { data: activeCycle } = await supabase
      .from("goal_cycles")
      .select("*")
      .eq("is_active", true)
      .single();

    // Goal sheets for active cycle
    let goalSheets: { id: string; employee_id: string; status: string }[] = [];
    if (activeCycle && teamIds.length > 0) {
      const { data } = await supabase
        .from("goal_sheets")
        .select("id, employee_id, status")
        .in("employee_id", teamIds)
        .eq("cycle_id", activeCycle.id);
      goalSheets = data || [];
    }

    // Checkins for active cycle
    let checkinCount = 0;
    if (activeCycle && teamIds.length > 0) {
      const { count } = await supabase
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .eq("manager_id", user.id)
        .eq("cycle_id", activeCycle.id);
      checkinCount = count || 0;
    }

    // Notifications
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const pendingApprovals = goalSheets.filter((s) => s.status === "submitted").length;
    const approvedSheets = goalSheets.filter((s) => s.status === "approved").length;

    // Build team status rows
    const teamStatusRows = (teamMembers || []).map((member) => {
      const sheet = goalSheets.find((s) => s.employee_id === member.id);
      return {
        name: member.full_name,
        department: member.department?.name || "—",
        status: sheet ? sheet.status : "no_sheet",
      };
    });

    return (
      <div className="flex flex-col gap-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
            Welcome back, {profile.full_name}
          </h1>
          <p className="text-sm text-[#8C8578] mt-1">{today}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "TEAM SIZE", value: teamIds.length, color: "#3B7DD8" },
            { label: "PENDING APPROVALS", value: pendingApprovals, color: "#C45A2D" },
            { label: "GOALS APPROVED", value: approvedSheets, color: "#3D9A5F" },
            { label: "CHECK-INS DONE", value: checkinCount, color: "#8B5FC7" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-[#E8E2D6] rounded-xl p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-8 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />
                <div>
                  <p className="text-3xl font-semibold font-mono tabular-nums text-[#1A1A1A] leading-none">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[#8C8578] uppercase tracking-wider mt-1">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/approvals"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C45A2D] text-white text-sm font-medium hover:bg-[#A94A24] transition-colors"
          >
            Review Approvals
          </Link>
          <Link
            href="/dashboard/checkins"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E8E2D6] bg-white text-[#1A1A1A] text-sm font-medium hover:bg-[#F5F1EA] transition-colors"
          >
            Start Check-ins
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E2D6]">
              <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
                Recent Activity
              </h2>
            </div>
            {(!notifications || notifications.length === 0) ? (
              <div className="p-5 text-sm text-[#8C8578]">No recent activity.</div>
            ) : (
              <div className="divide-y divide-[#F5F1EA]">
                {notifications.map((n) => (
                  <div key={n.id} className="px-5 py-3 flex items-start gap-3">
                    <div
                      className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: n.is_read ? "#E8E2D6" : "#C45A2D",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#1A1A1A] truncate">{n.title}</p>
                      <p className="text-xs text-[#8C8578] mt-0.5 truncate">
                        {n.message}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-[#8C8578] tabular-nums shrink-0">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Status */}
          <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E2D6]">
              <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
                Team Status
              </h2>
            </div>
            {teamStatusRows.length === 0 ? (
              <div className="p-5 text-sm text-[#8C8578]">No team members.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F5F1EA]">
                    <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-[#8C8578]">
                      Member
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-[#8C8578]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teamStatusRows.map((row) => {
                    const statusLabel =
                      row.status === "no_sheet"
                        ? "No Sheet"
                        : SHEET_STATUS_LABELS[row.status] || row.status;
                    const statusColor =
                      row.status === "approved"
                        ? "#3D9A5F"
                        : row.status === "submitted"
                          ? "#C08B30"
                          : row.status === "returned"
                            ? "#D94F3D"
                            : "#8C8578";
                    return (
                      <tr
                        key={row.name}
                        className="border-b border-[#F5F1EA] last:border-b-0"
                      >
                        <td className="px-5 py-2.5">
                          <p className="text-sm font-medium text-[#1A1A1A]">
                            {row.name}
                          </p>
                          <p className="text-xs text-[#8C8578]">{row.department}</p>
                        </td>
                        <td className="px-5 py-2.5">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium"
                            style={{ color: statusColor }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: statusColor }}
                            />
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── EMPLOYEE DASHBOARD ────────────────────────────────────────────
  if (role === "employee") {
    // Active cycle
    const { data: activeCycle } = await supabase
      .from("goal_cycles")
      .select("*")
      .eq("is_active", true)
      .single();

    // Goal sheet
    let goalSheet: { id: string; status: string; goals: { id: string }[] } | null = null;
    if (activeCycle) {
      const { data } = await supabase
        .from("goal_sheets")
        .select("id, status, goals(id)")
        .eq("employee_id", user.id)
        .eq("cycle_id", activeCycle.id)
        .single();
      goalSheet = data as { id: string; status: string; goals: { id: string }[] } | null;
    }

    // Notifications
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    const sheetStatus = goalSheet?.status || "no_sheet";
    const goalCount = goalSheet?.goals?.length || 0;
    const sheetStatusLabel =
      sheetStatus === "no_sheet"
        ? "Not Started"
        : SHEET_STATUS_LABELS[sheetStatus] || sheetStatus;
    const sheetStatusColor =
      sheetStatus === "approved"
        ? "#3D9A5F"
        : sheetStatus === "submitted"
          ? "#C08B30"
          : sheetStatus === "returned"
            ? "#D94F3D"
            : "#8C8578";

    return (
      <div className="flex flex-col gap-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
            Welcome back, {profile.full_name}
          </h1>
          <p className="text-sm text-[#8C8578] mt-1">{today}</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Goal Sheet Status */}
          <div className="bg-white border border-[#E8E2D6] rounded-xl p-6">
            <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A] mb-4">
              Goal Sheet Status
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: sheetStatusColor }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: sheetStatusColor }}
                />
                {sheetStatusLabel}
              </span>
            </div>
            <p className="text-sm text-[#5C564C]">
              {goalCount} goal{goalCount !== 1 ? "s" : ""} defined
            </p>
            {activeCycle && (
              <p className="text-xs text-[#8C8578] mt-2">
                Cycle: {activeCycle.name}
              </p>
            )}
          </div>

          {/* Current Cycle Info */}
          {activeCycle ? (
            <div className="bg-white border border-[#E8E2D6] rounded-xl p-6">
              <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A] mb-4">
                Current Cycle
              </h2>
              <p className="text-lg font-semibold text-[#1A1A1A]">
                {activeCycle.name}
              </p>
              <div className="mt-3 space-y-1.5">
                <p className="text-xs text-[#8C8578]">
                  <span className="text-[#5C564C] font-medium">Period:</span>{" "}
                  {new Date(activeCycle.start_date).toLocaleDateString()} &ndash;{" "}
                  {new Date(activeCycle.end_date).toLocaleDateString()}
                </p>
                <p className="text-xs text-[#8C8578]">
                  <span className="text-[#5C564C] font-medium">Submission deadline:</span>{" "}
                  {new Date(activeCycle.submission_deadline).toLocaleDateString()}
                </p>
                <p className="text-xs text-[#8C8578]">
                  <span className="text-[#5C564C] font-medium">Check-in window:</span>{" "}
                  {new Date(activeCycle.checkin_open).toLocaleDateString()} &ndash;{" "}
                  {new Date(activeCycle.checkin_close).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E8E2D6] rounded-xl p-6 flex items-center justify-center">
              <p className="text-sm text-[#8C8578]">No active cycle.</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/goals"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C45A2D] text-white text-sm font-medium hover:bg-[#A94A24] transition-colors"
          >
            View My Goals
          </Link>
          <Link
            href="/dashboard/my-checkins"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E8E2D6] bg-white text-[#1A1A1A] text-sm font-medium hover:bg-[#F5F1EA] transition-colors"
          >
            Log Check-in
          </Link>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E2D6]">
            <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
              Recent Notifications
            </h2>
          </div>
          {(!notifications || notifications.length === 0) ? (
            <div className="p-5 text-sm text-[#8C8578]">No notifications yet.</div>
          ) : (
            <div className="divide-y divide-[#F5F1EA]">
              {notifications.map((n) => (
                <div key={n.id} className="px-5 py-3 flex items-start gap-3">
                  <div
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: n.is_read ? "#E8E2D6" : "#C45A2D",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#1A1A1A] truncate">{n.title}</p>
                    <p className="text-xs text-[#8C8578] mt-0.5 truncate">
                      {n.message}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-[#8C8578] tabular-nums shrink-0">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── ADMIN DASHBOARD ───────────────────────────────────────────────
  if (role === "admin") {
    // Total employees
    const { count: totalEmployees } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .neq("role", "admin");

    // Active cycle
    const { data: activeCycle } = await supabase
      .from("goal_cycles")
      .select("*")
      .eq("is_active", true)
      .single();

    // Pending approvals org-wide
    let pendingApprovals = 0;
    if (activeCycle) {
      const { count } = await supabase
        .from("goal_sheets")
        .select("id", { count: "exact", head: true })
        .eq("cycle_id", activeCycle.id)
        .eq("status", "submitted");
      pendingApprovals = count || 0;
    }

    // Escalations (unresolved)
    const { count: escalationCount } = await supabase
      .from("escalation_log")
      .select("id", { count: "exact", head: true })
      .eq("resolved", false);

    // Recent audit log
    const { data: auditLogs } = await supabase
      .from("audit_log")
      .select(
        "*, changed_by_profile:profiles!audit_log_changed_by_fkey(id, full_name)"
      )
      .order("created_at", { ascending: false })
      .limit(5);

    return (
      <div className="flex flex-col gap-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
            Welcome back, {profile.full_name}
          </h1>
          <p className="text-sm text-[#8C8578] mt-1">{today}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "TOTAL EMPLOYEES", value: totalEmployees || 0, color: "#3B7DD8" },
            {
              label: "ACTIVE CYCLE",
              value: activeCycle ? activeCycle.name : "None",
              color: "#C08B30",
              isText: true,
            },
            { label: "PENDING APPROVALS", value: pendingApprovals, color: "#C45A2D" },
            { label: "ESCALATIONS", value: escalationCount || 0, color: "#D94F3D" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-[#E8E2D6] rounded-xl p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-8 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />
                <div>
                  <p
                    className={`font-semibold text-[#1A1A1A] leading-none ${
                      "isText" in stat && stat.isText
                        ? "text-base"
                        : "text-3xl font-mono tabular-nums"
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-[#8C8578] uppercase tracking-wider mt-1">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/employees"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C45A2D] text-white text-sm font-medium hover:bg-[#A94A24] transition-colors"
          >
            Manage Employees
          </Link>
          <Link
            href="/dashboard/cycles"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E8E2D6] bg-white text-[#1A1A1A] text-sm font-medium hover:bg-[#F5F1EA] transition-colors"
          >
            Goal Cycles
          </Link>
          <Link
            href="/dashboard/escalations"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E8E2D6] bg-white text-[#1A1A1A] text-sm font-medium hover:bg-[#F5F1EA] transition-colors"
          >
            Escalations
          </Link>
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E8E2D6] bg-white text-[#1A1A1A] text-sm font-medium hover:bg-[#F5F1EA] transition-colors"
          >
            Reports
          </Link>
        </div>

        {/* Recent Audit Log */}
        <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E2D6] flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
              Recent Audit Log
            </h2>
            <Link
              href="/dashboard/audit"
              className="text-xs text-[#C45A2D] font-medium hover:underline"
            >
              View All
            </Link>
          </div>
          {(!auditLogs || auditLogs.length === 0) ? (
            <div className="p-5 text-sm text-[#8C8578]">No audit entries.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5F1EA]">
                  {["Timestamp", "Table", "Field", "Changed By"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-[#8C8578]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-[#F5F1EA] last:border-b-0"
                  >
                    <td className="px-5 py-2.5 font-mono text-[11px] text-[#8C8578] tabular-nums whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="font-mono text-[11px] text-[#5C564C] border border-[#E8E2D6] rounded px-1.5 py-0.5">
                        {entry.table_name}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 font-mono text-sm text-[#1A1A1A]">
                      {entry.field_name}
                    </td>
                    <td className="px-5 py-2.5 text-sm text-[#1A1A1A]">
                      {entry.changed_by_profile?.full_name || entry.changed_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // Fallback — redirect to goals
  redirect("/dashboard/goals");
}

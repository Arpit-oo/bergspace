"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  EscalationRule,
  EscalationLogEntry,
  GoalCycle,
  EscalationTriggerType,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Clock,
  Bell,
  Activity,
  Plus,
} from "lucide-react";

const TRIGGER_TYPE_LABELS: Record<EscalationTriggerType, string> = {
  no_submission: "No Submission",
  no_approval: "No Approval",
  missed_checkin: "Missed Check-in",
};

interface EscalationLogWithRelations {
  id: string;
  rule_id: string;
  employee_id: string;
  cycle_id: string;
  trigger_type: EscalationTriggerType;
  escalation_level: number;
  notified_users: string[];
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  employee?: {
    full_name: string;
    email: string;
    department?: { name: string };
  };
  rule?: EscalationRule;
}

interface SheetWithEmployee {
  id: string;
  employee_id: string;
  cycle_id: string;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  employee?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    manager_id: string | null;
    department_id: string | null;
    department?: { name: string } | { name: string }[];
  };
}

interface ProfileWithDept {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department_id: string | null;
  manager_id: string | null;
  department?: { name: string } | { name: string }[];
}

interface CheckinRecord {
  id: string;
  employee_id: string;
  cycle_id: string;
}

function getDeptName(dept?: { name: string } | { name: string }[]): string {
  if (!dept) return "";
  if (Array.isArray(dept)) return dept[0]?.name || "";
  return dept.name || "";
}

interface BottleneckManager {
  id: string;
  name: string;
  email: string;
  department: string;
  pendingCount: number;
  oldestPendingDays: number;
}

interface DepartmentHealth {
  department: string;
  departmentId: string;
  totalEmployees: number;
  submissionRate: number;
  approvalRate: number;
  checkinRate: number;
}

interface EscalationsViewProps {
  rules: EscalationRule[];
  escalationLog: Record<string, unknown>[];
  cycles: GoalCycle[];
  allSheets?: SheetWithEmployee[];
  allProfiles?: ProfileWithDept[];
  allCheckins?: CheckinRecord[];
}

function HeatmapCell({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const cls =
    value >= 80
      ? "bg-green-50 text-green-700"
      : value >= 50
        ? "bg-yellow-50 text-yellow-700"
        : "bg-red-50 text-red-700";
  return (
    <span className={`inline-block font-mono text-xs font-medium px-2.5 py-1 rounded text-center min-w-[48px] tabular-nums ${cls}`}>
      {value}{suffix}
    </span>
  );
}

function TriggerBadge({ type }: { type: EscalationTriggerType }) {
  const cls =
    type === "no_submission"
      ? "bg-red-50 text-red-600"
      : type === "no_approval"
        ? "bg-yellow-50 text-yellow-700"
        : "bg-orange-50 text-orange-600";
  const dotCls =
    type === "no_submission"
      ? "bg-red-600"
      : type === "no_approval"
        ? "bg-yellow-700"
        : "bg-orange-600";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
      {TRIGGER_TYPE_LABELS[type]}
    </span>
  );
}

export function EscalationsView({
  rules: initialRules,
  escalationLog: rawLog,
  cycles,
  allSheets = [],
  allProfiles = [],
  allCheckins = [],
}: EscalationsViewProps) {
  const [rules, setRules] = useState<EscalationRule[]>(initialRules);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"rules" | "log" | "intervention">("rules");
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [newRuleTrigger, setNewRuleTrigger] = useState<EscalationTriggerType>("no_submission");
  const [newRuleDays, setNewRuleDays] = useState("7");
  const [newRuleNotifyEmployee, setNewRuleNotifyEmployee] = useState(true);
  const [newRuleNotifyManager, setNewRuleNotifyManager] = useState(true);
  const [newRuleNotifySkipLevel, setNewRuleNotifySkipLevel] = useState(false);
  const [newRuleNotifyHr, setNewRuleNotifyHr] = useState(false);
  const [newRuleActive, setNewRuleActive] = useState(true);
  const [creatingRule, setCreatingRule] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const logEntries = rawLog as unknown as EscalationLogWithRelations[];
  const cycleMap = new Map(cycles.map((c) => [c.id, c]));

  const unresolvedCount = logEntries.filter((e) => !e.resolved).length;
  const resolvedCount = logEntries.filter((e) => e.resolved).length;
  const activeRulesCount = rules.filter((r) => r.is_active).length;

  const bottleneckManagers = useMemo<BottleneckManager[]>(() => {
    const now = Date.now();
    const hours48 = 48 * 60 * 60 * 1000;
    const pendingSheets = allSheets.filter((s) => {
      if (s.status !== "submitted" || !s.submitted_at) return false;
      const submittedTime = new Date(s.submitted_at).getTime();
      return now - submittedTime > hours48;
    });
    const managerMap = new Map<string, { count: number; oldestMs: number }>();
    for (const sheet of pendingSheets) {
      const managerId = sheet.employee?.manager_id;
      if (!managerId) continue;
      const submittedMs = new Date(sheet.submitted_at!).getTime();
      const existing = managerMap.get(managerId);
      if (existing) {
        existing.count++;
        if (submittedMs < existing.oldestMs) existing.oldestMs = submittedMs;
      } else {
        managerMap.set(managerId, { count: 1, oldestMs: submittedMs });
      }
    }
    const profileMap = new Map(allProfiles.map((p) => [p.id, p]));
    const result: BottleneckManager[] = [];
    for (const [managerId, data] of managerMap) {
      const mgr = profileMap.get(managerId);
      result.push({
        id: managerId,
        name: mgr?.full_name || "Unknown",
        email: mgr?.email || "",
        department: getDeptName(mgr?.department) || "—",
        pendingCount: data.count,
        oldestPendingDays: Math.floor((now - data.oldestMs) / (1000 * 60 * 60 * 24)),
      });
    }
    return result.sort((a, b) => b.oldestPendingDays - a.oldestPendingDays);
  }, [allSheets, allProfiles]);

  const departmentHealth = useMemo<DepartmentHealth[]>(() => {
    const deptEmployees = new Map<string, { name: string; ids: Set<string> }>();
    for (const p of allProfiles) {
      if (p.role === "admin") continue;
      const deptId = p.department_id || "unknown";
      const deptName = getDeptName(p.department) || "No Department";
      const existing = deptEmployees.get(deptId);
      if (existing) {
        existing.ids.add(p.id);
      } else {
        deptEmployees.set(deptId, { name: deptName, ids: new Set([p.id]) });
      }
    }
    const checkinEmployeeIds = new Set(allCheckins.map((c) => c.employee_id));
    const result: DepartmentHealth[] = [];
    for (const [deptId, dept] of deptEmployees) {
      const totalEmployees = dept.ids.size;
      if (totalEmployees === 0) continue;
      const deptSheets = allSheets.filter(
        (s) => s.employee?.department_id === deptId || (!s.employee?.department_id && deptId === "unknown")
      );
      const submittedOrApproved = deptSheets.filter(
        (s) => s.status === "submitted" || s.status === "approved"
      ).length;
      const approvedSheets = deptSheets.filter((s) => s.status === "approved").length;
      const submittedSheets = deptSheets.filter(
        (s) => s.status === "submitted" || s.status === "approved"
      ).length;
      const employeesWithCheckin = [...dept.ids].filter((id) => checkinEmployeeIds.has(id)).length;
      const approvedSheetsCount = approvedSheets;
      const submissionRate = totalEmployees > 0 ? Math.round((submittedOrApproved / totalEmployees) * 100) : 0;
      const approvalRate = submittedSheets > 0 ? Math.round((approvedSheets / submittedSheets) * 100) : 0;
      const checkinRate = approvedSheetsCount > 0 ? Math.round((employeesWithCheckin / approvedSheetsCount) * 100) : 0;
      result.push({ department: dept.name, departmentId: deptId, totalEmployees, submissionRate, approvalRate, checkinRate });
    }
    return result.sort((a, b) => a.department.localeCompare(b.department));
  }, [allSheets, allProfiles, allCheckins]);

  async function sendReminder(managerId: string, managerName: string) {
    setSendingReminder(managerId);
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: managerId,
        type: "escalation" as const,
        title: "Pending Approval Reminder",
        message: `You have goal sheets awaiting your approval for more than 48 hours. Please review them at your earliest convenience.`,
        link: "/dashboard/approvals",
      });
      if (error) throw error;
      toast.success(`Reminder sent to ${managerName}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to send reminder";
      toast.error(msg);
    } finally {
      setSendingReminder(null);
    }
  }

  async function createRule() {
    const days = parseInt(newRuleDays);
    if (!days || days < 1) {
      toast.error("Days threshold must be at least 1");
      return;
    }
    setCreatingRule(true);
    try {
      const { data, error } = await supabase
        .from("escalation_rules")
        .insert({
          trigger_type: newRuleTrigger,
          days_threshold: days,
          notify_employee: newRuleNotifyEmployee,
          notify_manager: newRuleNotifyManager,
          notify_skip_level: newRuleNotifySkipLevel,
          notify_hr: newRuleNotifyHr,
          is_active: newRuleActive,
        })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setRules((prev) => [...prev, data as EscalationRule]);
      }
      toast.success("Escalation rule created");
      setNewRuleOpen(false);
      setNewRuleTrigger("no_submission");
      setNewRuleDays("7");
      setNewRuleNotifyEmployee(true);
      setNewRuleNotifyManager(true);
      setNewRuleNotifySkipLevel(false);
      setNewRuleNotifyHr(false);
      setNewRuleActive(true);
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to create rule";
      toast.error(msg);
    } finally {
      setCreatingRule(false);
    }
  }

  async function toggleRule(ruleId: string, currentlyActive: boolean) {
    setTogglingId(ruleId);
    try {
      const { error } = await supabase
        .from("escalation_rules")
        .update({ is_active: !currentlyActive })
        .eq("id", ruleId);
      if (error) throw error;
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, is_active: !currentlyActive } : r))
      );
      toast.success(`Rule ${!currentlyActive ? "activated" : "deactivated"}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update rule";
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  }

  async function resolveEscalation(entryId: string) {
    setResolvingId(entryId);
    try {
      const { error } = await supabase
        .from("escalation_log")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", entryId);
      if (error) throw error;
      toast.success("Escalation marked as resolved");
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to resolve escalation";
      toast.error(msg);
    } finally {
      setResolvingId(null);
    }
  }

  const tabs = [
    { key: "rules" as const, label: "Escalation Rules" },
    { key: "log" as const, label: `Escalation Log (${logEntries.length})` },
    { key: "intervention" as const, label: "Intervention" },
  ];

  const statCards = [
    { icon: Shield, value: rules.length, label: "TOTAL RULES", color: "#C45A2D" },
    { icon: CheckCircle2, value: activeRulesCount, label: "ACTIVE RULES", color: "#3D9A5F" },
    { icon: AlertTriangle, value: unresolvedCount, label: "UNRESOLVED", color: "#D94F3D" },
    { icon: Clock, value: resolvedCount, label: "RESOLVED", color: "#A89F91" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Escalations</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white border border-[#E8E2D6] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              <div>
                <p className="text-3xl font-semibold font-mono tabular-nums text-[#1A1A1A] leading-none">
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

        {/* Rules Tab */}
        {activeTab === "rules" && (
          <div className="bg-white border border-[#E8E2D6] border-t-0 rounded-b-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E2D6] flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">Escalation Rules</h2>
              <Button
                onClick={() => setNewRuleOpen(true)}
                className="gap-1.5 text-white border-0 text-xs"
                size="sm"
                style={{ backgroundColor: "#C45A2D" }}
              >
                <Plus className="h-3.5 w-3.5" /> New Rule
              </Button>
            </div>
            {rules.length === 0 ? (
              <div className="text-center text-[#A89F91] text-sm py-8 mx-4 my-4 border border-dashed border-[#E8E2D6] rounded-xl">
                No escalation rules configured.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F5F1EA]">
                    {["Trigger Type", "Days Threshold", "Notify Employee", "Notify Manager", "Notify Skip Level", "Notify HR", "Status", "Action"].map((h, i) => (
                      <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#A89F91] ${i === 1 || i === 7 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-b border-[#F5F1EA] hover:bg-[#FEFCF9] transition-colors">
                      <td className="px-4 py-3"><TriggerBadge type={rule.trigger_type} /></td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium tabular-nums text-[#1A1A1A]">
                        {rule.days_threshold} days
                      </td>
                      <td className="px-4 py-3">
                        {rule.notify_employee ? <CheckCircle2 className="h-4 w-4 text-[#3D9A5F]" /> : <XCircle className="h-4 w-4 text-[#E8E2D6]" />}
                      </td>
                      <td className="px-4 py-3">
                        {rule.notify_manager ? <CheckCircle2 className="h-4 w-4 text-[#3D9A5F]" /> : <XCircle className="h-4 w-4 text-[#E8E2D6]" />}
                      </td>
                      <td className="px-4 py-3">
                        {rule.notify_skip_level ? <CheckCircle2 className="h-4 w-4 text-[#3D9A5F]" /> : <XCircle className="h-4 w-4 text-[#E8E2D6]" />}
                      </td>
                      <td className="px-4 py-3">
                        {rule.notify_hr ? <CheckCircle2 className="h-4 w-4 text-[#3D9A5F]" /> : <XCircle className="h-4 w-4 text-[#E8E2D6]" />}
                      </td>
                      <td className="px-4 py-3">
                        {rule.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3D9A5F]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3D9A5F]" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A89F91]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#A89F91]" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRule(rule.id, rule.is_active)}
                          disabled={togglingId === rule.id}
                          className="border-[#E8E2D6] text-[#5C564C] text-xs"
                        >
                          {togglingId === rule.id ? <Loader2 className="h-3 w-3 animate-spin" /> : rule.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Log Tab */}
        {activeTab === "log" && (
          <div className="bg-white border border-[#E8E2D6] border-t-0 rounded-b-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E2D6]">
              <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">Escalation Log</h2>
            </div>
            {logEntries.length === 0 ? (
              <div className="text-center text-[#A89F91] text-sm py-8 mx-4 my-4 border border-dashed border-[#E8E2D6] rounded-xl">
                No escalations have been triggered.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F5F1EA]">
                    {["Employee", "Department", "Trigger", "Cycle", "Level", "Status", "Date", "Action"].map((h, i) => (
                      <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#A89F91] ${i === 4 || i === 7 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logEntries.map((entry) => {
                    const cycle = cycleMap.get(entry.cycle_id);
                    return (
                      <tr key={entry.id} className="border-b border-[#F5F1EA] hover:bg-[#FEFCF9] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-[#1A1A1A]">{entry.employee?.full_name || "Unknown"}</p>
                            <p className="text-[11px] text-[#A89F91]">{entry.employee?.email || ""}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#5C564C]">{entry.employee?.department?.name || "—"}</td>
                        <td className="px-4 py-3"><TriggerBadge type={entry.trigger_type} /></td>
                        <td className="px-4 py-3 text-sm text-[#5C564C]">{cycle?.name || "—"}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-medium tabular-nums text-[#1A1A1A]">
                          L{entry.escalation_level}
                        </td>
                        <td className="px-4 py-3">
                          {entry.resolved ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3D9A5F]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3D9A5F]" /> Resolved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D94F3D]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D94F3D]" /> Open
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[#A89F91] tabular-nums">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!entry.resolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolveEscalation(entry.id)}
                              disabled={resolvingId === entry.id}
                              className="gap-1.5 border-[#E8E2D6] text-[#5C564C] text-xs"
                            >
                              {resolvingId === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                              Resolve
                            </Button>
                          )}
                          {entry.resolved && entry.resolved_at && (
                            <span className="font-mono text-[11px] text-[#A89F91] tabular-nums">
                              {new Date(entry.resolved_at).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Intervention Tab */}
        {activeTab === "intervention" && (
          <div className="flex flex-col gap-6 pt-4">
            {/* Bottleneck Managers */}
            <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8E2D6] flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#C08B30]" />
                <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">Bottleneck Managers</h2>
              </div>
              {bottleneckManagers.length === 0 ? (
                <div className="text-center text-[#A89F91] text-sm py-8 mx-4 my-4 border border-dashed border-[#E8E2D6] rounded-xl">
                  No managers with pending approvals older than 48 hours.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F5F1EA]">
                      {["Manager Name", "Pending Approvals", "Oldest Pending", "Department", "Action"].map((h, i) => (
                        <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#A89F91] ${i === 1 || i === 2 || i === 4 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bottleneckManagers.map((mgr) => (
                      <tr key={mgr.id} className="border-b border-[#F5F1EA] hover:bg-[#FEFCF9] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-[#1A1A1A]">{mgr.name}</p>
                            <p className="text-[11px] text-[#A89F91]">{mgr.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-block font-mono text-xs font-medium tabular-nums px-2.5 py-0.5 rounded-full bg-red-50 text-red-600">
                            {mgr.pendingCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-medium tabular-nums text-[#1A1A1A]">
                          {mgr.oldestPendingDays} day{mgr.oldestPendingDays !== 1 ? "s" : ""} ago
                        </td>
                        <td className="px-4 py-3 text-sm text-[#5C564C]">{mgr.department}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendReminder(mgr.id, mgr.name)}
                            disabled={sendingReminder === mgr.id}
                            className="gap-1.5 border-[#E8E2D6] text-[#5C564C] text-xs"
                          >
                            {sendingReminder === mgr.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />}
                            Send Reminder
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Department Health */}
            <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8E2D6] flex items-center gap-2">
                <Activity className="h-5 w-5" style={{ color: "#C45A2D" }} />
                <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">Department Health</h2>
              </div>
              {departmentHealth.length === 0 ? (
                <div className="text-center text-[#A89F91] text-sm py-8 mx-4 my-4 border border-dashed border-[#E8E2D6] rounded-xl">
                  No department data available.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F5F1EA]">
                      {["Department", "Employees", "Submission Rate", "Approval Rate", "Check-in Rate"].map((h, i) => (
                        <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#A89F91] ${i >= 1 ? "text-center" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {departmentHealth.map((dept) => (
                      <tr key={dept.departmentId} className="border-b border-[#F5F1EA] hover:bg-[#FEFCF9] transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">{dept.department}</td>
                        <td className="px-4 py-3 text-center font-mono text-sm tabular-nums text-[#1A1A1A]">{dept.totalEmployees}</td>
                        <td className="px-4 py-3 text-center"><HeatmapCell value={dept.submissionRate} /></td>
                        <td className="px-4 py-3 text-center"><HeatmapCell value={dept.approvalRate} /></td>
                        <td className="px-4 py-3 text-center"><HeatmapCell value={dept.checkinRate} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Rule Dialog */}
      <Dialog open={newRuleOpen} onOpenChange={setNewRuleOpen}>
        <DialogContent className="max-w-4xl w-[85vw] p-8 bg-white border border-[#E8E2D6] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#1A1A1A]">
              New Escalation Rule
            </DialogTitle>
            <DialogDescription className="text-sm text-[#8C8578]">
              Configure when and who to notify when deadlines are missed.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-5">
            <div>
              <Label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                Trigger Type
              </Label>
              <Select
                value={newRuleTrigger}
                onValueChange={(v: string | null) =>
                  setNewRuleTrigger((v ?? "no_submission") as EscalationTriggerType)
                }
                items={[
                  { value: "no_submission", label: "No Submission" },
                  { value: "no_approval", label: "No Approval" },
                  { value: "missed_checkin", label: "Missed Check-in" },
                ]}
              >
                <SelectTrigger className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_submission">No Submission</SelectItem>
                  <SelectItem value="no_approval">No Approval</SelectItem>
                  <SelectItem value="missed_checkin">Missed Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                Days Threshold
              </Label>
              <Input
                type="number"
                min={1}
                value={newRuleDays}
                onChange={(e) => setNewRuleDays(e.target.value)}
                placeholder="e.g., 7"
                className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] font-mono tabular-nums focus:ring-0 max-w-[200px]"
              />
              <p className="text-xs text-[#A89F91] mt-1">
                Number of days after deadline before escalation triggers.
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-[#1A1A1A] mb-2 block">
                Notify
              </Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={newRuleNotifyEmployee}
                    onCheckedChange={(checked) =>
                      setNewRuleNotifyEmployee(checked === true)
                    }
                  />
                  <span className="text-sm text-[#1A1A1A]">Employee</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={newRuleNotifyManager}
                    onCheckedChange={(checked) =>
                      setNewRuleNotifyManager(checked === true)
                    }
                  />
                  <span className="text-sm text-[#1A1A1A]">Manager</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={newRuleNotifySkipLevel}
                    onCheckedChange={(checked) =>
                      setNewRuleNotifySkipLevel(checked === true)
                    }
                  />
                  <span className="text-sm text-[#1A1A1A]">Skip-level</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={newRuleNotifyHr}
                    onCheckedChange={(checked) =>
                      setNewRuleNotifyHr(checked === true)
                    }
                  />
                  <span className="text-sm text-[#1A1A1A]">HR</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={newRuleActive}
                  onCheckedChange={(checked) =>
                    setNewRuleActive(checked === true)
                  }
                />
                <span className="text-sm font-medium text-[#1A1A1A]">Active</span>
              </label>
              <span className="text-xs text-[#A89F91]">
                Rule will start triggering immediately if active.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-[#F5F1EA]">
            <button
              onClick={() => setNewRuleOpen(false)}
              className="rounded-lg border border-[#E8E2D6] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#FEFCF9] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createRule}
              disabled={creatingRule}
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#C45A2D" }}
            >
              {creatingRule && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Rule
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

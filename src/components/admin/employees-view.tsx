"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Profile, Department, GoalSheet, Goal } from "@/lib/types";
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
import { Loader2, Pencil, Search, FileText, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ManagerInfo {
  id: string;
  full_name: string;
}

interface EmployeesViewProps {
  employees: (Profile & { department?: Department })[];
  departments: Department[];
  managers: ManagerInfo[];
  managerMap: Record<string, string>;
}

export function EmployeesView({
  employees: initialEmployees,
  departments,
  managers,
  managerMap,
}: EmployeesViewProps) {
  const [employees] = useState(initialEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [goalSheetDialogOpen, setGoalSheetDialogOpen] = useState(false);
  const [selectedEmployeeSheets, setSelectedEmployeeSheets] = useState<GoalSheet[]>([]);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [expandedSheets, setExpandedSheets] = useState<Set<string>>(new Set());
  const router = useRouter();
  const supabase = createClient();

  function openEditDialog(emp: Profile) {
    setEditingEmployee(emp);
    setEditRole(emp.role);
    setEditDepartmentId(emp.department_id || "");
    setEditManagerId(emp.manager_id || "");
  }

  async function viewGoalSheets(emp: Profile) {
    const { data } = await supabase
      .from("goal_sheets")
      .select("*, goals(id, title, weightage, status, target_value, uom), cycle:goal_cycles(name)")
      .eq("employee_id", emp.id)
      .order("created_at", { ascending: false });
    setSelectedEmployeeSheets(data || []);
    setSelectedEmployeeName(emp.full_name);
    setExpandedSheets(new Set());
    setGoalSheetDialogOpen(true);
  }

  async function deleteGoalSheet(sheetId: string) {
    const res = await fetch("/api/admin/delete-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId }),
    });
    if (res.ok) {
      toast.success("Goal sheet deleted");
      setSelectedEmployeeSheets(prev => prev.filter(s => s.id !== sheetId));
    } else {
      toast.error("Failed to delete");
    }
  }

  function toggleSheetExpand(sheetId: string) {
    setExpandedSheets(prev => {
      const next = new Set(prev);
      if (next.has(sheetId)) next.delete(sheetId);
      else next.add(sheetId);
      return next;
    });
  }

  async function saveEmployee() {
    if (!editingEmployee) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: editRole,
          department_id: editDepartmentId || null,
          manager_id: editManagerId || null,
        })
        .eq("id", editingEmployee.id);

      if (error) throw error;

      // Notify both parties when manager changes
      if (editManagerId && editManagerId !== editingEmployee.manager_id) {
        // Notify new manager (in-app)
        await supabase.from("notifications").insert({
          user_id: editManagerId,
          type: "shared_goal_assigned",
          title: "New Team Member",
          message: `${editingEmployee.full_name} has been assigned to your team.`,
          link: "/dashboard/team",
        });
        // Notify employee (in-app)
        await supabase.from("notifications").insert({
          user_id: editingEmployee.id,
          type: "shared_goal_assigned",
          title: "Manager Updated",
          message: `You have been assigned to a new manager.`,
          link: "/dashboard",
        });

        // Email + Telegram + Teams for both parties
        const managerProfile = managers.find(m => m.id === editManagerId);
        try {
          await Promise.allSettled([
            // Manager gets: email + telegram + teams
            fetch("/api/notifications/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "manager_assigned", recipientId: editManagerId, employeeName: editingEmployee.full_name }) }),
            fetch("/api/notifications/telegram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "manager_assigned", recipientId: editManagerId, employeeName: editingEmployee.full_name }) }),
            fetch("/api/notifications/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "shared_goal_assigned", employeeName: editingEmployee.full_name, cycleName: "Team Assignment" }) }),
            // Employee gets: email + telegram
            fetch("/api/notifications/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "employee_manager_changed", recipientId: editingEmployee.id, employeeName: managerProfile?.full_name || "your manager" }) }),
            fetch("/api/notifications/telegram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "employee_manager_changed", recipientId: editingEmployee.id, employeeName: managerProfile?.full_name || "your manager" }) }),
          ]);
        } catch {}
      }

      toast.success(`${editingEmployee.full_name} updated successfully`);
      setEditingEmployee(null);
      router.refresh();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to update employee";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const filteredEmployees = searchQuery
    ? employees.filter(
        (emp) =>
          emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (emp.department?.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : employees;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">
          All Employees
        </h1>
        <span className="font-mono text-xs tabular-nums text-[#5C564C] border border-[#E8E2D6] rounded-full px-3 py-1">
          {employees.length} total
        </span>
      </div>

      <div className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E2D6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">
            Employee Directory
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A89F91]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees..."
              className="pl-9 h-8 text-sm border-[#E8E2D6] bg-[#FEFCF9]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F5F1EA]">
                {[
                  "Name",
                  "Email",
                  "Role",
                  "Department",
                  "Manager",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A89F91]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-[#F5F1EA] hover:bg-[#FEFCF9] transition-colors cursor-pointer"
                  onClick={() => openEditDialog(emp)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">
                    {emp.full_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#5C564C]">
                    {emp.email}
                  </td>
                  <td className="px-4 py-3">
                    {emp.role === "admin" ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                        }}
                      >
                        ADMIN
                      </span>
                    ) : emp.role === "manager" ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700">
                        MGR
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F1EA] text-[#5C564C]">
                        EMP
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1A1A1A]">
                    {emp.department?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1A1A1A]">
                    {(emp.manager_id && managerMap[emp.manager_id]) || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {emp.is_active ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3D9A5F]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3D9A5F]" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D94F3D]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D94F3D]" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewGoalSheets(emp);
                        }}
                        className="p-1.5 rounded-md text-[#A89F91] hover:text-[#3B7DD8] hover:bg-blue-50 transition-colors"
                        title="View Goals"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(emp);
                        }}
                        className="p-1.5 rounded-md text-[#A89F91] hover:text-[#1A1A1A] hover:bg-[#F5F1EA] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center text-[#A89F91] text-sm py-12"
                  >
                    {searchQuery
                      ? "No employees match your search."
                      : "No employees found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Goal Sheets Dialog */}
      <Dialog open={goalSheetDialogOpen} onOpenChange={setGoalSheetDialogOpen}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-8 bg-white border border-[#E8E2D6] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#1A1A1A]">
              Goal Sheets -- {selectedEmployeeName}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#8C8578]">
              {selectedEmployeeSheets.length} goal sheet(s) found
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            {selectedEmployeeSheets.length === 0 ? (
              <div className="text-center text-[#A89F91] text-sm py-8 border border-dashed border-[#E8E2D6] rounded-xl">
                No goal sheets found for this employee.
              </div>
            ) : (
              selectedEmployeeSheets.map((sheet) => (
                <div key={sheet.id} className="border border-[#E8E2D6] rounded-xl overflow-hidden">
                  <div
                    className="px-5 py-3 flex items-center justify-between bg-[#FEFCF9] cursor-pointer hover:bg-[#F5F1EA] transition-colors"
                    onClick={() => toggleSheetExpand(sheet.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedSheets.has(sheet.id) ? (
                        <ChevronDown className="h-4 w-4 text-[#A89F91]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[#A89F91]" />
                      )}
                      <div>
                        <span className="text-sm font-medium text-[#1A1A1A]">
                          {sheet.cycle?.name || "Unknown Cycle"}
                        </span>
                        <span className="ml-3 text-xs text-[#A89F91]">
                          {sheet.goals?.length || 0} goal(s)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        sheet.status === "approved" ? "bg-green-50 text-green-700" :
                        sheet.status === "submitted" ? "bg-blue-50 text-blue-700" :
                        sheet.status === "returned" ? "bg-red-50 text-red-700" :
                        "bg-[#F5F1EA] text-[#5C564C]"
                      }`}>
                        {sheet.status?.toUpperCase() || "DRAFT"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this goal sheet?")) {
                            deleteGoalSheet(sheet.id);
                          }
                        }}
                        className="p-1.5 rounded-md text-[#A89F91] hover:text-[#D94F3D] hover:bg-red-50 transition-colors"
                        title="Delete Goal Sheet"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {expandedSheets.has(sheet.id) && sheet.goals && sheet.goals.length > 0 && (
                    <div className="border-t border-[#E8E2D6] overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#F5F1EA]">
                            <th className="px-5 py-2 text-left text-xs font-medium uppercase tracking-wider text-[#A89F91]">Title</th>
                            <th className="px-5 py-2 text-left text-xs font-medium uppercase tracking-wider text-[#A89F91]">Weightage</th>
                            <th className="px-5 py-2 text-left text-xs font-medium uppercase tracking-wider text-[#A89F91]">Target</th>
                            <th className="px-5 py-2 text-left text-xs font-medium uppercase tracking-wider text-[#A89F91]">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sheet.goals.map((goal: Goal) => (
                            <tr key={goal.id} className="border-b border-[#F5F1EA] last:border-0">
                              <td className="px-5 py-2.5 text-sm text-[#1A1A1A]">{goal.title}</td>
                              <td className="px-5 py-2.5 text-sm font-mono tabular-nums text-[#5C564C]">{goal.weightage}%</td>
                              <td className="px-5 py-2.5 text-sm font-mono tabular-nums text-[#5C564C]">{goal.target_value} {goal.uom}</td>
                              <td className="px-5 py-2.5">
                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                                  goal.status === "completed" ? "bg-green-50 text-green-700" :
                                  goal.status === "on_track" ? "bg-blue-50 text-blue-700" :
                                  "bg-[#F5F1EA] text-[#5C564C]"
                                }`}>
                                  {goal.status || "pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {expandedSheets.has(sheet.id) && (!sheet.goals || sheet.goals.length === 0) && (
                    <div className="px-5 py-4 text-sm text-[#A89F91] text-center border-t border-[#E8E2D6]">
                      No goals in this sheet.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog
        open={!!editingEmployee}
        onOpenChange={(open) => {
          if (!open) setEditingEmployee(null);
        }}
      >
        <DialogContent className="max-w-4xl w-[85vw] p-8 bg-white border border-[#E8E2D6] rounded-xl">
          {editingEmployee && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold text-[#1A1A1A]">
                  Edit Employee
                </DialogTitle>
                <DialogDescription className="text-sm text-[#8C8578]">
                  {editingEmployee.full_name} &middot; {editingEmployee.email}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 flex flex-col gap-5">
                <div>
                  <Label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                    Role
                  </Label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full h-10 rounded-lg border border-[#E8E2D6] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#C45A2D] focus:ring-1 focus:ring-[#C45A2D]"
                  >
                    <option value="">Select role</option>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                    Department
                  </Label>
                  <select
                    value={editDepartmentId}
                    onChange={(e) => setEditDepartmentId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-[#E8E2D6] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#C45A2D] focus:ring-1 focus:ring-[#C45A2D]"
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                    Manager
                  </Label>
                  <select
                    value={editManagerId}
                    onChange={(e) => setEditManagerId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-[#E8E2D6] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#C45A2D] focus:ring-1 focus:ring-[#C45A2D]"
                  >
                    <option value="">Select manager</option>
                    {managers
                      .filter((m) => m.id !== editingEmployee.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-[#F5F1EA]">
                <button
                  onClick={() => setEditingEmployee(null)}
                  className="rounded-lg border border-[#E8E2D6] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#FEFCF9] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEmployee}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#C45A2D" }}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Profile, Department } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Pencil, Search } from "lucide-react";

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
  const router = useRouter();
  const supabase = createClient();

  function openEditDialog(emp: Profile) {
    setEditingEmployee(emp);
    setEditRole(emp.role);
    setEditDepartmentId(emp.department_id || "");
    setEditManagerId(emp.manager_id || "");
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
        // Notify new manager
        await supabase.from("notifications").insert({
          user_id: editManagerId,
          type: "shared_goal_assigned",
          title: "New Team Member",
          message: `${editingEmployee.full_name} has been assigned to your team.`,
          link: "/dashboard/team",
        });
        // Notify employee
        await supabase.from("notifications").insert({
          user_id: editingEmployee.id,
          type: "shared_goal_assigned",
          title: "Manager Updated",
          message: `You have been assigned to a new manager.`,
          link: "/dashboard",
        });
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
        <div className="px-5 py-4 border-b border-[#E8E2D6] flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">
            Employee Directory
          </h2>
          <div className="relative w-64">
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(emp);
                      }}
                      className="p-1.5 rounded-md text-[#A89F91] hover:text-[#1A1A1A] hover:bg-[#F5F1EA] transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
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
                  <Select
                    value={editRole || undefined}
                    onValueChange={(v: string | null) =>
                      setEditRole(v ?? "employee")
                    }
                    items={[
                      { value: "employee", label: "Employee" },
                      { value: "manager", label: "Manager" },
                      { value: "admin", label: "Admin" },
                    ]}
                  >
                    <SelectTrigger className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] focus:ring-0">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                    Department
                  </Label>
                  <Select
                    value={editDepartmentId || undefined}
                    onValueChange={(v: string | null) =>
                      setEditDepartmentId(v ?? "")
                    }
                    items={departments.map((d) => ({
                      value: d.id,
                      label: d.name,
                    }))}
                  >
                    <SelectTrigger className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] focus:ring-0">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                    Manager
                  </Label>
                  <Select
                    value={editManagerId || undefined}
                    onValueChange={(v: string | null) =>
                      setEditManagerId(v ?? "")
                    }
                    items={managers
                      .filter((m) => m.id !== editingEmployee.id)
                      .map((m) => ({ value: m.id, label: m.full_name }))}
                  >
                    <SelectTrigger className="bg-white border-[#E8E2D6] rounded-lg text-sm text-[#1A1A1A] focus:ring-0">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers
                        .filter((m) => m.id !== editingEmployee.id)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.full_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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

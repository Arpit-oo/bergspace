"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Profile,
  GoalCycle,
  Department,
  ThrustArea,
  SharedGoalTemplate,
  UomType,
} from "@/lib/types";
import { UOM_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Send,
  Loader2,
  Share2,
  Users,
  Eye,
} from "lucide-react";

interface LinkedGoal {
  id: string;
  shared_template_id: string;
  goal_sheet?: {
    employee?: {
      full_name: string;
      email: string;
      department?: { name: string };
    };
  };
}

interface SharedGoalsViewProps {
  profile: Profile;
  activeCycle: GoalCycle | null;
  cycles: GoalCycle[];
  departments: Department[];
  thrustAreas: ThrustArea[];
  employees: Profile[];
  templates: Record<string, unknown>[];
  linkedGoals: Record<string, unknown>[];
}

interface TemplateForm {
  title: string;
  description: string;
  thrust_area_id: string;
  uom: UomType;
  target_value: string;
  department_id: string;
}

const emptyForm: TemplateForm = {
  title: "",
  description: "",
  thrust_area_id: "",
  uom: "numeric",
  target_value: "",
  department_id: "",
};

export function SharedGoalsView({
  profile,
  activeCycle,
  cycles,
  departments,
  thrustAreas,
  employees,
  templates: rawTemplates,
  linkedGoals: rawLinkedGoals,
}: SharedGoalsViewProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SharedGoalTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>({ ...emptyForm });
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const templates = rawTemplates as unknown as (SharedGoalTemplate & {
    thrust_area?: ThrustArea;
    department?: Department;
  })[];
  const linkedGoals = rawLinkedGoals as unknown as LinkedGoal[];

  const linkedGoalsByTemplate = useMemo(() => {
    const map = new Map<string, LinkedGoal[]>();
    linkedGoals.forEach((g) => {
      const existing = map.get(g.shared_template_id) || [];
      existing.push(g);
      map.set(g.shared_template_id, existing);
    });
    return map;
  }, [linkedGoals]);

  function updateForm(field: keyof TemplateForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleEmployee(employeeId: string) {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId]
    );
  }

  function selectAllEmployees() {
    if (selectedEmployeeIds.length === employees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(employees.map((e) => e.id));
    }
  }

  async function createTemplate() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.target_value || parseFloat(form.target_value) <= 0) { toast.error("Target value must be greater than 0"); return; }
    if (!activeCycle) { toast.error("No active cycle"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("shared_goal_templates").insert({
        title: form.title,
        description: form.description || null,
        thrust_area_id: form.thrust_area_id || null,
        uom: form.uom,
        target_value: parseFloat(form.target_value),
        department_id: form.department_id || null,
        created_by: profile.id,
        cycle_id: activeCycle.id,
      });
      if (error) throw error;
      toast.success("Shared goal template created");
      setCreateDialogOpen(false);
      setForm({ ...emptyForm });
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to create template";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function pushToEmployees() {
    if (!selectedTemplate || !activeCycle) return;
    if (selectedEmployeeIds.length === 0) { toast.error("Select at least one employee"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/shared-goals/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          employeeIds: selectedEmployeeIds,
          cycleId: activeCycle.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to push goals");
      if (data.errors && data.errors.length > 0) {
        console.error("Push partial errors:", data.errors);
        toast.warning(`Pushed to ${data.pushed}/${data.total} employee(s). ${data.errors.length} failed.`);
      } else {
        toast.success(`Pushed to ${data.pushed} employee(s)`);
      }
      setPushDialogOpen(false);
      setSelectedEmployeeIds([]);
      setSelectedTemplate(null);
      router.refresh();
    } catch (error: unknown) {
      console.error("Push goals error:", error);
      const msg = error instanceof Error ? error.message : "Failed to push goals";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function openPushDialog(template: SharedGoalTemplate) {
    setSelectedTemplate(template);
    setSelectedEmployeeIds([]);
    setPushDialogOpen(true);
  }

  function openViewDialog(template: SharedGoalTemplate) {
    setSelectedTemplate(template);
    setViewDialogOpen(true);
  }

  if (!activeCycle) {
    return (
      <div className="text-center py-12">
        <h2 className="text-base font-semibold tracking-tight text-[#1A1A1A]">No Active Goal Cycle</h2>
        <p className="text-sm text-[#A89F91] mt-2">An active cycle is required to manage shared goals.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Shared Goals</h1>
          <p className="text-sm text-[#A89F91] mt-0.5">{activeCycle.name}</p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-1.5 text-white border-0"
          style={{ backgroundColor: "#C45A2D" }}
        >
          <Plus className="h-4 w-4" /> Create Template
        </Button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="border border-dashed border-[#E8E2D6] rounded-xl bg-white py-12 text-center text-sm text-[#A89F91]">
          No shared goal templates yet. Create one to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {templates.map((template) => {
            const linked = linkedGoalsByTemplate.get(template.id) || [];
            return (
              <div
                key={template.id}
                className="bg-white border border-[#E8E2D6] rounded-xl overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-[#E8E2D6]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">{template.title}</h3>
                      <p className="text-sm text-[#A89F91] mt-0.5">
                        {template.description || "No description"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-0.5 rounded text-xs text-[#5C564C] border border-[#E8E2D6]">
                        {UOM_LABELS[template.uom]}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded text-xs text-[#5C564C] border border-[#E8E2D6] font-mono tabular-nums">
                        Target: {template.target_value}
                      </span>
                      {template.department && (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-[#FEFCF9] text-[#5C564C]">
                          {template.department.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-[#A89F91]">
                    {template.thrust_area && <span>Thrust: {template.thrust_area.name}</span>}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="font-mono tabular-nums">{linked.length}</span> employee(s) linked
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openViewDialog(template as SharedGoalTemplate)}
                      className="gap-1.5 text-[#5C564C] text-xs"
                    >
                      <Eye className="h-3 w-3" /> View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPushDialog(template as SharedGoalTemplate)}
                      className="gap-1.5 border-[#E8E2D6] text-[#5C564C] text-xs"
                    >
                      <Send className="h-3 w-3" /> Push to Employees
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl w-[85vw] max-h-[90vh] overflow-y-auto p-8 bg-white border border-[#E8E2D6]">
          <DialogHeader>
            <DialogTitle className="font-semibold tracking-tight text-[#1A1A1A]">Create Shared Goal Template</DialogTitle>
            <DialogDescription className="text-sm text-[#5C564C]">
              Create a goal template that can be pushed to selected employees.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-6">
            <div>
              <Label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Title</Label>
              <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="e.g., Complete compliance training" className="border-[#E8E2D6] text-sm" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Description</Label>
              <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Detailed description of the goal..." rows={3} className="border-[#E8E2D6] text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Thrust Area</Label>
                <Select value={form.thrust_area_id || undefined} onValueChange={(v: string | null) => updateForm("thrust_area_id", v ?? "")} items={thrustAreas.map((ta) => ({ value: ta.id, label: ta.name }))}>
                  <SelectTrigger className="border-[#E8E2D6] text-sm"><SelectValue placeholder="Select area" /></SelectTrigger>
                  <SelectContent>
                    {thrustAreas.map((ta) => <SelectItem key={ta.id} value={ta.id}>{ta.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Unit of Measurement</Label>
                <Select value={form.uom} onValueChange={(v: string | null) => updateForm("uom", (v ?? "numeric") as string)} items={Object.entries(UOM_LABELS).map(([key, label]) => ({ value: key, label }))}>
                  <SelectTrigger className="border-[#E8E2D6] text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(UOM_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Target Value</Label>
                <Input type="number" value={form.target_value} onChange={(e) => updateForm("target_value", e.target.value)} placeholder="e.g., 100" className="border-[#E8E2D6] text-sm font-mono" />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Department (optional)</Label>
                <Select value={form.department_id || undefined} onValueChange={(v: string | null) => updateForm("department_id", v ?? "")} items={departments.map((d) => ({ value: d.id, label: d.name }))}>
                  <SelectTrigger className="border-[#E8E2D6] text-sm"><SelectValue placeholder="All departments" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-[#E8E2D6] text-[#5C564C]">
                Cancel
              </Button>
              <Button onClick={createTemplate} disabled={loading} className="gap-1.5 text-white border-0" style={{ backgroundColor: "#C45A2D" }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Push to Employees Dialog */}
      <Dialog open={pushDialogOpen} onOpenChange={setPushDialogOpen}>
        <DialogContent className="max-w-4xl w-[85vw] max-h-[90vh] overflow-y-auto p-8 bg-white border border-[#E8E2D6]">
          <DialogHeader>
            <DialogTitle className="font-semibold tracking-tight text-[#1A1A1A]">Push to Employees</DialogTitle>
            <DialogDescription className="text-sm text-[#5C564C]">
              {selectedTemplate?.title} -- Select employees to receive this shared goal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#A89F91] font-mono tabular-nums">
                {selectedEmployeeIds.length} of {employees.length} selected
              </span>
              <Button variant="ghost" size="sm" onClick={selectAllEmployees} className="text-[#5C564C] text-xs">
                {selectedEmployeeIds.length === employees.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="border border-[#E8E2D6] rounded-xl max-h-60 overflow-y-auto">
              {employees.map((emp) => {
                const alreadyLinked = linkedGoals.some(
                  (g) => g.shared_template_id === selectedTemplate?.id && g.goal_sheet?.employee?.email === emp.email
                );
                return (
                  <label
                    key={emp.id}
                    className={`flex items-center gap-3 px-3 py-2 border-b border-[#F5F1EA] last:border-0 transition-colors ${
                      alreadyLinked ? "opacity-50 cursor-default" : "cursor-pointer hover:bg-[#FEFCF9]"
                    }`}
                  >
                    <Checkbox
                      checked={selectedEmployeeIds.includes(emp.id)}
                      onCheckedChange={() => toggleEmployee(emp.id)}
                      disabled={alreadyLinked}
                    />
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{emp.full_name}</p>
                      <p className="text-xs text-[#A89F91]">
                        {emp.department?.name || "—"}
                        {alreadyLinked && " -- Already assigned"}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPushDialogOpen(false)} className="border-[#E8E2D6] text-[#5C564C]">
                Cancel
              </Button>
              <Button
                onClick={pushToEmployees}
                disabled={loading || selectedEmployeeIds.length === 0}
                className="gap-1.5 text-white border-0"
                style={{ backgroundColor: "#C45A2D" }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Push to {selectedEmployeeIds.length} Employee(s)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Linked Employees Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-8 bg-white border border-[#E8E2D6]">
          <DialogHeader>
            <DialogTitle className="font-semibold tracking-tight text-[#1A1A1A]">{selectedTemplate?.title}</DialogTitle>
            <DialogDescription className="text-sm text-[#5C564C]">Employees linked to this shared goal</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-[#A89F91]">UoM:</span>{" "}
                  {UOM_LABELS[selectedTemplate.uom]}
                </div>
                <div>
                  <span className="text-[#A89F91]">Target:</span>{" "}
                  <span className="font-mono tabular-nums">{selectedTemplate.target_value}</span>
                </div>
              </div>
              {(() => {
                const linked = linkedGoalsByTemplate.get(selectedTemplate.id) || [];
                if (linked.length === 0) {
                  return (
                    <div className="text-center text-[#A89F91] text-sm py-4 border border-dashed border-[#E8E2D6] rounded-xl">
                      No employees linked yet.
                    </div>
                  );
                }
                return (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#F5F1EA]">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A89F91]">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#A89F91]">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linked.map((g) => (
                        <tr key={g.id} className="border-b border-[#F5F1EA] hover:bg-[#FEFCF9] transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">
                            {g.goal_sheet?.employee?.full_name || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#5C564C]">
                            {g.goal_sheet?.employee?.department?.name || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

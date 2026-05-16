export type UserRole = "employee" | "manager" | "admin";
export type GoalSheetStatus = "draft" | "submitted" | "approved" | "returned";
export type GoalStatus = "not_started" | "on_track" | "completed";
export type UomType = "numeric" | "percentage" | "timeline" | "zero_based";
export type QuarterPreset = "calendar_year" | "fiscal_apr_mar" | "custom";
export type EscalationTriggerType = "no_submission" | "no_approval" | "missed_checkin";
export type NotificationType =
  | "goal_submitted"
  | "goal_approved"
  | "goal_returned"
  | "checkin_reminder"
  | "escalation"
  | "shared_goal_assigned";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: string | null;
  manager_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: Department;
  manager?: Profile;
}

export interface ThrustArea {
  id: string;
  name: string;
  department_id: string | null;
  is_global: boolean;
  created_at: string;
}

export interface GoalCycle {
  id: string;
  name: string;
  preset: QuarterPreset;
  year: number;
  quarter: number;
  start_date: string;
  end_date: string;
  submission_deadline: string;
  checkin_open: string;
  checkin_close: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface GoalSheet {
  id: string;
  employee_id: string;
  cycle_id: string;
  status: GoalSheetStatus;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  returned_at: string | null;
  return_reason: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  employee?: Profile;
  cycle?: GoalCycle;
  goals?: Goal[];
}

export interface Goal {
  id: string;
  goal_sheet_id: string;
  title: string;
  description: string | null;
  thrust_area_id: string | null;
  uom: UomType;
  target_value: number;
  weightage: number;
  status: GoalStatus;
  shared_template_id: string | null;
  is_from_shared: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  thrust_area?: ThrustArea;
  achievements?: Achievement[];
}

export interface SharedGoalTemplate {
  id: string;
  title: string;
  description: string | null;
  thrust_area_id: string | null;
  uom: UomType;
  target_value: number;
  department_id: string | null;
  created_by: string;
  cycle_id: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  goal_id: string;
  cycle_id: string;
  actual_value: number | null;
  status: GoalStatus;
  notes: string | null;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface Checkin {
  id: string;
  manager_id: string;
  employee_id: string;
  cycle_id: string;
  comment: string;
  progress_score: number | null;
  created_at: string;
  updated_at: string;
  employee?: Profile;
  manager?: Profile;
}

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  reason: string | null;
  created_at: string;
  changed_by_profile?: Profile;
}

export interface EscalationRule {
  id: string;
  trigger_type: EscalationTriggerType;
  days_threshold: number;
  is_active: boolean;
  notify_employee: boolean;
  notify_manager: boolean;
  notify_skip_level: boolean;
  notify_hr: boolean;
  created_by: string | null;
  created_at: string;
}

export interface EscalationLogEntry {
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
  employee?: Profile;
  rule?: EscalationRule;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

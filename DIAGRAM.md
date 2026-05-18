# BergSpace — Architecture Diagrams

## For Eraser.io (Cloud Architecture)

```
Cloud Architecture

Client [icon: monitor] {
  Landing Page [icon: globe]
  Auth Pages [icon: lock]
  Employee Dashboard [icon: user]
  Manager Dashboard [icon: users]
  Admin Dashboard [icon: shield]
}

Next.js Server [icon: server] {
  App Router [icon: git-branch]
  API Routes [icon: terminal]
  Middleware [icon: filter]
}

API Routes [icon: terminal] {
  Auth Callback [icon: key]
  Telegram Webhook [icon: message-circle]
  SMART Validator [icon: cpu]
  Email Sender [icon: mail]
  Teams Webhook [icon: hash]
  Shared Goals Push [icon: share-2]
  Admin Delete [icon: trash-2]
}

Supabase [icon: database] {
  PostgreSQL 17 [icon: database]
  Auth Service [icon: lock]
  Row Level Security [icon: shield]
  DB Triggers [icon: zap]
}

External Services [icon: cloud] {
  OpenAI GPT-4o [icon: cpu]
  Telegram Bot API [icon: message-circle]
  Gmail SMTP [icon: mail]
  MS Teams [icon: hash]
  Microsoft Entra ID [icon: key]
}

Client > Next.js Server
Next.js Server > Supabase
API Routes > External Services
Auth Callback > Microsoft Entra ID
Telegram Webhook > Telegram Bot API
SMART Validator > OpenAI GPT-4o
Email Sender > Gmail SMTP
Teams Webhook > MS Teams
Supabase > DB Triggers
```

## For Eraser.io (Entity Relationship)

```
Entity Relationship

profiles [icon: user] {
  id uuid pk
  email text
  full_name text
  role user_role
  department_id uuid fk
  manager_id uuid fk
  is_active boolean
}

departments [icon: building] {
  id uuid pk
  name text
  description text
}

goal_cycles [icon: calendar] {
  id uuid pk
  name text
  preset quarter_preset
  year int
  quarter int
  start_date date
  end_date date
  checkin_open date
  checkin_close date
  is_active boolean
}

goal_sheets [icon: file-text] {
  id uuid pk
  employee_id uuid fk
  cycle_id uuid fk
  status goal_sheet_status
  is_locked boolean
  approved_by uuid fk
}

goals [icon: target] {
  id uuid pk
  goal_sheet_id uuid fk
  title text
  thrust_area_id uuid fk
  uom uom_type
  target_value numeric
  weightage numeric
  status goal_status
  is_from_shared boolean
  shared_template_id uuid fk
}

achievements [icon: trending-up] {
  id uuid pk
  goal_id uuid fk
  cycle_id uuid fk
  actual_value numeric
  status goal_status
  notes text
}

checkins [icon: clipboard] {
  id uuid pk
  manager_id uuid fk
  employee_id uuid fk
  cycle_id uuid fk
  comment text
  progress_score numeric
}

audit_log [icon: eye] {
  id uuid pk
  table_name text
  record_id uuid
  field_name text
  old_value text
  new_value text
  changed_by uuid fk
}

thrust_areas [icon: compass] {
  id uuid pk
  name text
  department_id uuid fk
  is_global boolean
}

shared_goal_templates [icon: share-2] {
  id uuid pk
  title text
  uom uom_type
  target_value numeric
  department_id uuid fk
  cycle_id uuid fk
}

escalation_rules [icon: alert-triangle] {
  id uuid pk
  trigger_type text
  days_threshold int
  notify_employee boolean
  notify_manager boolean
  notify_skip_level boolean
  notify_hr boolean
}

escalation_log [icon: alert-circle] {
  id uuid pk
  rule_id uuid fk
  employee_id uuid fk
  cycle_id uuid fk
  escalation_level int
  resolved boolean
}

notifications [icon: bell] {
  id uuid pk
  user_id uuid fk
  type notification_type
  title text
  message text
  is_read boolean
}

telegram_links [icon: message-circle] {
  id uuid pk
  user_id uuid fk
  chat_id bigint
  username text
}

profiles.department_id > departments.id
profiles.manager_id > profiles.id
goal_sheets.employee_id > profiles.id
goal_sheets.cycle_id > goal_cycles.id
goals.goal_sheet_id > goal_sheets.id
goals.thrust_area_id > thrust_areas.id
goals.shared_template_id > shared_goal_templates.id
achievements.goal_id > goals.id
achievements.cycle_id > goal_cycles.id
checkins.manager_id > profiles.id
checkins.employee_id > profiles.id
checkins.cycle_id > goal_cycles.id
audit_log.changed_by > profiles.id
shared_goal_templates.cycle_id > goal_cycles.id
escalation_log.rule_id > escalation_rules.id
escalation_log.employee_id > profiles.id
notifications.user_id > profiles.id
telegram_links.user_id > profiles.id
```

## For Eraser.io (Sequence - Goal Lifecycle)

```
Sequence Diagram

Employee > Portal: Create Goal Sheet
Portal > Portal: Validate (100%, min 10%, max 8)
Employee > Portal: Submit for Approval
Portal > AI Validator: Check SMART Criteria
AI Validator > Portal: Score + Suggestions
Portal > Supabase: Save Goal Sheet (status: submitted)
Portal > Manager Telegram: Approval Request with Buttons
Portal > Manager Email: Goal Sheet Submitted
Portal > Manager In-App: Notification

Manager > Portal: Review Goal Sheet
Manager > Portal: Approve (or Return)
Portal > Supabase: Update status, lock goals
Portal > Employee Telegram: Approved Notification
Portal > Employee Email: Goal Sheet Approved
Portal > Employee In-App: Notification

Employee > Portal: Log Quarterly Achievement
Portal > Supabase: Save actual vs planned
Manager > Portal: Conduct Check-in
Portal > Supabase: Save comment + progress score
```

## For Eraser.io (Flowchart - Goal State Machine)

```
Flowchart

Start [shape: oval] > Create Goals
Create Goals [shape: rectangle] > Draft [shape: diamond]
Draft > Submit: "Employee submits"
Submit [shape: rectangle] > AI Check [shape: diamond]
AI Check > Submitted: "Goals valid"
AI Check > Draft: "Needs improvement"
Submitted [shape: rectangle] > Manager Review [shape: diamond]
Manager Review > Approved: "Approve"
Manager Review > Returned: "Return with reason"
Returned [shape: rectangle] > Draft: "Employee edits"
Approved [shape: rectangle] > Locked [shape: rectangle]
Locked > Check-in: "Window opens"
Check-in [shape: rectangle] > Log Achievement [shape: rectangle]
Log Achievement > Progress Score [shape: rectangle]
```

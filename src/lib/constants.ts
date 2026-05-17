export const UOM_LABELS: Record<string, string> = {
  numeric: "Numeric",
  percentage: "Percentage (%)",
  timeline: "Timeline",
  zero_based: "Zero-Based",
};

export const GOAL_STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  on_track: "On Track",
  completed: "Completed",
};

export const SHEET_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  returned: "Returned",
};

export const SHEET_STATUS_COLORS: Record<string, string> = {
  draft: "",
  submitted: "",
  approved: "",
  returned: "",
};

export const GOAL_STATUS_COLORS: Record<string, string> = {
  not_started: "",
  on_track: "",
  completed: "",
};

export const MAX_GOALS_PER_SHEET = 8;
export const MIN_WEIGHTAGE = 10;
export const REQUIRED_TOTAL_WEIGHTAGE = 100;

export const GOAL_TYPES = {
  SELF: "self",
  TEAM: "team",
  ORG: "org",
};

export const GOAL_STATUS = {
  PENDING: "pending",
  OPEN: "open",
  INPROGRESS: "inprogress",
  COMPLETED: "completed",
  OVERDUE: "overdue",
  REJECTED: "rejected",
  CLOSED: "closed",
  REOPENED: "reopened", 
};

export const APPROVAL_TYPES = {
  CREATION: "creation",
  COMPLETION: "completion",
  TASK_ACKNOWLEDGMENT: "task_acknowledgment",
  REOPENING: "reopening",
  DELEGATION: "delegation",
  SELFGOALACTIVATION: "selfgoalactivation",
  CLOSURE: "closure", 
  REACTIVATION: "reactivation", 
};

export const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const TASK_STATUS = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  PENDING_ACKNOWLEDGMENT: "pending_acknowledgment",
  ACKNOWLEDGED: "acknowledged",
};


export const STATUS_COLORS = {
  
  completed: "success",
  open: "info",
  inprogress: "primary",
  pending: "warning",
  overdue: "danger",
  rejected: "secondary",
  closed: "secondary", 
  reopened: "info", 
};

export const TASK_STATUS_COLORS = {
  not_started: "secondary",
  in_progress: "warning",
  pending_acknowledgment: "info",
  acknowledged: "success",
};

export const GOAL_TYPE_COLORS = {
  self: "info",
  team: "primary",
  org: "success",
};

export const GOAL_TYPE_LABELS = {
  self: "Self Goal",
  team: "Team Goal",
  org: "Org Goal",
};

export const STATUS_LABELS = {
  pending: "Pending",
  open: "Open",
  inprogress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  rejected: "Rejected",
  closed: "Closed", 
  reopened: "Reopened", 
};

export const TASK_STATUS_LABELS = {
  not_started: "Not Started",
  in_progress: "In Progress",
  pending_acknowledgment: "Pending Acknowledgment",
  acknowledged: "Acknowledged",
  reopened: "Reopened",
  closed: "Closed",
};

export const APPROVAL_TYPE_LABELS = {
  creation: "Goal Creation",
  completion: "Goal Completion",
  task_acknowledgment: "Task Acknowledgment",
  reopening: "Goal Reopening",
  delegation: "Goal Delegation",
  selfgoalactivation: "Self Goal Activation",
  reactivation: "Goal Reactivation", 
  closure: "Goal Closure", 
};


export const LEADERSHIP_ROLES = {
  MANAGER: "Manager",
  DEPARTMENT_HEAD: "Department Head",
  LEADERSHIP: "Leadership",
};


export const GOAL_TRANSITIONS = {
  
  PENDING_TO_OPEN: { from: "pending", to: "open" },
  OPEN_TO_INPROGRESS: { from: "open", to: "inprogress" },
  INPROGRESS_TO_COMPLETED: { from: "inprogress", to: "completed" },
  COMPLETED_TO_CLOSED: { from: "completed", to: "closed" },
  
  
  CLOSED_TO_REOPENED: { from: "closed", to: "reopened" },
  COMPLETED_TO_REOPENED: { from: "completed", to: "reopened" },
  REOPENED_TO_INPROGRESS: { from: "reopened", to: "inprogress" },
  
  
  ANY_TO_REJECTED: { from: "*", to: "rejected" },
  INPROGRESS_TO_OVERDUE: { from: "inprogress", to: "overdue" },
};


export const ORG_GOAL_APPROVALS = {
  
  AUTO_APPROVE_TYPES: [
    "completion",
    "closure",
    "reactivation",
  ],
  
  
  REQUIRE_APPROVAL_TYPES: [
    "creation",
    "delegation",
    "task_acknowledgment",
  ],
};


export const APPROVAL_REQUIREMENTS = {
  self: {
    completion: { requiresProof: true, requiresManager: true },
    closure: { requiresProof: false, requiresManager: true },
    reactivation: { requiresProof: false, requiresManager: true },
  },
  team: {
    completion: { requiresProof: true, requiresManager: true },
    closure: { requiresProof: false, requiresManager: true },
    reactivation: { requiresProof: false, requiresManager: true },
  },
  org: {
    completion: { requiresProof: false, requiresManager: false, leadership: true },
    closure: { requiresProof: false, requiresManager: false, leadership: true },
    reactivation: { requiresProof: false, requiresManager: false, leadership: true },
    creation: { requiresProof: false, requiresManager: true },
  },
};

export const ALERT_MESSAGES = {
  SUCCESS: {
    GOAL_CREATED: "Goal created successfully!",
    GOAL_UPDATED: "Goal updated successfully!",
    GOAL_DELETED: "Goal deleted successfully!",
    GOAL_COMPLETED: "Goal marked as completed successfully!", 
    GOAL_CLOSED: "Goal closed successfully!", 
    GOAL_REOPENED: "Goal reopened successfully!", 
    CHECKLIST_UPDATED: "Checklist item updated!",
    COMMENT_ADDED: "Comment added successfully!",
    APPROVAL_REQUESTED: "Approval request sent successfully!",
    APPROVAL_DECIDED: "Approval processed successfully!",
    APPROVAL_AUTO_APPROVED: "Goal auto-approved by Leadership!", 
    FILE_UPLOADED: "File uploaded successfully!",
    FILE_DELETED: "File deleted successfully!",
  },
  ERROR: {
    NETWORK_ERROR: "Network error. Please check your connection and try again.",
    PERMISSION_DENIED: "You don't have permission to perform this action.",
    GOAL_NOT_FOUND: "Goal not found or no longer exists.",
    INVALID_INPUT: "Please check your input and try again.",
    FILE_UPLOAD_FAILED: "File upload failed. Please try again.",
    GENERAL_ERROR: "Something went wrong. Please try again.",
    INCOMPLETE_CHECKLIST:
      "Please complete all checklist items before requesting approval.",
    MISSING_PROOF: "Proof attachments are required for completion approval.",
    INVALID_STATUS_TRANSITION: "This action is not allowed for the current goal status.", 
    ALREADY_COMPLETED: "This goal is already completed.", 
    CANNOT_REOPEN_OPEN_GOAL: "Only closed or completed goals can be reopened.", 
    CANNOT_CLOSE_OPEN_GOAL: "Only open or in-progress goals can be closed.", 
  },
  WARNING: {
    UNSAVED_CHANGES:
      "You have unsaved changes. Are you sure you want to leave?",
    GOAL_WILL_BE_COMPLETED: "This goal will be marked as completed. This action is final.", 
    GOAL_WILL_BE_CLOSED: "This goal will be closed. You can reopen it later if needed.", 
    GOAL_WILL_BE_REOPENED: "This goal will be reopened. You can continue working on it.", 
  },
  INFO: {
    AUTO_APPROVED: "This goal was automatically approved by Leadership.", 
    LEADERSHIP_ONLY: "This action requires Leadership approval.", 
    ORG_GOAL_AUTO_APPROVAL: "Org goals are automatically approved by Leadership without manual approval flow.", 
  },
};


export const WORKFLOW_MESSAGES = {
  GOAL_COMPLETION: {
    TITLE: "Mark Goal as Completed",
    DESCRIPTION: "Leadership can complete org goals immediately without approval flow.",
    WARNING: "This action will mark the goal as completed. It can be reopened if needed.",
  },
  GOAL_CLOSURE: {
    TITLE: "Close Goal",
    DESCRIPTION: "Close this goal and mark it as complete.",
    WARNING: "Closed goals can be reopened at any time.",
  },
  GOAL_REACTIVATION: {
    TITLE: "Reopen Goal",
    DESCRIPTION: "Reopen a closed or completed goal to continue working on it.",
    WARNING: "The goal will be reopened and you can continue working on it.",
  },
};


export const VALID_STATUS_FLOWS = {
  open: ["inprogress", "rejected", "closed"],
  inprogress: ["completed", "overdue", "rejected", "closed"],
  completed: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["inprogress", "completed", "closed"],
  rejected: ["open"],
  overdue: ["completed", "closed"],
  pending: ["open", "rejected"],
};

import {
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Check,
} from "lucide-react";

// Assignment Status
export const ASSIGNMENT_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  PENDING_SME_ACKNOWLEDGEMENT: "PENDING_SME_ACKNOWLEDGEMENT",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  PENDING_MANAGER_ACKNOWLEDGEMENT: "PENDING_MANAGER_ACKNOWLEDGEMENT",
  COMPLETED: "COMPLETED",
  OVERDUE: "OVERDUE",
  
};

// Approval Status
export const APPROVAL_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

// Approval Types
export const APPROVAL_TYPE = {
  SME_REGISTRATION: "SME_REGISTRATION",
  SME_REQUEST: "SME_REQUEST",
  ASSIGNMENT_ACKNOWLEDGEMENT: "ASSIGNMENT_ACKNOWLEDGEMENT",
  ASSIGNMENT_COMPLETION: "ASSIGNMENT_COMPLETION",
  ASSIGNMENT_REOPEN: "ASSIGNMENT_REOPEN",
};

// Rating Thresholds
export const RATING = {
  MIN_SME: 8,
  MIN_REQUEST_SME: 5,
  MAX: 10,
  MIN: 1,
};

// Skill Rating Labels
export const SKILL_RATING_LABELS = {
  NEEDS_IMPROVEMENT: "Needs Improvement",
  COMPETENT: "Competent",
  EXPERT: "Expert",
};

// Status Display Configuration
export const STATUS_CONFIG = {
  [ASSIGNMENT_STATUS.IN_PROGRESS]: {
    label: "In Progress",
    color: "#ba8b00",
    bg: "#fff3cd",
    icon: RefreshCw,
  },
  [ASSIGNMENT_STATUS.PENDING_SME_ACKNOWLEDGEMENT]: {
    label: "In SME Review",
    color: "#fd7e14",
    bg: "#ffe5d0",
    icon: Clock,
  },
  [ASSIGNMENT_STATUS.ACKNOWLEDGED]: {
    label: "Acknowledged",
    color: "#0dcaf0",
    bg: "#cff4fc",
    icon: Check,
  },
  [ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT]: {
    label: "In Manager Review",
    color: "#6f42c1",
    bg: "#e0cffc",
    icon: Clock,
  },
  [ASSIGNMENT_STATUS.COMPLETED]: {
    label: "Completed",
    color: "#198754",
    bg: "#d1e7dd",
    icon: CheckCircle,
  },
  [ASSIGNMENT_STATUS.OVERDUE]: {
    label: "Overdue",
    color: "#dc3545",
    bg: "#f8d7da",
    icon: AlertCircle,
  },
  [APPROVAL_STATUS.PENDING]: {
    label: "Pending",
    color: "#ffc107",
    bg: "#fff3cd",
    icon: Clock,
  },
  [APPROVAL_STATUS.APPROVED]: {
    label: "Approved",
    color: "#198754",
    bg: "#d1e7dd",
    icon: CheckCircle,
  },
  [APPROVAL_STATUS.REJECTED]: {
    label: "Rejected",
    color: "#dc3545",
    bg: "#f8d7da",
    icon: XCircle,
  },
};  

// Sort Options
export const SORT_OPTIONS = {
  EMPLOYEE_NAME: "employeename",
  SKILL_NAME: "skillname",
  RATING: "rating",
  CREATED_ON: "createdon",
};

// Filter Options
export const FILTER_OPTIONS = {
  ALL: "",
  IN_PROGRESS: ASSIGNMENT_STATUS.IN_PROGRESS,
  COMPLETED: ASSIGNMENT_STATUS.COMPLETED,
  PENDING: APPROVAL_STATUS.PENDING,
  APPROVED: APPROVAL_STATUS.APPROVED,
  REJECTED: APPROVAL_STATUS.REJECTED,
};

// File Upload Configuration
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/zip",
  ],
  ALLOWED_EXTENSIONS: [
    ".pdf",
    ".doc",
    ".docx",
    ".jpg",
    ".jpeg",
    ".png",
    ".zip",
  ],
};

// Pagination
export const PAGINATION = {
  PAGE_SIZE: 10,
  DEFAULT_PAGE: 1,
};

export default {
  ASSIGNMENT_STATUS,
  APPROVAL_STATUS,
  APPROVAL_TYPE,
  RATING,
  SKILL_RATING_LABELS,
  STATUS_CONFIG,
  SORT_OPTIONS,
  FILTER_OPTIONS,
  FILE_UPLOAD,
  PAGINATION,
};

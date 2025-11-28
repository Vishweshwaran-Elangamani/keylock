namespace Relevantz.EEPZ.Common.Enums
{
    // Goal type enumeration
    public static class GOAL_TYPE
    {
        public const string SELF = "self";
        public const string TEAM = "team";
        public const string ORG = "org";

        public static readonly string[] ALL = { SELF, TEAM, ORG };

        public static bool IsValid(string goalType)
        {
            return ALL.Contains(goalType?.ToLower() ?? "");
        }
    }

    // Goal status enumeration
    public static class GOAL_STATUS
    {
        public const string PENDING = "pending";
        public const string OPEN = "open";
        public const string IN_PROGRESS = "inprogress";
        public const string COMPLETED = "completed";
        public const string CLOSED = "closed";
        public const string EXPIRED = "expired";
        public const string REOPENED = "reopened";
        public const string CANCELLED = "cancelled";

        public static readonly string[] ALL =
        {
            PENDING,
            OPEN,
            IN_PROGRESS,
            COMPLETED,
            CLOSED,
            EXPIRED,
            REOPENED,
            CANCELLED,
        };

        public static readonly string[] ACTIVE_STATES = { OPEN, IN_PROGRESS, REOPENED };

        public static readonly string[] TERMINAL_STATES = { COMPLETED, CLOSED, EXPIRED, CANCELLED };

        public static readonly string[] EDITABLE_STATES = { PENDING, OPEN, IN_PROGRESS, REOPENED };

        public static readonly string[] COMPLETABLE_STATES = { OPEN, IN_PROGRESS, REOPENED };

        public static bool IsValid(string status)
        {
            return ALL.Contains(status?.ToLower() ?? "");
        }

        public static bool IsActive(string status)
        {
            return ACTIVE_STATES.Contains(status?.ToLower() ?? "");
        }

        public static bool IsTerminal(string status)
        {
            return TERMINAL_STATES.Contains(status?.ToLower() ?? "");
        }

        public static bool IsEditable(string status)
        {
            return EDITABLE_STATES.Contains(status?.ToLower() ?? "");
        }

        public static bool CanMarkComplete(string status)
        {
            return COMPLETABLE_STATES.Contains(status?.ToLower() ?? "");
        }

        public static bool CanAcceptComments(string status)
        {
            return status?.ToLower() != COMPLETED && status?.ToLower() != CLOSED;
        }
    }

    // Approval type enumeration
    public static class APPROVAL_TYPE
    {
        public const string CREATION = "creation";
        public const string COMPLETION = "completion";
        public const string REOPENING = "reopening";
        public const string DELEGATION = "delegation";
        public const string SELF_GOAL_ACTIVATION = "selfgoalactivation";
        public const string TASK_ACKNOWLEDGMENT = "task_acknowledgment";
        public const string CLOSURE = "closure";
        public const string REACTIVATION = "reactivation";

        public static readonly string[] ALL =
        {
            CREATION,
            COMPLETION,
            REOPENING,
            DELEGATION,
            SELF_GOAL_ACTIVATION,
            TASK_ACKNOWLEDGMENT,
            CLOSURE,
            REACTIVATION,
        };

        public static bool IsValid(string approvalType)
        {
            return ALL.Contains(approvalType?.ToLower() ?? "");
        }

        public static bool RequiresProof(string approvalType)
        {
            return approvalType?.ToLower() == COMPLETION;
        }
    }

    // Approval status enumeration
    public static class APPROVAL_STATUS
    {
        public const string PENDING = "pending";
        public const string APPROVED = "approved";
        public const string REJECTED = "rejected";

        public static readonly string[] ALL = { PENDING, APPROVED, REJECTED };

        public static bool IsValid(string status)
        {
            return ALL.Contains(status?.ToLower() ?? "");
        }

        public static bool IsPending(string status)
        {
            return status?.ToLower() == PENDING;
        }

        public static bool IsDecided(string status)
        {
            return status?.ToLower() == APPROVED || status?.ToLower() == REJECTED;
        }
    }

    // Progress source enumeration
    public static class PROGRESS_SOURCE
    {
        public const string MANUAL = "manual";
        public const string AUTO = "auto";

        public static readonly string[] ALL = { MANUAL, AUTO };

        public static bool IsValid(string source)
        {
            return ALL.Contains(source?.ToLower() ?? "");
        }
    }

    // Project status enumeration
    public static class PROJECT_STATUS
    {
        public const string ACTIVE = "Active";
        public const string INACTIVE = "Inactive";
        public const string COMPLETED = "Completed";
        public const string ON_HOLD = "On Hold";
        public const string UNKNOWN = "Unknown";

        public static readonly string[] ALL = { ACTIVE, INACTIVE, COMPLETED, ON_HOLD, UNKNOWN };

        public static bool IsValid(string status)
        {
            return ALL.Contains(status ?? "");
        }

        public static bool IsActive(string status)
        {
            return status == ACTIVE;
        }
    }

    // Timeline event type enumeration
    public static class TIMELINE_EVENT_TYPE
    {
        public const string GOAL_CREATED = "goal_created";
        public const string GOAL_UPDATED = "goal_updated";
        public const string GOAL_COMPLETED = "goal_completed";
        public const string GOAL_REOPENED = "goal_reopened";
        public const string GOAL_CLOSED = "goal_closed";
        public const string GOAL_EXPIRED = "goal_expired";
        public const string ASSIGNMENT = "assignment";
        public const string ASSIGNMENT_ADDED = "assignment_added";
        public const string ASSIGNMENT_REMOVED = "assignment_removed";
        public const string CHECKLIST_TOGGLED = "checklist_toggled";
        public const string CHECKLIST_ADDED = "checklist_added";
        public const string CHECKLIST_DELETED = "checklist_deleted";
        public const string PROGRESS = "progress";
        public const string PROGRESS_UPDATED = "progress_updated";
        public const string APPROVAL = "approval";
        public const string APPROVAL_REQUESTED = "approval_requested";
        public const string APPROVAL_APPROVED = "approval_approved";
        public const string APPROVAL_REJECTED = "approval_rejected";
        public const string COMMENT = "comment";
        public const string COMMENT_ADDED = "comment_added";
        public const string ATTACHMENT = "attachment";
        public const string ATTACHMENT_ADDED = "attachment_added";
        public const string ATTACHMENT_DELETED = "attachment_deleted";

        public static readonly string[] ALL =
        {
            GOAL_CREATED,
            GOAL_UPDATED,
            GOAL_COMPLETED,
            GOAL_REOPENED,
            GOAL_CLOSED,
            GOAL_EXPIRED,
            ASSIGNMENT,
            ASSIGNMENT_ADDED,
            ASSIGNMENT_REMOVED,
            CHECKLIST_TOGGLED,
            CHECKLIST_ADDED,
            CHECKLIST_DELETED,
            PROGRESS,
            PROGRESS_UPDATED,
            APPROVAL,
            APPROVAL_REQUESTED,
            APPROVAL_APPROVED,
            APPROVAL_REJECTED,
            COMMENT,
            COMMENT_ADDED,
            ATTACHMENT,
            ATTACHMENT_ADDED,
            ATTACHMENT_DELETED,
        };
    }

    // User role constants
    public static class USER_ROLE
    {
        public const string EMPLOYEE = "Employee";
        public const string MANAGER = "Manager";
        public const string DEPARTMENT_HEAD = "Department Head";
        public const string LEADERSHIP = "Leadership";
        public const string HR = "HR";

        public static readonly string[] ALL =
        {
            EMPLOYEE,
            MANAGER,
            DEPARTMENT_HEAD,
            LEADERSHIP,
            HR,
        };

        public static readonly string[] MANAGERIAL_ROLES = { MANAGER, DEPARTMENT_HEAD, LEADERSHIP };

        public static readonly string[] APPROVAL_AUTHORITIES =
        {
            MANAGER,
            DEPARTMENT_HEAD,
            LEADERSHIP,
        };

        public static readonly string[] ADMIN_ROLES = { LEADERSHIP, HR };

        public static bool IsValid(string role)
        {
            return ALL.Contains(role ?? "");
        }

        public static bool IsManagerial(string role)
        {
            return MANAGERIAL_ROLES.Contains(role ?? "");
        }

        public static bool CanApprove(string role)
        {
            return APPROVAL_AUTHORITIES.Contains(role ?? "");
        }

        public static bool CanCreateTeamGoal(string role)
        {
            return role == MANAGER || role == DEPARTMENT_HEAD || role == LEADERSHIP;
        }

        public static bool CanCreateOrgGoal(string role)
        {
            return role == LEADERSHIP;
        }

        public static bool CanAssignGoals(string role)
        {
            return MANAGERIAL_ROLES.Contains(role ?? "");
        }

        public static bool CanViewAllGoals(string role)
        {
            return role == LEADERSHIP || role == HR;
        }

        public static bool IsAdmin(string role)
        {
            return ADMIN_ROLES.Contains(role ?? "");
        }
    }

    // Approval user role context
    public static class APPROVAL_USER_ROLE
    {
        public const string REQUESTER = "Requester";
        public const string APPROVER = "Approver";
        public const string GOAL_CREATOR = "GoalCreator";
        public const string GOAL_ASSIGNEE = "GoalAssignee";
        public const string POTENTIAL_APPROVER = "PotentialApprover";
        public const string OBSERVER = "Observer";
        public const string MANAGER = "Manager";

        public static readonly string[] ALL =
        {
            REQUESTER,
            APPROVER,
            GOAL_CREATOR,
            GOAL_ASSIGNEE,
            POTENTIAL_APPROVER,
            OBSERVER,
            MANAGER,
        };
    }

    // File upload constants
    public static class FILE_UPLOAD
    {
        public const long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
        public const int MAX_FILE_SIZE_MB = 10;
        public const int PROOF_ATTACHMENT_MAX_AGE_DAYS = 30;

        public static readonly string[] ALLOWED_EXTENSIONS =
        {
            ".pdf",
            ".doc",
            ".docx",
            ".xls",
            ".xlsx",
            ".png",
            ".jpg",
            ".jpeg",
            ".txt",
            ".zip",
        };

        public static readonly Dictionary<string, string> CONTENT_TYPES = new()
        {
            { ".pdf", "application/pdf" },
            { ".doc", "application/msword" },
            { ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
            { ".xls", "application/vnd.ms-excel" },
            { ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
            { ".png", "image/png" },
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".txt", "text/plain" },
            { ".zip", "application/zip" },
        };

        public static readonly string[] IMAGE_EXTENSIONS = { ".png", ".jpg", ".jpeg" };

        public static readonly string[] DOCUMENT_EXTENSIONS = { ".pdf", ".doc", ".docx", ".txt" };

        public static readonly string[] SPREADSHEET_EXTENSIONS = { ".xls", ".xlsx" };

        public static bool IsValidExtension(string extension)
        {
            return ALLOWED_EXTENSIONS.Contains(extension?.ToLowerInvariant() ?? "");
        }

        public static bool IsImage(string extension)
        {
            return IMAGE_EXTENSIONS.Contains(extension?.ToLowerInvariant() ?? "");
        }

        public static bool IsDocument(string extension)
        {
            return DOCUMENT_EXTENSIONS.Contains(extension?.ToLowerInvariant() ?? "");
        }

        public static bool IsSpreadsheet(string extension)
        {
            return SPREADSHEET_EXTENSIONS.Contains(extension?.ToLowerInvariant() ?? "");
        }

        public static string GetContentType(string extension)
        {
            return CONTENT_TYPES.TryGetValue(
                extension?.ToLowerInvariant() ?? "",
                out var contentType
            )
                ? contentType
                : "application/octet-stream";
        }

        public static bool IsValidFileSize(long fileSizeBytes)
        {
            return fileSizeBytes > 0 && fileSizeBytes <= MAX_FILE_SIZE_BYTES;
        }

        public static string GetAllowedExtensionsString()
        {
            return string.Join(", ", ALLOWED_EXTENSIONS.Select(e => e.ToUpper()));
        }
    }

    // Validation constants
    public static class VALIDATION
    {
        public const int MIN_CHECKLIST_ITEMS = 3;
        public const int MAX_CHECKLIST_ITEMS = 50;
        public const int MAX_CHECKLIST_TITLE_LENGTH = 200;
        public const int MIN_GOAL_TITLE_LENGTH = 3;
        public const int MAX_GOAL_TITLE_LENGTH = 200;
        public const int MAX_GOAL_DESCRIPTION_LENGTH = 5000;
        public const int MIN_GOAL_DESCRIPTION_LENGTH = 10;
        public const int MIN_COMMENT_LENGTH = 1;
        public const int MAX_COMMENT_LENGTH = 1000;
        public const int MIN_PROGRESS = 0;
        public const int MAX_PROGRESS = 100;
        public const int COMPLETION_PROGRESS_THRESHOLD = 100;
        public const int DEFAULT_PAGE_SIZE = 10;
        public const int MAX_PAGE_SIZE = 100;
        public const int MIN_PAGE_SIZE = 1;
        public const int DEFAULT_PAGE_NUMBER = 1;
        public const int MIN_DEADLINE_DAYS_FROM_NOW = 1;
        public const int MAX_DEADLINE_DAYS_FROM_NOW = 365;
        public const int MIN_PROOF_ATTACHMENTS = 1;
        public const int DESCRIPTION_SHORT_LENGTH = 80;

        public static bool IsValidProgress(int progress)
        {
            return progress >= MIN_PROGRESS && progress <= MAX_PROGRESS;
        }

        public static bool IsValidPageSize(int pageSize)
        {
            return pageSize >= MIN_PAGE_SIZE && pageSize <= MAX_PAGE_SIZE;
        }

        public static bool IsValidPageNumber(int pageNumber)
        {
            return pageNumber >= DEFAULT_PAGE_NUMBER;
        }

        public static bool IsValidGoalTitle(string title)
        {
            return !string.IsNullOrWhiteSpace(title)
                && title.Length >= MIN_GOAL_TITLE_LENGTH
                && title.Length <= MAX_GOAL_TITLE_LENGTH;
        }

        public static bool IsValidGoalDescription(string description)
        {
            return !string.IsNullOrWhiteSpace(description)
                && description.Length >= MIN_GOAL_DESCRIPTION_LENGTH
                && description.Length <= MAX_GOAL_DESCRIPTION_LENGTH;
        }

        public static bool IsValidComment(string comment)
        {
            return !string.IsNullOrWhiteSpace(comment)
                && comment.Length >= MIN_COMMENT_LENGTH
                && comment.Length <= MAX_COMMENT_LENGTH;
        }

        public static bool HasMinimumChecklistItems(int count)
        {
            return count >= MIN_CHECKLIST_ITEMS;
        }

        public static bool IsWithinMaxChecklistItems(int count)
        {
            return count <= MAX_CHECKLIST_ITEMS;
        }

        public static bool IsValidDeadline(DateTime deadline)
        {
            var now = DateTime.UtcNow;
            var minDeadline = now.AddDays(MIN_DEADLINE_DAYS_FROM_NOW);
            var maxDeadline = now.AddDays(MAX_DEADLINE_DAYS_FROM_NOW);
            return deadline >= minDeadline && deadline <= maxDeadline;
        }
    }

    // Query filter constants
    public static class QUERY_FILTER
    {
        public static class GOAL_FILTERS
        {
            public const string ALL = "all";
            public const string MY_GOALS = "my";
            public const string ASSIGNED_TO_ME = "assigned";
            public const string CREATED_BY_ME = "created";
            public const string TEAM_GOALS = "team";
            public const string ORG_GOALS = "org";
            public const string PENDING = "pending";
            public const string ACTIVE = "active";
            public const string COMPLETED = "completed";
            public const string OVERDUE = "overdue";

            public static readonly string[] ALL_FILTERS =
            {
                ALL,
                MY_GOALS,
                ASSIGNED_TO_ME,
                CREATED_BY_ME,
                TEAM_GOALS,
                ORG_GOALS,
                PENDING,
                ACTIVE,
                COMPLETED,
                OVERDUE,
            };

            public static bool IsValid(string filter)
            {
                return ALL_FILTERS.Contains(filter?.ToLower() ?? "");
            }
        }

        public static class APPROVAL_FILTERS
        {
            public const string ALL = "all";
            public const string PENDING_APPROVAL = "pending";
            public const string MY_REQUESTS = "myrequests";
            public const string TO_APPROVE = "toapprove";
            public const string APPROVED = "approved";
            public const string REJECTED = "rejected";

            public static readonly string[] ALL_FILTERS =
            {
                ALL,
                PENDING_APPROVAL,
                MY_REQUESTS,
                TO_APPROVE,
                APPROVED,
                REJECTED,
            };

            public static bool IsValid(string filter)
            {
                return ALL_FILTERS.Contains(filter?.ToLower() ?? "");
            }
        }

        public static class SORT_ORDER
        {
            public const string ASCENDING = "asc";
            public const string DESCENDING = "desc";

            public static readonly string[] ALL = { ASCENDING, DESCENDING };

            public static bool IsValid(string order)
            {
                return ALL.Contains(order?.ToLower() ?? "");
            }
        }

        public static class SORT_FIELDS
        {
            public const string CREATED_DATE = "created";
            public const string UPDATED_DATE = "updated";
            public const string DEADLINE = "deadline";
            public const string PROGRESS = "progress";
            public const string TITLE = "title";
            public const string STATUS = "status";

            public static readonly string[] ALL =
            {
                CREATED_DATE,
                UPDATED_DATE,
                DEADLINE,
                PROGRESS,
                TITLE,
                STATUS,
            };

            public static bool IsValid(string field)
            {
                return ALL.Contains(field?.ToLower() ?? "");
            }
        }
    }

    // Claim type constants
    public static class CLAIM_TYPES
    {
        public const string ROLE = "role";
        public const string EMPLOYEE_MASTER_ID = "empMasterId";
    }

    // HTTP route constants
    public static class ROUTES
    {
        public const string ATTACHMENTPREVIEW = "attachments/{attachmentId:int}/preview";

        public const string GOAL_CONTROLLER = "api/[controller]";
        public const string GOAL_BY_ID = "{id:int}";
        public const string GOAL_QUERY = "query";
        public const string GOAL_ASSIGNEES = "{id:int}/assignees";
        public const string GOAL_ASSIGN = "{id:int}/assign";
        public const string GOAL_APPROVALS = "{id:int}/approvals";
        public const string APPROVALS_BY_ID = "approvals/{approvalId:int}";
        public const string APPROVALS_PENDING = "approvals/pending";
        public const string APPROVALS_MY = "approvals/my";
        public const string CHECKLIST_TOGGLE = "{id:int}/checklist/toggle";
        public const string PROGRESS_MANUAL = "{id:int}/progress/manual";
        public const string PROGRESS = "{id:int}/progress";
        public const string PROGRESS_TEAM = "{id:int}/progress/team";
        public const string PROGRESS_CASCADING = "{id:int}/progress/cascading";
        public const string PROGRESS_HIERARCHY = "{id:int}/progress/hierarchy";
        public const string PROJECTS_USER = "projects/user";
        public const string PROJECTS = "projects";
        public const string PROJECT_BY_ID = "projects/{projectId:int}";
        public const string PROJECT_SUBORDINATES = "projects/{projectId}/subordinates";
        public const string ATTACHMENTS_UPLOAD = "{id:int}/attachments/upload";
        public const string ATTACHMENTS_LIST = "{id:int}/attachments";
        public const string ATTACHMENT_DOWNLOAD = "attachments/{attachmentId:int}/download";
        public const string ATTACHMENT_DELETE = "attachments/{attachmentId:int}";
        public const string COMMENTS_ADD = "{id:int}/comments";
        public const string COMMENTS_LIST = "{id:int}/comments";
        public const string TIMELINE = "{id:int}/timeline";
        public const string DASHBOARD_SUMMARY = "dashboard/summary";
        public const string DASHBOARD_ONGOING = "dashboard/ongoing";
        public const string CAN_COMPLETE = "{id:int}/can-complete";
        public const string CAN_VIEW = "{id:int}/can-view";
        public const string CAN_COMMENT = "{id:int}/can-comment";
    }

    // File storage paths
    public static class FILE_STORAGE
    {
        public const string WWWROOT = "wwwroot";
        public const string UPLOADS = "uploads";
        public const string GOAL_ATTACHMENTS = "goal-attachments";
    }
}

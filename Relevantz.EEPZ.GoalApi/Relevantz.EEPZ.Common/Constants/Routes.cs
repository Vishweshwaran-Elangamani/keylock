namespace Relevantz.EEPZ.Common.Constants
{

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

}

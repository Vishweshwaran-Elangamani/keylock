namespace Relevantz.EEPZ.Common.Constants
{

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

}
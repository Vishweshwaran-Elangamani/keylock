namespace Relevantz.EEPZ.Common.Enums
{
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


}
namespace Relevantz.EEPZ.Common.Enums
{

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
}
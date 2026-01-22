namespace Relevantz.EEPZ.Common
{
    public static class AppConstants
    {
        // SLA Automation Messages
        public const string SLA_TYPE_REQUIRED = "SLA Type is required.";
        public const string EMPLOYEE_ID_REQUIRED = "Employee ID is required.";
        public const string DEADLINE_REQUIRED = "Deadline is required.";
        public const string DEPARTMENT_ID_REQUIRED = "Department ID is required.";
        public const string SLA_CLOSED = "SLA is already closed.";
        public const string SLA_NOT_FOUND = "SLA not found.";

        // Escalation Messages
        public const string ESCALATION_SUBMITTED = "Escalation submitted successfully.";
        public const string ESCALATION_FAILED = "Failed to submit escalation.";

        // General Messages
        public const string INTERNAL_SERVER_ERROR = "An unexpected error occurred.";
        public const string SUCCESS = "Operation completed successfully.";
    }
}

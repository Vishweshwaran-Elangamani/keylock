namespace Relevantz.EEPZ.Common.Constants
{
    public static class AssessmentStatuses
    {
        public const string Submitted = "Submitted";
        public const string Draft = "Draft";
        public const string Pending = "Pending";
        public const string Completed = "Completed";
    }

    public static class ApprovalStatuses
    {
        public const string Approved = "Approved";
        public const string Pending = "Pending";
        public const string Rejected = "Rejected";
    }

    public static class ReviewStatuses
    {
        public const string Approved = "Approved";
        public const string Rejected = "Rejected";
        public const string Pending = "Pending";
    }

    public static class ReviewerRoles
    {
        public const string Reviewer = "Reviewer";  // L2
        public const string Approver = "Approver";  // L1
    }

    public static class ResponseStatuses
    {
        public const string Completed = "Completed";
    }
}
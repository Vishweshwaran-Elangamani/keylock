namespace Relevantz.EEPZ.Common.Constants
{
    public static class AssessmentConstants
    {
        public const string STATUS_SUBMITTED = "Submitted";
        public const string STATUS_APPROVED = "Approved";
        public const string STATUS_REJECTED = "Rejected";
        public const string REVIEWER_ROLE_APPROVER = "Approver";
        public const string REVIEWER_ROLE_REVIEWER = "Reviewer";
        public const string REVIEW_STATUS_APPROVED = "Approved";
        public const string REVIEW_STATUS_REJECTED = "Rejected";
        public const string REVIEW_STATUS_PENDING = "Pending";
    }

    public enum ReviewerRole
    {
        Approver,
        Reviewer
    }

    public enum ReviewStatus
    {
        Approved,
        Rejected,
        Pending
    }
}

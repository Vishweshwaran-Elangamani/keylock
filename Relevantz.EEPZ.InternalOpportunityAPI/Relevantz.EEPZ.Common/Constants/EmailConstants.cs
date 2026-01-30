namespace Relevantz.EEPZ.Common.Constants
{
    public static class EmailConstants
    {
        public static class ConfigKeys
        {
            public const string Host = "SmtpSettings:Host";
            public const string Port = "SmtpSettings:Port";
            public const string EnableSsl = "SmtpSettings:EnableSsl";
            public const string Username = "SmtpSettings:Username";
            public const string Password = "SmtpSettings:Password";
            public const string FromEmail = "SmtpSettings:FromEmail";
            public const string FromName = "SmtpSettings:FromName";
        }

        public static class Subjects
        {
            // Nomination Workflow
            public const string NominationCreated = "You have been nominated for an internal opportunity";
            public const string NominationApproved = "🎉 Congratulations! Your nomination has been APPROVED";
            public const string NominationRejected = "Your nomination has been rejected - FINAL";
            public const string L2ReviewRequest = "Action Required - Review Nomination";
            public const string L2Approved = "Your nomination has been approved by your Manager";
            public const string L2Rejected = "Your nomination has been rejected by your Manager";
            public const string DeptHeadReviewRequest = "Action Required - Final Review Required";
            public const string DeptHeadApproved = "🎉 Congratulations! Your nomination has been APPROVED";
            public const string DeptHeadApprovedToL2 = "Nomination Approved";
            public const string DeptHeadRejectedToL2 = "Action Required - Re-review Nomination";
            public const string DeptHeadRejectedToNominee = "Update on your nomination";
            public const string L2ReApproved = "Your nomination has been re-approved by your Manager";
            public const string L2ReApprovedToDeptHead = "Action Required - Re-review Nomination";
            public const string L2ReRejected = "Your nomination has been rejected - FINAL";
        }

        public static class Defaults
        {
            public const string EmptyRecipientName = "";
        }
    }
}

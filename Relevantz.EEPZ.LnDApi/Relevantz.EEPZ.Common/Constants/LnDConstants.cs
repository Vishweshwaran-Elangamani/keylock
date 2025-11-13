namespace Relevantz.EEPZ.Common.Constants
{
    public static class LnDConstants
    {
        public const int MIN_SME_RATING = 8;
        public const int MAX_SME_ASSIGNMENTS = 3;
        public const int MIN_REQUEST_SME_RATING = 5;
        public const int PAGE_SIZE = 10;

        public static class AssignmentStatus
        {
            public const string IN_PROGRESS = "IN_PROGRESS";
            public const string PENDING_SME_ACKNOWLEDGEMENT = "PENDING_SME_ACKNOWLEDGEMENT";
            public const string ACKNOWLEDGED = "ACKNOWLEDGED";
            public const string PENDING_MANAGER_ACKNOWLEDGEMENT = "PENDING_MANAGER_ACKNOWLEDGEMENT";
            public const string COMPLETED = "COMPLETED";
            public const string OVERDUE = "OVERDUE";
        }

        public static class ApprovalType
        {
            public const string SME_REGISTRATION = "SME_REGISTRATION";
            public const string SME_REQUEST = "SME_REQUEST";
            public const string ASSIGNMENT_ACKNOWLEDGEMENT = "ASSIGNMENT_ACKNOWLEDGEMENT";
            public const string ASSIGNMENT_COMPLETION = "ASSIGNMENT_COMPLETION";
        }

        public static class ApprovalStatus
        {
            public const string PENDING = "PENDING";
            public const string APPROVED = "APPROVED";
            public const string REJECTED = "REJECTED";
        }

        public static class AttachmentType
        {
            public const string SME_PROOF = "SME_PROOF";
            public const string COMPLETION_PROOF = "COMPLETION_PROOF";
        }
    }
}

namespace Relevantz.EEPZ.Common.Constants
{
    public static class LnDConstants
    {
        // Numeric constraints
        public const int MIN_SME_RATING = 8;
        public const int MAX_SME_ASSIGNMENTS = 3;
        public const int MIN_REQUEST_SME_RATING = 5;
        public const int PAGE_SIZE = 10;

        /// <summary>
        /// Claim types for JWT
        /// </summary>
        public static class CLAIM_TYPES
        {
            public const string EMPLOYEE_ID = "empId";
            public const string ROLE = "role";
        }

        /// <summary>
        /// User roles
        /// </summary>
        public static class USER_ROLES
        {
            public const string HR = "HR";
            public const string MANAGER = "Manager";
            public const string EMPLOYEE = "Employee";
            public const string LEADERSHIP = "Leadership";
        }

        /// <summary>
        /// Employment status
        /// </summary>
        public static class EMPLOYMENT_STATUS
        {
            public const string ACTIVE = "Active";
            public const string INACTIVE = "Inactive";
        }

        /// <summary>
        /// Default values
        /// </summary>
        public static class DEFAULTS
        {
            public const string SORT_BY_EMPLOYEE_NAME = "employeename";
            public const string SORT_BY_SKILL_NAME = "skillname";
        }

        /// <summary>
        /// Assignment status
        /// </summary>
        public static class ASSIGNMENT_STATUS
        {
            public const string IN_PROGRESS = "IN_PROGRESS";
            public const string PENDING_SME_ACKNOWLEDGEMENT = "PENDING_SME_ACKNOWLEDGEMENT";
            public const string ACKNOWLEDGED = "ACKNOWLEDGED";
            public const string PENDING_MANAGER_ACKNOWLEDGEMENT = "PENDING_MANAGER_ACKNOWLEDGEMENT";
            public const string COMPLETED = "COMPLETED";
            public const string OVERDUE = "OVERDUE";
        }

        /// <summary>
        /// Approval types
        /// </summary>
        public static class APPROVAL_TYPE
        {
            public const string SME_REGISTRATION = "SME_REGISTRATION";
            public const string SME_REQUEST = "SME_REQUEST";
            public const string ASSIGNMENT_ACKNOWLEDGEMENT = "ASSIGNMENT_ACKNOWLEDGEMENT";
            public const string ASSIGNMENT_COMPLETION = "ASSIGNMENT_COMPLETION";
        }

        /// <summary>
        /// Approval status
        /// </summary>
        public static class APPROVAL_STATUS
        {
            public const string PENDING = "PENDING";
            public const string APPROVED = "APPROVED";
            public const string REJECTED = "REJECTED";
        }

        /// <summary>
        /// Attachment types
        /// </summary>
        public static class ATTACHMENT_TYPE
        {
            public const string SME_PROOF = "SME_PROOF";
            public const string COMPLETION_PROOF = "COMPLETION_PROOF";
        }

        /// <summary>
        /// File storage paths
        /// </summary>
        public static class FILE_STORAGE
        {
            public const string SME_PROOFS = "sme-proofs";  
            public const string COMPLETION_PROOFS = "completion-proofs";
        }

        /// <summary>
        /// Sort fields
        /// </summary>
        public static class SORT_FIELDS
        {
            public const string SKILL_NAME = "skillname";
            public const string RATING = "rating";
            public const string CREATED_ON = "createdon";
            public const string EMPLOYEE_NAME = "employeename";
            public const string MENTEE_NAME = "menteename";
            public const string SME_NAME = "smename";
            public const string STATUS = "status";
            public const string DEADLINE = "deadline";
            public const string COMPLETION_RATING = "completionrating";
            public const string APPROVAL_TYPE = "approvaltype";
            public const string REQUESTER_NAME = "requestername";
            public const string APPROVER_NAME = "approvername";
            public const string REQUESTED_ON = "requestedon";
        }

        /// <summary>
        /// Sort order
        /// </summary>
        public static class SORT_ORDER
        {
            public const string ASC = "asc";
            public const string DESC = "desc";
        }

        /// <summary>
        /// Role filters
        /// </summary>
        public static class ROLE_FILTERS
        {
            public const string ALL = "all";
            public const string REQUESTER = "requester";
            public const string APPROVER = "approver";
        }
    }
}     



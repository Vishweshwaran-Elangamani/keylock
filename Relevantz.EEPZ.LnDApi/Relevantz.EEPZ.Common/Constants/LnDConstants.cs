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
            public const string ASSIGNMENT_REOPEN = "ASSIGNMENT_REOPEN";
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

        /// <summary>
        /// Team Assignment export constants
        /// <summary>
        public static class TEAM_EXPORT
        {
            public const string TITLE = "Team Assignment";
            public const string EMPLOYEE_NAME = "Employee Name";
            public const string SKILL_NAME = "Skill Name";

            public const string SME_ASSIGNED = "SME Assigned";

            public const string ASSIGNMENT_STATUS = "Assignment Status";

            public const string START_DATE = "Start Date";
            public const string DUE_DATE = "Due Date";
            public const string SCORE = "Score";
            public const string COMMENTS = "Comments";
        }

        public static class ACTIVE_SMES_EXPORT
        {
            public const string TITLE = "Active SMEs";
            public const string EMPLOYEE_NAME = "Employee Name";
            public const string SKILL_NAME = "Skill Name";
            public const string DEPARTMENT = "Department";
            public const string APPROVED_DATE = "Approved Date";
        }

        public static class ORG_EXPORT
        {
            public const string TITLE = "Team Assignment";
            public const string EMPLOYEE_NAME = "Employee Name";
            public const string SKILL_NAME = "Skill Name";
            public const string DEPARTMENT = "Department";
            public const string SME_ASSIGNED = "SME Assigned";

            public const string ASSIGNMENT_STATUS = "Assignment Status";

            public const string START_DATE = "Start Date";
            public const string DUE_DATE = "Due Date";
            public const string SCORE = "Score";
            public const string COMMENTS = "Comments";
        }

        public static class RESPONSE_MESSAGES
        {
            // Generic
            public const string EMPLOYEE_ID_NOT_FOUND_TOKEN = "Employee ID not found in token";
            public const string SUCCESS = "Operation completed successfully";
            public const string FAILED = "Operation failed";
            public const string ACCESS_DENIED = "You do not have access to this resource";
            public const string NOT_FOUND = "Requested resource not found";
            public const string EMPLOYEES_FOUND = "Found {0} employee(s)";

            // Approval
            public const string APPROVAL_NOT_FOUND_OR_NOT_APPROVER =
                "Approval not found or you are not the approver";

            public const string APPROVAL_ALREADY_PROCESSED = "Approval has already been processed";

            public const string APPROVAL_PROCESSED_SUCCESS = "Approval processed successfully";

            public const string APPROVAL_REJECTED_SUCCESS = "Request rejected successfully";

            public const string APPROVAL_NOT_FOUND = "Approval not found";

            // Assignment
            public const string ASSIGNMENT_NOT_FOUND = "Assignment not found";
            public const string ASSIGNMENTS_FOUND = "Found {0} assignment(s)";
            public const string ASSIGNMENT_ACCESS_DENIED = "Assignment not found or access denied";

            public const string ASSIGNMENT_PROOF_NOT_FOUND =
                "No proof document found for this assignment";

            // SME
            public const string SME_NOT_FOUND = "SME not found";

            public const string SME_MIN_RATING_REQUIRED =
                "You need a rating of at least {0} to become an SME";

            public const string ALREADY_ACTIVE_SME = "You are already an active SME for this skill";

            public const string SME_REGISTRATION_ALREADY_PENDING =
                "You already have a pending SME registration request";

            public const string SME_REGISTRATION_REQUEST_SUCCESS =
                "SME registration request submitted successfully";

            public const string ACTIVE_SMES_FOUND = "Found {0} active SME(s)";

            // Attachment
            public const string ATTACHMENT_NOT_FOUND = "No attachment found for this approval";

            public const string ATTACHMENT_ACCESS_DENIED = "Approval not found or access denied";

            public const string EMPLOYEE_NOT_FOUND_OR_NOT_SUBORDINATE =
                "Employee not found or not your subordinate";

            public const string SKILL_RATING_TOO_HIGH_FOR_SME_REQUEST =
                "Employee must have a skill rating below minimum to request SME assignment";

            public const string SME_ASSIGNMENT_REQUEST_SUCCESS =
                "SME assignment request sent successfully";

            // Assignment – Upload completion proof
            public const string ASSIGNMENT_NOT_IN_PROGRESS = "Assignment is not in progress";

            public const string COMPLETION_PROOF_UPLOAD_SUCCESS =
                "Completion proof uploaded successfully. Awaiting SME acknowledgement.";

            // Assignment – Completion
            public const string ASSIGNMENT_NOT_READY_FOR_COMPLETION =
                "Assignment is not ready for completion";

            public const string ASSIGNMENT_COMPLETED_SUCCESS = "Assignment completed successfully";

            // Overdue
            public const string OVERDUE_ASSIGNMENTS_MARKED = "assignment(s) marked as overdue";

            public const string MANAGER_NOT_FOUND = "Manager not found";

            // Skills
            public const string SKILL_NOT_FOUND = "Skill not found";

            public const string SKILL_ALREADY_RECORDED = "Skill already recorded for this employee";

            public const string SKILL_RECORDED_SUCCESS = "Skill recorded successfully";

            public const string SKILL_RATING_UPDATED_SUCCESS = "Skill rating updated successfully";

            public const string SKILL_MAPPING_NOT_FOUND_OR_UNAUTHORIZED =
                "Skill mapping not found or employee not your subordinate";

            public const string SKILL_DELETED_SUCCESS = "Skill deleted successfully";

            // Fetch messages
            public const string SUBORDINATES_FOUND = "Found {0} subordinate(s)";

            public const string SKILLS_FOUND = "Found {0} skill(s)";

            public const string BULK_SKILLS_RECORDED = "{0} skills recorded successfully";

            public const string SKILL_DELETE_WITH_ASSIGNMENTS =
                "Skill deleted successfully. {0} active assignment(s) removed. SME status deactivated if applicable.";

            public const string REOPEN_REQUEST_SUBMITTED = "Reopen request submitted successfully";
            public const string REOPEN_REQUEST_APPROVED = "Assignment reopened and deadline extended";
            public const string REOPEN_REQUEST_REJECTED = "Reopen request rejected";

            public const string PENDING_REOPEN_REQUEST_EXISTS = "A pending reopen request already exists for this assignment";
            public const string NEW_DEADLINE_REQUIRED = "New deadline is required when approving reopen request";
            public const string ASSIGNMENT_NOT_ELIGIBLE_FOR_REOPEN =
            "Only in-progress assignments with passed deadlines can be reopened";
            public const string ASSIGNMENT_DEADLINE_NOT_PASSED = "Assignment deadline has not passed yet. Reopen request is only available for overdue assignments.";

        }
    }
}

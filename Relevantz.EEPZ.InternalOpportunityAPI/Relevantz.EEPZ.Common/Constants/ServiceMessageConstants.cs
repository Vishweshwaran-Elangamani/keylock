namespace Relevantz.EEPZ.Core.Constants
{
    public static class ServiceMessageConstants
    {
        // Opportunity messages
        public const string OpportunityNotFoundById = "Opportunity with ID {0} not found";
        
        // Status constants
        public const string StatusActive = "Active";
        public const string StatusClosed = "Closed";
        public const string StatusApproved = "Approved";
        public const string StatusRejected = "Rejected";
        public const string StatusAutoSkipped = "Auto_Skipped";
        public const string StatusPendingManagerReview = "Pending_Manager_Review";
        public const string StatusPendingManagerReReview = "Pending_Manager_ReReview";
        public const string StatusPendingDeptHeadReview = "Pending_DeptHead_Review";
        public const string StatusRejectedByManager = "Rejected_By_Manager";
        public const string StatusRejectedByDeptHead = "Rejected_By_DeptHead";
        public const string StatusApprovedByDeptHead = "Approved_By_DeptHead";
        public const string StatusPendingReReview = "Pending_ReReview";
        public const string StatusWithdrawn = "Withdrawn";
        
        // General constants
        public const string UnknownDepartment = "Unknown";
        public const string UnknownEmployee = "Unknown";
        public const string NotAvailable = "N/A";
        
        // Nomination constants
        public const string NominationTypeEmployeeSelf = "employee_self";
        public const string NominationTypeManagerNomination = "manager_nomination";
        public const string NominationTypeSelf = "Self";
        public const string NominationTypeManager = "Manager";
        
        // Error messages
        public const string NominationNotFound = "Nomination not found";
        public const string DuplicateNominationError = "You have already applied for this opportunity. You can reapply only if your previous application was rejected.";
        public const string EmployeeAlreadyNominated = "This employee has already been nominated for this opportunity.";
        public const string DeptHeadNotFound = "Cannot find Department Head for review. Please contact HR.";
        public const string DeptHeadNotFoundForNominee = "Cannot find DeptHead for nominee. Please contact HR.";
        public const string ManagerNotFoundFromProject = "Cannot find Manager (L2) from your primary project. Please contact HR.";
        public const string L2ManagerNotFoundForNominee = "Cannot find L2 Manager for nominee. Please contact HR.";
        public const string NotAuthorizedToReview = "Not authorized to review this nomination";
        
        // Review messages
        public const string AutoSkippedL2ManagerSelfNomination = "Auto-skipped (L2 Manager self-nomination)";
        public const string L2ManagerNominatedAutoApproved = "L2 Manager nominated (auto-approved)";
        public const string YourselfSelfNomination = "Yourself (Self-nomination)";
        public const string NoReasonProvided = "No reason provided";
        public const string RejectedByDeptHead = "Rejected by Department Head";
        public const string DeptHeadRejectedPrefix = "DeptHead rejected. Previous:";
        
        // Actions
        public const string ActionApproved = "Approved";
        
        // Workflow stages
        public const string WorkflowStageSubmitted = "Submitted";
        public const string WorkflowStageManagerReview = "Manager Review";
        public const string WorkflowStageManagerReReview = "Manager Re-Review";
        public const string WorkflowStageDeptHeadReview = "Department Head Review";
        public const string WorkflowStageCompleted = "Completed";
        public const string WorkflowStageUnknown = "Unknown";
        
        // Display statuses
        public const string DisplayStatusApproved = "Approved";
        public const string DisplayStatusRejected = "Rejected";
        public const string DisplayStatusPendingManagerReview = "Pending Manager Review";
        public const string DisplayStatusPendingManagerReReview = "Pending Manager Re-Review";
        public const string DisplayStatusPendingDeptHeadReview = "Pending DeptHead Review";
        public const string DisplayStatusWithdrawn = "Withdrawn";
        
        // Keywords for filtering
        public const string ApprovedKeyword = "Approved";
        public const string RejectedKeyword = "Rejected";
        public const string PendingKeyword = "Pending";
        
        // Placeholders
        public const string OpportunityNamePlaceholder = "Opportunity Name";
        public const string EmployeeIsEligible = "Employee is eligible";
        public const string CriteriaPlaceholder = "Criteria";
        public const string InternalOpportunityType = "Internal Opportunity";
    }
}

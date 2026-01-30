namespace Relevantz.EEPZ.Data.Constants
{
    public static class RepositoryConstants
    {
        // Status constants
        public const string StatusActive = "Active";
        public const string StatusClosed = "Closed";
        public const string StatusApproved = "Approved";
        public const string StatusRejected = "Rejected";
        public const string StatusPending = "Pending";
        
        // Nomination statuses
        public const string StatusPendingManagerReview = "Pending_Manager_Review";
        public const string StatusPendingManagerReReview = "Pending_Manager_ReReview";
        public const string StatusPendingDeptHeadReview = "Pending_DeptHead_Review";
        public const string StatusApprovedByDeptHead = "Approved_By_DeptHead";
        public const string StatusRejectedByManager = "Rejected_By_Manager";
        public const string StatusRejectedByDeptHead = "Rejected_By_DeptHead";
        
        // Nomination types
        public const string NominationTypeEmployeeSelf = "employee_self";
        public const string NominationTypeManagerNomination = "manager_nomination";
        
        // Role names
        public const string RoleNameManager = "Manager";
        public const string RoleNameDepartmentHead = "Department Head";
        public const string RoleNameDepartmentHeadAlt1 = "DepartmentHead";
        public const string RoleNameDepartmentHeadAlt2 = "DEPTHEAD";
    }
}

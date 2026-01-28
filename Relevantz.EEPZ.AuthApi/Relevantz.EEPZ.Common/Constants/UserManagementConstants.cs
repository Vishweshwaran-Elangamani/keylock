namespace Relevantz.EEPZ.Common.Constants
{
    public static class UserManagementConstants
    {
        public static class Messages
        {
            public const string UserRetrievedSuccess = "User retrieved successfully";
            public const string UsersRetrievedSuccess = "Users retrieved successfully";
            public const string UserDeactivatedSuccess = "User deactivated successfully";
            public const string UserActivatedSuccess = "User activated successfully";
            public const string RoleDepartmentAssignedSuccess = "Role and Department assigned successfully";
            public const string ManagerNotFound = "Manager not found";
            public const string EmailAlreadyExists = "Email already exists";
            public const string EmployeeCompanyIdExists = "Employee Company ID already exists";
            public const string RoleNotFound = "Role not found";
            public const string DepartmentNotFound = "Department not found";
            public const string UserNotFound = "User not found";
            public const string EmployeeNotFound = "Employee not found";
            public const string CannotDeactivateProtectedUser = "Cannot deactivate protected user (Employee ID: 1000)";
        }
        public static class Prefixes
        {
            public const string CountryCodeIndia = "+91";
            public const string CountryCodeIndiaWithDash = "+91-";
        }
        public static class Separators
        {
            public const string Dash = "-";
            public const string Space = " ";
            public const string EmptyString = "";
        }
    }
}

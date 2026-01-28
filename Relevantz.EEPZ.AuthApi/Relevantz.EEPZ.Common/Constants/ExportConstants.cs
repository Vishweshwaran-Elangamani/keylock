using System.Drawing;
namespace Relevantz.EEPZ.Common.Constants
{
    public static class ExportConstants
    {
        public static class SheetNames
        {
            public const string Roles = "Roles";
            public const string Departments = "Departments";
            public const string Users = "Users";
        }
        public static class ColumnHeaders
        {
            public static class Roles
            {
                public const string RoleId = "Role ID";
                public const string RoleName = "Role Name";
                public const string RoleCode = "Role Code";
                public const string Description = "Description";
                public const string IsSystemRole = "Is System Role";
                public const string CreatedAt = "Created At";
                public const string UpdatedAt = "Updated At";
            }
            public static class Departments
            {
                public const string DepartmentId = "Department ID";
                public const string DepartmentName = "Department Name";
                public const string BudgetAllocated = "Budget Allocated";
                public const string CostCenter = "Cost Center";
                public const string CreatedAt = "Created At";
                public const string UpdatedAt = "Updated At";
            }
            public static class Users
            {
                public const string UserId = "User ID";
                public const string EmployeeCompanyId = "Employee Company ID";
                public const string Email = "Email";
                public const string FirstName = "First Name";
                public const string LastName = "Last Name";
                public const string MobileNumber = "Mobile Number";
                public const string Mobile = "Mobile";
                public const string Gender = "Gender";
                public const string EmploymentType = "Employment Type";
                public const string EmploymentStatus = "Employment Status";
                public const string EmployeeType = "Employee Type";
                public const string JoiningDate = "Joining Date";
                public const string WorkLocation = "Work Location";
                public const string RoleName = "Role Name";
                public const string Role = "Role";
                public const string DepartmentName = "Department Name";
                public const string Department = "Department";
                public const string Status = "Status";
                public const string IsActive = "Is Active";
                public const string LastLogin = "Last Login";
                public const string CreatedAt = "Created At";
            }
        }
        public static class Defaults
        {
            public const string NotAvailable = "N/A";
            public const string Yes = "Yes";
            public const string No = "No";
            public const string Never = "Never";
        }
        public static class DateFormats
        {
            public const string DateTimeFormat = "yyyy-MM-dd HH:mm:ss";
            public const string DateFormat = "yyyy-MM-dd";
        }
        public static class NumberFormats
        {
            public const string DecimalFormat = "N2";
        }
        public static class Styling
        {
            public static readonly Color HeaderBackgroundColor = Color.FromArgb(79, 129, 189);
            public static readonly Color HeaderFontColor = Color.White;
        }
        public static class LogMessages
        {
            public const string RolesExported = "Roles exported to Excel successfully";
            public const string DepartmentsExported = "Departments exported to Excel successfully";
            public const string AllDataExported = "All data exported to Excel successfully";
        }
    }
}

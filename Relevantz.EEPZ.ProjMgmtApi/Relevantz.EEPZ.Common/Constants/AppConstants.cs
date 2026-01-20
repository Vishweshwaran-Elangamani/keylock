namespace Relevantz.EEPZ.Common.Constants
{
    public static class AppConstants
    {
        public static class RoleNames
        {
            public static readonly List<string> ManagerRoles = new()
            {
                "Manager",
                "Project Manager",
                "Team Lead",
                "Technical Architect",
                "HR Manager",
                "Senior Software Engineer",
                "Senior Manager",
                "Director",
                "Vice President",
                "CTO",
                "CEO"
            };
        }

        public static class ProjectNames
        {
            public const string ResourcePoolProjectName = "org.rz.resourcepool";
        }

        public static class RepositoryErrors
        {
            public const string ResourcePoolProjectNotFound = "Resource pool project not found";
            public const string ResourcePoolProjectL2ApproverMissing = "Resource pool project does not have L2 Approver assigned";
            public const string ResourcePoolProjectInvalidL2ApproverConfig = "Invalid L2 Approver configuration for resource pool";
            public const string EmployeeNotFoundPrefix = "Employee not found with EmployeeMasterId";
        }
    }
}

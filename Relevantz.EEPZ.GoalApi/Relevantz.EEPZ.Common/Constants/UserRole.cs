namespace Relevantz.EEPZ.Common.Constants
{
    // User role constants
    public static class USER_ROLE
    {
        public const string EMPLOYEE = "Employee";
        public const string MANAGER = "Manager";
        public const string DEPARTMENT_HEAD = "Department Head";
        public const string LEADERSHIP = "Leadership";
        public const string HR = "HR";

        public static readonly string[] ALL =
        {
            EMPLOYEE,
            MANAGER,
            DEPARTMENT_HEAD,
            LEADERSHIP,
            HR,
        };

        public static readonly string[] MANAGERIAL_ROLES = { MANAGER, DEPARTMENT_HEAD, LEADERSHIP };

        public static readonly string[] APPROVAL_AUTHORITIES =
        {
            MANAGER,
            DEPARTMENT_HEAD,
            LEADERSHIP,
        };

        public static readonly string[] ADMIN_ROLES = { LEADERSHIP, HR };

        public static bool IsValid(string role)
        {
            return ALL.Contains(role ?? "");
        }

        public static bool IsManagerial(string role)
        {
            return MANAGERIAL_ROLES.Contains(role ?? "");
        }

        public static bool CanApprove(string role)
        {
            return APPROVAL_AUTHORITIES.Contains(role ?? "");
        }

        public static bool CanCreateTeamGoal(string role)
        {
            return role == MANAGER || role == DEPARTMENT_HEAD || role == LEADERSHIP;
        }

        public static bool CanCreateOrgGoal(string role)
        {
            return role == LEADERSHIP;
        }

        public static bool CanAssignGoals(string role)
        {
            return MANAGERIAL_ROLES.Contains(role ?? "");
        }

        public static bool CanViewAllGoals(string role)
        {
            return role == LEADERSHIP || role == HR;
        }

        public static bool IsAdmin(string role)
        {
            return ADMIN_ROLES.Contains(role ?? "");
        }
    }
}

namespace Relevantz.EEPZ.Common.Enums
{


    public static class PROJECT_STATUS
    {
        public const string ACTIVE = "Active";
        public const string INACTIVE = "Inactive";
        public const string COMPLETED = "Completed";
        public const string ON_HOLD = "On Hold";
        public const string UNKNOWN = "Unknown";

        public static readonly string[] ALL = { ACTIVE, INACTIVE, COMPLETED, ON_HOLD, UNKNOWN };

        public static bool IsValid(string status)
        {
            return ALL.Contains(status ?? "");
        }

        public static bool IsActive(string status)
        {
            return status == ACTIVE;
        }
    }
}
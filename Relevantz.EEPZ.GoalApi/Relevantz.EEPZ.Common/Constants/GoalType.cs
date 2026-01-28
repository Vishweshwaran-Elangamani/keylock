namespace Relevantz.EEPZ.Common.Constants
{
    // Goal type enumeration
    public static class GOAL_TYPE
    {
        public const string SELF = "self";
        public const string TEAM = "team";
        public const string ORG = "org";

        public static readonly string[] ALL = { SELF, TEAM, ORG };

        public static bool IsValid(string goalType)
        {
            return ALL.Contains(goalType?.ToLower() ?? "");
        }
    }
}
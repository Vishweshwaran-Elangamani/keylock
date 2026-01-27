namespace Relevantz.EEPZ.Common.Enums
{
    // Query filter constants
    public static class QUERY_FILTER
    {
        public static class GOAL_FILTERS
        {
            public const string ALL = "all";
            public const string MY_GOALS = "my";
            public const string ASSIGNED_TO_ME = "assigned";
            public const string CREATED_BY_ME = "created";
            public const string TEAM_GOALS = "team";
            public const string ORG_GOALS = "org";
            public const string PENDING = "pending";
            public const string ACTIVE = "active";
            public const string COMPLETED = "completed";
            public const string OVERDUE = "overdue";

            public static readonly string[] ALL_FILTERS =
            {
                ALL,
                MY_GOALS,
                ASSIGNED_TO_ME,
                CREATED_BY_ME,
                TEAM_GOALS,
                ORG_GOALS,
                PENDING,
                ACTIVE,
                COMPLETED,
                OVERDUE,
            };

            public static bool IsValid(string filter)
            {
                return ALL_FILTERS.Contains(filter?.ToLower() ?? "");
            }
        }

    }
}
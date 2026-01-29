namespace Relevantz.EEPZ.Common.Constants
{
    public static class SORT_FIELDS
    {
        public const string CREATED_DATE = "created";
        public const string UPDATED_DATE = "updated";
        public const string DEADLINE = "deadline";
        public const string PROGRESS = "progress";
        public const string TITLE = "title";
        public const string STATUS = "status";

        public static readonly string[] ALL =
        {
            CREATED_DATE,
            UPDATED_DATE,
            DEADLINE,
            PROGRESS,
            TITLE,
            STATUS,
        };

        public static bool IsValid(string field)
        {
            return ALL.Contains(field?.ToLower() ?? "");
        }
    }
}

namespace Relevantz.EEPZ.Common.Constants
{
    public static class SORT_ORDER
    {
        public const string ASCENDING = "asc";
        public const string DESCENDING = "desc";

        public static readonly string[] ALL = { ASCENDING, DESCENDING };

        public static bool IsValid(string order)
        {
            return ALL.Contains(order?.ToLower() ?? "");
        }
    }

}
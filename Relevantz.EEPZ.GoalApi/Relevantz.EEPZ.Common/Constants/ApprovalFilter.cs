namespace Relevantz.EEPZ.Common.Constants
{
    public static class APPROVAL_FILTERS
    {
        public const string ALL = "all";
        public const string PENDING_APPROVAL = "pending";
        public const string MY_REQUESTS = "myrequests";
        public const string TO_APPROVE = "toapprove";
        public const string APPROVED = "approved";
        public const string REJECTED = "rejected";

        public static readonly string[] ALL_FILTERS =
        {
            ALL,
            PENDING_APPROVAL,
            MY_REQUESTS,
            TO_APPROVE,
            APPROVED,
            REJECTED,
        };

        public static bool IsValid(string filter)
        {
            return ALL_FILTERS.Contains(filter?.ToLower() ?? "");
        }
    }
}

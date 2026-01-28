namespace Relevantz.EEPZ.Common.Constants
{

    // Approval status enumeration
    public static class APPROVAL_STATUS
    {
        public const string PENDING = "pending";
        public const string APPROVED = "approved";
        public const string REJECTED = "rejected";

        public static readonly string[] ALL = { PENDING, APPROVED, REJECTED };

        public static bool IsValid(string status)
        {
            return ALL.Contains(status?.ToLower() ?? "");
        }

        public static bool IsPending(string status)
        {
            return status?.ToLower() == PENDING;
        }

        public static bool IsDecided(string status)
        {
            return status?.ToLower() == APPROVED || status?.ToLower() == REJECTED;
        }
    }
}

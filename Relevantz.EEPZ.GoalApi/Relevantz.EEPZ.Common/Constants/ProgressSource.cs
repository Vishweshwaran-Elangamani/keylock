namespace Relevantz.EEPZ.Common.Constants
{
    // Progress source enumeration
    public static class PROGRESS_SOURCE
    {
        public const string MANUAL = "manual";
        public const string AUTO = "auto";

        public static readonly string[] ALL = { MANUAL, AUTO };

        public static bool IsValid(string source)
        {
            return ALL.Contains(source?.ToLower() ?? "");
        }
    }
}  


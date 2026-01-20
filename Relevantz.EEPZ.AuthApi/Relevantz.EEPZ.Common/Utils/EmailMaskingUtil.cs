namespace Relevantz.EEPZ.Common.Utils
{
    public static class EmailMaskingUtil
    {
        public static string MaskEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
                return "***@***.***";

            var parts = email.Split('@');
            var username = parts[0];
            var domain = parts[1];

            var maskedUsername = username.Length > 2
                ? username.Substring(0, 2) + new string('*', Math.Min(username.Length - 2, 5))
                : new string('*', username.Length);

            return $"{maskedUsername}@{domain}";
        }
    }
}

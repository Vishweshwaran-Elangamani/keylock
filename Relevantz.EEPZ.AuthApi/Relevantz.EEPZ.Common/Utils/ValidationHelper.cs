using System.Text.RegularExpressions;

namespace Relevantz.EEPZ.Common.Utils
{
    public static class ValidationHelper
    {
        public static bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        public static bool IsValidIndianMobileNumber(string mobileNumber)
        {
            if (string.IsNullOrWhiteSpace(mobileNumber))
                return false;

            var cleanedNumber = mobileNumber.Replace("+91-", "").Replace("+91", "").Replace("-", "").Replace(" ", "").Trim();
            return Regex.IsMatch(cleanedNumber, @"^[6-9][0-9]{9}$");
        }

        public static bool IsValidEmployeeCompanyId(string employeeCompanyId)
        {
            if (string.IsNullOrWhiteSpace(employeeCompanyId))
                return false;

            return Regex.IsMatch(employeeCompanyId.Trim(), @"^\d+$");
        }

        public static bool IsValidName(string name, int minLength = 2)
        {
            if (string.IsNullOrWhiteSpace(name))
                return false;

            var trimmedName = name.Trim();
            return trimmedName.Length >= minLength && Regex.IsMatch(trimmedName, @"^[a-zA-Z\s]+$");
        }
    }
}

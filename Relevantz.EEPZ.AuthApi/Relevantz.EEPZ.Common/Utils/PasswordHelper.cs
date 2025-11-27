using System.Text;

namespace Relevantz.EEPZ.Common.Utils
{
    public class PasswordHelper
    {
        private static readonly Random _random = new Random();

        public static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
        }

        public static bool VerifyPassword(string password, string passwordHash)
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }

        public static string GenerateTemporaryPassword(int length = 12)
        {
            const string uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string lowercase = "abcdefghijklmnopqrstuvwxyz";
            const string digits = "0123456789";
            const string special = "!@#$%^&*";

            var password = new StringBuilder();

            password.Append(uppercase[_random.Next(uppercase.Length)]);
            password.Append(lowercase[_random.Next(lowercase.Length)]);
            password.Append(digits[_random.Next(digits.Length)]);
            password.Append(special[_random.Next(special.Length)]);

            string allChars = uppercase + lowercase + digits + special;
            for (int i = password.Length; i < length; i++)
            {
                password.Append(allChars[_random.Next(allChars.Length)]);
            }

            return ShuffleString(password.ToString());
        }

        public static bool ValidatePasswordStrength(string password, 
            bool requireUppercase = true, 
            bool requireLowercase = true, 
            bool requireDigit = true, 
            bool requireSpecialChar = true, 
            int minLength = 8)
        {
            if (string.IsNullOrWhiteSpace(password) || password.Length < minLength)
                return false;

            if (requireUppercase && !password.Any(char.IsUpper))
                return false;

            if (requireLowercase && !password.Any(char.IsLower))
                return false;

            if (requireDigit && !password.Any(char.IsDigit))
                return false;

            if (requireSpecialChar && !password.Any(c => "!@#$%^&*()_+-=[]{}|;:,.<>?".Contains(c)))
                return false;

            return true;
        }

        private static string ShuffleString(string input)
        {
            char[] array = input.ToCharArray();
            int n = array.Length;
            while (n > 1)
            {
                n--;
                int k = _random.Next(n + 1);
                var temp = array[k];
                array[k] = array[n];
                array[n] = temp;
            }
            return new string(array);
        }
    }
}

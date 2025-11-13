namespace Relevantz.EEPZ.Common.Utils
{
    public class OtpHelper
    {
        private static readonly Random _random = new Random();

        // Generate OTP
        public static string GenerateOtp(int length = 6)
        {
            if (length < 4 || length > 10)
                throw new ArgumentException("OTP length must be between 4 and 10");

            var otp = string.Empty;
            for (int i = 0; i < length; i++)
            {
                otp += _random.Next(0, 10).ToString();
            }
            return otp;
        }

        // Calculate expiration time
        public static DateTime CalculateExpirationTime(int expirationMinutes)
        {
            return DateTime.UtcNow.AddMinutes(expirationMinutes);
        }

        // Check if OTP is expired
        public static bool IsExpired(DateTime expiresAt)
        {
            return DateTime.UtcNow > expiresAt;
        }
    }
}

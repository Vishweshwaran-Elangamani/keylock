namespace Relevantz.EEPZ.Common.Constants
{
    public static class EmailConstants
    {
        public static class ConfigKeys
        {
            public const string FromName = "SmtpSettings:FromName";
            public const string FromEmail = "SmtpSettings:FromEmail";
            public const string Host = "SmtpSettings:Host";
            public const string Port = "SmtpSettings:Port";
            public const string EnableSsl = "SmtpSettings:EnableSsl";
            public const string Username = "SmtpSettings:Username";
            public const string Password = "SmtpSettings:Password";
        }
        public static class Subjects
        {
            public const string Welcome = "Welcome to EEPZ System";
            public const string Otp = "Your OTP Code - EEPZ System";
            public const string PasswordResetConfirmation = "Password Reset Successful - EEPZ System";
            public const string ChangeRequestNotification = "Change Request Submitted - EEPZ System";
        }
        public static class Defaults
        {
            public const string EmptyRecipientName = "";
        }
    }
}

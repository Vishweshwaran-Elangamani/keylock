namespace Relevantz.EEPZ.Common.Constants
{
    public static class EmailConstants
    {
        public static class ConfigKeys
        {
            public const string Host = "SmtpSettings:Host";
            public const string Port = "SmtpSettings:Port";
            public const string EnableSsl = "SmtpSettings:EnableSsl";
            public const string Username = "SmtpSettings:Username";
            public const string Password = "SmtpSettings:Password";
            public const string FromEmail = "SmtpSettings:FromEmail";
            public const string FromName = "SmtpSettings:FromName";
        }

        public static class Subjects
        {
            public const string Welcome = "Welcome to EEPZ";
            public const string Otp = "Your Verification Code";
            public const string PasswordResetConfirmation = "Password Reset Successful";
            public const string ChangeRequestNotification = "Change Request Submitted";
            public const string GoalReminder = "Set Your Career Development Goals";
        }

        public static class Defaults
        {
            public const string EmptyRecipientName = "";
        }
    }
}

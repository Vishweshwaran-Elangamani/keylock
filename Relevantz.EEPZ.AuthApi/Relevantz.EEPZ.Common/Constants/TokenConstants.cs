namespace Relevantz.EEPZ.Common.Constants
{
    public static class TokenConstants
    {
        public static class ConfigKeys
        {
            public const string JwtIssuer = "Jwt:Issuer";
            public const string JwtAudience = "Jwt:Audience";
            public const string JwtSecretKey = "Jwt:SecretKey";
            public const string AccessTokenExpirationMinutes = "Jwt:AccessTokenExpirationMinutes";
            public const string RefreshTokenExpirationDays = "Jwt:RefreshTokenExpirationDays";
        }
        public static class Defaults
        {
            public const string DefaultIssuer = "EEPZ";
            public const string DefaultAudience = "EEPZUsers";
            public const int DefaultAccessTokenExpirationMinutes = 60;
            public const int DefaultRefreshTokenExpirationDays = 7;
        }
        public static class ErrorMessages
        {
            public const string SecretKeyNotConfigured = "JWT Secret Key not configured";
        }
        public static class LogMessages
        {
            public const string RefreshTokenRevoked = "Refresh token revoked";
        }
    }
}

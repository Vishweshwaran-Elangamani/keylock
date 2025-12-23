namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class LoginResponseDto
    {
        public bool RequiresTwoFactor { get; set; }
        public bool RequiresPasswordReset { get; set; }
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? TokenExpiration { get; set; }
        public UserResponseDto? User { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? EmployeeMasterId { get; set; }
    }
}

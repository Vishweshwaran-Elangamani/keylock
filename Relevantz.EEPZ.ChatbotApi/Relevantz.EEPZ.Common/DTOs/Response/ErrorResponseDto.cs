namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class ErrorResponseDto
    {
        public string Message { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public List<string>? Details { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}

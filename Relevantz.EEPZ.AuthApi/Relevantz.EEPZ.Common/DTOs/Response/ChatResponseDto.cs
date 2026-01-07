namespace Relevantz.EEPZ.Common.DTOs.Response;
public class ChatResponseDto
{
    public string Response { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? ActionType { get; set; }
    public object? Data { get; set; }
}
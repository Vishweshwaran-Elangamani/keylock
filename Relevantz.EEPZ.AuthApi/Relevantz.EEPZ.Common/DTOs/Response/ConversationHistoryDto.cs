namespace Relevantz.EEPZ.Common.DTOs.Response;
public class ConversationHistoryDto
{
    public int MessageId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsUserMessage { get; set; }
    public DateTime CreatedAt { get; set; }
}
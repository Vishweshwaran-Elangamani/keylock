namespace Relevantz.EEPZ.Common.DTOs.Response;
public class ChatPatternDto
{
    public int PatternId { get; set; }
    public string Pattern { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
    public string? Category { get; set; }
    public int Priority { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
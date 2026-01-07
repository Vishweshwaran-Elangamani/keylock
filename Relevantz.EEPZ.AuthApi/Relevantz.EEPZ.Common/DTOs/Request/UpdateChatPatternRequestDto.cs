namespace Relevantz.EEPZ.Common.DTOs.Request;
public class UpdateChatPatternRequestDto
{
    public int PatternId { get; set; }
    public string Pattern { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
    public string? Category { get; set; }
    public int Priority { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

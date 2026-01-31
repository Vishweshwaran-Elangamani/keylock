namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class AutomationLogResponse
    {
        public int LogCount { get; set; }
        public string Period { get; set; } = string.Empty;
        public List<SlaHistoryLogDto> Logs { get; set; } = new();
    }

    public class SlaHistoryLogDto
    {
        public int SlahistoryId { get; set; }
        public int Slaid { get; set; }
        public string ChangeType { get; set; } = string.Empty;
        public string? ChangedFrom { get; set; }
        public string? ChangedTo { get; set; }
        public int? ChangedByEmployeeId { get; set; }
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

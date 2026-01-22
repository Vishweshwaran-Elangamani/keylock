namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class SlaHistoryResponse
    {
        public int SlahistoryId { get; set; }
        public int Slaid { get; set; }
        public string Slatype { get; set; } = string.Empty;
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string ChangeType { get; set; } = string.Empty;
        public string? ChangedFrom { get; set; }
        public string? ChangedTo { get; set; }
        public int? ChangedByEmployeeId { get; set; }
        public string? ChangedByName { get; set; }
        public int? ReferenceEscalationId { get; set; }
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

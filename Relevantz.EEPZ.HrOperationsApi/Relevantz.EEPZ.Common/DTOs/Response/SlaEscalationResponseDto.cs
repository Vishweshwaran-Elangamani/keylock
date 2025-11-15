namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class SlaEscalationResponseDto
    {
        public int EscalationId { get; set; }
        public int SlaId { get; set; }
        public string? SlaType { get; set; }
        public int EmployeeUserId { get; set; }
        public string? EmployeeName { get; set; }
        public string? EmployeeEmail { get; set; }
        public int EscalatedToEmployeeId { get; set; }
        public string? EscalatedToName { get; set; }
        public string? EscalatedToEmail { get; set; }
        public string EscalationLevel { get; set; } = null!;
        public string Reason { get; set; } = null!;
        public string? Description { get; set; }
        public string EscalationStatus { get; set; } = null!;
        public string? SubmittedByName { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? EscalationDeadline { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? ResolvedByName { get; set; }
        public string? ResolutionComments { get; set; }
        public DateTime? SlaDeadline { get; set; }
        public string? SlaStatus { get; set; }
        public int DaysOverdue { get; set; }
        public string Severity { get; set; } = null!;
    }
}

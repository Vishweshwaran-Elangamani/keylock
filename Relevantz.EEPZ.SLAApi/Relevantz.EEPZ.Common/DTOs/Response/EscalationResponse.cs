namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class EscalationResponse
    {
        public int EscalationId { get; set; }
        public int Slaid { get; set; }
        public string? Reason { get; set; }
        public string? Description { get; set; }
        public string? EscalationLevel { get; set; }
        public string? EscalationStatus { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public int? EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string? EmployeeEmail { get; set; }
        public int? SubmittedByEmployeeId { get; set; }
        public string? SubmittedByName { get; set; }
        public int? EscalatedToEmployeeId { get; set; }
        public string? EscalatedToName { get; set; }
        public int? ResolvedByEmployeeId { get; set; }
        public string? ResolvedByName { get; set; }
        public string? ResolutionComments { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? Message { get; set; }
    }
}

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class SlaResponse
    {
        public int Slaid { get; set; }
        public string? Slatype { get; set; }
        public string? Status { get; set; }
        public int EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string? EmployeeEmail { get; set; }
        public int DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public int? AssignedToEmployeeId { get; set; }
        public string? AssignedToName { get; set; }
        public DateTime Deadline { get; set; }
        public DateTime? ClosedAt { get; set; }
        public string? ComplianceStatus { get; set; }
        public string? RelatedEntityType { get; set; }
        public int? RelatedEntityId { get; set; }
        public DateTime? ReopenedAt { get; set; }
        public int? ReopenExtensionDays { get; set; }
        public string? ReopenReason { get; set; }
        public string? UrgencyStatus { get; set; }
        public int DaysUntilDeadline { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

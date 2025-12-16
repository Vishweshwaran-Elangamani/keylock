using System;

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class ViolationResponseDto
    {
        public int ViolationId { get; set; }
        public int EmployeeUserId { get; set; }
        public string? EmployeeName { get; set; }
        public string? EmployeeEmail { get; set; }
        public int? PolicyId { get; set; }
        public string? PolicyName { get; set; }
        public string ViolationType { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Severity { get; set; } = null!;
        public string Status { get; set; } = null!;
        public int ReportedByUserId { get; set; }
        public string? ReportedByEmail { get; set; }
        public DateOnly ReportedDate { get; set; }
        public int? EscalatedToUserId { get; set; }
        public string? EscalatedToEmail { get; set; }
        public string? ResolutionNotes { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class ChangeRequestResponseDto
    {
        public int RequestId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeCompanyId { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string ChangeType { get; set; } = string.Empty;
        public string? CurrentValue { get; set; }
        public string? NewValue { get; set; }
        public string? Reason { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? AdminRemarks { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }
}

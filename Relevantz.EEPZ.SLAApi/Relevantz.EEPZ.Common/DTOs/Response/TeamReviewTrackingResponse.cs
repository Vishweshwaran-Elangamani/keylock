namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class TeamReviewTrackingResponse
    {
        public int ReviewTrackingId { get; set; }
        public int Slaid { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeEmail { get; set; } = string.Empty;
        public int ReviewerId { get; set; }
        public string ReviewerName { get; set; } = string.Empty;
        public string ReviewType { get; set; } = string.Empty;
        public string ReviewCycle { get; set; } = string.Empty;
        public DateTime Deadline { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ComplianceStatus { get; set; } = string.Empty;
        public int DaysUntilDeadline { get; set; }
        public string UrgencyStatus { get; set; } = string.Empty;
    }
}

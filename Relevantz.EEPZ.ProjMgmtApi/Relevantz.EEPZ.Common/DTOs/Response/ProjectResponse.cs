namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class ProjectResponse
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public string ClientName { get; set; } = null!;
        public string? Description { get; set; }
        public string? BusinessUnit { get; set; }
        public string? Department { get; set; }
        public string? EngagementModel { get; set; }
        public string? Status { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public EmployeeBasicInfo? ResourceOwner { get; set; }
        public EmployeeBasicInfo? L1Approver { get; set; }
        public EmployeeBasicInfo? L2Approver { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}

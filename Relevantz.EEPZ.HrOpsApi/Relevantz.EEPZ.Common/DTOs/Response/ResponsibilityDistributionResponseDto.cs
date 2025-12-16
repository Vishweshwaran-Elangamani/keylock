namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class ResponsibilityDistributionResponseDto
    {
        public int WorkloadId { get; set; }
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public int ManagerUserId { get; set; }
        public string ManagerName { get; set; } = string.Empty;
        public int MemberCount { get; set; }
        public decimal AvgWorkload { get; set; }
        public decimal WorkloadVariance { get; set; }
        public int TasksDistributed { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? EvaluationDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
 
 
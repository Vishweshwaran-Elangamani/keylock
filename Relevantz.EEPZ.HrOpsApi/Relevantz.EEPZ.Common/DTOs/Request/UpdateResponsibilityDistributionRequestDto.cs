using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateResponsibilityDistributionRequestDto
    {
        [Required(ErrorMessage = "Workload ID is required")]
        public int WorkloadId { get; set; }
        [Range(1, 1000, ErrorMessage = "Member count must be between 1 and 1000")]
        public int? MemberCount { get; set; }
        [Range(0, 10000, ErrorMessage = "Tasks distributed must be between 0 and 10000")]
        public int? TasksDistributed { get; set; }
        [StringLength(20, ErrorMessage = "Status cannot exceed 20 characters")]
        public string? Status { get; set; }
        public DateTime? EvaluationDate { get; set; }
    }
}

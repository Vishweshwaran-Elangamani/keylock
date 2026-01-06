using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateProjectRequest
    {
        [Required]
        public string ProjectName { get; set; } = null!;

        [Required]
        [StringLength(255)]
        public string ClientName { get; set; } = null!;

        public string? Description { get; set; }

        public string? BusinessUnit { get; set; }

        public string? Department { get; set; }

        public string? EngagementModel { get; set; }

        public string Status { get; set; } = "Active";

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public int? ResourceOwnerEmployeeId { get; set; }

        public int? L1ApproverEmployeeId { get; set; }

        public int? L2ApproverEmployeeId { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateProjectRequest
    {
        [Required]
        public int ProjectId { get; set; }

        [Required]
        public string ProjectName { get; set; } = null!;

        public string? Description { get; set; }

        public string? BusinessUnit { get; set; }

        public string? Department { get; set; }

        public string? EngagementModel { get; set; }

        public string Status { get; set; } = "Active";

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }
    }
}

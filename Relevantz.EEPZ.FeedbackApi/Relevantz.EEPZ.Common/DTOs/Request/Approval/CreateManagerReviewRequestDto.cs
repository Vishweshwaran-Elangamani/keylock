using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateManagerReviewRequestDto
    {
        public int ManagerEmployeeId { get; set; }
        public int TargetEmployeeId { get; set; }

        public int? TargetGoalId { get; set; }
        public int? TargetOrganizationGoalId { get; set; }
        public int Rating { get; set; }
        public string ReviewComment { get; set; }
    }
}

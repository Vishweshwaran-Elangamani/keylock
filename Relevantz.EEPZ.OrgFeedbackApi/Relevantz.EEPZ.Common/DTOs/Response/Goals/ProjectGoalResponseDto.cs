using Relevantz.EEPZ.Common.DTOs.Response.Employees;

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    /// <summary>
    /// Basic goal response DTO.
    /// </summary>
    public class ProjectGoalResponseDto
    {
        public int GoalId { get; set; }

        public string? GoalType { get; set; }

        public string? GoalTitle { get; set; }

        public string? GoalDescription { get; set; }

        public DateTime? GoalCreatedAt { get; set; }

        public DateTime? GoalEndAt { get; set; }

        public string? GoalStatus { get; set; }

        public int? ProjectId { get; set; }

        public string? ProjectName { get; set; }

        public EmployeeBasicInfoDto? CreatedBy { get; set; }

        public DateTime? ClosedOn { get; set; }

        public string? ClosureReason { get; set; }
    }
}

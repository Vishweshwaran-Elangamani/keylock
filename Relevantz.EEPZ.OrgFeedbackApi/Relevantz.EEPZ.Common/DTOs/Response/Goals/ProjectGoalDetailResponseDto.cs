using Relevantz.EEPZ.Common.DTOs.Response.Employees;
namespace Relevantz.EEPZ.Common.DTOs.Response
{
    /// <summary>
    /// Detailed goal response with assignment information.
    /// </summary>

    public class ProjectGoalDetailResponseDto
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

        public EmployeeBasicInfoDto? ClosedBy { get; set; }

        public EmployeeBasicInfoDto? ReopenedBy { get; set; }

        public DateTime? ReopenedOn { get; set; }

        public DateTime? ReopenUntil { get; set; }

        public DateTime? ClosedOn { get; set; }

        public string? ClosureReason { get; set; }

        public List<GoalAssignmentInfoDto> AssignedTo { get; set; } = new();
    }
}

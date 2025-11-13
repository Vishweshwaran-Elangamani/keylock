using System.Text.Json.Serialization;
using Relevantz.EEPZ.Common.Entities;
// using eepzbackend.Controllers;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;




namespace Relevantz.EEPZ.Common.DTOs.Response
{
    /// <summary>
    /// Individual goal response DTO
    /// </summary>
    public class ProjectGoalResponse
    {
        [JsonPropertyName("goalId")]
        public int GoalId { get; set; }

        [JsonPropertyName("goalType")]
        public string? GoalType { get; set; }

        [JsonPropertyName("goalTitle")]
        public string? GoalTitle { get; set; }

        [JsonPropertyName("goalDescription")]
        public string? GoalDescription { get; set; }

        [JsonPropertyName("goalCreatedAt")]
        public DateTime? GoalCreatedAt { get; set; }

        [JsonPropertyName("goalEndAt")]
        public DateTime? GoalEndAt { get; set; }

        [JsonPropertyName("goalStatus")]
        public string? GoalStatus { get; set; }

        [JsonPropertyName("projectId")]
        public int? ProjectId { get; set; }

        [JsonPropertyName("projectName")]
        public string? ProjectName { get; set; }

        [JsonPropertyName("createdBy")]
        public EmployeeBasicInfo? CreatedBy { get; set; }

        [JsonPropertyName("closedOn")]
        public DateTime? ClosedOn { get; set; }

        [JsonPropertyName("closureReason")]
        public string? ClosureReason { get; set; }
    }

    /// <summary>
    /// Detailed goal response with assignment information
    /// </summary>
    public class ProjectGoalDetailResponse
    {
        [JsonPropertyName("goalId")]
        public int GoalId { get; set; }

        [JsonPropertyName("goalType")]
        public string? GoalType { get; set; }

        [JsonPropertyName("goalTitle")]
        public string? GoalTitle { get; set; }

        [JsonPropertyName("goalDescription")]
        public string? GoalDescription { get; set; }

        [JsonPropertyName("goalCreatedAt")]
        public DateTime? GoalCreatedAt { get; set; }

        [JsonPropertyName("goalEndAt")]
        public DateTime? GoalEndAt { get; set; }

        [JsonPropertyName("goalStatus")]
        public string? GoalStatus { get; set; }

        [JsonPropertyName("projectId")]
        public int? ProjectId { get; set; }

        [JsonPropertyName("projectName")]
        public string? ProjectName { get; set; }

        [JsonPropertyName("createdBy")]
        public EmployeeBasicInfo? CreatedBy { get; set; }

        [JsonPropertyName("closedBy")]
        public EmployeeBasicInfo? ClosedBy { get; set; }

        [JsonPropertyName("reopenedBy")]
        public EmployeeBasicInfo? ReopenedBy { get; set; }

        [JsonPropertyName("reopenedOn")]
        public DateTime? ReopenedOn { get; set; }

        [JsonPropertyName("reopenUntil")]
        public DateTime? ReopenUntil { get; set; }

        [JsonPropertyName("closedOn")]
        public DateTime? ClosedOn { get; set; }

        [JsonPropertyName("closureReason")]
        public string? ClosureReason { get; set; }

        [JsonPropertyName("assignedTo")]
        public List<GoalAssignmentInfo>? AssignedTo { get; set; }
    }

    /// <summary>
    /// Goal assignment information
    /// </summary>
    public class GoalAssignmentInfo
    {
        [JsonPropertyName("assignmentId")]
        public int AssignmentId { get; set; }

        [JsonPropertyName("employeeId")]
        public int EmployeeId { get; set; }

        [JsonPropertyName("employeeName")]
        public string? EmployeeName { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }
    }

    /// <summary>
    /// Goals segregated by type (Team and Organization Level)
    /// </summary>
    public class SegregatedGoalsResponse
    {
        [JsonPropertyName("teamGoals")]
        public List<ProjectGoalResponse>? TeamGoals { get; set; }

        [JsonPropertyName("organizationLevelGoals")]
        public List<ProjectGoalResponse>? OrganizationLevelGoals { get; set; }

        [JsonPropertyName("totalTeamGoals")]
        public int TotalTeamGoals { get; set; }

        [JsonPropertyName("totalOrgLevelGoals")]
        public int TotalOrgLevelGoals { get; set; }
    }

    public class EmployeeBasicInfo
    {
        [JsonPropertyName("employeeMasterId")]
        public int EmployeeMasterId { get; set; }

        [JsonPropertyName("employeeId")]
        public int EmployeeId { get; set; }

        [JsonPropertyName("employeeCompanyId")]
        public string EmployeeCompanyId { get; set; }

        [JsonPropertyName("firstName")]
        public string FirstName { get; set; }

        [JsonPropertyName("lastName")]
        public string LastName { get; set; }

        [JsonPropertyName("email")]
        public string Email { get; set; }

        [JsonPropertyName("roleName")]
        public string RoleName { get; set; }

        [JsonPropertyName("departmentName")]
        public string DepartmentName { get; set; }
    }
}

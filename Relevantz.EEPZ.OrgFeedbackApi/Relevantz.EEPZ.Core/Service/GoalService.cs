using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Response.Employees;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Core.Service
{
    public class GoalService : IGoalService
    {
        private readonly IGoalRepository _goalRepository;
        private readonly ILogger<GoalService> _logger;

        public GoalService(IGoalRepository goalRepository, ILogger<GoalService> logger)
        {
            _goalRepository = goalRepository ?? throw new ArgumentNullException(nameof(goalRepository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<SegregatedGoalsResponseDto> GetAllGoalsAsync()
        {
            _logger.LogInformation("Retrieving all goals segregated by type");

            var allGoals = await _goalRepository.GetAllGoalsAsync();

            var teamGoals = allGoals
                .Where(g => g.Project != null)
                .Select(MapToProjectGoalResponse)
                .ToList();

            var orgLevelGoals = allGoals
                .Where(g => g.Project == null)
                .Select(MapToProjectGoalResponse)
                .ToList();

            return new SegregatedGoalsResponseDto
            {
                TeamGoals = teamGoals,
                OrganizationLevelGoals = orgLevelGoals,
                TotalTeamGoals = teamGoals.Count,
                TotalOrgLevelGoals = orgLevelGoals.Count
            };
        }

        public async Task<ProjectGoalResponseDto?> GetGoalByIdAsync(int goalId)
        {
            _logger.LogInformation("Retrieving goal with ID: {GoalId}", goalId);

            var goal = await _goalRepository.GetGoalByIdAsync(goalId);
            return goal == null ? null : MapToProjectGoalResponse(goal);
        }

        public async Task<List<ProjectGoalResponseDto>> GetTeamGoalsAsync()
        {
            _logger.LogInformation("Retrieving all team goals");

            var teamGoals = await _goalRepository.GetTeamGoalsAsync();
            return teamGoals.Select(MapToProjectGoalResponse).ToList();
        }

        public async Task<List<ProjectGoalResponseDto>> GetOrganizationLevelGoalsAsync()
        {
            _logger.LogInformation("Retrieving organization level goals");

            var orgGoals = await _goalRepository.GetOrganizationLevelGoalsAsync();
            return orgGoals.Select(MapToProjectGoalResponse).ToList();
        }

        public async Task<List<ProjectGoalResponseDto>> GetGoalsByProjectIdAsync(int projectId)
        {
            _logger.LogInformation("Retrieving goals for project ID: {ProjectId}", projectId);

            var projectGoals = await _goalRepository.GetGoalsByProjectIdAsync(projectId);
            return projectGoals.Select(MapToProjectGoalResponse).ToList();
        }

        private static ProjectGoalResponseDto MapToProjectGoalResponse(Goal goal)
        {
            return new ProjectGoalResponseDto
            {
                GoalId = goal.GoalId,
                GoalTitle = goal.GoalTitle,
                GoalDescription = goal.GoalDescription,
                ProjectId = goal.ProjectId,
                ProjectName = goal.Project?.ProjectName,
                CreatedBy = goal.CreatedByNavigation != null ? MapToEmployeeBasicInfo(goal.CreatedByNavigation) : null,
                ClosedOn = goal.ClosedOn,
                ClosureReason = goal.ClosureReason,
            };
        }

        private static EmployeeBasicInfoDto MapToEmployeeBasicInfo(Employeedetailsmaster employee)
        {
            return new EmployeeBasicInfoDto
            {
                EmployeeMasterId = employee.EmployeeMasterId,
                EmployeeId = employee.EmployeeId,
                EmployeeCompanyId = employee.Employee?.EmployeeCompanyId ?? string.Empty,
                FirstName = employee.Employee?.Userprofile?.FirstName ?? string.Empty,
                LastName = employee.Employee?.Userprofile?.LastName ?? string.Empty,
                Email = employee.Employee?.Userauthentication?.Email ?? string.Empty,
                RoleName = employee.Role?.RoleName ?? string.Empty,
                DepartmentName = employee.Department?.DepartmentName ?? string.Empty
            };
        }
    }
}

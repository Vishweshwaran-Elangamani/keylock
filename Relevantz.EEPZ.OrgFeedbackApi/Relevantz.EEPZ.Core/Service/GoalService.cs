using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Core.Service
{
    /// <summary>
    /// Service implementation for goal-related business operations
    /// </summary>
    public class GoalService : IGoalService
    {
        private readonly IGoalRepository _goalRepository;
        private readonly ILogger<GoalService> _logger;

        public GoalService(IGoalRepository goalRepository, ILogger<GoalService> logger)
        {
            _goalRepository = goalRepository;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves all goals segregated by type
        /// </summary>
        /// <returns>Segregated goals response containing team and organization level goals</returns>
        public async Task<SegregatedGoalsResponse> GetAllGoalsAsync()
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

            return new SegregatedGoalsResponse
            {
                TeamGoals = teamGoals,
                OrganizationLevelGoals = orgLevelGoals,
                TotalTeamGoals = teamGoals.Count,
                TotalOrgLevelGoals = orgLevelGoals.Count
            };
        }

        /// <summary>
        /// Retrieves a specific goal by its identifier
        /// </summary>
        /// <param name="goalId">The goal identifier</param>
        /// <returns>Project goal response if found, otherwise null</returns>
        public async Task<ProjectGoalResponse> GetGoalByIdAsync(int goalId)
        {
            _logger.LogInformation("Retrieving goal with ID: {GoalId}", goalId);

            var goal = await _goalRepository.GetGoalByIdAsync(goalId);

            return goal != null ? MapToProjectGoalResponse(goal) : null;
        }

        /// <summary>
        /// Retrieves all team goals
        /// </summary>
        /// <returns>List of team goal responses</returns>
        public async Task<List<ProjectGoalResponse>> GetTeamGoalsAsync()
        {
            _logger.LogInformation("Retrieving all team goals");

            var teamGoals = await _goalRepository.GetTeamGoalsAsync();

            return teamGoals.Select(MapToProjectGoalResponse).ToList();
        }

        /// <summary>
        /// Retrieves all organization level goals
        /// </summary>
        /// <returns>List of organization level goal responses</returns>
        public async Task<List<ProjectGoalResponse>> GetOrganizationLevelGoalsAsync()
        {
            _logger.LogInformation("Retrieving organization level goals");

            var orgGoals = await _goalRepository.GetOrganizationLevelGoalsAsync();

            return orgGoals.Select(MapToProjectGoalResponse).ToList();
        }

        /// <summary>
        /// Retrieves goals for a specific project
        /// </summary>
        /// <param name="projectId">The project identifier</param>
        /// <returns>List of project goal responses</returns>
        public async Task<List<ProjectGoalResponse>> GetGoalsByProjectIdAsync(int projectId)
        {
            _logger.LogInformation("Retrieving goals for project ID: {ProjectId}", projectId);

            var projectGoals = await _goalRepository.GetGoalsByProjectIdAsync(projectId);

            return projectGoals.Select(MapToProjectGoalResponse).ToList();
        }

        private ProjectGoalResponse MapToProjectGoalResponse(Goal goal)
        {
            return new ProjectGoalResponse
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

        private EmployeeBasicInfo MapToEmployeeBasicInfo(Employeedetailsmaster employee)
        {
            return new EmployeeBasicInfo
            {
                EmployeeMasterId = employee.EmployeeMasterId,
                EmployeeId = employee.EmployeeId,
                EmployeeCompanyId = employee.Employee?.EmployeeCompanyId ?? string.Empty,
                FirstName = employee.Employee?.Userprofile?.FirstName,
                LastName = employee.Employee?.Userprofile?.LastName,
                Email = employee.Employee?.Userauthentication?.Email,
                RoleName = employee.Role?.RoleName,
                DepartmentName = employee.Department?.DepartmentName
            };
        }
    }
}

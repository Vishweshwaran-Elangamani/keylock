using Mapster;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
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
                .Adapt<List<ProjectGoalResponseDto>>();

            var orgLevelGoals = allGoals
                .Where(g => g.Project == null)
                .Adapt<List<ProjectGoalResponseDto>>();

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
            return goal?.Adapt<ProjectGoalResponseDto>();
        }

        public async Task<List<ProjectGoalResponseDto>> GetTeamGoalsAsync(int pageNumber = 1, int pageSize = 20)
        {
            _logger.LogInformation("Retrieving team goals - Page: {PageNumber}, Size: {PageSize}", pageNumber, pageSize);

            var teamGoals = await _goalRepository.GetTeamGoalsAsync(pageNumber, pageSize);
            return teamGoals.Adapt<List<ProjectGoalResponseDto>>();
        }

        public async Task<List<ProjectGoalResponseDto>> GetOrganizationLevelGoalsAsync()
        {
            _logger.LogInformation("Retrieving organization level goals");

            var orgGoals = await _goalRepository.GetOrganizationLevelGoalsAsync();
            return orgGoals.Adapt<List<ProjectGoalResponseDto>>();
        }

        public async Task<List<ProjectGoalResponseDto>> GetGoalsByProjectIdAsync(int projectId)
        {
            _logger.LogInformation("Retrieving goals for project ID: {ProjectId}", projectId);

            var projectGoals = await _goalRepository.GetGoalsByProjectIdAsync(projectId);
            return projectGoals.Adapt<List<ProjectGoalResponseDto>>();
        }
    }
}

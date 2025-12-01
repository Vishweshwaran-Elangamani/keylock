using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Response;
using System.Text.Json.Serialization;
using Relevantz.EEPZ.Data.DBContexts;


namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GoalsController : ControllerBase
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<GoalsController> _logger;

        public GoalsController(EEPZDbContext context, ILogger<GoalsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all goals segregated by type (Team Goals and Organization Level Goals)
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<SegregatedGoalsResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllGoals()
        {
            try
            {
                _logger.LogInformation("Retrieving all goals segregated by type");

                var allGoals = await _context.Goals
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Employee)
                            .ThenInclude(e => e.Userauthentication)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Role)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Department)
                    .Include(g => g.Project)
                    .ToListAsync();

                var teamGoals = allGoals
                    .Where(g => g.Project != null)
                    .Select(MapToProjectGoalResponse)
                    .ToList();

                var orgLevelGoals = allGoals
                    .Where(g => g.Project == null) 
                    .Select(MapToProjectGoalResponse)
                    .ToList();

                var response = new SegregatedGoalsResponse
                {
                    TeamGoals = teamGoals,
                    OrganizationLevelGoals = orgLevelGoals,
                    TotalTeamGoals = teamGoals.Count,
                    TotalOrgLevelGoals = orgLevelGoals.Count
                };

                return Ok(ApiResponse<SegregatedGoalsResponse>.SuccessResponse(
                    response, 
                    "Goals retrieved successfully."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all goals");
                return StatusCode(500, ApiResponse<SegregatedGoalsResponse>.ErrorResponse(
                    $"An error occurred while retrieving goals: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get specific goal by ID
        /// </summary>
        [HttpGet("{goalId}")]
        [ProducesResponseType(typeof(ApiResponse<ProjectGoalResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ProjectGoalResponse>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetGoalById(int goalId)
        {
            try
            {
                _logger.LogInformation("Retrieving goal with ID: {GoalId}", goalId);

                var goal = await _context.Goals
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Employee)
                            .ThenInclude(e => e.Userauthentication)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Role)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Department)
                    .Include(g => g.Project)
                    .FirstOrDefaultAsync(g => g.GoalId == goalId);

                if (goal == null)
                {
                    _logger.LogWarning("Goal with ID {GoalId} not found", goalId);
                    return NotFound(ApiResponse<ProjectGoalResponse>.ErrorResponse("Goal not found."));
                }

                var response = MapToProjectGoalResponse(goal);

                return Ok(ApiResponse<ProjectGoalResponse>.SuccessResponse(
                    response, 
                    "Goal retrieved successfully."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving goal with ID {GoalId}", goalId);
                return StatusCode(500, ApiResponse<ProjectGoalResponse>.ErrorResponse(
                    $"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get all team goals (goals linked to projects)
        /// </summary>
        [HttpGet("team/all")]
        [ProducesResponseType(typeof(ApiResponse<List<ProjectGoalResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetTeamGoals()
        {
            try
            {
                _logger.LogInformation("Retrieving all team goals");

                var teamGoals = await _context.Goals
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Employee)
                            .ThenInclude(e => e.Userauthentication)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Role)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Department)
                    .Include(g => g.Project)
                    .Where(g => g.Project != null)
                    .ToListAsync();

                var responses = teamGoals.Select(MapToProjectGoalResponse).ToList();

                return Ok(ApiResponse<List<ProjectGoalResponse>>.SuccessResponse(
                    responses, 
                    "Team goals retrieved successfully."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving team goals");
                return StatusCode(500, ApiResponse<List<ProjectGoalResponse>>.ErrorResponse(
                    $"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get all organization level goals (goals not linked to projects)
        /// </summary>
        [HttpGet("organization-level")]
        [ProducesResponseType(typeof(ApiResponse<List<ProjectGoalResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOrganizationLevelGoals()
        {
            try
            {
                _logger.LogInformation("Retrieving organization level goals");

                var orgGoals = await _context.Goals
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Employee)
                            .ThenInclude(e => e.Userauthentication)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Role)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Department)
                    .Include(g => g.Project)
                    .Where(g => g.Project == null) 
                    .ToListAsync();

                var responses = orgGoals.Select(MapToProjectGoalResponse).ToList();

                return Ok(ApiResponse<List<ProjectGoalResponse>>.SuccessResponse(
                    responses, 
                    "Organization level goals retrieved successfully."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving organization level goals");
                return StatusCode(500, ApiResponse<List<ProjectGoalResponse>>.ErrorResponse(
                    $"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get goals for a specific project
        /// </summary>
        [HttpGet("project/{projectId}")]
        [ProducesResponseType(typeof(ApiResponse<List<ProjectGoalResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetGoalsByProject(int projectId)
        {
            try
            {
                _logger.LogInformation("Retrieving goals for project ID: {ProjectId}", projectId);

                var projectGoals = await _context.Goals
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Employee)
                            .ThenInclude(e => e.Userauthentication)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Role)
                    .Include(g => g.CreatedByNavigation)
                        .ThenInclude(e => e.Department)
                    .Include(g => g.Project)
                    .Where(g => g.ProjectId == projectId)
                    .ToListAsync();

                var responses = projectGoals.Select(MapToProjectGoalResponse).ToList();

                return Ok(ApiResponse<List<ProjectGoalResponse>>.SuccessResponse(
                    responses, 
                    "Project goals retrieved successfully."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving project goals");
                return StatusCode(500, ApiResponse<List<ProjectGoalResponse>>.ErrorResponse(
                    $"An error occurred: {ex.Message}"));
            }
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

        /// <summary>
        /// Generic API Response wrapper for all endpoints
        /// </summary>
        public class ApiResponse<T>
        {
            [JsonPropertyName("isSuccess")]
            public bool IsSuccess { get; set; }

            [JsonPropertyName("message")]
            public string Message { get; set; }

            [JsonPropertyName("data")]
            public T Data { get; set; }

            [JsonPropertyName("errors")]
            public List<string> Errors { get; set; }

            public static ApiResponse<T> SuccessResponse(T data, string message = "Operation successful")
            {
                return new ApiResponse<T>
                {
                    IsSuccess = true,
                    Message = message,
                    Data = data,
                    Errors = null
                };
            }

            public static ApiResponse<T> ErrorResponse(string message, List<string> errors = null)
            {
                return new ApiResponse<T>
                {
                    IsSuccess = false,
                    Message = message,
                    Data = default,
                    Errors = errors ?? new List<string>()
                };
            }


        }

    }
}

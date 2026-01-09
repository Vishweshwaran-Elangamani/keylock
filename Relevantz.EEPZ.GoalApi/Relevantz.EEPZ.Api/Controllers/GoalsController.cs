using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
    public class GoalsController : BaseGoalController
    {
        protected new readonly IGoalService _service;
        protected readonly IBaseGoalService _baseService;

        public GoalsController(
            IGoalService service,
            IBaseGoalService baseService,
            ILogger<GoalsController> logger
        )
            : base(baseService, logger)
        {
            _service = service;
            _baseService = baseService;
        }

        /// <summary>
        /// Create a new goal (self, team, or org based on role)
        /// </summary>
        [HttpPost("/api/goals/create")]
        [Authorize(
            Roles = $"{USER_ROLE.EMPLOYEE},{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> Create([FromBody] CreateGoalModel dto)
        {
            var userId = 0;
            try
            {
                userId = GetEmpMasterId();
                var role = GetUserRole();

                var result = await _service.CreateGoalAsync(dto, userId, role);

                _logger.LogInformation(
                    "User {UserId} ({Role}) creating goal: {GoalTitle}",
                    userId,
                    role,
                    dto.Title
                );

                if (result.Success)
                {
                    _logger.LogInformation(
                        "Goal created successfully. GoalId: {GoalId}, CreatedBy: {UserId}",
                        result.Data,
                        userId
                    );
                    return CreatedAtAction(
                        nameof(GetGoalDetailsById),
                        new { id = result.Data },
                        result
                    );
                }

                _logger.LogWarning(
                    "Goal creation failed for User {UserId}. Reason: {Message}",
                    userId,
                    result.Message
                );

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating goal for User {UserId}", userId);
                var response = ApiResponseModel<int>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get goal details by ID
        /// </summary>
        [HttpGet("/api/goals/{id:int}")]
        public async Task<IActionResult> GetGoalDetailsById(int id)
        {
            var userId = 0;
            try
            {
                userId = GetEmpMasterId();
                var role = GetUserRole();

                _logger.LogInformation("User {UserId} requesting goal {GoalId}", userId, id);

                var goal = await _baseService.GetGoalAsync(id, userId, role);

                var response = ApiResponseModel<GoalDetailModel>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                    goal,
                    new { GoalId = id, RequestedBy = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning(
                    "Goal {GoalId} not found (requested by User {UserId})",
                    id,
                    userId
                );
                var response = ApiResponseModel<GoalDetailModel>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (UnauthorizedAccessException)
            {
                _logger.LogWarning("User {UserId} denied access to Goal {GoalId}", userId, id);
                var response = ApiResponseModel<GoalDetailModel>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_ACCESS_DENIED
                );
                return Forbid(response.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error retrieving goal {GoalId} for User {UserId}",
                    id,
                    userId
                );
                var response = ApiResponseModel<GoalDetailModel>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Query goals based on filters
        /// </summary>
        [HttpGet("/api/goals/query")]
        public async Task<IActionResult> QueryGoals([FromQuery] GoalQueryModel query)
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                _logger.LogInformation(
                    "[GoalsController.Query] Querying - Type: {Type}, Role: {Role}, UserID: {ID}",
                    query.Type,
                    role ?? "NULL",
                    userId
                );

                var goals = await _service.QueryGoalsAsync(query, userId, role);

                var response = ApiResponseModel<List<GoalSummaryModel>>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                    goals,
                    new
                    {
                        Page = query.Page,
                        PageSize = query.PageSize,
                        ResultCount = goals.Count,
                        UserRole = role,
                    }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GoalsController.Query] Error");
                return StatusCode(
                    500,
                    ApiResponseModel<List<GoalSummaryModel>>.ErrorResponse(
                        ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                    )
                );
            }
        }

        /// <summary>
        /// Update goal (title, description, deadline)
        /// </summary>
        [HttpPut("/api/goals/{id:int}")]
        public async Task<IActionResult> UpdateGoal(int id, [FromBody] UpdateGoalModel dto)
        {
            var userId = 0;
            try
            {
                userId = GetEmpMasterId();
                var role = GetUserRole();

                _logger.LogInformation("User {UserId} updating goal {GoalId}", userId, id);

                var result = await _service.UpdateGoalAsync(id, dto, userId, role);

                if (result.Success)
                {
                    _logger.LogInformation(
                        "Goal {GoalId} updated successfully by User {UserId}",
                        id,
                        userId
                    );
                    return Ok(result);
                }

                _logger.LogWarning("Goal {GoalId} update failed. Code: {Code}", id, result.Code);

                return result.Code switch
                {
                    ResponseMessages.Codes.GOAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.GOAL_ACCESS_DENIED => Forbid(result.Message),
                    _ => BadRequest(result),
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating goal {GoalId} by User {UserId}", id, userId);
                var response = ApiResponseModel.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get list of assignees for a goal
        /// </summary>
        [HttpGet("/api/goals/{id:int}/assignees")]
        public async Task<IActionResult> GetAssignees(int id)
        {
            try
            {
                var assignees = await _service.GetAssigneesAsync(id);

                var response = ApiResponseModel<List<AssigneeModel>>.SuccessResponse(
                    ResponseMessages.Codes.ASSIGNMENT_RETRIEVED_SUCCESS,
                    assignees,
                    new { GoalId = id, AssigneeCount = assignees.Count }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseModel<List<AssigneeModel>>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseModel<List<AssigneeModel>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Assign a team goal to subordinates (managers/Department Heads only)
        /// </summary>
        [HttpPost("/api/goals/{id:int}/assign")]
        [Authorize(Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD}")]
        public async Task<IActionResult> Assign(int id, [FromBody] AssignGoalModel dto)
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var result = await _service.AssignAsync(id, dto, userId, role);

                if (result.Success)
                {
                    return Ok(result);
                }

                return result.Code switch
                {
                    ResponseMessages.Codes.GOAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED => Forbid(result.Message),
                    ResponseMessages.Codes.ASSIGNMENT_INVALID_SUBORDINATE => BadRequest(result),
                    ResponseMessages.Codes.ASSIGNMENT_DUPLICATE => Conflict(result),
                    _ => BadRequest(result),
                };
            }
            catch (Exception ex)
            {
                var response = ApiResponseModel.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get projects for the current authenticated user
        /// </summary>
        [HttpGet("/api/goals/projects/user")]
        public async Task<IActionResult> GetUserProjects()
        {
            try
            {
                var userId = GetEmpMasterId();

                var userProjects = await _service.GetUserProjectsAsync(userId);

                var response = ApiResponseModel<List<ProjectModel>>.SuccessResponse(
                    ResponseMessages.Codes.PROJECTS_RETRIEVED_SUCCESS,
                    userProjects,
                    new { UserId = userId, ProjectCount = userProjects.Count }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseModel<List<ProjectModel>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get all projects (for reference)
        /// </summary>
        [HttpGet("/api/goals/projects")]
        [Authorize(
            Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> GetAllProjects()
        {
            try
            {
                var allProjects = await _service.GetAllProjectsAsync();

                var response = ApiResponseModel<List<ProjectModel>>.SuccessResponse(
                    ResponseMessages.Codes.PROJECTS_RETRIEVED_SUCCESS,
                    allProjects,
                    new { ProjectCount = allProjects.Count }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseModel<List<ProjectModel>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get project by ID
        /// </summary>
        [HttpGet("/api/goals/projects/{projectId:int}")]
        public async Task<IActionResult> GetProject(int projectId)
        {
            try
            {
                var project = await _service.GetProjectAsync(projectId);

                var response = ApiResponseModel<ProjectModel>.SuccessResponse(
                    ResponseMessages.Codes.PROJECT_RETRIEVED_SUCCESS,
                    project,
                    new { ProjectId = projectId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseModel<ProjectModel>.ErrorResponse(
                    ResponseMessages.Codes.PROJECT_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseModel<ProjectModel>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }
    }
}

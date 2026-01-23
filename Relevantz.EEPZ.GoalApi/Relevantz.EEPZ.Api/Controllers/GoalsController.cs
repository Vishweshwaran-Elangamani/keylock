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

        [HttpPost("/api/goals/create")]
        [Authorize(
            Roles = $"{USER_ROLE.EMPLOYEE},{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> Create([FromBody] CreateGoalModel dto)
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            var result = await _service.CreateGoalAsync(dto, userId, role);

            return CreatedAtAction(nameof(GetGoalDetailsById), new { id = result.Data }, result);
        }

        [HttpGet("/api/goals/{id:int}")]
        public async Task<IActionResult> GetGoalDetailsById(int id)
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            var goal = await _baseService.GetGoalAsync(id, userId, role);

            var response = ApiResponseModel<GoalDetailModel>.SuccessResponse(
                ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                goal,
                new { GoalId = id, RequestedBy = userId }
            );

            return Ok(response);
        }

        [HttpGet("/api/goals/query")]
        public async Task<IActionResult> QueryGoals([FromQuery] GoalQueryModel query)
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

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

        [HttpPut("/api/goals/{id:int}")]
        public async Task<IActionResult> UpdateGoal(int id, [FromBody] UpdateGoalModel dto)
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            var result = await _service.UpdateGoalAsync(id, dto, userId, role);

            return Ok(result);
        }

        [HttpGet("/api/goals/{id:int}/assignees")]
        public async Task<IActionResult> GetAssignees(int id)
        {
            var assignees = await _service.GetAssigneesAsync(id);

            var response = ApiResponseModel<List<AssigneeModel>>.SuccessResponse(
                ResponseMessages.Codes.ASSIGNMENT_RETRIEVED_SUCCESS,
                assignees,
                new { GoalId = id, AssigneeCount = assignees.Count }
            );

            return Ok(response);
        }

        [HttpPost("/api/goals/{id:int}/assign")]
        [Authorize(Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD}")]
        public async Task<IActionResult> Assign(int id, [FromBody] AssignGoalModel dto)
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            var result = await _service.AssignAsync(id, dto, userId, role);

            return Ok(result);
        }

        [HttpGet("/api/goals/projects/user")]
        public async Task<IActionResult> GetUserProjects()
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

        [HttpGet("/api/goals/projects")]
        [Authorize(
            Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> GetAllProjects()
        {
            var allProjects = await _service.GetAllProjectsAsync();

            var response = ApiResponseModel<List<ProjectModel>>.SuccessResponse(
                ResponseMessages.Codes.PROJECTS_RETRIEVED_SUCCESS,
                allProjects,
                new { ProjectCount = allProjects.Count }
            );

            return Ok(response);
        }

        [HttpGet("/api/goals/projects/{projectId:int}")]
        public async Task<IActionResult> GetProject(int projectId)
        {
            var project = await _service.GetProjectAsync(projectId);

            var response = ApiResponseModel<ProjectModel>.SuccessResponse(
                ResponseMessages.Codes.PROJECT_RETRIEVED_SUCCESS,
                project,
                new { ProjectId = projectId }
            );

            return Ok(response);
        }
    }
}

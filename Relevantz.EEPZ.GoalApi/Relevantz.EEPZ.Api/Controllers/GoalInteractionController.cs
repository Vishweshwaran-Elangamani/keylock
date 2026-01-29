using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
    /// <summary>
    /// Controller for managing goal interactions such as comments, timelines, dashboard summaries, completion checks, and project subordinates.
    /// </summary>
    public class GoalInteractionsController : BaseGoalController
    {
        protected new readonly IGoalInteractionService _service;
        protected readonly IBaseGoalService _baseService;

        public GoalInteractionsController(
            IGoalInteractionService service,
            IBaseGoalService baseService,
            ILogger<GoalInteractionsController> logger
        )
            : base(baseService, logger)
        {
            _service = service;
            _baseService = baseService;
        }

        /// <summary>
        /// Adds a comment to a specific goal.
        /// </summary>
        [HttpPost("api/goals/{id}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentModel dto)
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            var result = await _service.AddCommentAsync(id, dto, userId, role);

            return Ok(result);
        }

        /// <summary>
        /// Retrieves all comments for a specific goal.
        /// </summary>
        [HttpGet("api/goals/{id}/comments")]
        public async Task<IActionResult> GetAllComments(int id)
        {
            var items = await _service.GetAllCommentsAsync(id);

            var response = ApiResponseModel<List<GoalCommentModel>>.SuccessResponse(
                ResponseMessages.Codes.COMMENTS_RETRIEVED_SUCCESS,
                items,
                new { GoalId = id, CommentCount = items.Count }
            );

            return Ok(response);
        }

        /// <summary>
        /// Retrieves the timeline of events for a specific goal.
        /// </summary>
        [HttpGet("api/goals/{id}/timeline")]
        public async Task<IActionResult> GetTimeline(int id)
        {
            var userId = GetEmpMasterId();

            var timeline = await _service.GetGoalTimelineAsync(id, userId);

            var response = ApiResponseModel<List<TimelineEventModel>>.SuccessResponse(
                ResponseMessages.Codes.TIMELINE_RETRIEVED_SUCCESS,
                timeline,
                new { GoalId = id, EventCount = timeline.Count }
            );

            return Ok(response);
        }

        /// <summary>
        /// Retrieves a dashboard summary for the current user.
        /// </summary>
        [HttpGet("api/goals/dashboard/summary")]
        public async Task<IActionResult> GetDashboardStatistics()
        {
            var userId = GetEmpMasterId();

            var summary = await _service.GetDashboardDetailsAsync(userId);

            var response = ApiResponseModel<GoalDashboardSummaryModel>.SuccessResponse(
                ResponseMessages.Codes.DASHBOARD_RETRIEVED_SUCCESS,
                summary,
                new { UserId = userId }
            );

            return Ok(response);
        }

        /// <summary>
        /// Checks whether a specific goal can be marked as complete by the current user.
        /// </summary>
        [HttpGet("api/goals/{id}/complete-eligibility")]
        public async Task<IActionResult> GetMarkCompleteEligibility(int id)
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            var result = await _baseService.GetMarkCompleteEligibilityAsync(id, userId, role);

            var response = ApiResponseModel<CanMarkCompleteModel>.SuccessResponse(
                ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                result,
                new { GoalId = id, UserId = userId }
            );

            return Ok(response);
        }

        /// <summary>
        /// Retrieves the list of subordinates for a specific project.
        /// </summary>
        [HttpGet("api/goals/projects/{projectId}/subordinates")]
        public async Task<IActionResult> FetchProjectTeam(int projectId)
        {
            var currentUserId = GetEmpMasterId();

            var subordinates = await _service.FetchProjectTeamAsync(projectId, currentUserId);

            var response = ApiResponseModel<List<ProjectEmployeeModel>>.SuccessResponse(
                ResponseMessages.Codes.SUBORDINATES_RETRIEVED_SUCCESS,
                subordinates,
                new
                {
                    ProjectId = projectId,
                    UserId = currentUserId,
                    Count = subordinates.Count,
                }
            );

            return Ok(response);
        }
    }
}

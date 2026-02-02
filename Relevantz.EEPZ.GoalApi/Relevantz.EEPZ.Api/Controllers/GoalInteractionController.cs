using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;
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

            Log.Debug("GoalInteractionsController initialized.");
        }

        /// <summary>
        /// Adds a comment to a specific goal.
        /// </summary>
        [HttpPost("api/goals/{id}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentModel dto)
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            Log.Information(
                "AddComment START | GoalId={GoalId} | UserId={UserId} | Role={Role} | CommentText={Comment}",
                id,
                userId,
                role,
                dto?.Comment
            );

            var result = await _service.AddComment(id, dto, userId, role);

            Log.Information(
                "AddComment END | GoalId={GoalId} | UserId={UserId} | Success={Success}",
                id,
                userId,
                result.Success
            );

            return Ok(result);
        }

        /// <summary>
        /// Retrieves all comments for a specific goal.
        /// </summary>
        [HttpGet("api/goals/{id}/comments")]
        public async Task<IActionResult> GetAllComments(int id)
        {
            Log.Information("GetAllComments START | GoalId={GoalId}", id);

            var items = await _service.GetAllComments(id);

            Log.Information(
                "GetAllComments END | GoalId={GoalId} | Count={Count}",
                id,
                items.Count
            );

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

            Log.Information(
                "GetTimeline START | GoalId={GoalId} | UserId={UserId}",
                id,
                userId
            );

            var timeline = await _service.GetGoalTimeline(id, userId);

            Log.Information(
                "GetTimeline END | GoalId={GoalId} | UserId={UserId} | Events={Count}",
                id,
                userId,
                timeline.Count
            );

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

            Log.Information(
                "GetDashboardStatistics START | UserId={UserId}",
                userId
            );

            var summary = await _service.GetDashboardDetails(userId);

            Log.Information(
                "GetDashboardStatistics END | UserId={UserId}",
                userId
            );

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

            Log.Information(
                "GetMarkCompleteEligibility START | GoalId={GoalId} | UserId={UserId} | Role={Role}",
                id,
                userId,
                role
            );

            var result = await _baseService.GetMarkCompleteEligibility(id, userId, role);

            Log.Information(
                "GetMarkCompleteEligibility END | GoalId={GoalId} | UserId={UserId} | Success={Success}",
                id,
                userId,
                result != null
            );

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

            Log.Information(
                "FetchProjectTeam START | ProjectId={ProjectId} | UserId={UserId}",
                projectId,
                currentUserId
            );

            var subordinates = await _service.FetchProjectTeam(projectId, currentUserId);

            Log.Information(
                "FetchProjectTeam END | ProjectId={ProjectId} | UserId={UserId} | Count={Count}",
                projectId,
                currentUserId,
                subordinates.Count
            );

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
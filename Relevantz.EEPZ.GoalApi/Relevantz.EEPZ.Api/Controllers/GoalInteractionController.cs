using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
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

        [HttpPost("api/goal-interaction/{id:int}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentModel dto)
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            var result = await _service.AddCommentAsync(id, dto, userId, role);

            return Ok(result);
        }

        [HttpGet("api/goal-interaction/{id:int}/comments")]
        public async Task<IActionResult> ListComments(int id)
        {
            var items = await _service.ListCommentsAsync(id);

            var response = ApiResponseModel<List<GoalCommentModel>>.SuccessResponse(
                ResponseMessages.Codes.COMMENTS_RETRIEVED_SUCCESS,
                items,
                new { GoalId = id, CommentCount = items.Count }
            );

            return Ok(response);
        }

        [HttpGet("api/goal-interaction/{id:int}/timeline")]
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

        [HttpGet("api/goal-interaction/dashboard/summary")]
        public async Task<IActionResult> DashboardSummary()
        {
            var userId = GetEmpMasterId();

            var summary = await _service.GetDashboardSummaryAsync(userId);

            var response = ApiResponseModel<GoalDashboardSummaryModel>.SuccessResponse(
                ResponseMessages.Codes.DASHBOARD_RETRIEVED_SUCCESS,
                summary,
                new { UserId = userId }
            );

            return Ok(response);
        }

        [HttpGet("api/goal-interaction/{id:int}/can-complete")]
        public async Task<IActionResult> CanMarkComplete(int id)
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            var canComplete = await _baseService.CanMarkCompleteAsync(id, userId);
            var goal = await _baseService.GetGoalAsync(id, userId, role);

            var isOverdue = goal.IsOverdue;
            var hasRequiredProgress = goal.ProgressPercent >= 100;
            var hasValidStatus =
                goal.Status == GOAL_STATUS.OPEN
                || goal.Status == GOAL_STATUS.IN_PROGRESS
                || goal.Status == GOAL_STATUS.REOPENED;
            var isNotOverdue = !isOverdue || goal.Status == GOAL_STATUS.REOPENED;

            bool isCreator = goal.CreatedByEmployeeMasterId == userId;
            bool isAssignee = goal.Assignees?.Any(a => a.EmployeeMasterId == userId) ?? false;
            var isParticipant = isCreator || isAssignee;

            List<string> reasons = new List<string>();
            if (!hasRequiredProgress)
                reasons.Add($"Progress must be 100% (current: {goal.ProgressPercent}%)");
            if (isOverdue && goal.Status != GOAL_STATUS.REOPENED)
                reasons.Add("Goal is overdue");
            if (!hasValidStatus)
                reasons.Add($"Invalid status: {goal.Status}");
            if (!isParticipant)
                reasons.Add("Not a participant");

            var shouldRequestReopen = isOverdue && goal.Status != GOAL_STATUS.REOPENED;

            var result = new CanMarkCompleteModel
            {
                CanComplete = canComplete,
                Reason = reasons.Any() ? string.Join(", ", reasons) : null,
                Reasons = reasons.Any() ? reasons : null,
                IsOverdue = isOverdue,
                ShouldRequestReopen = shouldRequestReopen,
                Details = new CanMarkCompleteDetailsModel
                {
                    HasRequiredProgress = hasRequiredProgress,
                    CurrentProgress = goal.ProgressPercent,
                    IsNotOverdue = isNotOverdue,
                    HasValidStatus = hasValidStatus,
                    CurrentStatus = goal.Status,
                    IsParticipant = isParticipant,
                },
            };

            var response = ApiResponseModel<CanMarkCompleteModel>.SuccessResponse(
                ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                result,
                new { GoalId = id, UserId = userId }
            );

            return Ok(response);
        }

        [HttpGet("api/goal-interaction/projects/{projectId:int}/subordinates")]
        public async Task<IActionResult> GetProjectSubordinates(int projectId)
        {
            var currentUserId = GetEmpMasterId();

            var subordinates = await _service.GetProjectSubordinatesAsync(projectId, currentUserId);

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

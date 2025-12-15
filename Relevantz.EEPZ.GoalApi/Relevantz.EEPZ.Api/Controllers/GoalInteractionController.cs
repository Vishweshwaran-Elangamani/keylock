using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
    [Route("api/goals")]
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

        // ==================== COMMENTS ====================

        /// <summary>
        /// Add a comment to a goal
        /// </summary>
        [HttpPost("{id:int}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentDto dto)
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var result = await _service.AddCommentAsync(id, dto, userId, role);

                if (result.Success)
                {
                    return Ok(result);
                }

                return result.Code switch
                {
                    ResponseMessages.Codes.GOAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.COMMENT_ACCESS_DENIED => Forbid(result.Message),
                    _ => BadRequest(result),
                };
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// List all comments for a goal
        /// </summary>
        [HttpGet("{id:int}/comments")]
        public async Task<IActionResult> ListComments(int id)
        {
            try
            {
                var items = await _service.ListCommentsAsync(id);

                var response = ApiResponseDto<List<GoalCommentDto>>.SuccessResponse(
                    ResponseMessages.Codes.COMMENTS_RETRIEVED_SUCCESS,
                    items,
                    new { GoalId = id, CommentCount = items.Count }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<List<GoalCommentDto>>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<GoalCommentDto>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        // ==================== TIMELINE ====================

        /// <summary>
        /// Get timeline of all events for a goal (progress, approvals, comments, etc.)
        /// </summary>
        [HttpGet("{id:int}/timeline")]
        public async Task<IActionResult> GetTimeline(int id)
        {
            try
            {
                var userId = GetEmpMasterId();

                var timeline = await _service.GetGoalTimelineAsync(id, userId);

                var response = ApiResponseDto<List<TimelineEventDto>>.SuccessResponse(
                    ResponseMessages.Codes.TIMELINE_RETRIEVED_SUCCESS,
                    timeline,
                    new { GoalId = id, EventCount = timeline.Count }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<List<TimelineEventDto>>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (UnauthorizedAccessException)
            {
                var response = ApiResponseDto<List<TimelineEventDto>>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_ACCESS_DENIED
                );
                return Forbid(response.Message);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<TimelineEventDto>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        // ==================== DASHBOARD ====================

        /// <summary>
        /// Get dashboard summary (completed, ongoing, pending counts)
        /// </summary>
        [HttpGet("dashboard/summary")]
        public async Task<IActionResult> DashboardSummary()
        {
            try
            {
                var userId = GetEmpMasterId();

                var summary = await _service.GetDashboardSummaryAsync(userId);

                var response = ApiResponseDto<GoalDashboardSummaryDto>.SuccessResponse(
                    ResponseMessages.Codes.DASHBOARD_RETRIEVED_SUCCESS,
                    summary,
                    new { UserId = userId }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<GoalDashboardSummaryDto>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get ongoing goals filtered by type (self, team, org)
        /// </summary>
        [HttpGet("dashboard/ongoing")]
        public async Task<IActionResult> DashboardOngoing([FromQuery] string type)
        {
            try
            {
                var userId = GetEmpMasterId();

                var list = await _service.GetOngoingAsync(type, userId);

                var response = ApiResponseDto<List<GoalSummaryDto>>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                    list,
                    new
                    {
                        UserId = userId,
                        Type = type,
                        GoalCount = list.Count,
                    }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<GoalSummaryDto>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        // ==================== PERMISSIONS VALIDATION ====================

        /// <summary>
        /// Check if user can mark goal as complete
        /// </summary>
        [HttpGet("{id:int}/can-complete")]
        public async Task<IActionResult> CanMarkComplete(int id)
        {
            try
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

                var result = new CanMarkCompleteDto
                {
                    CanComplete = canComplete,
                    Reason = reasons.Any() ? string.Join(", ", reasons) : null,
                    Reasons = reasons.Any() ? reasons : null,
                    IsOverdue = isOverdue,
                    ShouldRequestReopen = shouldRequestReopen,
                    Details = new CanMarkCompleteDetailsDto
                    {
                        HasRequiredProgress = hasRequiredProgress,
                        CurrentProgress = goal.ProgressPercent,
                        IsNotOverdue = isNotOverdue,
                        HasValidStatus = hasValidStatus,
                        CurrentStatus = goal.Status,
                        IsParticipant = isParticipant,
                    },
                };

                var response = ApiResponseDto<CanMarkCompleteDto>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                    result,
                    new { GoalId = id, UserId = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<CanMarkCompleteDto>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<CanMarkCompleteDto>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Check if user can view a goal
        /// </summary>
        [HttpGet("{id:int}/can-view")]
        public async Task<IActionResult> CanViewGoal(int id)
        {
            try
            {
                var userId = GetEmpMasterId();

                var canView = await _baseService.CanViewGoalAsync(id, userId);

                var response = ApiResponseDto<object>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                    new { canView },
                    new { GoalId = id, UserId = userId }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Check if user can comment on a goal
        /// </summary>
        [HttpGet("{id:int}/can-comment")]
        public async Task<IActionResult> CanComment(int id)
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var canComment = await _baseService.CanCommentOnGoalAsync(id, userId, role);

                var response = ApiResponseDto<object>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                    new { canComment },
                    new { GoalId = id, UserId = userId }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        // ==================== PROJECTS ====================

        /// <summary>
        /// Get project subordinates for assignment
        /// </summary>
        [HttpGet("projects/{projectId:int}/subordinates")]
        public async Task<IActionResult> GetProjectSubordinates(int projectId)
        {
            try
            {
                var currentUserId = GetEmpMasterId();
                var subordinates = await _service.GetProjectSubordinatesAsync(
                    projectId,
                    currentUserId
                );

                return Ok(
                    new ApiResponseDto<List<ProjectEmployeeDto>>
                    {
                        Success = true,
                        Data = subordinates,
                        Message = "Project subordinates retrieved successfully",
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving project subordinates");
                return StatusCode(
                    500,
                    new ApiResponseDto<object>
                    {
                        Success = false,
                        Message = "Failed to retrieve project subordinates",
                        DetailedMessage = ex.Message,
                    }
                );
            }
        }
    }
}

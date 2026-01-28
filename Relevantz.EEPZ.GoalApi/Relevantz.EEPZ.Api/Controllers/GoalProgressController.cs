using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
    /// <summary>
    /// Controller for managing goal progress operations such as checklist toggling, manual updates,
    /// retrieving progress, team progress, cascading progress, and hierarchy.
    /// </summary>
    public class GoalProgressController : BaseGoalController
    {
        protected new readonly IGoalProgressService _service;
        protected readonly IBaseGoalService _baseService;

        public GoalProgressController(
            IGoalProgressService service,
            IBaseGoalService baseService,
            ILogger<GoalProgressController> logger
        )
            : base(baseService, logger)
        {
            _service = service;
            _baseService = baseService;
        }

        /// <summary>
        /// Toggles the completion state of a checklist item for a specific goal.
        /// </summary>
        [HttpPut("api/goal-progress/{goalId}/checklist/toggle")]
        public async Task<IActionResult> ToggleChecklist(
            int goalId,
            [FromBody] ToggleChecklistModel dto
        )
        {
            var userId = GetEmpMasterId();

            var result = await _service.ToggleChecklistAsync(goalId, dto, userId);

            return Ok(result);
        }

        /// <summary>
        /// Updates the progress of a goal manually by an authorized user.
        /// </summary>
        [HttpPut("api/goal-progress/{goalId}/manual")]
        [Authorize(
            Roles = $"{USER_ROLE.EMPLOYEE},{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )] 
        public async Task<IActionResult> UpdateManualProgress(
            int goalId,
            [FromBody] ManualProgressUpdateModel dto
        )
        {
            var userId = GetEmpMasterId();

            var result = await _service.UpdateManualProgressAsync(goalId, dto, userId);

            return Ok(result);
        }

        /// <summary>
        /// Retrieves the progress percentage of a specific goal for the current user.
        /// </summary>
        [HttpGet("api/goal-progress/{goalId}")]
        public async Task<IActionResult> GetProgress(int goalId)
        {
            var userId = GetEmpMasterId();

            var percent = await _service.GetGoalProgressPercentAsync(goalId, userId);

            var response = ApiResponseModel<object>.SuccessResponse(
                ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                new { progress = percent },
                new { GoalId = goalId, UserId = userId }
            );

            return Ok(response);
        }

        /// <summary>
        /// Retrieves the team progress percentage for a specific goal, accessible by managers and leadership roles.
        /// </summary>
        [HttpGet("api/goal-progress/{goalId}/team")]
        [Authorize(
            Roles = $"{USER_ROLE.EMPLOYEE},{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> GetTeamProgress(int goalId)
        {
            var userId = GetEmpMasterId();

            var percent = await _service.GetTeamGoalProgressForManagerAsync(goalId, userId);

            var response = ApiResponseModel<object>.SuccessResponse(
                ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                new { teamProgress = percent },
                new { GoalId = goalId, ManagerId = userId }
            );

            return Ok(response);
        }

        /// <summary>
        /// Retrieves cascading progress for a specific goal, reflecting dependent goals' progress.
        /// </summary>
        [HttpGet("api/goal-progress/{goalId}/cascading")]
        public async Task<IActionResult> GetCascadingProgress(int goalId)
        {
            var userId = GetEmpMasterId();

            var progress = await _service.GetCascadingProgressAsync(goalId, userId);

            var response = ApiResponseModel<object>.SuccessResponse(
                ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                new { cascadingProgress = progress },
                new { GoalId = goalId, UserId = userId }
            );

            return Ok(response);
        }

        /// <summary>
        /// Retrieves the progress hierarchy for a specific goal, showing structured progress details.
        /// </summary>
        [HttpGet("api/goal-progress/{goalId}/hierarchy")]
        public async Task<IActionResult> GetProgressHierarchy(int goalId)
        {
            var userId = GetEmpMasterId();

            var hierarchy = await _service.GetProgressHierarchyAsync(goalId, userId);

            var response = ApiResponseModel<GoalProgressHierarchyModel>.SuccessResponse(
                ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                hierarchy,
                new { GoalId = goalId, UserId = userId }
            );

            return Ok(response);
        }
    }
}

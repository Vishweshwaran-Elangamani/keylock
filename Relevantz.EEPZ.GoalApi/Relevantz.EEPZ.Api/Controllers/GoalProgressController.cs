using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;
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

            Log.Debug("GoalProgressController initialized.");
        }

        /// <summary>
        /// Toggles the completion state of a checklist item for a specific goal.
        /// </summary>
        [HttpPut("api/goals/{goalId}/checklist/toggle")]
        public async Task<IActionResult> UpdateChecklistStatus(
            int goalId,
            [FromBody] UpdateChecklistStatusModel dto
        )
        {
            var userId = GetEmpMasterId();

            Log.Information(
                "UpdateChecklistStatus START | GoalId={GoalId} | UserId={UserId} | ChecklistItemId={ChecklistItemId} | Status={Status}",
                goalId,
                userId,
                dto?.IsCompleted
            );

            var result = await _service.UpdateChecklistStatus(goalId, dto, userId);

            Log.Information(
                "UpdateChecklistStatus END | GoalId={GoalId} | UserId={UserId} | Success={Success}",
                goalId,
                userId,
                result.Success
            );

            return Ok(result);
        }

        /// <summary>
        /// Updates the progress of a goal manually by an authorized user.
        /// </summary>
        [HttpPut("api/goals/{goalId}/manual")]
        [Authorize(
            Roles = $"{USER_ROLE.EMPLOYEE},{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> UpdateProgressPercentage(
            int goalId,
            [FromBody] UpdateProgressPercentageModel dto
        )
        {
            var userId = GetEmpMasterId();

            Log.Information(
                "UpdateProgressPercentage START | GoalId={GoalId} | UserId={UserId} | UpdatedValue={Percent}",
                goalId,
                userId
            );

            var result = await _service.UpdateProgressPercentage(goalId, dto, userId);

            Log.Information(
                "UpdateProgressPercentage END | GoalId={GoalId} | UserId={UserId} | Success={Success}",
                goalId,
                userId,
                result.Success
            );

            return Ok(result);
        }

        /// <summary>
        /// Retrieves the team progress percentage for a specific goal.
        /// </summary>
        [HttpGet("api/goals/{goalId}/team")]
        [Authorize(
            Roles = $"{USER_ROLE.EMPLOYEE},{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> GetTeamProgressPercentage(int goalId)
        {
            var userId = GetEmpMasterId();

            Log.Information(
                "GetTeamProgressPercentage START | GoalId={GoalId} | ManagerId={UserId}",
                goalId,
                userId
            );

            var percent = await _service.GetTeamGoalProgressForManager(goalId, userId);

            Log.Information(
                "GetTeamProgressPercentage END | GoalId={GoalId} | ManagerId={UserId} | TeamProgress={Progress}",
                goalId,
                userId,
                percent
            );

            var response = ApiResponseModel<object>.SuccessResponse(
                ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                new { teamProgress = percent },
                new { GoalId = goalId, ManagerId = userId }
            );

            return Ok(response);
        }

        /// <summary>
        /// Retrieves cascading progress for a specific goal.
        /// </summary>
        [HttpGet("api/goals/{goalId}/cascading")]
        public async Task<IActionResult> GetDependentProgress(int goalId)
        {
            var userId = GetEmpMasterId();

            Log.Information(
                "GetDependentProgress START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                userId
            );

            var progress = await _service.GetDependentProgress(goalId, userId);

            Log.Information(
                "GetDependentProgress END | GoalId={GoalId} | UserId={UserId} | CascadingProgress={Progress}",
                goalId,
                userId,
                progress
            );

            var response = ApiResponseModel<object>.SuccessResponse(
                ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                new { cascadingProgress = progress },
                new { GoalId = goalId, UserId = userId }
            );

            return Ok(response);
        }

        /// <summary>
        /// Retrieves the progress hierarchy for a specific goal.
        /// </summary>
        [HttpGet("api/goals/{goalId}/hierarchy")]
        public async Task<IActionResult> FetchGoalProgressTree(int goalId)
        {
            var userId = GetEmpMasterId();

            Log.Information(
                "FetchGoalProgressTree START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                userId
            );

            var hierarchy = await _service.FetchGoalProgressTree(goalId, userId);

            Log.Information(
                "FetchGoalProgressTree END | GoalId={GoalId} | UserId={UserId} | HasHierarchy={HasData}",
                goalId,
                userId,
                hierarchy != null
            );

            var response = ApiResponseModel<GoalProgressHierarchyModel>.SuccessResponse(
                ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                hierarchy,
                new { GoalId = goalId, UserId = userId }
            );

            return Ok(response);
        }
    }
}
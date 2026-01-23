using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
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

        [HttpPut("api/goal-progress/{goalId:int}/checklist/toggle")]
        public async Task<IActionResult> ToggleChecklist(
            int goalId,
            [FromBody] ToggleChecklistModel dto
        )
        {
            var userId = GetEmpMasterId();

            var result = await _service.ToggleChecklistAsync(goalId, dto, userId);

            return Ok(result);
        }

        [HttpPut("api/goal-progress/{goalId:int}/manual")]
        [Authorize(
            Roles = $"{USER_ROLE.EMPLOYEE},{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> ManualProgress(
            int goalId,
            [FromBody] ManualProgressUpdateModel dto
        )
        {
            var userId = GetEmpMasterId();

            var result = await _service.ManualUpdateProgressAsync(goalId, dto, userId);

            return Ok(result);
        }

        [HttpGet("api/goal-progress/{goalId:int}")]
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

        [HttpGet("api/goal-progress/{goalId:int}/team")]
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

        [HttpGet("api/goal-progress/{goalId:int}/cascading")]
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

        [HttpGet("api/goal-progress/{goalId:int}/hierarchy")]
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

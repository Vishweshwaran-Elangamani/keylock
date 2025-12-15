using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
    [Route("api/goal-progress")]
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
        /// Toggle checklist item completion status
        /// </summary>
        [HttpPut("{goalId:int}/checklist/toggle")]
        public async Task<IActionResult> ToggleChecklist(
            int goalId,
            [FromBody] ToggleChecklistDto dto
        )
        {
            try
            {
                var userId = GetEmpMasterId();

                var result = await _service.ToggleChecklistAsync(goalId, dto, userId);

                if (result.Success)
                {
                    return Ok(result);
                }

                return result.Code switch
                {
                    ResponseMessages.Codes.GOAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.CHECKLIST_NOT_FOUND => NotFound(result),
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
        /// Manually update progress (managers/Department Heads/leaders only)
        /// </summary>
        [HttpPut("{goalId:int}/manual")]
        [Authorize(
            Roles = $"{USER_ROLE.EMPLOYEE},{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> ManualProgress(
            int goalId,
            [FromBody] ManualProgressUpdateDto dto
        )
        {
            try
            {
                var userId = GetEmpMasterId();

                var result = await _service.ManualUpdateProgressAsync(goalId, dto, userId);

                if (result.Success)
                {
                    return Ok(result);
                }

                return result.Code switch
                {
                    ResponseMessages.Codes.GOAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.PROGRESS_UPDATE_DENIED => Forbid(result.Message),
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
        /// Get current progress percentage for a goal
        /// </summary>
        [HttpGet("{goalId:int}")]
        public async Task<IActionResult> GetProgress(int goalId)
        {
            try
            {
                var userId = GetEmpMasterId();

                var percent = await _service.GetGoalProgressPercentAsync(goalId, userId);

                var response = ApiResponseDto<object>.SuccessResponse(
                    ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                    new { progress = percent },
                    new { GoalId = goalId, UserId = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
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
        /// Get team goal progress for manager (aggregated from subordinates)
        /// </summary>
        [HttpGet("{goalId:int}/team")]
        [Authorize(
            Roles = $"{USER_ROLE.EMPLOYEE},{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> GetTeamProgress(int goalId)
        {
            try
            {
                var userId = GetEmpMasterId();

                var percent = await _service.GetTeamGoalProgressForManagerAsync(goalId, userId);

                var response = ApiResponseDto<object>.SuccessResponse(
                    ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                    new { teamProgress = percent },
                    new { GoalId = goalId, ManagerId = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
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
        /// Get cascading progress for a user (includes subordinate progress)
        /// </summary>
        [HttpGet("{goalId:int}/cascading")]
        public async Task<IActionResult> GetCascadingProgress(int goalId)
        {
            try
            {
                var userId = GetEmpMasterId();

                var progress = await _service.GetCascadingProgressAsync(goalId, userId);

                var response = ApiResponseDto<object>.SuccessResponse(
                    ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                    new { cascadingProgress = progress },
                    new { GoalId = goalId, UserId = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
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
        /// Get detailed hierarchical progress breakdown
        /// </summary>
        [HttpGet("{goalId:int}/hierarchy")]
        public async Task<IActionResult> GetProgressHierarchy(int goalId)
        {
            try
            {
                var userId = GetEmpMasterId();

                var hierarchy = await _service.GetProgressHierarchyAsync(goalId, userId);

                var response = ApiResponseDto<GoalProgressHierarchyDto>.SuccessResponse(
                    ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                    hierarchy,
                    new { GoalId = goalId, UserId = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<GoalProgressHierarchyDto>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<GoalProgressHierarchyDto>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }
    }
}

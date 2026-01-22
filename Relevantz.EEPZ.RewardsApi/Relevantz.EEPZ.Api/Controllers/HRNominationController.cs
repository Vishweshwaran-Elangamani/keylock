using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class HRNominationController : ControllerBase
    {
        private readonly IHRNominationService _service;
        private readonly ILogger<HRNominationController> _logger;

        public HRNominationController(
            IHRNominationService service,
            ILogger<HRNominationController> logger
        )
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("hr/manager-nominations")]
        public async Task<IActionResult> GetAllManagerNominationsForHR()
        {
            try
            {
                var result = await _service.GetAllManagerNominationsForHRAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[HR_ALL_NOMINATIONS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("nomination-details/{nominationId}")]
        public async Task<IActionResult> GetNominationDetails(int nominationId)
        {
            try
            {
                var result = await _service.GetNominationDetailsAsync(nominationId);

                if (!result.Success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[NOMINATION_DETAILS] Error: {ex.Message}");
                return StatusCode(
                    500,
                    ApiResponse<object>.ErrorResponse(
                        "Internal server error",
                        new List<string> { ex.Message }
                    )
                );
            }
        }

        [HttpPost("hr/nominations/approve")]
        public async Task<IActionResult> ApproveNominations([FromBody] HRNominationApprovalDto dto)
        {
            try
            {
                var result = await _service.ApproveNominationsAsync(dto);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[HR_APPROVE] Error: {ex.Message}");
                return StatusCode(
                    500,
                    ApiResponse<object>.ErrorResponse(
                        "Internal server error",
                        new List<string> { ex.Message }
                    )
                );
            }
        }

        [HttpPost("hr/nominations/reject")]
        public async Task<IActionResult> RejectNominations([FromBody] HRNominationRejectDto dto)
        {
            try
            {
                var result = await _service.RejectNominationsAsync(dto);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[REJECT_NOMINATIONS] Error: {ex.Message}");
                return StatusCode(
                    500,
                    ApiResponse<object>.ErrorResponse(
                        "Internal server error",
                        new List<string> { ex.Message }
                    )
                );
            }
        }

        [HttpGet("approved-profiles")]
        public async Task<IActionResult> GetApprovedProfiles()
        {
            try
            {
                var result = await _service.GetApprovedProfilesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[APPROVED_PROFILES] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("rejected-profiles")]
        public async Task<IActionResult> GetRejectedProfiles()
        {
            try
            {
                var result = await _service.GetRejectedProfilesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[REJECTED_PROFILES] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var result = await _service.GetStatisticsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[STATISTICS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("reward-types")]
        public async Task<IActionResult> GetAllRewardTypes([FromQuery] bool activeOnly = false)
        {
            try
            {
                var result = await _service.GetAllRewardTypesAsync(activeOnly);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GET_REWARD_TYPES] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("reward-types")]
        public async Task<IActionResult> CreateRewardType([FromBody] CreateRewardTypeDto dto)
        {
            try
            {
                var result = await _service.CreateRewardTypeAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[CREATE_REWARD_TYPE] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("reward-types/{rewardTypeId}")]
        public async Task<IActionResult> UpdateRewardType(
            int rewardTypeId,
            [FromBody] UpdateRewardTypeDto dto
        )
        {
            try
            {
                _logger.LogInformation(
                    $"[UPDATE_REWARD_TYPE] Starting update for RewardTypeId: {rewardTypeId}"
                );

                var result = await _service.UpdateRewardTypeAsync(rewardTypeId, dto);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[UPDATE_REWARD_TYPE] Exception: {ex.Message}");
                _logger.LogError($"[UPDATE_REWARD_TYPE] Stack: {ex.StackTrace}");

                return StatusCode(
                    500,
                    new
                    {
                        success = false,
                        message = "Error updating reward type",
                        details = ex.Message,
                    }
                );
            }
        }

        [HttpGet("reward-types/{rewardTypeId}/parameters")]
        public async Task<IActionResult> GetParametersByRewardType(int rewardTypeId)
        {
            try
            {
                var result = await _service.GetParametersByRewardTypeAsync(rewardTypeId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GET_PARAMETERS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("parameters")]
        public async Task<IActionResult> CreateParameter([FromBody] CreateParameterDto dto)
        {
            try
            {
                var result = await _service.CreateParameterAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[CREATE_PARAMETER] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("parameters/{parameterId}")]
        public async Task<IActionResult> UpdateParameter(
            int parameterId,
            [FromBody] UpdateParameterDto dto
        )
        {
            try
            {
                var result = await _service.UpdateParameterAsync(parameterId, dto);

                // Check if result is null
                if (result == null)
                {
                    return Ok(new { success = true, message = "Parameter updated successfully" });
                }

                // Safe property check
                var resultType = result.GetType();
                var successProperty =
                    resultType.GetProperty("success") ?? resultType.GetProperty("Success");

                if (successProperty != null)
                {
                    var success = (bool)successProperty.GetValue(result);
                    if (!success)
                    {
                        return NotFound(result);
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[UPDATE_PARAMETER] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("parameters/{parameterId}")]
        public async Task<IActionResult> DeleteParameter(int parameterId)
        {
            try
            {
                await _service.DeleteParameterAsync(parameterId);

                return Ok(new { success = true, message = "Parameter deleted successfully" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Parameter not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[DELETE_PARAMETER] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        public class ReviewMetricsDto
        {
            public int NominationId { get; set; }
            public int ReviewedByEmployeeId { get; set; }
            public decimal? MeritScore { get; set; }
            public decimal? DiversityScore { get; set; }
            public bool ConflictOfInterest { get; set; }
            public string ReviewNotes { get; set; }
        }
    }
}

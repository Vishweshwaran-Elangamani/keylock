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

      // GET api/HRNomination/hr/manager-nominations
[HttpGet("hr/manager-nominations")]
public async Task<IActionResult> GetAllManagerNominationsForHR(
    [FromQuery] string? search = null,
    [FromQuery] string? status = null,          
    [FromQuery] string? sortBy = null,         
    [FromQuery] string? sortDirection = "asc",
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10
)
{
    if (page < 1)
    {
        return BadRequest(new { success = false, message = "Page must be greater than 0" });
    }

    if (pageSize < 1 || pageSize > 100)
    {
        return BadRequest(new { success = false, message = "PageSize must be between 1 and 100" });
    }

    var validSortDirections = new[] { "asc", "desc" };
    if (!string.IsNullOrEmpty(sortDirection) && !validSortDirections.Contains(sortDirection.ToLower()))
    {
        return BadRequest(new { success = false, message = "sortDirection must be 'asc' or 'desc'" });
    }

    var validSortBys = new[] { "OpportunityName", "OpportunityDeadline", "NominationCount" };
    if (!string.IsNullOrEmpty(sortBy) && !validSortBys.Contains(sortBy))
    {
        return BadRequest(new { success = false, message = "sortBy must be one of: OpportunityName, OpportunityDeadline, NominationCount" });
    }

    if (!string.IsNullOrEmpty(status) && !new[] { "Pending", "Approved", "Rejected" }.Contains(status))
    {
        return BadRequest(new { success = false, message = "status must be Pending, Approved, or Rejected" });
    }

    if (!string.IsNullOrEmpty(search) && search.Length > 100)
    {
        return BadRequest(new { success = false, message = "search term cannot exceed 100 characters" });
    }

    try
    {
        var result = await _service.GetAllManagerNominationsForHRAsync(
            search,
            status,
            sortBy,
            sortDirection,
            page,
            pageSize  
        );

        return Ok(result);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "[HR_ALL_NOMINATIONS] Error");
        return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
    }
}


        // GET api/HRNomination/nomination-details/{nominationId}
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
                _logger.LogError(ex, "[NOMINATION_DETAILS] Error");
                return StatusCode(
                    500,
                    ApiResponse<object>.ErrorResponse(
                        "Internal server error",
                        new List<string> { ex.Message }
                    )
                );
            }
        }

        // POST api/HRNomination/hr/nominations/approve
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
                _logger.LogError(ex, "[HR_APPROVE] Error");
                return StatusCode(
                    500,
                    ApiResponse<object>.ErrorResponse(
                        "Internal server error",
                        new List<string> { ex.Message }
                    )
                );
            }
        }

        // POST api/HRNomination/hr/nominations/reject
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
                _logger.LogError(ex, "[REJECT_NOMINATIONS] Error");
                return StatusCode(
                    500,
                    ApiResponse<object>.ErrorResponse(
                        "Internal server error",
                        new List<string> { ex.Message }
                    )
                );
            }
        }

        // GET api/HRNomination/approved-profiles
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
                _logger.LogError(ex, "[APPROVED_PROFILES] Error");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET api/HRNomination/rejected-profiles
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
                _logger.LogError(ex, "[REJECTED_PROFILES] Error");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET api/HRNomination/statistics
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
                _logger.LogError(ex, "[STATISTICS] Error");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET api/HRNomination/reward-types
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
                _logger.LogError(ex, "[GET_REWARD_TYPES] Error");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST api/HRNomination/reward-types
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
                _logger.LogError(ex, "[CREATE_REWARD_TYPE] Error");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // PUT api/HRNomination/reward-types/{rewardTypeId}
        [HttpPut("reward-types/{rewardTypeId}")]
        public async Task<IActionResult> UpdateRewardType(
            int rewardTypeId,
            [FromBody] UpdateRewardTypeDto dto
        )
        {
            try
            {
                _logger.LogInformation(
                    "[UPDATE_REWARD_TYPE] Starting update for RewardTypeId: {RewardTypeId}",
                    rewardTypeId
                );

                var result = await _service.UpdateRewardTypeAsync(rewardTypeId, dto);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UPDATE_REWARD_TYPE] Exception");
                _logger.LogError("[UPDATE_REWARD_TYPE] Stack: {StackTrace}", ex.StackTrace);

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

        // GET api/HRNomination/reward-types/{rewardTypeId}/parameters
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
                _logger.LogError(ex, "[GET_PARAMETERS] Error");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST api/HRNomination/parameters
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
                _logger.LogError(ex, "[CREATE_PARAMETER] Error");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // PUT api/HRNomination/parameters/{parameterId}
        [HttpPut("parameters/{parameterId}")]
        public async Task<IActionResult> UpdateParameter(
            int parameterId,
            [FromBody] UpdateParameterDto dto
        )
        {
            try
            {
                var result = await _service.UpdateParameterAsync(parameterId, dto);

                if (result == null)
                {
                    return Ok(new { success = true, message = "Parameter updated successfully" });
                }

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
                _logger.LogError(ex, "[UPDATE_PARAMETER] Error");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // DELETE api/HRNomination/parameters/{parameterId}
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
                _logger.LogError(ex, "[DELETE_PARAMETER] Error");
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


using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Authorize]
    [Authorize(Roles = "HR")]
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

        // GET api/HRNomination/nomination-details/{nominationId}
        [HttpGet("nomination-details/{nominationId}")]
        public async Task<IActionResult> GetNominationDetails(int nominationId)
        {
            var result = await _service.GetNominationDetailsAsync(nominationId);

            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        // POST api/HRNomination/hr/nominations/approve
        [HttpPost("hr/nominations/approve")]
        public async Task<IActionResult> ApproveNominations([FromBody] HRNominationApprovalDto dto)
        {
            var result = await _service.ApproveNominationsAsync(dto);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // POST api/HRNomination/hr/nominations/reject
        [HttpPost("hr/nominations/reject")]
        public async Task<IActionResult> RejectNominations([FromBody] HRNominationRejectDto dto)
        {
            var result = await _service.RejectNominationsAsync(dto);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // GET api/HRNomination/approved-profiles
        [HttpGet("approved-profiles")]
        public async Task<IActionResult> GetApprovedProfiles()
        {
            var result = await _service.GetApprovedProfilesAsync();
            return Ok(result);
        }

        // GET api/HRNomination/rejected-profiles
        [HttpGet("rejected-profiles")]
        public async Task<IActionResult> GetRejectedProfiles()
        {
            var result = await _service.GetRejectedProfilesAsync();
            return Ok(result);
        }

        // GET api/HRNomination/statistics
        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            var result = await _service.GetStatisticsAsync();
            return Ok(result);
        }

        // GET api/HRNomination/reward-types
        [HttpGet("reward-types")]
        public async Task<IActionResult> GetAllRewardTypes([FromQuery] bool activeOnly = false)
        {
            var result = await _service.GetAllRewardTypesAsync(activeOnly);
            return Ok(result);
        }

        // POST api/HRNomination/reward-types
        [HttpPost("reward-types")]
        public async Task<IActionResult> CreateRewardType([FromBody] CreateRewardTypeDto dto)
        {
            var result = await _service.CreateRewardTypeAsync(dto);
            return Ok(result);
        }

        // PUT api/HRNomination/reward-types/{rewardTypeId}
        [HttpPut("reward-types/{rewardTypeId}")]
        public async Task<IActionResult> UpdateRewardType(
            int rewardTypeId,
            [FromBody] UpdateRewardTypeDto dto
        )
        {
            _logger.LogInformation(
                "[UPDATE_REWARD_TYPE] Starting update for RewardTypeId: {RewardTypeId}",
                rewardTypeId
            );

            var result = await _service.UpdateRewardTypeAsync(rewardTypeId, dto);
            return Ok(result);
        }

        // GET api/HRNomination/reward-types/{rewardTypeId}/parameters
        [HttpGet("reward-types/{rewardTypeId}/parameters")]
        public async Task<IActionResult> GetParametersByRewardType(int rewardTypeId)
        {
            var result = await _service.GetParametersByRewardTypeAsync(rewardTypeId);
            return Ok(result);
        }

        // POST api/HRNomination/parameters
        [HttpPost("parameters")]
        public async Task<IActionResult> CreateParameter([FromBody] CreateParameterDto dto)
        {
            var result = await _service.CreateParameterAsync(dto);
            return Ok(result);
        }

        // PUT api/HRNomination/parameters/{parameterId}
        [HttpPut("parameters/{parameterId}")]
        public async Task<IActionResult> UpdateParameter(
            int parameterId,
            [FromBody] UpdateParameterDto dto
        )
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

        // DELETE api/HRNomination/parameters/{parameterId}
        [HttpDelete("parameters/{parameterId}")]
        public async Task<IActionResult> DeleteParameter(int parameterId)
        {
            await _service.DeleteParameterAsync(parameterId);
            return Ok(new { success = true, message = "Parameter deleted successfully" });
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

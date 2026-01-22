using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class HRNominationController : ControllerBase
    {
        private readonly IHRNominationService _service;
        private readonly ILogger<HRNominationController> _logger;
        private const int MaxPageSize = 100;

        private static readonly HashSet<string> AllowedSortBy =
            new(StringComparer.OrdinalIgnoreCase)
            { "SubmittedAt", "EmployeeName", "Status", "OpportunityName" };

        private static readonly HashSet<string> AllowedSortDir =
            new(StringComparer.OrdinalIgnoreCase)
            { "asc", "desc" };

        private static readonly HashSet<string> AllowedStatuses =
            new(StringComparer.OrdinalIgnoreCase)
            { "Pending", "Approved", "Rejected" };
        public HRNominationController(
            IHRNominationService service,
            ILogger<HRNominationController> logger)
        {
            _service = service;
            _logger = logger;
        }

        // GET: api/HRNomination/manager-nominations
        [HttpGet("manager-nominations")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllManagerNominationsForHR(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null,
            [FromQuery] int? rewardTypeId = null,
            [FromQuery] string? search = null,
            [FromQuery] DateTimeOffset? fromDate = null,
            [FromQuery] DateTimeOffset? toDate = null,
            [FromQuery] string? sortBy = "SubmittedAt",
            [FromQuery] string? sortDir = "desc")
        {
            try
            {
                if (pageNumber <= 0)
                    return BadRequest(ApiResponse<object>.ErrorResponse("pageNumber must be >= 1"));

                if (pageSize <= 0 || pageSize > MaxPageSize)
                    return BadRequest(ApiResponse<object>.ErrorResponse($"pageSize must be between 1 and {MaxPageSize}"));

                if (rewardTypeId.HasValue && rewardTypeId.Value <= 0)
                    return BadRequest(ApiResponse<object>.ErrorResponse("rewardTypeId must be > 0"));

                if (fromDate.HasValue && toDate.HasValue && fromDate > toDate)
                    return BadRequest(ApiResponse<object>.ErrorResponse("fromDate must be less than or equal to toDate"));

                if (!string.IsNullOrWhiteSpace(sortBy) && !AllowedSortBy.Contains(sortBy))
                    return BadRequest(ApiResponse<object>.ErrorResponse($"sortBy must be one of: {string.Join(", ", AllowedSortBy)}"));

                if (!string.IsNullOrWhiteSpace(sortDir) && !AllowedSortDir.Contains(sortDir))
                    return BadRequest(ApiResponse<object>.ErrorResponse("sortDir must be 'asc' or 'desc'"));

                if (!string.IsNullOrWhiteSpace(status) && !AllowedStatuses.Contains(status))
                    return BadRequest(ApiResponse<object>.ErrorResponse($"status must be one of: {string.Join(", ", AllowedStatuses)}"));

                if (!string.IsNullOrWhiteSpace(search) && search.Length > 100)
                    return BadRequest(ApiResponse<object>.ErrorResponse("search must be 100 characters or fewer"));

                _logger.LogInformation(
                    "HR:GetAllManagerNominationsForHR - start page={PageNumber}, size={PageSize}, status={Status}, rewardTypeId={RewardTypeId}, search={Search}, from={From}, to={To}, sortBy={SortBy}, sortDir={SortDir}",
                    pageNumber, pageSize, status, rewardTypeId, search, fromDate, toDate, sortBy, sortDir);

                var result = await _service.GetAllManagerNominationsForHRAsync(
                    pageNumber, pageSize, status, rewardTypeId, search, fromDate, toDate, sortBy, sortDir);

                _logger.LogInformation("HR:GetAllManagerNominationsForHR - success");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:GetAllManagerNominationsForHR - failed");
                return Problem(title: "Unexpected error while fetching manager nominations.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }


   // GET: api/HRNomination/nomination-details/{nominationId}
        [HttpGet("nomination-details/{nominationId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetNominationDetails([FromRoute] int nominationId)
        {
            try
            {
                if (nominationId <= 0)
                    return BadRequest(ApiResponse<object>.ErrorResponse("nominationId must be > 0"));

                _logger.LogInformation("HR:GetNominationDetails - start (NominationId={NominationId})", nominationId);

                var result = await _service.GetNominationDetailsAsync(nominationId);

                if (!result.Success)
                {
                    _logger.LogWarning("HR:GetNominationDetails - not found (NominationId={NominationId})", nominationId);
                    return NotFound(result);
                }

                _logger.LogInformation("HR:GetNominationDetails - success (NominationId={NominationId})", nominationId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:GetNominationDetails - failed (NominationId={NominationId})", nominationId);
                return Problem(title: "Unexpected error while fetching nomination details.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // POST: api/HRNomination/nominations/approve
        [HttpPost("nominations/approve")]
        public async Task<IActionResult> ApproveNominations([FromBody] HRNominationApprovalDto dto)
        {
            try
            {
                _logger.LogInformation("HR:ApproveNominations - start");
                var result = await _service.ApproveNominationsAsync(dto);

                if (!result.Success)
                {
                    _logger.LogWarning("HR:ApproveNominations - bad request");
                    return BadRequest(result);
                }

                _logger.LogInformation("HR:ApproveNominations - success");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:ApproveNominations - failed");
                return Problem(title: "Unexpected error while approving nominations.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // POST: api/HRNomination/nominations/reject
        [HttpPost("nominations/reject")]
        public async Task<IActionResult> RejectNominations([FromBody] HRNominationRejectDto dto)
        {
            try
            {
                _logger.LogInformation("HR:RejectNominations - start");
                var result = await _service.RejectNominationsAsync(dto);

                if (!result.Success)
                {
                    _logger.LogWarning("HR:RejectNominations - bad request");
                    return BadRequest(result);
                }

                _logger.LogInformation("HR:RejectNominations - success");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:RejectNominations - failed");
                return Problem(title: "Unexpected error while rejecting nominations.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // GET: api/HRNomination/approved-profiles
        [HttpGet("approved-profiles")]
        public async Task<IActionResult> GetApprovedProfiles()
        {
            try
            {
                _logger.LogInformation("HR:GetApprovedProfiles - start");
                var result = await _service.GetApprovedProfilesAsync();
                _logger.LogInformation("HR:GetApprovedProfiles - success");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:GetApprovedProfiles - failed");
                return Problem(title: "Unexpected error while fetching approved profiles.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // GET: api/HRNomination/rejected-profiles
        [HttpGet("rejected-profiles")]
        public async Task<IActionResult> GetRejectedProfiles()
        {
            try
            {
                _logger.LogInformation("HR:GetRejectedProfiles - start");
                var result = await _service.GetRejectedProfilesAsync();
                _logger.LogInformation("HR:GetRejectedProfiles - success");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:GetRejectedProfiles - failed");
                return Problem(title: "Unexpected error while fetching rejected profiles.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // GET: api/HRNomination/statistics
        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                _logger.LogInformation("HR:GetStatistics - start");
                var result = await _service.GetStatisticsAsync();
                _logger.LogInformation("HR:GetStatistics - success");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:GetStatistics - failed");
                return Problem(title: "Unexpected error while fetching statistics.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // GET: api/HRNomination/reward-types?activeOnly=false
        [HttpGet("reward-types")]
        public async Task<IActionResult> GetAllRewardTypes([FromQuery] bool activeOnly = false)
        {
            try
            {
                _logger.LogInformation("HR:GetAllRewardTypes - start (ActiveOnly={ActiveOnly})", activeOnly);
                var result = await _service.GetAllRewardTypesAsync(activeOnly);
                _logger.LogInformation("HR:GetAllRewardTypes - success");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:GetAllRewardTypes - failed (ActiveOnly={ActiveOnly})", activeOnly);
                return Problem(title: "Unexpected error while fetching reward types.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // POST: api/HRNomination/reward-types
        [HttpPost("reward-types")]
        public async Task<IActionResult> CreateRewardType([FromBody] CreateRewardTypeDto dto)
        {
            try
            {
                _logger.LogInformation("HR:CreateRewardType - start");
                var result = await _service.CreateRewardTypeAsync(dto);
                _logger.LogInformation("HR:CreateRewardType - success");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:CreateRewardType - failed");
                return Problem(title: "Unexpected error while creating reward type.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // PUT: api/HRNomination/reward-types/{rewardTypeId}
        [HttpPut("reward-types/{rewardTypeId:int}")]
        public async Task<IActionResult> UpdateRewardType([FromRoute] int rewardTypeId, [FromBody] UpdateRewardTypeDto dto)
        {
            try
            {
                _logger.LogInformation("HR:UpdateRewardType - start (RewardTypeId={RewardTypeId})", rewardTypeId);
                var result = await _service.UpdateRewardTypeAsync(rewardTypeId, dto);
                _logger.LogInformation("HR:UpdateRewardType - success (RewardTypeId={RewardTypeId})", rewardTypeId);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning("HR:UpdateRewardType - not found (RewardTypeId={RewardTypeId})", rewardTypeId);
                return NotFound(ApiResponse<object>.ErrorResponse("Reward type not found"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:UpdateRewardType - failed (RewardTypeId={RewardTypeId})", rewardTypeId);
                return Problem(title: "Unexpected error while updating reward type.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // GET: api/HRNomination/reward-types/{rewardTypeId}/parameters
        [HttpGet("reward-types/{rewardTypeId:int}/parameters")]
        public async Task<IActionResult> GetParametersByRewardType([FromRoute] int rewardTypeId)
        {
            try
            {
                _logger.LogInformation("HR:GetParametersByRewardType - start (RewardTypeId={RewardTypeId})", rewardTypeId);
                var result = await _service.GetParametersByRewardTypeAsync(rewardTypeId);
                _logger.LogInformation("HR:GetParametersByRewardType - success (RewardTypeId={RewardTypeId})", rewardTypeId);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning("HR:GetParametersByRewardType - not found (RewardTypeId={RewardTypeId})", rewardTypeId);
                return NotFound(ApiResponse<object>.ErrorResponse("Reward type not found"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:GetParametersByRewardType - failed (RewardTypeId={RewardTypeId})", rewardTypeId);
                return Problem(title: "Unexpected error while fetching parameters.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // POST: api/HRNomination/parameters
        [HttpPost("parameters")]
        public async Task<IActionResult> CreateParameter([FromBody] CreateParameterDto dto)
        {
            try
            {
                _logger.LogInformation("HR:CreateParameter - start");
                var result = await _service.CreateParameterAsync(dto);
                _logger.LogInformation("HR:CreateParameter - success");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:CreateParameter - failed");
                return Problem(title: "Unexpected error while creating parameter.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // PUT: api/HRNomination/parameters/{parameterId}
        [HttpPut("parameters/{parameterId:int}")]
        public async Task<IActionResult> UpdateParameter([FromRoute] int parameterId, [FromBody] UpdateParameterDto dto)
        {
            try
            {
                _logger.LogInformation("HR:UpdateParameter - start (ParameterId={ParameterId})", parameterId);
                var result = await _service.UpdateParameterAsync(parameterId, dto);

                if (result == null)
                {
                    _logger.LogInformation("HR:UpdateParameter - success (ParameterId={ParameterId})", parameterId);
                    return Ok(new { success = true, message = "Parameter updated successfully" });
                }

                var type = result.GetType();
                var successProp = type.GetProperty("success") ?? type.GetProperty("Success");
                if (successProp != null && successProp.PropertyType == typeof(bool))
                {
                    var success = (bool)successProp.GetValue(result);
                    if (!success)
                    {
                        _logger.LogWarning("HR:UpdateParameter - not found (ParameterId={ParameterId})", parameterId);
                        return NotFound(result);
                    }
                }

                _logger.LogInformation("HR:UpdateParameter - success (ParameterId={ParameterId})", parameterId);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning("HR:UpdateParameter - not found (ParameterId={ParameterId})", parameterId);
                return NotFound(ApiResponse<object>.ErrorResponse("Parameter not found"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:UpdateParameter - failed (ParameterId={ParameterId})", parameterId);
                return Problem(title: "Unexpected error while updating parameter.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // DELETE: api/HRNomination/parameters/{parameterId}
        [HttpDelete("parameters/{parameterId:int}")]
        public async Task<IActionResult> DeleteParameter([FromRoute] int parameterId)
        {
            try
            {
                _logger.LogInformation("HR:DeleteParameter - start (ParameterId={ParameterId})", parameterId);
                await _service.DeleteParameterAsync(parameterId);
                _logger.LogInformation("HR:DeleteParameter - success (ParameterId={ParameterId})", parameterId);
                return Ok(new { success = true, message = "Parameter deleted successfully" });
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning("HR:DeleteParameter - not found (ParameterId={ParameterId})", parameterId);
                return NotFound(ApiResponse<object>.ErrorResponse("Parameter not found"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HR:DeleteParameter - failed (ParameterId={ParameterId})", parameterId);
                return Problem(title: "Unexpected error while deleting parameter.",
                               statusCode: StatusCodes.Status500InternalServerError);
            }
        }
    }
}

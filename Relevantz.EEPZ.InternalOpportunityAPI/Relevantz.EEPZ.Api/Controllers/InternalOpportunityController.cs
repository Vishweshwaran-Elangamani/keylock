using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Request;
using Relevantz.EEPZ.Common.Validators;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Api.Constants;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Manages internal opportunities including creation, update, retrieval, statistics, and deletion.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InternalOpportunityController : ControllerBase
    {
        private readonly IInternalOpportunityService _opportunityService;

        public InternalOpportunityController(IInternalOpportunityService opportunityService)
        {
            _opportunityService = opportunityService;
        }

        /// <summary>
        /// Retrieves a simplified list of all internal opportunities.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllOpportunities()
        {
            var result = await _opportunityService.GetAllOpportunitiesSimpleAsync();
            return Ok(result);
        }

        /// <summary>
        /// Creates a new internal opportunity. (HR only)
        /// </summary>
        /// <remarks>
        /// Validates the request payload and associates the created opportunity with the requesting HR user.
        /// Returns 201 with the created resource location.
        /// </remarks>
        [HttpPost("create")]
        [Authorize(Roles = "HR")]
        public async Task<IActionResult> CreateOpportunity([FromBody] CreateInternalOpportunityRequestDto request)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ??
                             User.FindFirst("sub");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId <= 0)
            {
                return Unauthorized(new { message = MessageConstants.UserIdNotFoundInToken });
            }

            var result = await _opportunityService.CreateOpportunityAsync(request, userId);
            return CreatedAtAction(nameof(GetOpportunityById), new { id = result.OpportunityId }, result);
        }

        /// <summary>
        /// Updates an existing internal opportunity by ID. (HR only)
        /// </summary>
        /// <param name="id">Opportunity identifier</param>
        [HttpPut("update/{id}")]
        [Authorize(Roles = "HR")]
        public async Task<IActionResult> UpdateOpportunity(int id, [FromBody] UpdateInternalOpportunityRequestDto request)
        {
            var result = await _opportunityService.UpdateOpportunityAsync(id, request);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves an internal opportunity by its ID.
        /// </summary>
        /// <param name="id">Opportunity identifier</param>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOpportunityById(int id)
        {
            var result = await _opportunityService.GetOpportunityByIdAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves a simplified list of currently active opportunities.
        /// </summary>
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveOpportunities()
        {
            var result = await _opportunityService.GetActiveOpportunitiesSimpleAsync();
            return Ok(result);
        }

        /// <summary>
        /// Returns HR-facing statistics for internal opportunities. (HR only)
        /// </summary>
        [HttpGet("statistic")]
        [Authorize(Roles = "HR")]
        public async Task<IActionResult> GetStatistics()
        {
            var result = await _opportunityService.GetStatisticsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Deletes an internal opportunity by ID. (HR only)
        /// </summary>
        /// <param name="id">Opportunity identifier</param>
        [HttpDelete("{id}")]
        [Authorize(Roles = "HR")]
        public async Task<IActionResult> DeleteOpportunity(int id)
        {
            var result = await _opportunityService.DeleteOpportunityAsync(id);
            return Ok(new { message = MessageConstants.OpportunityDeletedSuccessfully });
        }
    }
}

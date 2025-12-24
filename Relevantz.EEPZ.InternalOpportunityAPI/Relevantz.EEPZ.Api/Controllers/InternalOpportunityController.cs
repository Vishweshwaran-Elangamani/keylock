using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Request;
using Relevantz.EEPZ.Common.Validators;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
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

        [HttpGet]
        public async Task<IActionResult> GetAllOpportunities()
        {
            try
            {
                var result = await _opportunityService.GetAllOpportunitiesSimpleAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("create")]
        [Authorize(Roles = "HR")]
        public async Task<IActionResult> CreateOpportunity([FromBody] CreateInternalOpportunityRequestDto request)
        {
            try
            {
                InternalOpportunityValidator.ValidateCreate(request);

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ??
                                 User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId <= 0)
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                var result = await _opportunityService.CreateOpportunityAsync(request, userId);
                return CreatedAtAction(nameof(GetOpportunityById), new { id = result.OpportunityId }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "HR")]
        public async Task<IActionResult> UpdateOpportunity(int id, [FromBody] UpdateInternalOpportunityRequestDto request)
        {
            try
            {
                InternalOpportunityValidator.ValidateUpdate(request);
                var result = await _opportunityService.UpdateOpportunityAsync(id, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOpportunityById(int id)
        {
            try
            {
                var result = await _opportunityService.GetOpportunityByIdAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveOpportunities()
        {
            try
            {
                var result = await _opportunityService.GetActiveOpportunitiesSimpleAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("statistics")]
        [Authorize(Roles = "HR")]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var result = await _opportunityService.GetStatisticsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "HR")]
        public async Task<IActionResult> DeleteOpportunity(int id)
        {
            try
            {
                var result = await _opportunityService.DeleteOpportunityAsync(id);
                return Ok(new { message = "Opportunity deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}

using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Mvc;
 
namespace Relevantz.EEPZ.Api.Controllers
{
   [Route("api/[controller]")]
    [ApiController]
    public class NominationManagementController : ControllerBase
    {
        private readonly INominationManagementService _nominationManagementService;
 
        public NominationManagementController(INominationManagementService nominationManagementService)
        {
            _nominationManagementService = nominationManagementService;
        }
 
        [HttpPost("create")]
        public async Task<IActionResult> CreateNomination([FromBody] CreateNominationRequestDto request)
        {
            var result = await _nominationManagementService.CreateNominationAsync(request);
            return Ok(result);
        }
 
        [HttpPut("review")]
        public async Task<IActionResult> ReviewNomination([FromBody] ReviewNominationRequestDto request)
        {
            var result = await _nominationManagementService.ReviewNominationAsync(request);
            return Ok(result);
        }
 
        [HttpGet("all")]
        public async Task<IActionResult> GetAllNominations()
        {
            var result = await _nominationManagementService.GetAllNominationsAsync();
            return Ok(result);
        }
 
        [HttpGet("{nominationId}")]
        public async Task<IActionResult> GetNominationById(int nominationId)
        {
            var result = await _nominationManagementService.GetNominationByIdAsync(nominationId);
            return Ok(result);
        }
 
        [HttpGet("by-status/{status}")]
        public async Task<IActionResult> GetNominationsByStatus(string status)
        {
            var result = await _nominationManagementService.GetNominationsByStatusAsync(status);
            return Ok(result);
        }
 
        [HttpGet("by-opportunity/{opportunityId}")]
        public async Task<IActionResult> GetNominationsByOpportunity(int opportunityId)
        {
            var result = await _nominationManagementService.GetNominationsByOpportunityAsync(opportunityId);
            return Ok(result);
        }
 
        [HttpGet("pending-review")]
        public async Task<IActionResult> GetPendingReviewNominations()
        {
            var result = await _nominationManagementService.GetPendingReviewNominationsAsync();
            return Ok(result);
        }
    }
 
 
}
 
 
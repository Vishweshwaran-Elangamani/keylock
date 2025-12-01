using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MomController : ControllerBase
    {
        private readonly IMomService _momService;

        public MomController(IMomService momService)
        {
            _momService = momService;
        }

        [HttpPost("create")]
        public async Task<ActionResult<MomResponseDto>> CreateMom([FromBody] CreateMomDto createMomDto)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();

                var result = await _momService.CreateMomAsync(createMomDto, employeeId, role);
                return Ok(new { success = true, message = "MOM created successfully", data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }


        [HttpPut("update")]
        public async Task<ActionResult<MomResponseDto>> UpdateMom([FromBody] UpdateMomDto updateMomDto)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();
                
                var result = await _momService.UpdateMomAsync(updateMomDto, employeeId, role);
                return Ok(new { success = true, message = "MOM updated successfully", data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }


        [HttpGet("my-moms")]
        [Authorize(Roles ="Manager,Employee")]
        public async Task<ActionResult<List<MomResponseDto>>> GetMyMoms()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetMomsSubmittedByEmployeeAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{momId}")]
        public async Task<ActionResult<MomResponseDto>> GetMomById(int momId)
        {
            try
            {
                var result = await _momService.GetMomByIdAsync(momId);
                if (result == null)
                    return NotFound(new { success = false, message = "MOM not found" });

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }


        [HttpDelete("{momId}")]
        public async Task<ActionResult> DeleteMom(int momId)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();
                
                var result = await _momService.DeleteMomAsync(momId, employeeId, role);
                
                if (!result)
                    return NotFound(new { success = false, message = "MOM not found" });

                return Ok(new { success = true, message = "MOM deleted successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

 
        [HttpPost("share")]
        public async Task<ActionResult<List<MomSharingResponseDto>>> ShareMom([FromBody] ShareMomDto shareMomDto)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.ShareMomAsync(shareMomDto, employeeId);
                return Ok(new { success = true, message = "MOM shared successfully", data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("shared-by-me")]
        public async Task<ActionResult<List<MomSharingResponseDto>>> GetMomsSharedByMe()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetMomsSharedByEmployeeAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("shared-with-me")]
        public async Task<ActionResult<List<MomResponseDto>>> GetMomsSharedWithMe()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetMomsSharedWithEmployeeAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }


        [HttpGet("all-moms")]
        [Authorize(Roles = "HR")] 
        public async Task<ActionResult<PaginatedMomResponseDto>> GetAllMomsForHR(
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? meetingType = null,
            [FromQuery] int? departmentId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();

                var result = await _momService.GetAllMomsForHRAsync(
                    employeeId,
                    role,
                    searchTerm,
                    meetingType,
                    departmentId,
                    startDate,
                    endDate,
                    pageNumber,
                    pageSize);

                return Ok(new { success = true, data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }


        [HttpPatch("action-items/{actionItemId}/status")]
        public async Task<ActionResult> UpdateActionItemStatus(int actionItemId, [FromBody] string status)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                
                var result = await _momService.UpdateActionItemStatusAsync(actionItemId, status, employeeId);
                
                if (!result)
                    return NotFound(new { success = false, message = "Action item not found" });

                return Ok(new { success = true, message = "Action item status updated successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("action-items/my-tasks")]
        public async Task<ActionResult<List<ActionItemResponseDto>>> GetMyActionItems()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetMyActionItemsAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("action-items/assigned-by-me")]
        public async Task<ActionResult<List<ActionItemResponseDto>>> GetActionItemsAssignedByMe()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetActionItemsAssignedByMeAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("action-items/overdue")]
        public async Task<ActionResult<List<ActionItemResponseDto>>> GetOverdueActionItems()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetOverdueActionItemsAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        
        private int GetEmployeeIdFromClaims()
        {
            var employeeIdClaim = User.FindFirst("empId");
            
            if (employeeIdClaim != null && int.TryParse(employeeIdClaim.Value, out int employeeId))
            {
                return employeeId;
            }
            
            var subClaim = User.FindFirst("sub") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            
            if (subClaim != null && int.TryParse(subClaim.Value, out int subId))
            {
                return subId;
            }
            
            throw new UnauthorizedAccessException("Employee ID not found in token");
        }

        private string GetRoleFromClaims()
{
    var roleClaim = User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role");
    
    if (roleClaim != null)
        return roleClaim.Value;
 
    roleClaim = User.FindFirst(ClaimTypes.Role);
    
    if (roleClaim != null)
        return roleClaim.Value;
    
    roleClaim = User.FindFirst("role");
    
    if (roleClaim != null)
        return roleClaim.Value;
   
    return "Employee";
}

    }
}

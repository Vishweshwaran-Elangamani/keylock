using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs;

namespace eepzbackend.Controllers
{
    /// <summary>
    /// Partial class containing MOM sharing operations
    /// </summary>
    public partial class MomController
    {
        // ========== SHARING OPERATIONS (3 endpoints) ==========

        /// <summary>
        /// Share a MOM with other employees
        /// </summary>
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

        /// <summary>
        /// Get MOMs shared by the current user
        /// </summary>
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

        /// <summary>
        /// Get MOMs shared with the current user
        /// </summary>
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
    }
}

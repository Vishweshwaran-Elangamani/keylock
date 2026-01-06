using Microsoft.AspNetCore.Mvc;

namespace eepzbackend.Controllers
{
    public partial class SlaController
    {
        /// <summary>
        /// Delete an SLA (admin operation)
        /// </summary>
        [HttpDelete("{slaid}")]
        public async Task<IActionResult> DeleteSla(int slaid)
        {
            try
            {
                _logger.LogInformation("Deleting SLA {Slaid}", slaid);
                var result = await _slaService.DeleteSla(slaid);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DeleteSla");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}

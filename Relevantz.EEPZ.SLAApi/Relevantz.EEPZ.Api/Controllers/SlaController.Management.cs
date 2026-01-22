using Microsoft.AspNetCore.Mvc;

namespace eepzbackend.Controllers
{
    public partial class SlaController
    {
        [HttpDelete("{slaid}")]
        public async Task<IActionResult> DeleteSla(int slaid)
        {
            _logger.LogInformation("Deleting SLA {Slaid}", slaid);
            var result = await _slaService.DeleteSla(slaid);
            return result.Success ? Ok(result) : NotFound(result);
        }
    }
}

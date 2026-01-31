using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common;

namespace eepzbackend.Controllers
{
    public partial class SlaController
    {
        /// <summary>
        /// Deletes an SLA by its identifier.
        /// </summary>
        /// <param name="slaid">Unique identifier of the SLA to delete.</param>
        /// <returns>API response containing deletion result.</returns>
       [Authorize(Roles = "HR")]
[HttpDelete("{slaid}")]
public async Task<IActionResult> DeleteSla(int slaid)
{
    _logger.LogInformation("START DeleteSla. SLA: {Slaid}, CorrelationId: {CorrelationId}", slaid, CorrelationId);

    await _slaService.DeleteSla(slaid);

    _logger.LogInformation("SUCCESS DeleteSla. SLA: {Slaid}, CorrelationId: {CorrelationId}", slaid, CorrelationId);

    _logger.LogInformation("END DeleteSla. SLA: {Slaid}, CorrelationId: {CorrelationId}", slaid, CorrelationId);

    return Ok(new ApiResponse<object>
    {
        StatusCode = StatusCodes.Status200OK,
        Success = true,
        Message = ApiMessages.Deleted,
        CorrelationId = CorrelationId
    });
    }

    }
}

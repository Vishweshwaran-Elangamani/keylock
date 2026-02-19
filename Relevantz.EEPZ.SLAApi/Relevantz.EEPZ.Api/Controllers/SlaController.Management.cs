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
[HttpDelete("{slaid:int}")]
public async Task<IActionResult> DeleteSla([FromRoute] int slaid)
{
    _logger.LogInformation(
        "START DeleteSla | SlaId: {SlaId} | UserId: {UserId} | CorrelationId: {CorrelationId}",
        slaid, UserId, CorrelationId);

    var deleted = await _slaService.DeleteSla(slaid);

    if (!deleted)
    {
        _logger.LogWarning(
            "DeleteSla FAILED - Not Found | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
            slaid, CorrelationId);

        return NotFound(new ApiResponse<object>
        {
            StatusCode = StatusCodes.Status404NotFound,
            Success = false,
            Message = ApiMessages.NotFound,
            CorrelationId = CorrelationId
        });
    }

    _logger.LogInformation(
        "SUCCESS DeleteSla | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
        slaid, CorrelationId);

    _logger.LogInformation(
        "END DeleteSla | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
        slaid, CorrelationId);

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

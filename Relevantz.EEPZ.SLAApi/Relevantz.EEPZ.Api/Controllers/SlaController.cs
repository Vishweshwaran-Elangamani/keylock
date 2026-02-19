using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace eepzbackend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/slas")]
    [Produces("application/json")]
    public partial class SlaController : ControllerBase
    {
        private readonly ISlaService _slaService;
        private readonly ILogger<SlaController> _logger;

        public SlaController(ISlaService slaService, ILogger<SlaController> logger)
        {
            _slaService = slaService;
            _logger = logger;
        }

        private string CorrelationId => HttpContext.TraceIdentifier;

        private int UserId
        {
            get
            {
                var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(claim))
                    throw new UnauthorizedAccessException(ApiMessages.Unauthorized);
                return int.Parse(claim);
            }
        }

        /// <summary>
        /// Retrieves all SLAs available in the system.
        /// </summary>
        /// <returns>List of SLA records</returns>
        [HttpGet]
        public async Task<IActionResult> GetSlas()
        {
            _logger.LogInformation(
                "START GetSlas | UserId: {UserId} | CorrelationId: {CorrelationId}",
                UserId, CorrelationId);

            var data = await _slaService.GetAllSlas();

            _logger.LogInformation(
                "SUCCESS GetSlas | Count: {Count} | CorrelationId: {CorrelationId}",
                data.Count, CorrelationId);

            _logger.LogInformation(
                "END GetSlas | CorrelationId: {CorrelationId}",
                CorrelationId);

            return Ok(new ApiResponse<object>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Success,
                Data = data,
                CorrelationId = CorrelationId
            });
        }


        /// <summary>
        /// Creates a new SLA for an employee.
        /// </summary>
        /// <param name="slaRequest">SLA creation request payload</param>
        /// <returns>Created SLA information</returns>
        [HttpPost]
        public async Task<IActionResult> CreateSla([FromBody] CreateSlaRequest slaRequest)
        {
            _logger.LogInformation("Creating SLA. UserId: {UserId}, CorrelationId: {CorrelationId}", UserId, CorrelationId);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Validation failed for CreateSla. CorrelationId: {CorrelationId}", CorrelationId);

                return BadRequest(new ApiResponse<object>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = ApiMessages.ValidationFailed,
                    Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(),
                    CorrelationId = CorrelationId
                });
            }

            var data = await _slaService.CreateSla(slaRequest, UserId);

            _logger.LogInformation("SLA created successfully. SLA ID: {Slaid}, CorrelationId: {CorrelationId}", data.Slaid, CorrelationId);

            return Ok(new ApiResponse<object>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Created,
                Data = data,
                CorrelationId = CorrelationId
            });
        }

        /// <summary>
        /// Creates multiple SLAs in bulk.
        /// </summary>
        /// <param name="slaRequests">List of SLA creation request payloads</param>
        /// <returns>Bulk creation result</returns>
        [HttpPost("bulk")]
        [Consumes("application/json")]
        [Produces("application/json")]

        public async Task<IActionResult> BulkCreateSla([FromBody] List<CreateSlaRequest> slaRequests)
        {
            _logger.LogInformation("Bulk SLA creation started. UserId: {UserId}, Count: {Count}, CorrelationId: {CorrelationId}",
                UserId, slaRequests?.Count ?? 0, CorrelationId);

            if (slaRequests == null || !slaRequests.Any())
                return BadRequest(new ApiResponse<object> { StatusCode = 400, Success = false, Message = ApiMessages.NoRecords, CorrelationId = CorrelationId });

            if (slaRequests.Count > 10000)
                return BadRequest(new ApiResponse<object> { StatusCode = 400, Success = false, Message = ApiMessages.BulkLimitExceeded, CorrelationId = CorrelationId });

            foreach (var slaRequest in slaRequests)
                if (!TryValidateModel(slaRequest))
                    return BadRequest(new ApiResponse<object> { StatusCode = 400, Success = false, Message = ApiMessages.ValidationFailed, CorrelationId = CorrelationId });

            var data = await _slaService.BulkCreateSla(slaRequests, UserId);

            _logger.LogInformation("Bulk SLA creation completed. Success: {Count}, CorrelationId: {CorrelationId}", data.SuccessfulInserts, CorrelationId);

            return Ok(new ApiResponse<object>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Created,
                Data = data,
                CorrelationId = CorrelationId
            });
        }

        /// <summary>
        /// Retrieves SLA details by identifier.
        /// </summary>
        /// <param name="slaId">SLA identifier</param>
        /// <returns>SLA details</returns>
        [HttpGet("{slaId:int}")]
        public async Task<IActionResult> GetSlaById([FromRoute] int slaId)
        {
            _logger.LogInformation(
                "START GetSlaById | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
                slaId, CorrelationId);

            var data = await _slaService.GetSlaById(slaId);

            if (data == null)
            {
                _logger.LogWarning(
                    "SLA not found | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
                    slaId, CorrelationId);

                return NotFound(new ApiResponse<object>
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Success = false,
                    Message = ApiMessages.NotFound,
                    CorrelationId = CorrelationId
                });
            }

            _logger.LogInformation(
                "SUCCESS GetSlaById | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
                slaId, CorrelationId);

            _logger.LogInformation(
                "END GetSlaById | CorrelationId: {CorrelationId}",
                CorrelationId);

            return Ok(new ApiResponse<object>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Success,
                Data = data,
                CorrelationId = CorrelationId
            });
        }


        /// <summary>
        /// Updates an existing SLA record.
        /// </summary>
        /// <param name="slaId">SLA identifier</param>
        /// <param name="slaRequest">SLA update request payload</param>
        /// <returns>Update confirmation</returns>
        [HttpPut("{slaId:int}")]
        public async Task<IActionResult> UpdateSla(
     [FromRoute] int slaId,
     [FromBody] UpdateSlaRequest slaRequest)
        {
            _logger.LogInformation(
                "START UpdateSla | SlaId: {SlaId} | UserId: {UserId} | CorrelationId: {CorrelationId}",
                slaId, UserId, CorrelationId);

            await _slaService.UpdateSla(slaId, slaRequest, UserId);

            _logger.LogInformation(
                "SUCCESS UpdateSla | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
                slaId, CorrelationId);

            _logger.LogInformation(
                "END UpdateSla | CorrelationId: {CorrelationId}",
                CorrelationId);

            return Ok(new ApiResponse<object>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Updated,
                CorrelationId = CorrelationId
            });
        }


        /// <summary>
        /// Closes an SLA.
        /// </summary>
        /// <param name="slaId">SLA identifier</param>
        /// <returns>Closure confirmation</returns>
        [HttpPut("{slaId:int}/close")]
        public async Task<IActionResult> CloseSla([FromRoute] int slaId)
        {
            _logger.LogInformation(
                "START CloseSla | SlaId: {SlaId} | UserId: {UserId} | CorrelationId: {CorrelationId}",
                slaId, UserId, CorrelationId);

            await _slaService.CloseSla(slaId, UserId);

            _logger.LogInformation(
                "SUCCESS CloseSla | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
                slaId, CorrelationId);

            _logger.LogInformation(
                "END CloseSla | CorrelationId: {CorrelationId}",
                CorrelationId);

            return Ok(new ApiResponse<object>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Closed,
                CorrelationId = CorrelationId
            });
        }


        /// <summary>
        /// Reopens a closed SLA.
        /// </summary>
        /// <param name="slaId">SLA identifier</param>
        /// <param name="slaRequest">Reopen SLA request payload</param>
        /// <returns>Reopen result</returns>
        [HttpPut("{slaId:int}/reopen")]
        public async Task<IActionResult> ReopenSla(
      [FromRoute] int slaId,
      [FromBody] ReopenSlaRequest slaRequest)
        {
            _logger.LogInformation(
                "START ReopenSla | SlaId: {SlaId} | UserId: {UserId} | CorrelationId: {CorrelationId}",
                slaId, UserId, CorrelationId);

            var data = await _slaService.ReopenSla(
                slaId,
                slaRequest.ExtensionDays,
                slaRequest.ReopenReason,
                UserId);

            _logger.LogInformation(
                "SUCCESS ReopenSla | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
                slaId, CorrelationId);

            _logger.LogInformation(
                "END ReopenSla | CorrelationId: {CorrelationId}",
                CorrelationId);

            return Ok(new ApiResponse<ReopenSlaResponse>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Reopened,
                Data = data,
                CorrelationId = CorrelationId
            });
        }


        /// <summary>
        /// Retrieves SLA history records for a given SLA.
        /// </summary>
        /// <param name="slaid">SLA identifier</param>
        /// <returns>List of SLA history changes</returns>
        [HttpGet("{slaid:int}/history")]
        public async Task<IActionResult> GetSlaHistory([FromRoute] int slaid)
        {
            _logger.LogInformation(
                "START GetSlaHistory | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
                slaid, CorrelationId);

            var data = await _slaService.GetSlaHistory(slaid);

            _logger.LogInformation(
                "SUCCESS GetSlaHistory | SlaId: {SlaId} | Count: {Count} | CorrelationId: {CorrelationId}",
                slaid, data.Count, CorrelationId);

            _logger.LogInformation(
                "END GetSlaHistory | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
                slaid, CorrelationId);

            return Ok(new ApiResponse<List<SlaHistoryResponse>>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Success,
                Data = data,
                CorrelationId = CorrelationId
            });
        }


        /// <summary>
        /// Retrieves all SLAs assigned to a specific employee.
        /// </summary>
        /// <param name="employeeId">Unique identifier of the employee.</param>
        /// <returns>ApiResponse containing list of SLAs for the employee.</returns>
        /// <summary>
        /// Retrieves all SLAs assigned to a specific employee.
        /// </summary>
        /// <param name="employeeId">Unique identifier of the employee.</param>
        /// <returns>ApiResponse containing list of SLAs for the employee.</returns>
        [HttpGet("employee/{employeeId:int}")]
        public async Task<IActionResult> GetEmployeeSlas([FromRoute] int employeeId)
        {
            if (employeeId <= 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = ApiMessages.ValidationFailed,
                    CorrelationId = CorrelationId
                });
            }

            _logger.LogInformation(
                "START GetEmployeeSlas | EmployeeId: {EmployeeId} | CorrelationId: {CorrelationId}",
                employeeId, CorrelationId);

            var data = await _slaService.GetEmployeeSlas(employeeId);

            _logger.LogInformation(
                "SUCCESS GetEmployeeSlas | EmployeeId: {EmployeeId} | Count: {Count} | CorrelationId: {CorrelationId}",
                employeeId, data?.Count ?? 0, CorrelationId);

            _logger.LogInformation(
                "END GetEmployeeSlas | EmployeeId: {EmployeeId} | CorrelationId: {CorrelationId}",
                employeeId, CorrelationId);

            return Ok(new ApiResponse<List<SlaResponse>>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Success,
                Data = data,
                CorrelationId = CorrelationId
            });
        }


    }
}

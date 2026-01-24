using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;

namespace Relevantz.EEPZ.Api.Controllers.LnD
{
    /// <summary>
    /// HR Management - Organization-wide Views and Exports
    /// </summary>
    [ApiController]
    [Authorize(Roles = LnDConstants.USER_ROLES.HR)]
    public class LnDHRController : BaseLnDController
    {
        #region Dependencies

        private readonly ILnDHRService _hrService;
        private readonly ILnDSmeService _smeService;

        public LnDHRController(ILnDHRService hrService, ILnDSmeService smeService)
        {
            _hrService = hrService;
            _smeService = smeService;
        }

        #endregion

        #region Assignment Management

        /// <summary>
        /// Gets paginated organization-wide assignments with filtering and search (HR only)
        /// </summary>
        [HttpGet("api/lnd-hr/assignments/organization")]
        public async Task<IActionResult> GetAllOrganizationAssignments(
            [FromQuery] OrganizationAssignmentsRequestModel request
        )
        {
            Log.Information(
                "GetAllOrganizationAssignments API called. StatusFilter={StatusFilter}, Page={PageNumber}, PageSize={PageSize}",
                request.StatusFilter ?? "all",
                request.PageNumber,
                request.PageSize
            );

            var result = await _hrService.GetAllOrganizationAssignments(request);

            if (result.Success)
            {
                Log.Information(
                    "GetAllOrganizationAssignments API succeeded. TotalCount={TotalCount}",
                    result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetAllOrganizationAssignments API failed. Message={Message}",
                    result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>
        /// Exports all organization assignments to Excel file (HR only)
        /// </summary>
        [HttpGet("api/lnd-hr/assignments/organization/export")]
        public async Task<IActionResult> GetOrganizationAssignmentsForExport(
            [FromQuery] ExportOrganizationAssignmentsRequestModel request
        )
        {
            Log.Information(
                "GetOrganizationAssignmentsForExport API called. StatusFilter={StatusFilter}",
                request.StatusFilter ?? "all"
            );

            var result = await _hrService.GetOrganizationAssignmentsForExport(request);

            if (!result.Success)
            {
                Log.Warning(
                    "GetOrganizationAssignmentsForExport API failed. Message={Message}",
                    result.Message
                );
                return BadRequest(result);
            }

            var fileName = $"OrganizationalAssignments_{DateTime.Now:yyyyMMddHHmmss}.xlsx";

            Log.Information(
                "GetOrganizationAssignmentsForExport API succeeded. FileName={FileName}, FileSize={FileSize} bytes",
                fileName,
                result.Data.Length
            );

            return File(
                result.Data,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }

        #endregion

        #region Employee Management

        /// <summary>
        /// Gets paginated list of all organization employees with search capability (HR only)
        /// </summary>
        [HttpGet("api/lnd-hr/employees/organization")]
        public async Task<IActionResult> GetAllOrganizationEmployees(
            [FromQuery] OrganizationEmployeesRequestModel request
        )
        {
            Log.Information(
                "GetAllOrganizationEmployees API called. SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                request.SearchTerm ?? "none",
                request.PageNumber,
                request.PageSize
            );

            var result = await _hrService.GetAllOrganizationEmployees(request);

            if (result.Success)
            {
                Log.Information(
                    "GetAllOrganizationEmployees API succeeded. TotalCount={TotalCount}",
                    result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetAllOrganizationEmployees API failed. Message={Message}",
                    result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>
        /// Gets paginated skills for a specific employee by ID (HR only)
        /// </summary>
        [HttpGet("api/lnd-hr/skills/employee/{employeeId}")]
        public async Task<IActionResult> GetEmployeeSkillsById(
            int employeeId,
            [FromQuery] EmployeeSkillsByIdRequestModel request
        )
        {
            Log.Information(
                "GetEmployeeSkillsById API called. EmployeeId={EmployeeId}, Page={PageNumber}, SearchTerm={SearchTerm}",
                employeeId,
                request.PageNumber,
                request.SearchTerm ?? "none"
            );

            var result = await _hrService.GetEmployeeSkillsById(employeeId, request);

            if (result.Success)
            {
                Log.Information(
                    "GetEmployeeSkillsById API succeeded. EmployeeId={EmployeeId}, TotalCount={TotalCount}",
                    employeeId,
                    result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetEmployeeSkillsById API failed. EmployeeId={EmployeeId}, Message={Message}",
                    employeeId,
                    result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion

        #region SME Management

        /// <summary>
        /// Gets paginated list of all active SMEs with search capability (HR only)
        /// </summary>
        [HttpGet("api/lnd-hr/smes/all")]
        public async Task<IActionResult> GetAllActiveSmes(
            [FromQuery] ActiveSmesRequestModel request
        )
        {
            Log.Information(
                "GetAllActiveSmes API called. SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                request.SearchTerm ?? "none",
                request.PageNumber,
                request.PageSize
            );

            var result = await _smeService.GetAllActiveSmes(request);

            if (result.Success)
            {
                Log.Information(
                    "GetAllActiveSmes API succeeded. TotalCount={TotalCount}",
                    result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning("GetAllActiveSmes API failed. Message={Message}", result.Message);
                return BadRequest(result);
            }
        }

        /// <summary>
        /// Exports all active SMEs to Excel file (HR only)
        /// </summary>
        [HttpGet("api/lnd-hr/smes/export")]
        public async Task<IActionResult> GetAllActiveSmesForExport(
            [FromQuery] ExportActiveSmesRequestModel request
        )
        {
            Log.Information(
                "GetAllActiveSmesForExport API called. SearchTerm={SearchTerm}",
                request.SearchTerm ?? "none"
            );

            var result = await _smeService.GetAllActiveSmesForExport(request);

            if (!result.Success)
            {
                Log.Warning(
                    "GetAllActiveSmesForExport API failed. Message={Message}",
                    result.Message
                );
                return BadRequest(result);
            }

            var fileName = $"SMEDirectory_{DateTime.Now:yyyyMMddHHmmss}.xlsx";

            Log.Information(
                "GetAllActiveSmesForExport API succeeded. FileName={FileName}, FileSize={FileSize} bytes",
                fileName,
                result.Data.Length
            );

            return File(
                result.Data,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }

        #endregion
    }
}

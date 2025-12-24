using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;

namespace Relevantz.EEPZ.Api.Controllers.LnD
{
    /// <summary>
    /// HR Management - Organization-wide Views and Exports
    /// </summary>
    [ApiController]
    [Route("api/lnd-hr")]
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

        /// <summary>Gets paginated organization-wide assignments with filtering and search (HR only).</summary>
        [HttpGet("assignments/organization")]
        public async Task<IActionResult> GetAllOrganizationAssignments(
            [FromQuery] string? statusFilter,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortField,
            [FromQuery] string? sortOrder,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            Log.Information(
                "GetAllOrganizationAssignments API called. StatusFilter={StatusFilter}, Page={PageNumber}, PageSize={PageSize}",
                statusFilter ?? "all", pageNumber, pageSize
            );

            var result = await _hrService.GetAllOrganizationAssignments(
                statusFilter,
                searchTerm,
                sortField,
                sortOrder,
                pageNumber,
                pageSize
            );

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

        /// <summary>Exports all organization assignments to Excel file (HR only).</summary>
        [HttpGet("assignments/organization/export")]
        public async Task<IActionResult> ExportOrganizationAssignments(
            [FromQuery] string? statusFilter,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortField,
            [FromQuery] string? sortOrder
        )
        {
            Log.Information(
                "ExportOrganizationAssignments API called. StatusFilter={StatusFilter}",
                statusFilter ?? "all"
            );

            var result = await _hrService.ExportOrganizationAssignmentsToExcel(
                statusFilter,
                searchTerm,
                sortField,
                sortOrder
            );

            if (!result.Success)
            {
                Log.Warning(
                    "ExportOrganizationAssignments API failed. Message={Message}",
                    result.Message
                );
                return BadRequest(result);
            }

            var fileName = $"OrganizationalAssignments_{DateTime.Now:yyyyMMddHHmmss}.xlsx";

            Log.Information(
                "ExportOrganizationAssignments API succeeded. FileName={FileName}, FileSize={FileSize} bytes",
                fileName, result.Data.Length
            );

            return File(
                result.Data,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }

        #endregion

        #region Employee Management

        /// <summary>Gets paginated list of all organization employees with search capability (HR only).</summary>
        [HttpGet("employees/organization")]
        public async Task<IActionResult> GetAllOrganizationEmployees(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 9
        )
        {
            Log.Information(
                "GetAllOrganizationEmployees API called. SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                searchTerm ?? "none", pageNumber, pageSize
            );

            var result = await _hrService.GetAllOrganizationEmployees(
                searchTerm,
                pageNumber,
                pageSize
            );

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

        /// <summary>Gets paginated skills for a specific employee by ID (HR only).</summary>
        [HttpGet("skills/employee/{employeeId}")]
        public async Task<IActionResult> GetEmployeeSkillsById(
            int employeeId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] string? searchTerm = "",
            [FromQuery] string? sortBy = LnDConstants.DEFAULTS.SORT_BY_SKILL_NAME
        )
        {
            Log.Information(
                "GetEmployeeSkillsById API called. EmployeeId={EmployeeId}, Page={PageNumber}, SearchTerm={SearchTerm}",
                employeeId, pageNumber, searchTerm ?? "none"
            );

            var result = await _hrService.GetEmployeeSkillsById(
                employeeId,
                pageNumber,
                searchTerm,
                sortBy
            );

            if (result.Success)
            {
                Log.Information(
                    "GetEmployeeSkillsById API succeeded. EmployeeId={EmployeeId}, TotalCount={TotalCount}",
                    employeeId, result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetEmployeeSkillsById API failed. EmployeeId={EmployeeId}, Message={Message}",
                    employeeId, result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion

        #region SME Management

        /// <summary>Gets paginated list of all active SMEs with search capability (HR only).</summary>
        [HttpGet("smes/all")]
        public async Task<IActionResult> GetAllActiveSmes(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            Log.Information(
                "GetAllActiveSmes API called. SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                searchTerm ?? "none", pageNumber, pageSize
            );

            var result = await _smeService.GetAllActiveSmes(searchTerm, pageNumber, pageSize);

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
                Log.Warning(
                    "GetAllActiveSmes API failed. Message={Message}",
                    result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>Exports all active SMEs to Excel file (HR only).</summary>
        [HttpGet("smes/export")]
        public async Task<IActionResult> ExportAllActiveSmes([FromQuery] string? searchTerm)
        {
            Log.Information(
                "ExportAllActiveSmes API called. SearchTerm={SearchTerm}",
                searchTerm ?? "none"
            );

            var result = await _smeService.ExportAllActiveSmesToExcel(searchTerm);

            if (!result.Success)
            {
                Log.Warning(
                    "ExportAllActiveSmes API failed. Message={Message}",
                    result.Message
                );
                return BadRequest(result);
            }

            var fileName = $"SMEDirectory_{DateTime.Now:yyyyMMddHHmmss}.xlsx";

            Log.Information(
                "ExportAllActiveSmes API succeeded. FileName={FileName}, FileSize={FileSize} bytes",
                fileName, result.Data.Length
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

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Core.Services.Interface;

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
        private readonly ILnDService _lndService;

        public LnDHRController(ILnDService lndService)
        {
            _lndService = lndService;
        }

        [HttpGet("assignments/organization/export")]
        public async Task<IActionResult> ExportOrganizationAssignments(
            [FromQuery] string? statusFilter,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortField,
            [FromQuery] string? sortOrder
        )
        {
            var result = await _lndService.ExportOrganizationAssignmentsToExcel(
                statusFilter,
                searchTerm,
                sortField,
                sortOrder
            );

            if (!result.Success)
                return BadRequest(result);

            var fileName = $"OrganizationalAssignments_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
            return File(result.Data,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName);
        }

        [HttpGet("employees/organization")]
        public async Task<IActionResult> GetAllOrganizationEmployees(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 9
        )
        {
            var result = await _lndService.GetAllOrganizationEmployees(
                searchTerm,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("smes/export")]
        public async Task<IActionResult> ExportAllActiveSmes(
            [FromQuery] string? searchTerm
        )
        {
            var result = await _lndService.ExportAllActiveSmesToExcel(searchTerm);

            if (!result.Success)
                return BadRequest(result);

            var fileName = $"SMEDirectory_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
            return File(result.Data,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName);
        }

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
            var result = await _lndService.GetAllOrganizationAssignments(
                statusFilter,
                searchTerm,
                sortField,
                sortOrder,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("smes/all")]
        public async Task<IActionResult> GetAllActiveSmes(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var result = await _lndService.GetAllActiveSmes(searchTerm, pageNumber, pageSize);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("skills/employee/{employeeId}")]
        public async Task<IActionResult> GetEmployeeSkillsById(
            int employeeId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] string? searchTerm = "",
            [FromQuery] string? sortBy = LnDConstants.DEFAULTS.SORT_BY_SKILL_NAME
        )
        {
            var result = await _lndService.GetEmployeeSkillsById(
                employeeId,
                pageNumber,
                searchTerm,
                sortBy
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}

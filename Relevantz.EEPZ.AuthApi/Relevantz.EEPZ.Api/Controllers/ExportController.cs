using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class ExportController : ControllerBase
    {
        private readonly IExportService _exportService;

        public ExportController(IExportService exportService)
        {
            _exportService = exportService;
        }

        /// <summary>
        /// Export all roles to Excel
        /// </summary>
        [HttpGet("roles")]
        public async Task<IActionResult> ExportRoles()
        {
            try
            {
                var fileBytes = await _exportService.ExportRolesToExcelAsync();
                var fileName = $"Roles_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
                
                return File(fileBytes, 
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                    fileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = "Error exporting roles", error = ex.Message });
            }
        }

        /// <summary>
        /// Export all departments to Excel
        /// </summary>
        [HttpGet("departments")]
        public async Task<IActionResult> ExportDepartments()
        {
            try
            {
                var fileBytes = await _exportService.ExportDepartmentsToExcelAsync();
                var fileName = $"Departments_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
                
                return File(fileBytes, 
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                    fileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = "Error exporting departments", error = ex.Message });
            }
        }

        /// <summary>
        /// Export all users to Excel
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> ExportUsers()
        {
            try
            {
                var fileBytes = await _exportService.ExportUsersToExcelAsync();
                var fileName = $"Users_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
                
                return File(fileBytes, 
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                    fileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = "Error exporting users", error = ex.Message });
            }
        }

        /// <summary>
        /// Export all data (Roles, Departments, Users) in a single Excel file with multiple sheets
        /// </summary>
        [HttpGet("all-data")]
        public async Task<IActionResult> ExportAllData()
        {
            try
            {
                var fileBytes = await _exportService.ExportAllDataToExcelAsync();
                var fileName = $"EEPZ_Complete_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
                
                return File(fileBytes, 
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                    fileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = "Error exporting all data", error = ex.Message });
            }
        }
    }
}

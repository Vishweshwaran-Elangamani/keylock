using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Relevantz.EEPZ.Common.Utils;
namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class BulkOperationController : ControllerBase
    {
        private readonly IBulkOperationService _bulkOperationService;
        private readonly IExportService _exportService;
        public BulkOperationController(IBulkOperationService bulkOperationService, IExportService exportService)
        {
            _bulkOperationService = bulkOperationService;
            _exportService = exportService;
        }
        [HttpPost("bulk-create-users")]
        public async Task<IActionResult> BulkCreateUsers([FromBody] BulkUserCreateRequestDto request)
        {
            var performedByUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _bulkOperationService.BulkCreateUsersAsync(request.Users, performedByUserId);
            return Ok(result);
        }
        [HttpPost("bulk-inactivate-users")]
        public async Task<IActionResult> BulkInactivateUsers([FromBody] BulkUserInactivateRequestDto request)
        {
            var performedByUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _bulkOperationService.BulkInactivateUsersAsync(request, performedByUserId);
            return Ok(result);
        }
        [HttpPost("bulk-create-from-excel")]
        public async Task<IActionResult> BulkCreateUsersFromExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { success = false, message = "Please upload a valid Excel file" });
            // File validation
            var allowedExtensions = new[] { ".xlsx", ".xls" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
                return BadRequest(new { success = false, message = "Only .xlsx and .xls files are allowed" });
            // File size validation (5MB max)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { success = false, message = "File size exceeds 5MB limit" });
            var performedByUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            using var stream = file.OpenReadStream();
            var result = await _bulkOperationService.BulkCreateUsersFromExcelAsync(stream, performedByUserId);
            return Ok(result);
        }
        [HttpGet("download-template")]
        public async Task<IActionResult> DownloadExcelTemplate()
        {
            try
            {
                var templateBytes = await _bulkOperationService.GenerateExcelTemplateAsync();
                return File(
                    templateBytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"UserImportTemplate_{DateTime.UtcNow:yyyyMMdd}.xlsx"
                );
            }
            catch (Exception ex)
            {
                EEPZServiceLog.Error("Error downloading Excel template", ex);
                return StatusCode(500, "Failed to generate template");
            }
        }
        /// <summary>
        /// Export all roles to Excel
        /// </summary>
        [HttpGet("export/roles")]
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
        [HttpGet("export/departments")]
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
        [HttpGet("export/users")]
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
        [HttpGet("export/all-data")]
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

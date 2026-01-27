using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Provides admin-only endpoints for bulk user operations (create/inactivate),
    /// Excel-based imports, template downloads, and exporting master data.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class BulkOperationController : ControllerBase
    {
        private readonly IBulkOperationService _bulkOperationService;
        private readonly IExportService _exportService;

        /// <summary>
        /// Initializes a new instance of <see cref="BulkOperationController"/>.
        /// </summary>
        /// <param name="bulkOperationService">Service handling bulk user operations.</param>
        /// <param name="exportService">Service that builds Excel exports for master data.</param>
        public BulkOperationController(
            IBulkOperationService bulkOperationService,
            IExportService exportService)
        {
            _bulkOperationService = bulkOperationService;
            _exportService = exportService;
        }

        /// <summary>
        /// Creates multiple users in bulk.
        /// </summary>
        /// <param name="request">Payload containing the list of users to create.</param>
        /// <returns>
        /// 200 OK with the bulk operation result payload.
        /// </returns>
        [HttpPost("bulk-create-users")]
        public async Task<IActionResult> BulkCreateUsers([FromBody] BulkUserCreateRequestDto request)
        {
            if (!TryGetUserId(out var performedByUserId))
                return Unauthorized(new { success = false, message = "Invalid user context" });

            var result = await _bulkOperationService.BulkCreateUsersAsync(request.Users, performedByUserId);
            return Ok(result);
        }

        /// <summary>
        /// Inactivates multiple users in bulk.
        /// </summary>
        /// <param name="request">Payload containing user identifiers and optional reason.</param>
        /// <returns>
        /// 200 OK with the bulk inactivation result payload.
        /// </returns>
        [HttpPost("bulk-inactivate-users")]
        public async Task<IActionResult> BulkInactivateUsers([FromBody] BulkUserInactivateRequestDto request)
        {
            if (!TryGetUserId(out var performedByUserId))
                return Unauthorized(new { success = false, message = "Invalid user context" });

            var result = await _bulkOperationService.BulkInactivateUsersAsync(request, performedByUserId);
            return Ok(result);
        }

        /// <summary>
        /// Creates users in bulk from an uploaded Excel file.
        /// </summary>
        /// <param name="file">Excel file (.xlsx or .xls) containing user data in the expected template format.</param>
        /// <returns>
        /// 200 OK with the bulk creation result on success,
        /// 400 Bad Request if validation fails (missing/invalid file, size limit exceeded).
        /// </returns>
        [HttpPost("bulk-create-from-excel")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(5 * 1024 * 1024)] // enforce 5 MB at action level
        public async Task<IActionResult> BulkCreateUsersFromExcel([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { success = false, message = "Please upload a valid Excel file" });

            var allowedExtensions = new[] { ".xlsx", ".xls" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(fileExtension))
                return BadRequest(new { success = false, message = "Only .xlsx and .xls files are allowed" });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { success = false, message = "File size exceeds 5MB limit" });

            if (!TryGetUserId(out var performedByUserId))
                return Unauthorized(new { success = false, message = "Invalid user context" });

            using var stream = file.OpenReadStream();
            var result = await _bulkOperationService.BulkCreateUsersFromExcelAsync(stream, performedByUserId);

            return Ok(result);
        }

        /// <summary>
        /// Downloads the Excel template for bulk user import.
        /// </summary>
        /// <returns>
        /// A downloadable Excel file (.xlsx) with the required columns and sample data,
        /// or 500 Internal Server Error if generation fails.
        /// </returns>
        [HttpGet("download-template")]
        [Authorize]
        public async Task<IActionResult> DownloadExcelTemplate()
        {
            var templateBytes = await _bulkOperationService.GenerateExcelTemplateAsync();

            return File(
                templateBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"UserImportTemplate_{DateTime.UtcNow:yyyyMMdd}.xlsx"
            );
        }

        /// <summary>
        /// Exports all roles to an Excel file.
        /// </summary>
        /// <returns>
        /// A downloadable Excel file (.xlsx) containing the roles data,
        /// or 400 Bad Request with error details if export fails.
        /// </returns>
        [HttpGet("export/roles")]
        public async Task<IActionResult> ExportRoles()
        {
            var fileBytes = await _exportService.ExportRolesToExcelAsync();
            var fileName = $"Roles_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";

            return File(
                fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }

        /// <summary>
        /// Exports all departments to an Excel file.
        /// </summary>
        /// <returns>
        /// A downloadable Excel file (.xlsx) containing the departments data,
        /// or 400 Bad Request with error details if export fails.
        /// </returns>
        [HttpGet("export/departments")]
        public async Task<IActionResult> ExportDepartments()
        {
            var fileBytes = await _exportService.ExportDepartmentsToExcelAsync();
            var fileName = $"Departments_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";

            return File(
                fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }

        /// <summary>
        /// Exports all users to an Excel file.
        /// </summary>
        /// <returns>
        /// A downloadable Excel file (.xlsx) containing the users data,
        /// or 400 Bad Request with error details if export fails.
        /// </returns>
        [HttpGet("export/users")]
        public async Task<IActionResult> ExportUsers()
        {
            var fileBytes = await _exportService.ExportUsersToExcelAsync();
            var fileName = $"Users_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";

            return File(
                fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }

        /// <summary>
        /// Exports roles, departments, and users into a single Excel file with multiple sheets.
        /// </summary>
        /// <returns>
        /// A downloadable Excel file (.xlsx) with multiple worksheets,
        /// or 400 Bad Request with error details if export fails.
        /// </returns>
        [HttpGet("export/all-data")]
        public async Task<IActionResult> ExportAllData()
        {
            var fileBytes = await _exportService.ExportAllDataToExcelAsync();
            var fileName = $"EEPZ_Complete_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";

            return File(
                fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }

        // ---------- Helper (no flow change) ----------
        private bool TryGetUserId(out int userId)
        {
            userId = 0;
            var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(idStr, out userId) && userId > 0;
        }
    }
}
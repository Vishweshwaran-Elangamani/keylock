using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Common.Constants;
using FluentValidation;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class BulkOperationController : ControllerBase
    {
        private readonly IBulkOperationService _bulkOperationService;
        private readonly IExportService _exportService;
        private readonly IValidator<BulkUserCreateRequestDto> _bulkCreateValidator;
        private readonly IValidator<BulkUserInactivateRequestDto> _bulkInactivateValidator;

        public BulkOperationController(
            IBulkOperationService bulkOperationService,
            IExportService exportService,
            IValidator<BulkUserCreateRequestDto> bulkCreateValidator,
            IValidator<BulkUserInactivateRequestDto> bulkInactivateValidator)
        {
            _bulkOperationService = bulkOperationService;
            _exportService = exportService;
            _bulkCreateValidator = bulkCreateValidator;
            _bulkInactivateValidator = bulkInactivateValidator;
        }

        /// <summary>
        /// Adding Users in Bulk manner
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("bulk-create-users")]
        public async Task<IActionResult> BulkCreateUsers([FromBody] BulkUserCreateRequestDto request)
        {
            var validationResult = await _bulkCreateValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Validation failed",
                    errors = validationResult.Errors.Select(e => new
                    {
                        property = e.PropertyName,
                        error = e.ErrorMessage
                    })
                });
            }

            if (!TryGetUserId(out var performedByUserId))
                return Unauthorized(new { success = false, message = "Invalid user context" });

            var result = await _bulkOperationService.BulkCreateUsersAsync(request.Users, performedByUserId);
            return Ok(result);
        }

        /// <summary>
        /// Deactivating the users in Bulk manner
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("bulk-inactivate-users")]
        public async Task<IActionResult> BulkInactivateUsers([FromBody] BulkUserInactivateRequestDto request)
        {
            // Validate request payload (ensures user IDs and required fields are present/valid)
            var validationResult = await _bulkInactivateValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Validation failed",
                    errors = validationResult.Errors.Select(e => new
                    {
                        property = e.PropertyName,
                        error = e.ErrorMessage
                    })
                });
            }

            // Verify authenticated user context (used for audit: performedByUserId)
            if (!TryGetUserId(out var performedByUserId))
                return Unauthorized(new { success = false, message = "Invalid user context" });

            var result = await _bulkOperationService.BulkInactivateUsersAsync(request, performedByUserId);
            return Ok(result);
        }

        /// <summary>
        /// Add users in Bulk manner via Excel
        /// </summary>
        /// <param name="file"></param>
        /// <returns></returns>
        [HttpPost("bulk-create-from-excel")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(5 * 1024 * 1024)]
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
        /// Download Excel Template
        /// </summary>
        /// <returns></returns>
        [HttpGet("download-template")]
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
        /// Export Roles
        /// </summary>
        /// <returns></returns>
        [HttpGet("export/roles")]
        public async Task<IActionResult> ExportRoles()
        {
            var fileBytes = await _exportService.ExportRolesToExcelAsync();
            var password = _exportService.GetLastExportPassword();
            var fileName = $"Roles_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            
            Response.Headers.Add("X-Export-Password", password);
            
            return File(
                fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }

        /// <summary>
        /// Export Department
        /// </summary>
        /// <returns></returns>
        [HttpGet("export/departments")]
        public async Task<IActionResult> ExportDepartments()
        {
            var fileBytes = await _exportService.ExportDepartmentsToExcelAsync();
            var password = _exportService.GetLastExportPassword();
            var fileName = $"Departments_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            
            Response.Headers.Add("X-Export-Password", password);
            
            return File(
                fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }

        /// <summary>
        /// Export users
        /// </summary>
        /// <returns></returns>
        [HttpGet("export/users")]
        public async Task<IActionResult> ExportUsers()
        {
            var fileBytes = await _exportService.ExportUsersToExcelAsync();
            var password = _exportService.GetLastExportPassword();
            var fileName = $"Users_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            
            Response.Headers.Add("X-Export-Password", password);
            
            return File(
                fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }

        /// <summary>
        /// Export users, Roles and department
        /// </summary>
        /// <returns></returns>
        [HttpGet("export/all-data")]
        public async Task<IActionResult> ExportAllData()
        {
            var fileBytes = await _exportService.ExportAllDataToExcelAsync();
            var password = _exportService.GetLastExportPassword();
            var fileName = $"EEPZ_Complete_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
            
            Response.Headers.Add("X-Export-Password", password);
            
            return File(
                fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }

        private bool TryGetUserId(out int userId)
        {
            userId = 0;
            var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(idStr, out userId) && userId > 0;
        }
    }
}


using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class BulkOperationController : ControllerBase
    {
        private readonly IBulkOperationService _bulkOperationService;

        public BulkOperationController(IBulkOperationService bulkOperationService)
        {
            _bulkOperationService = bulkOperationService;
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
        public IActionResult DownloadExcelTemplate()
        {
            try
            {
                var fileBytes = _bulkOperationService.GenerateExcelTemplate();
                
                var fileName = $"BulkUserImportTemplate_{DateTime.UtcNow:yyyyMMddHHmmss}.xlsx";
                
                return File(
                    fileBytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    fileName
                );
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error generating Excel template", error = ex.Message });
            }
        }
    }
}

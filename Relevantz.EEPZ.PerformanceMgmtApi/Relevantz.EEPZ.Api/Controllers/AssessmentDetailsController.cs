using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssessmentDetailsController : ControllerBase
    {
        private readonly IAssessmentDetailsService _assessmentDetailsService;
        private readonly ILogger<AssessmentDetailsController> _logger;

        public AssessmentDetailsController(
            IAssessmentDetailsService assessmentDetailsService,
            ILogger<AssessmentDetailsController> logger)
        {
            _assessmentDetailsService = assessmentDetailsService;
            _logger = logger;
        }

        [HttpGet("all-details")]
        public async Task<IActionResult> GetAllDetails()
        {
            try
            {
                var result = await _assessmentDetailsService.GetAllDetailsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all assessment details");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("hrattachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadHrAttachment(int attachmentId)
        {
            try
            {
                var result = await _assessmentDetailsService.GetHrAttachmentAsync(attachmentId);

                if (!result.Success || result.FileBytes == null)
                {
                    return NotFound(new { success = false, message = result.ErrorMessage ?? "Attachment not found" });
                }

                return File(
                    result.FileBytes,
                    result.ContentType ?? "application/octet-stream",
                    result.FileName
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading HR attachment {AttachmentId}", attachmentId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}

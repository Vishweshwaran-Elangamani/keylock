using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace EepzBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PeerFeedbackQueueController : ControllerBase
    {
        private readonly IPeerFeedbackQueueService _service;

        public PeerFeedbackQueueController(IPeerFeedbackQueueService service)
        {
            _service = service;
        }

        /// <summary>
        /// Creates a new peer feedback entry in the queue.
        /// </summary>
        /// <param name="dto">Peer feedback request DTO containing submitter, recipient, and content.</param>
        /// <returns>Response containing the created peer feedback item.</returns>
        [HttpPost("create")]
        public async Task<IActionResult> CreatePeerFeedback(CreatePeerFeedbackRequestDto dto)
        {
            var result = await _service.CreatePeerFeedbackAsync(dto);
            return Ok(ApiResponseDto<PeerFeedbackQueueResponseDto>.SuccessResponse(result, "Peer feedback created"));
        }

        /// <summary>
        /// Retrieves a specific peer feedback queue item by its ID.
        /// </summary>
        /// <param name="queueId">Queue item identifier.</param>
        /// <returns>Response containing the peer feedback item.</returns>
        [HttpGet("{queueId}")]
        public async Task<IActionResult> GetQueueItem(int queueId)
        {
            var result = await _service.GetQueueItemByIdAsync(queueId);
            return Ok(ApiResponseDto<PeerFeedbackQueueResponseDto>.SuccessResponse(result));
        }

        /// <summary>
        /// Retrieves all pending peer feedback items.
        /// </summary>
        /// <returns>List of pending peer feedback items.</returns>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingFeedback()
        {
            var result = await _service.GetPendingFeedbackAsync();
            return Ok(ApiResponseDto<List<PeerFeedbackQueueResponseDto>>.SuccessResponse(result));
        }

        /// <summary>
        /// Retrieves all approved peer feedback items.
        /// </summary>
        /// <returns>List of approved peer feedback items.</returns>
        [HttpGet("approved")]
        public async Task<IActionResult> GetApprovedFeedback()
        {
            var result = await _service.GetApprovedFeedbackAsync();
            return Ok(ApiResponseDto<List<PeerFeedbackQueueResponseDto>>.SuccessResponse(result));
        }

        /// <summary>
        /// Retrieves all peer feedback records with pagination.
        /// </summary>
        /// <param name="pageNumber">Page number (default = 1).</param>
        /// <param name="pageSize">Page size (default = 20).</param>
        /// <returns>Paginated list of peer feedback items.</returns>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllPeerFeedback([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            // Inline comment: Default values ensure predictable pagination when client does not specify parameters.
            var result = await _service.GetAllPeerFeedbackAsync(pageNumber, pageSize);
            return Ok(ApiResponseDto<List<PeerFeedbackQueueResponseDto>>.SuccessResponse(result));
        }

        /// <summary>
        /// Approves a peer feedback item.
        /// </summary>
        /// <param name="queueId">Queue item identifier.</param>
        /// <param name="isProfessional">Indicates if feedback is professional.</param>
        /// <param name="isRelevant">Indicates if feedback is relevant.</param>
        /// <param name="approvedByHRId">HR employee ID approving the feedback.</param>
        /// <returns>Boolean indicating success.</returns>
        [HttpPost("{queueId}/approve")]
        public async Task<IActionResult> ApprovePeerFeedback(int queueId, [FromQuery] bool isProfessional, [FromQuery] bool isRelevant, [FromQuery] int approvedByHRId)
        {
            // Inline comment: Query parameters capture HR evaluation criteria for maintainability.
            var result = await _service.ApprovePeerFeedbackAsync(queueId, isProfessional, isRelevant, approvedByHRId);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Peer feedback approved"));
        }

        /// <summary>
        /// Rejects a peer feedback item.
        /// </summary>
        /// <param name="queueId">Queue item identifier.</param>
        /// <param name="rejectedByHRId">HR employee ID rejecting the feedback.</param>
        /// <returns>Boolean indicating success.</returns>
        [HttpPost("{queueId}/reject")]
        public async Task<IActionResult> RejectPeerFeedback(int queueId, [FromQuery] int rejectedByHRId)
        {
            // Inline comment: rejectedByHRId ensures traceability of HR decision.
            var result = await _service.RejectPeerFeedbackAsync(queueId, rejectedByHRId);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Peer feedback rejected"));
        }

        /// <summary>
        /// Deletes a peer feedback queue item.
        /// </summary>
        /// <param name="queueId">Queue item identifier.</param>
        /// <returns>Boolean indicating success.</returns>
        [HttpDelete("{queueId}")]
        public async Task<IActionResult> DeleteQueueItem(int queueId)
        {
            var result = await _service.DeleteQueueItemAsync(queueId);
            // Inline comment: Logging uses warning level to highlight deletion events without treating them as errors.
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Queue item deleted"));
        }
    }
}

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

        [HttpPost("create")]
        public async Task<IActionResult> CreatePeerFeedback(CreatePeerFeedbackRequestDto dto)
        {
            var result = await _service.CreatePeerFeedbackAsync(dto);
            return Ok(ApiResponseDto<PeerFeedbackQueueResponseDto>.SuccessResponse(result, "Peer feedback created"));
        }

        [HttpGet("{queueId}")]
        public async Task<IActionResult> GetQueueItem(int queueId)
        {
            var result = await _service.GetQueueItemByIdAsync(queueId);
            return Ok(ApiResponseDto<PeerFeedbackQueueResponseDto>.SuccessResponse(result));
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingFeedback()
        {
            var result = await _service.GetPendingFeedbackAsync();
            return Ok(ApiResponseDto<List<PeerFeedbackQueueResponseDto>>.SuccessResponse(result));
        }

        [HttpGet("approved")]
        public async Task<IActionResult> GetApprovedFeedback()
        {
            var result = await _service.GetApprovedFeedbackAsync();
            return Ok(ApiResponseDto<List<PeerFeedbackQueueResponseDto>>.SuccessResponse(result));
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllPeerFeedback([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _service.GetAllPeerFeedbackAsync(pageNumber, pageSize);
            return Ok(ApiResponseDto<List<PeerFeedbackQueueResponseDto>>.SuccessResponse(result));
        }

        [HttpPost("{queueId}/approve")]
        public async Task<IActionResult> ApprovePeerFeedback(int queueId, [FromQuery] bool isProfessional, [FromQuery] bool isRelevant, [FromQuery] int approvedByHRId)
        {
            var result = await _service.ApprovePeerFeedbackAsync(queueId, isProfessional, isRelevant, approvedByHRId);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Peer feedback approved"));
        }

        [HttpPost("{queueId}/reject")]
        public async Task<IActionResult> RejectPeerFeedback(int queueId, [FromQuery] int rejectedByHRId)
        {
            var result = await _service.RejectPeerFeedbackAsync(queueId, rejectedByHRId);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Peer feedback rejected"));
        }

        [HttpDelete("{queueId}")]
        public async Task<IActionResult> DeleteQueueItem(int queueId)
        {
            var result = await _service.DeleteQueueItemAsync(queueId);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Queue item deleted"));
        }
    }
}

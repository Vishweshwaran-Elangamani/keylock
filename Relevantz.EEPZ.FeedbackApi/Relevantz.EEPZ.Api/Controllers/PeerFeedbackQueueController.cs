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
        public async Task<ApiResponseDto<PeerFeedbackQueueResponseDto>> CreatePeerFeedback(CreatePeerFeedbackRequestDto dto)
        {
            try
            {
                var result = await _service.CreatePeerFeedbackAsync(dto);
                return ApiResponseDto<PeerFeedbackQueueResponseDto>.SuccessResponse(result, "Peer feedback created");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<PeerFeedbackQueueResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("{queueId}")]
        public async Task<ApiResponseDto<PeerFeedbackQueueResponseDto>> GetQueueItem(int queueId)
        {
            try
            {
                var result = await _service.GetQueueItemByIdAsync(queueId);
                return ApiResponseDto<PeerFeedbackQueueResponseDto>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<PeerFeedbackQueueResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("pending")]
        public async Task<ApiResponseDto<List<PeerFeedbackQueueResponseDto>>> GetPendingFeedback()
        {
            try
            {
                var result = await _service.GetPendingFeedbackAsync();
                return ApiResponseDto<List<PeerFeedbackQueueResponseDto>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<PeerFeedbackQueueResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("approved")]
        public async Task<ApiResponseDto<List<PeerFeedbackQueueResponseDto>>> GetApprovedFeedback()
        {
            try
            {
                var result = await _service.GetApprovedFeedbackAsync();
                return ApiResponseDto<List<PeerFeedbackQueueResponseDto>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<PeerFeedbackQueueResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("all")]
        public async Task<ApiResponseDto<List<PeerFeedbackQueueResponseDto>>> GetAllPeerFeedback([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _service.GetAllPeerFeedbackAsync(pageNumber, pageSize);
                return ApiResponseDto<List<PeerFeedbackQueueResponseDto>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<PeerFeedbackQueueResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpPost("{queueId}/approve")]
        public async Task<ApiResponseDto<bool>> ApprovePeerFeedback(int queueId, [FromQuery] bool isProfessional, [FromQuery] bool isRelevant, [FromQuery] int approvedByHRId)
        {
            try
            {
                var result = await _service.ApprovePeerFeedbackAsync(queueId, isProfessional, isRelevant, approvedByHRId);
                return ApiResponseDto<bool>.SuccessResponse(result, "Peer feedback approved");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpPost("{queueId}/reject")]
        public async Task<ApiResponseDto<bool>> RejectPeerFeedback(int queueId, [FromQuery] int rejectedByHRId)
        {
            try
            {
                var result = await _service.RejectPeerFeedbackAsync(queueId, rejectedByHRId);
                return ApiResponseDto<bool>.SuccessResponse(result, "Peer feedback rejected");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpDelete("{queueId}")]
        public async Task<ApiResponseDto<bool>> DeleteQueueItem(int queueId)
        {
            try
            {
                var result = await _service.DeleteQueueItemAsync(queueId);
                return ApiResponseDto<bool>.SuccessResponse(result, "Queue item deleted");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }
    }
}

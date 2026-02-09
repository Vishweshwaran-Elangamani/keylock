using Microsoft.Extensions.Logging;
using Mapster;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class PeerFeedbackQueueService : IPeerFeedbackQueueService
    {
        private readonly IPeerFeedbackQueueRepository _queueRepo;
        private readonly ILogger<PeerFeedbackQueueService> _logger;

        public PeerFeedbackQueueService(IPeerFeedbackQueueRepository queueRepo, ILogger<PeerFeedbackQueueService> logger)
        {
            _queueRepo = queueRepo;
            _logger = logger;
        }

        public async Task<PeerFeedbackQueueResponseDto?> CreatePeerFeedbackAsync(CreatePeerFeedbackRequestDto dto)
        {
            var feedback = dto.Adapt<Peerfeedbackqueue>();
            var queueId = await _queueRepo.CreatePeerFeedbackAsync(feedback);

            _logger.LogInformation("Peer feedback created in queue: {QueueId}", queueId);
            return await GetQueueItemByIdAsync(queueId);
        }

        public async Task<PeerFeedbackQueueResponseDto?> GetQueueItemByIdAsync(int queueId)
        {
            if (queueId <= 0) return null;

            var feedback = await _queueRepo.GetQueueItemByIdAsync(queueId);
            return feedback?.Adapt<PeerFeedbackQueueResponseDto>();
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetPendingFeedbackAsync()
            => (await _queueRepo.GetPendingFeedbackAsync()).Adapt<List<PeerFeedbackQueueResponseDto>>();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetUnderReviewFeedbackAsync()
            => (await _queueRepo.GetUnderReviewFeedbackAsync()).Adapt<List<PeerFeedbackQueueResponseDto>>();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetApprovedFeedbackAsync()
            => (await _queueRepo.GetApprovedFeedbackAsync()).Adapt<List<PeerFeedbackQueueResponseDto>>();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetRejectedFeedbackAsync()
            => (await _queueRepo.GetRejectedFeedbackAsync()).Adapt<List<PeerFeedbackQueueResponseDto>>();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackByRecipientAsync(int employeeId)
            => employeeId <= 0
                ? new()
                : (await _queueRepo.GetFeedbackByRecipientAsync(employeeId)).Adapt<List<PeerFeedbackQueueResponseDto>>();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackBySubmitterAsync(int employeeId)
            => employeeId <= 0
                ? new()
                : (await _queueRepo.GetFeedbackBySubmitterAsync(employeeId)).Adapt<List<PeerFeedbackQueueResponseDto>>();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetAllPeerFeedbackAsync(int pageNumber = 1, int pageSize = 20)
            => (await _queueRepo.GetAllPeerFeedbackAsync(pageNumber, pageSize)).Adapt<List<PeerFeedbackQueueResponseDto>>();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackByStatusAsync(string status)
            => string.IsNullOrWhiteSpace(status)
                ? new()
                : (await _queueRepo.GetFeedbackByStatusAsync(status)).Adapt<List<PeerFeedbackQueueResponseDto>>();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetAnonymousPeerFeedbackAsync()
            => (await _queueRepo.GetAnonymousPeerFeedbackAsync()).Adapt<List<PeerFeedbackQueueResponseDto>>();

        public async Task<PeerFeedbackQueueResponseDto?> UpdatePeerFeedbackAsync(int queueId, UpdatePeerFeedbackRequestDto dto)
        {
            if (queueId <= 0 || dto == null) return null;

            var feedback = await _queueRepo.GetQueueItemByIdAsync(queueId);
            if (feedback == null ||
                !string.Equals(feedback.Status, PeerFeedbackConstants.Status.Pending, StringComparison.OrdinalIgnoreCase))
                return null;

            dto.Adapt(feedback);

            await _queueRepo.UpdatePeerFeedbackAsync(feedback);
            _logger.LogInformation("Peer feedback updated: {QueueId}", queueId);

            return await GetQueueItemByIdAsync(queueId);
        }

        public async Task<bool> ApprovePeerFeedbackAsync(int queueId, bool isProfessional, bool isRelevant, int approvedByHRId)
            => queueId <= 0 || approvedByHRId <= 0
                ? false
                : await _queueRepo.ApprovePeerFeedbackAsync(queueId, isProfessional, isRelevant, approvedByHRId);

        public async Task<bool> RejectPeerFeedbackAsync(int queueId, int rejectedByHRId)
            => queueId <= 0 || rejectedByHRId <= 0
                ? false
                : await _queueRepo.RejectPeerFeedbackAsync(queueId, rejectedByHRId);

        public async Task<bool> UpdateFeedbackStatusAsync(int queueId, string newStatus)
            => queueId <= 0 || string.IsNullOrWhiteSpace(newStatus)
                ? false
                : await _queueRepo.UpdateFeedbackStatusAsync(queueId, newStatus);

        public async Task<bool> DeleteQueueItemAsync(int queueId)
            => queueId <= 0 ? false : await _queueRepo.DeleteQueueItemAsync(queueId);

        public async Task<bool> QueueItemExistsAsync(int queueId)
            => queueId > 0 && await _queueRepo.QueueItemExistsAsync(queueId);
    }
}

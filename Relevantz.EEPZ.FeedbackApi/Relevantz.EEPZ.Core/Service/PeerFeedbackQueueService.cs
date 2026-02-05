using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.Extensions.Logging;

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

        public async Task<PeerFeedbackQueueResponseDto> CreatePeerFeedbackAsync(CreatePeerFeedbackRequestDto dto)
        {
            if (dto.SubmittedByEmployeeId <= 0)
                throw new ArgumentException("SubmittedByEmployeeId must be valid");
            if (dto.RecipientEmployeeId <= 0)
                throw new ArgumentException("RecipientEmployeeId must be valid");
            if (string.IsNullOrEmpty(dto.FeedbackContent))
                throw new ArgumentException("FeedbackContent is required");

            _logger.LogInformation("Creating peer feedback. Submitter: {SubmitterId}, Recipient: {RecipientId}, Anonymous: {IsAnon}",
                dto.SubmittedByEmployeeId, dto.RecipientEmployeeId, dto.IsAnonymous);

            var feedback = new Peerfeedbackqueue
            {
                SubmittedByEmployeeId = dto.SubmittedByEmployeeId,
                RecipientEmployeeId = dto.RecipientEmployeeId,
                FeedbackContent = dto.FeedbackContent,
                IsAnonymous = dto.IsAnonymous,
                Status = "Pending"
            };

            var queueId = await _queueRepo.CreatePeerFeedbackAsync(feedback);

            _logger.LogInformation("Peer feedback queued successfully. QueueId: {QueueId}", queueId);

            return await GetQueueItemByIdAsync(queueId);
        }

        public async Task<PeerFeedbackQueueResponseDto> GetQueueItemByIdAsync(int queueId)
        {
            _logger.LogDebug("Fetching peer feedback. QueueId: {QueueId}", queueId);

            var feedback = await _queueRepo.GetQueueItemByIdAsync(queueId);
            if (feedback == null)
                throw new KeyNotFoundException($"Peer feedback queue item {queueId} not found");

            return MapToResponseDto(feedback);
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetPendingFeedbackAsync() =>
            (await _queueRepo.GetPendingFeedbackAsync()).Select(MapToResponseDto).ToList();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetUnderReviewFeedbackAsync() =>
            (await _queueRepo.GetUnderReviewFeedbackAsync()).Select(MapToResponseDto).ToList();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetApprovedFeedbackAsync() =>
            (await _queueRepo.GetApprovedFeedbackAsync()).Select(MapToResponseDto).ToList();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetRejectedFeedbackAsync() =>
            (await _queueRepo.GetRejectedFeedbackAsync()).Select(MapToResponseDto).ToList();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackByRecipientAsync(int employeeId) =>
            (await _queueRepo.GetFeedbackByRecipientAsync(employeeId)).Select(MapToResponseDto).ToList();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackBySubmitterAsync(int employeeId) =>
            (await _queueRepo.GetFeedbackBySubmitterAsync(employeeId)).Select(MapToResponseDto).ToList();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetAllPeerFeedbackAsync(int pageNumber = 1, int pageSize = 20) =>
            (await _queueRepo.GetAllPeerFeedbackAsync(pageNumber, pageSize)).Select(MapToResponseDto).ToList();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackByStatusAsync(string status) =>
            (await _queueRepo.GetFeedbackByStatusAsync(status)).Select(MapToResponseDto).ToList();

        public async Task<List<PeerFeedbackQueueResponseDto>> GetAnonymousPeerFeedbackAsync() =>
            (await _queueRepo.GetAnonymousPeerFeedbackAsync()).Select(MapToResponseDto).ToList();

        public async Task<PeerFeedbackQueueResponseDto> UpdatePeerFeedbackAsync(int queueId, UpdatePeerFeedbackRequestDto dto)
        {
            var feedback = await _queueRepo.GetQueueItemByIdAsync(queueId);
            if (feedback == null)
                throw new KeyNotFoundException($"Peer feedback queue item {queueId} not found");

            if (feedback.Status != "Pending")
                throw new InvalidOperationException($"Cannot edit feedback in {feedback.Status} status");

            if (!string.IsNullOrEmpty(dto.FeedbackContent))
                feedback.FeedbackContent = dto.FeedbackContent;

            await _queueRepo.UpdatePeerFeedbackAsync(feedback);

            _logger.LogInformation("Peer feedback updated. QueueId: {QueueId}", queueId);

            return await GetQueueItemByIdAsync(queueId);
        }

        public async Task<bool> ApprovePeerFeedbackAsync(int queueId, bool isProfessional, bool isRelevant, int approvedByHRId)
        {
            var result = await _queueRepo.ApprovePeerFeedbackAsync(queueId, isProfessional, isRelevant, approvedByHRId);

            if (result)
                _logger.LogInformation("Peer feedback approved. QueueId: {QueueId}, HRId: {HRId}", queueId, approvedByHRId);

            return result;
        }

        public async Task<bool> RejectPeerFeedbackAsync(int queueId, int rejectedByHRId)
        {
            var result = await _queueRepo.RejectPeerFeedbackAsync(queueId, rejectedByHRId);

            if (result)
                _logger.LogInformation("Peer feedback rejected. QueueId: {QueueId}, HRId: {HRId}", queueId, rejectedByHRId);

            return result;
        }

        public async Task<bool> UpdateFeedbackStatusAsync(int queueId, string newStatus)
        {
            var result = await _queueRepo.UpdateFeedbackStatusAsync(queueId, newStatus);

            if (result)
                _logger.LogInformation("Peer feedback status updated. QueueId: {QueueId}, Status: {Status}", queueId, newStatus);

            return result;
        }

        public async Task<bool> DeleteQueueItemAsync(int queueId)
        {
            var result = await _queueRepo.DeleteQueueItemAsync(queueId);

            if (result)
                _logger.LogWarning("Peer feedback deleted. QueueId: {QueueId}", queueId);

            return result;
        }

        public async Task<bool> QueueItemExistsAsync(int queueId) =>
            await _queueRepo.QueueItemExistsAsync(queueId);

        private PeerFeedbackQueueResponseDto MapToResponseDto(Peerfeedbackqueue feedback)
        {
            return new PeerFeedbackQueueResponseDto
            {
                QueueId = feedback.QueueId,
                SubmittedByEmployeeId = feedback.SubmittedByEmployeeId,
                SubmitterName = feedback.SubmittedByEmployee != null ? $"{feedback.SubmittedByEmployee.EmployeeId}" : "Anonymous",
                RecipientEmployeeId = feedback.RecipientEmployeeId,
                RecipientName = feedback.RecipientEmployee != null ? $"{feedback.RecipientEmployee.EmployeeId}" : "Unknown",
                FeedbackContent = feedback.FeedbackContent,
                IsAnonymous = feedback.IsAnonymous,
                IsProfessional = feedback.IsProfessional,
                IsRelevant = feedback.IsRelevant,
                ApprovedByHRId = feedback.ApprovedByHrid,
                ApprovedByHRName = feedback.ApprovedByHr != null ? $"{feedback.ApprovedByHr.EmployeeId}" : "Unknown",
                Status = feedback.Status,
                CreatedAt = feedback.CreatedAt,
                ApprovedAt = feedback.ApprovedAt
            };
        }
    }
}

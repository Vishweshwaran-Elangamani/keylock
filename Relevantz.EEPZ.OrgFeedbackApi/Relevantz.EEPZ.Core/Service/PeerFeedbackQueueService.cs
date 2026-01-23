using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class PeerFeedbackQueueService : IPeerFeedbackQueueService
    {
        private readonly IPeerFeedbackQueueRepository _queueRepo;
        private readonly ILogger<PeerFeedbackQueueService> _logger;


        public PeerFeedbackQueueService(
            IPeerFeedbackQueueRepository queueRepo,
            ILogger<PeerFeedbackQueueService> logger)
        {
            _queueRepo = queueRepo ?? throw new ArgumentNullException(nameof(queueRepo));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<PeerFeedbackQueueResponseDto?> CreatePeerFeedbackAsync(CreatePeerFeedbackRequestDto dto)
        {


            var feedback = new Peerfeedbackqueue
            {
                SubmittedByEmployeeId = dto.SubmittedByEmployeeId,
                RecipientEmployeeId = dto.RecipientEmployeeId,
                FeedbackContent = dto.FeedbackContent,
                IsAnonymous = dto.IsAnonymous,
                Status = PeerFeedbackConstants.Status.Pending
            };

            var queueId = await _queueRepo.CreatePeerFeedbackAsync(feedback);
            _logger.LogInformation("Peer feedback created in queue: {QueueId}", queueId);

            return await GetQueueItemByIdAsync(queueId);
        }

        public async Task<PeerFeedbackQueueResponseDto?> GetQueueItemByIdAsync(int queueId)
        {
            if (queueId <= 0)
                return null;

            var feedback = await _queueRepo.GetQueueItemByIdAsync(queueId);
            return feedback == null ? null : MapToResponseDto(feedback);
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetPendingFeedbackAsync()
        {
            var feedbacks = await _queueRepo.GetPendingFeedbackAsync();
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetUnderReviewFeedbackAsync()
        {
            var feedbacks = await _queueRepo.GetUnderReviewFeedbackAsync();
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetApprovedFeedbackAsync()
        {
            var feedbacks = await _queueRepo.GetApprovedFeedbackAsync();
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetRejectedFeedbackAsync()
        {
            var feedbacks = await _queueRepo.GetRejectedFeedbackAsync();
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackByRecipientAsync(int employeeId)
        {
            if (employeeId <= 0)
                return new List<PeerFeedbackQueueResponseDto>();

            var feedbacks = await _queueRepo.GetFeedbackByRecipientAsync(employeeId);
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackBySubmitterAsync(int employeeId)
        {
            if (employeeId <= 0)
                return new List<PeerFeedbackQueueResponseDto>();

            var feedbacks = await _queueRepo.GetFeedbackBySubmitterAsync(employeeId);
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetAllPeerFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            var feedbacks = await _queueRepo.GetAllPeerFeedbackAsync(pageNumber, pageSize);
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return new List<PeerFeedbackQueueResponseDto>();

            var feedbacks = await _queueRepo.GetFeedbackByStatusAsync(status);
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetAnonymousPeerFeedbackAsync()
        {
            var feedbacks = await _queueRepo.GetAnonymousPeerFeedbackAsync();
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<PeerFeedbackQueueResponseDto?> UpdatePeerFeedbackAsync(int queueId, UpdatePeerFeedbackRequestDto dto)
        {
            if (queueId <= 0 || dto == null)
                return null;

            var feedback = await _queueRepo.GetQueueItemByIdAsync(queueId);
            if (feedback == null)
                return null;

            if (!string.Equals(feedback.Status, PeerFeedbackConstants.Status.Pending, StringComparison.OrdinalIgnoreCase))
                return null;

            if (!string.IsNullOrWhiteSpace(dto.FeedbackContent))
                feedback.FeedbackContent = dto.FeedbackContent;

            await _queueRepo.UpdatePeerFeedbackAsync(feedback);
            _logger.LogInformation("Peer feedback updated: {QueueId}", queueId);

            return await GetQueueItemByIdAsync(queueId);
        }

        public async Task<bool> ApprovePeerFeedbackAsync(int queueId, bool isProfessional, bool isRelevant, int approvedByHRId)
        {
            if (queueId <= 0 || approvedByHRId <= 0)
                return false;

            var result = await _queueRepo.ApprovePeerFeedbackAsync(queueId, isProfessional, isRelevant, approvedByHRId);

            if (result)
                _logger.LogInformation("Peer feedback approved: {QueueId}", queueId);

            return result;
        }

        public async Task<bool> RejectPeerFeedbackAsync(int queueId, int rejectedByHRId)
        {
            if (queueId <= 0 || rejectedByHRId <= 0)
                return false;

            var result = await _queueRepo.RejectPeerFeedbackAsync(queueId, rejectedByHRId);

            if (result)
                _logger.LogInformation("Peer feedback rejected: {QueueId}", queueId);

            return result;
        }

        public async Task<bool> UpdateFeedbackStatusAsync(int queueId, string newStatus)
        {
            if (queueId <= 0 || string.IsNullOrWhiteSpace(newStatus))
                return false;

            var result = await _queueRepo.UpdateFeedbackStatusAsync(queueId, newStatus);

            if (result)
                _logger.LogInformation("Peer feedback status updated: {QueueId} -> {Status}", queueId, newStatus);

            return result;
        }

        public async Task<bool> DeleteQueueItemAsync(int queueId)
        {
            if (queueId <= 0)
                return false;

            var result = await _queueRepo.DeleteQueueItemAsync(queueId);

            if (result)
                _logger.LogInformation("Peer feedback deleted: {QueueId}", queueId);

            return result;
        }

        public async Task<bool> QueueItemExistsAsync(int queueId)
        {
            if (queueId <= 0)
                return false;

            return await _queueRepo.QueueItemExistsAsync(queueId);
        }

        private static PeerFeedbackQueueResponseDto MapToResponseDto(Peerfeedbackqueue feedback)
        {
            return new PeerFeedbackQueueResponseDto
            {
                QueueId = feedback.QueueId,
                SubmittedByEmployeeId = feedback.SubmittedByEmployeeId,
                SubmitterName = feedback.SubmittedByEmployee != null
                    ? $"{feedback.SubmittedByEmployee.EmployeeId}"
                    : MessageConstants.AnonymousUser,
                RecipientEmployeeId = feedback.RecipientEmployeeId,
                RecipientName = feedback.RecipientEmployee != null
                    ? $"{feedback.RecipientEmployee.EmployeeId}"
                    : MessageConstants.UnknownUser,
                FeedbackContent = feedback.FeedbackContent,
                IsAnonymous = feedback.IsAnonymous,
                IsProfessional = feedback.IsProfessional,
                IsRelevant = feedback.IsRelevant,
                ApprovedByHRId = feedback.ApprovedByHrid,
                ApprovedByHRName = feedback.ApprovedByHr != null
                    ? $"{feedback.ApprovedByHr.EmployeeId}"
                    : MessageConstants.UnknownUser,
                Status = feedback.Status,
                CreatedAt = feedback.CreatedAt,
                ApprovedAt = feedback.ApprovedAt
            };
        }
    }
}

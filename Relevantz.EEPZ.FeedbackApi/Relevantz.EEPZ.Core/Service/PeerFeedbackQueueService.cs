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

        public PeerFeedbackQueueService(
            IPeerFeedbackQueueRepository queueRepo,
            ILogger<PeerFeedbackQueueService> logger)
        {
            _queueRepo = queueRepo;
            _logger = logger;
        }

        public async Task<PeerFeedbackQueueResponseDto> CreatePeerFeedbackAsync(CreatePeerFeedbackRequestDto dto)
        {
            try
            {
                if (dto.SubmittedByEmployeeId <= 0)
                    throw new ArgumentException("SubmittedByEmployeeId must be valid");
                if (dto.RecipientEmployeeId <= 0)
                    throw new ArgumentException("RecipientEmployeeId must be valid");
                if (string.IsNullOrEmpty(dto.FeedbackContent))
                    throw new ArgumentException("FeedbackContent is required");

                var feedback = new Peerfeedbackqueue
                {
                    SubmittedByEmployeeId = dto.SubmittedByEmployeeId,
                    RecipientEmployeeId = dto.RecipientEmployeeId,
                    FeedbackContent = dto.FeedbackContent,
                    IsAnonymous = dto.IsAnonymous,
                    Status = "Pending"
                };

                var queueId = await _queueRepo.CreatePeerFeedbackAsync(feedback);
                _logger.LogInformation($"Peer feedback created in queue: {queueId}");

                return await GetQueueItemByIdAsync(queueId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating peer feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<PeerFeedbackQueueResponseDto> GetQueueItemByIdAsync(int queueId)
        {
            try
            {
                var feedback = await _queueRepo.GetQueueItemByIdAsync(queueId);
                if (feedback == null)
                    throw new KeyNotFoundException($"Peer feedback queue item {queueId} not found");

                return MapToResponseDto(feedback);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting queue item by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetPendingFeedbackAsync()
        {
            try
            {
                var feedbacks = await _queueRepo.GetPendingFeedbackAsync();
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting pending feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetUnderReviewFeedbackAsync()
        {
            try
            {
                var feedbacks = await _queueRepo.GetUnderReviewFeedbackAsync();
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting under review feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetApprovedFeedbackAsync()
        {
            try
            {
                var feedbacks = await _queueRepo.GetApprovedFeedbackAsync();
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting approved feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetRejectedFeedbackAsync()
        {
            try
            {
                var feedbacks = await _queueRepo.GetRejectedFeedbackAsync();
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting rejected feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackByRecipientAsync(int employeeId)
        {
            try
            {
                var feedbacks = await _queueRepo.GetFeedbackByRecipientAsync(employeeId);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by recipient: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackBySubmitterAsync(int employeeId)
        {
            try
            {
                var feedbacks = await _queueRepo.GetFeedbackBySubmitterAsync(employeeId);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by submitter: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetAllPeerFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                var feedbacks = await _queueRepo.GetAllPeerFeedbackAsync(pageNumber, pageSize);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all peer feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackByStatusAsync(string status)
        {
            try
            {
                var feedbacks = await _queueRepo.GetFeedbackByStatusAsync(status);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by status: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PeerFeedbackQueueResponseDto>> GetAnonymousPeerFeedbackAsync()
        {
            try
            {
                var feedbacks = await _queueRepo.GetAnonymousPeerFeedbackAsync();
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting anonymous peer feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<PeerFeedbackQueueResponseDto> UpdatePeerFeedbackAsync(int queueId, UpdatePeerFeedbackRequestDto dto)
        {
            try
            {
                var feedback = await _queueRepo.GetQueueItemByIdAsync(queueId);
                if (feedback == null)
                    throw new KeyNotFoundException($"Peer feedback queue item {queueId} not found");

                if (feedback.Status != "Pending")
                    throw new InvalidOperationException($"Cannot edit feedback in {feedback.Status} status");

                if (!string.IsNullOrEmpty(dto.FeedbackContent))
                    feedback.FeedbackContent = dto.FeedbackContent;

                await _queueRepo.UpdatePeerFeedbackAsync(feedback);
                _logger.LogInformation($"Peer feedback updated: {queueId}");

                return await GetQueueItemByIdAsync(queueId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating peer feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> ApprovePeerFeedbackAsync(int queueId, bool isProfessional, bool isRelevant, int approvedByHRId)
        {
            try
            {
                var result = await _queueRepo.ApprovePeerFeedbackAsync(queueId, isProfessional, isRelevant, approvedByHRId);
                if (result)
                    _logger.LogInformation($"Peer feedback approved: {queueId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error approving peer feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> RejectPeerFeedbackAsync(int queueId, int rejectedByHRId)
        {
            try
            {
                var result = await _queueRepo.RejectPeerFeedbackAsync(queueId, rejectedByHRId);
                if (result)
                    _logger.LogInformation($"Peer feedback rejected: {queueId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error rejecting peer feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateFeedbackStatusAsync(int queueId, string newStatus)
        {
            try
            {
                var result = await _queueRepo.UpdateFeedbackStatusAsync(queueId, newStatus);
                if (result)
                    _logger.LogInformation($"Peer feedback status updated: {queueId} → {newStatus}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating feedback status: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> DeleteQueueItemAsync(int queueId)
        {
            try
            {
                var result = await _queueRepo.DeleteQueueItemAsync(queueId);
                if (result)
                    _logger.LogInformation($"Peer feedback deleted: {queueId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting peer feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> QueueItemExistsAsync(int queueId)
        {
            try
            {
                return await _queueRepo.QueueItemExistsAsync(queueId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking queue item existence: {ex.Message}");
                throw;
            }
        }
        private PeerFeedbackQueueResponseDto MapToResponseDto(Peerfeedbackqueue feedback)
        {
            return new PeerFeedbackQueueResponseDto
            {
                QueueId = feedback.QueueId,
                SubmittedByEmployeeId = feedback.SubmittedByEmployeeId,
                SubmitterName = feedback.SubmittedByEmployee != null
                    ? $"{feedback.SubmittedByEmployee.EmployeeId}"
                    : "Anonymous",
                RecipientEmployeeId = feedback.RecipientEmployeeId,
                RecipientName = feedback.RecipientEmployee != null
                    ? $"{feedback.RecipientEmployee.EmployeeId}"
                    : "Unknown",
                FeedbackContent = feedback.FeedbackContent,
                IsAnonymous = feedback.IsAnonymous,
                IsProfessional = feedback.IsProfessional,
                IsRelevant = feedback.IsRelevant,
                ApprovedByHRId = feedback.ApprovedByHrid,
                ApprovedByHRName = feedback.ApprovedByHr != null
                    ? $"{feedback.ApprovedByHr.EmployeeId}"
                    : "Unknown",
                Status = feedback.Status,
                CreatedAt = feedback.CreatedAt,
                ApprovedAt = feedback.ApprovedAt
            };
        }
    }
}

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
    /// <summary>
    /// Service implementation for Mentor Feedback operations.
    /// Handles creation, retrieval, update, acknowledgement, and deletion of mentor feedback records.
    /// </summary>
    public class MentorFeedbackService : IMentorFeedbackService
    {
        private readonly IMentorFeedbackRepository _mentorFeedbackRepo;
        private readonly ILogger<MentorFeedbackService> _logger;

        private const string StatusSubmitted = "Submitted";
        private const string StatusAcknowledged = "Acknowledged";

        public MentorFeedbackService(
            IMentorFeedbackRepository mentorFeedbackRepo,
            ILogger<MentorFeedbackService> logger)
        {
            _mentorFeedbackRepo = mentorFeedbackRepo ?? throw new ArgumentNullException(nameof(mentorFeedbackRepo));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Creates a new mentor feedback entry from the provided DTO.
        /// Maps the DTO to the entity, sets the initial status to Submitted,
        /// persists it, and returns the created record.
        /// </summary>
        public async Task<MentorFeedbackResponseDto?> CreateMentorFeedbackAsync(CreateMentorFeedbackRequestDto dto)
        {
            ArgumentNullException.ThrowIfNull(dto);

            var feedback = dto.Adapt<Mentorfeedbacktracking>();
            feedback.Status = StatusSubmitted;

            var mentorFeedbackId = await _mentorFeedbackRepo.CreateMentorFeedbackAsync(feedback);

            _logger.LogInformation("Mentor feedback created. MentorFeedbackId: {MentorFeedbackId}", mentorFeedbackId);

            return await GetMentorFeedbackByIdAsync(mentorFeedbackId);
        }

        /// <summary>
        /// Retrieves a mentor feedback entry by its unique identifier.
        /// Returns null if the ID is invalid or the record does not exist.
        /// </summary>
        public async Task<MentorFeedbackResponseDto?> GetMentorFeedbackByIdAsync(int mentorFeedbackId)
        {
            if (mentorFeedbackId <= 0) return null;

            var feedback = await _mentorFeedbackRepo.GetMentorFeedbackByIdAsync(mentorFeedbackId);
            return feedback?.Adapt<MentorFeedbackResponseDto>();
        }

        /// <summary>
        /// Retrieves all feedback entries submitted about a specific mentor.
        /// Returns an empty list if the mentor employee ID is invalid.
        /// </summary>
        public async Task<List<MentorFeedbackResponseDto>> GetFeedbackAboutMeAsync(int mentorEmployeeId)
        {
            if (mentorEmployeeId <= 0) return new();

            var feedbacks = await _mentorFeedbackRepo.GetFeedbackByMentorAsync(mentorEmployeeId);
            return feedbacks.Adapt<List<MentorFeedbackResponseDto>>();
        }

        /// <summary>
        /// Retrieves all mentor feedback entries submitted by a specific mentee.
        /// Returns an empty list if the mentee employee ID is invalid.
        /// </summary>
        public async Task<List<MentorFeedbackResponseDto>> GetMyMentorFeedbackAsync(int menteeEmployeeId)
        {
            if (menteeEmployeeId <= 0) return new();

            var feedbacks = await _mentorFeedbackRepo.GetFeedbackByMenteeAsync(menteeEmployeeId);
            return feedbacks.Adapt<List<MentorFeedbackResponseDto>>();
        }

        /// <summary>
        /// Retrieves all mentor feedback entries with pagination support.
        /// Defaults to page 1 with 20 items per page.
        /// </summary>
        public async Task<List<MentorFeedbackResponseDto>> GetAllMentorFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            var feedbacks = await _mentorFeedbackRepo.GetAllMentorFeedbackAsync(pageNumber, pageSize);
            return feedbacks.Adapt<List<MentorFeedbackResponseDto>>();
        }

        /// <summary>
        /// Retrieves mentor feedback entries filtered by their status.
        /// Returns an empty list if the status value is null or whitespace.
        /// </summary>
        public async Task<List<MentorFeedbackResponseDto>> GetFeedbackByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status)) return new();

            var feedbacks = await _mentorFeedbackRepo.GetFeedbackByStatusAsync(status);
            return feedbacks.Adapt<List<MentorFeedbackResponseDto>>();
        }

        /// <summary>
        /// Retrieves all mentor feedback entries that are pending HR review.
        /// </summary>
        public async Task<List<MentorFeedbackResponseDto>> GetPendingHRReviewAsync()
        {
            var feedbacks = await _mentorFeedbackRepo.GetPendingHRReviewAsync();
            return feedbacks.Adapt<List<MentorFeedbackResponseDto>>();
        }

        /// <summary>
        /// Retrieves all anonymous mentor feedback entries.
        /// </summary>
        public async Task<List<MentorFeedbackResponseDto>> GetAnonymousMentorFeedbackAsync()
        {
            var feedbacks = await _mentorFeedbackRepo.GetAnonymousMentorFeedbackAsync();
            return feedbacks.Adapt<List<MentorFeedbackResponseDto>>();
        }

        /// <summary>
        /// Updates an existing mentor feedback entry.
        /// Only feedback in Submitted status can be updated.
        /// Returns null if the record is not found or the ID is invalid.
        /// Throws <see cref="InvalidOperationException"/> if the feedback is not in Submitted status.
        /// Throws <see cref="ArgumentException"/> if the rating is outside the valid range (1-5).
        /// </summary>
        public async Task<MentorFeedbackResponseDto?> UpdateMentorFeedbackAsync(
            int mentorFeedbackId,
            UpdateMentorFeedbackRequestDto dto)
        {
            if (mentorFeedbackId <= 0) return null;
            ArgumentNullException.ThrowIfNull(dto);

            var feedback = await _mentorFeedbackRepo.GetMentorFeedbackByIdAsync(mentorFeedbackId);
            if (feedback == null) return null;

            // Use MessageConstants instead of silent null return so callers
            // receive a meaningful exception rather than an ambiguous null.
            if (!string.Equals(feedback.Status, StatusSubmitted, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(MessageConstants.FeedbackNotEditable);

            // Use MessageConstants to centralise the rating range error message.
            if (dto.Rating.HasValue && (dto.Rating.Value < 1 || dto.Rating.Value > 5))
                throw new ArgumentException(MessageConstants.InvalidRatingRange);

            dto.Adapt(feedback);

            await _mentorFeedbackRepo.UpdateMentorFeedbackAsync(feedback);

            _logger.LogInformation("Mentor feedback updated. MentorFeedbackId: {MentorFeedbackId}", mentorFeedbackId);

            return await GetMentorFeedbackByIdAsync(mentorFeedbackId);
        }

        /// <summary>
        /// Acknowledges a mentor feedback entry by updating its status to Acknowledged.
        /// Returns false if the ID is invalid or the record was not found.
        /// </summary>
        public async Task<bool> AcknowledgeMentorFeedbackAsync(int mentorFeedbackId)
        {
            if (mentorFeedbackId <= 0) return false;

            var updated = await _mentorFeedbackRepo.UpdateFeedbackStatusAsync(mentorFeedbackId, StatusAcknowledged);

            if (updated)
                _logger.LogInformation("Mentor feedback acknowledged. MentorFeedbackId: {MentorFeedbackId}", mentorFeedbackId);

            return updated;
        }

        /// <summary>
        /// Sets the HR review details for a mentor feedback entry.
        /// Returns false if any input parameter is invalid.
        /// </summary>
        public async Task<bool> SetHRReviewAsync(int mentorFeedbackId, string hrComments, int reviewedByHRId)
        {
            if (mentorFeedbackId <= 0 || string.IsNullOrWhiteSpace(hrComments) || reviewedByHRId <= 0)
                return false;

            var updated = await _mentorFeedbackRepo.SetHRReviewAsync(mentorFeedbackId, hrComments, reviewedByHRId);

            if (updated)
                _logger.LogInformation("HR review set for mentor feedback. MentorFeedbackId: {MentorFeedbackId}", mentorFeedbackId);

            return updated;
        }

        /// <summary>
        /// Deletes a mentor feedback entry by its unique identifier.
        /// Returns false if the ID is invalid or the record was not found.
        /// </summary>
        public async Task<bool> DeleteMentorFeedbackAsync(int mentorFeedbackId)
        {
            if (mentorFeedbackId <= 0) return false;

            var deleted = await _mentorFeedbackRepo.DeleteMentorFeedbackAsync(mentorFeedbackId);

            if (deleted)
                _logger.LogInformation("Mentor feedback deleted. MentorFeedbackId: {MentorFeedbackId}", mentorFeedbackId);

            return deleted;
        }

        /// <summary>
        /// Checks whether a mentor feedback entry exists by its unique identifier.
        /// Returns false immediately if the ID is invalid without hitting the database.
        /// </summary>
        public Task<bool> MentorFeedbackExistsAsync(int mentorFeedbackId)
            => mentorFeedbackId <= 0
                ? Task.FromResult(false)
                : _mentorFeedbackRepo.MentorFeedbackExistsAsync(mentorFeedbackId);
    }
}

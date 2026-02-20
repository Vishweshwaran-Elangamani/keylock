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
    /// Service implementation for Organization Goal Feedback operations.
    /// </summary>
    public class OrgGoalFeedbackService : IOrgGoalFeedbackService
    {
        private readonly IOrgGoalFeedbackRepository _orgGoalFeedbackRepo;
        private readonly ILogger<OrgGoalFeedbackService> _logger;

        public OrgGoalFeedbackService(
            IOrgGoalFeedbackRepository orgGoalFeedbackRepo,
            ILogger<OrgGoalFeedbackService> logger)
        {
            _orgGoalFeedbackRepo = orgGoalFeedbackRepo ?? throw new ArgumentNullException(nameof(orgGoalFeedbackRepo));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Creates a new organization goal feedback entry from the provided DTO.
        /// </summary>
        public async Task<OrgGoalFeedbackResponseDto?> CreateOrgGoalFeedbackAsync(CreateOrgGoalFeedbackRequestDto dto)
        {
            ArgumentNullException.ThrowIfNull(dto);

            var feedback = dto.Adapt<Feedback>();
            var feedbackId = await _orgGoalFeedbackRepo.CreateOrgGoalFeedbackAsync(feedback);

            _logger.LogInformation("Organization goal feedback created. FeedbackId: {FeedbackId}", feedbackId);

            return await GetOrgGoalFeedbackByIdAsync(feedbackId);
        }

        /// <summary>
        /// Retrieves an organization goal feedback entry by its unique identifier.
        /// Returns null if the ID is invalid or the record does not exist.
        /// </summary>
        public async Task<OrgGoalFeedbackResponseDto?> GetOrgGoalFeedbackByIdAsync(int feedbackId)
        {
            if (feedbackId <= 0) return null;

            var feedback = await _orgGoalFeedbackRepo.GetOrgGoalFeedbackByIdAsync(feedbackId);
            return feedback?.Adapt<OrgGoalFeedbackResponseDto>();
        }

        /// <summary>
        /// Retrieves a paginated list of feedback entries for a given organization goal.
        /// </summary>
        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByOrgGoalAsync(
            int goalId,
            int pageNumber = 1,
            int pageSize = 20)
        {
            return (await _orgGoalFeedbackRepo.GetFeedbackByOrgGoalAsync(goalId, pageNumber, pageSize))
                .Adapt<List<OrgGoalFeedbackResponseDto>>();
        }

        /// <summary>
        /// Retrieves all feedback entries submitted by a specific employee.
        /// </summary>
        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackBySubmitterAsync(int employeeId)
            => (await _orgGoalFeedbackRepo.GetFeedbackBySubmitterAsync(employeeId))
                .Adapt<List<OrgGoalFeedbackResponseDto>>();

        /// <summary>
        /// Retrieves all organization goal feedback entries with pagination support.
        /// </summary>
        public async Task<List<OrgGoalFeedbackResponseDto>> GetAllOrgGoalFeedbackAsync(
            int pageNumber = 1,
            int pageSize = 20)
            => (await _orgGoalFeedbackRepo.GetAllOrgGoalFeedbackAsync(pageNumber, pageSize))
                .Adapt<List<OrgGoalFeedbackResponseDto>>();

        /// <summary>
        /// Retrieves organization goal feedback entries filtered by their status.
        /// </summary>
        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByStatusAsync(string status)
            => (await _orgGoalFeedbackRepo.GetFeedbackByStatusAsync(status))
                .Adapt<List<OrgGoalFeedbackResponseDto>>();

        /// <summary>
        /// Retrieves all anonymous organization goal feedback entries.
        /// </summary>
        public async Task<List<OrgGoalFeedbackResponseDto>> GetAnonymousOrgGoalFeedbackAsync()
            => (await _orgGoalFeedbackRepo.GetAnonymousOrgGoalFeedbackAsync())
                .Adapt<List<OrgGoalFeedbackResponseDto>>();

        /// <summary>
        /// Updates an existing organization goal feedback entry.
        /// Only feedback in Submitted status can be updated.
        /// Throws <see cref="InvalidOperationException"/> if feedback is not in Submitted status.
        /// Throws <see cref="ArgumentException"/> if the rating is outside the valid range (1–5).
        /// Returns null if the feedback is not found or the ID is invalid.
        /// </summary>
        public async Task<OrgGoalFeedbackResponseDto?> UpdateOrgGoalFeedbackAsync(
            int feedbackId,
            UpdateOrgGoalFeedbackRequestDto dto)
        {
            if (feedbackId <= 0) return null;
            ArgumentNullException.ThrowIfNull(dto);

            var feedback = await _orgGoalFeedbackRepo.GetOrgGoalFeedbackByIdAsync(feedbackId);
            if (feedback == null) return null;

            // Use MessageConstants instead of silent null return
            if (!string.Equals(feedback.Status, FeedbackConstants.Status.Submitted, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(MessageConstants.FeedbackNotEditable);

            // use MessageConstants instead of silent null return
            if (dto.Rating.HasValue && (dto.Rating < 1 || dto.Rating > 5))
                throw new ArgumentException(MessageConstants.InvalidRatingRange);

            dto.Adapt(feedback);

            await _orgGoalFeedbackRepo.UpdateOrgGoalFeedbackAsync(feedback);

            _logger.LogInformation("Organization goal feedback updated. FeedbackId: {FeedbackId}", feedbackId);

            return await GetOrgGoalFeedbackByIdAsync(feedbackId);
        }

        /// <summary>
        /// Archives an organization goal feedback entry by updating its status.
        /// </summary>
        public Task<bool> ArchiveOrgGoalFeedbackAsync(int feedbackId)
            => _orgGoalFeedbackRepo.UpdateFeedbackStatusAsync(feedbackId, FeedbackConstants.Status.Archived);

        /// <summary>
        /// Deletes an organization goal feedback entry by its identifier.
        /// </summary>
        public Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId)
            => _orgGoalFeedbackRepo.DeleteOrgGoalFeedbackAsync(feedbackId);

        /// <summary>
        /// Checks whether an organization goal feedback entry exists by its identifier.
        /// </summary>
        public Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId)
            => feedbackId <= 0
                ? Task.FromResult(false)
                : _orgGoalFeedbackRepo.OrgGoalFeedbackExistsAsync(feedbackId);
    }
}

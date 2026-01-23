using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
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

        public async Task<OrgGoalFeedbackResponseDto?> CreateOrgGoalFeedbackAsync(CreateOrgGoalFeedbackRequestDto dto)
        {
            ArgumentNullException.ThrowIfNull(dto);

            var feedback = new Feedback
            {
                RelatedGoalId = dto.GoalId,
                SubmittedByEmployeeId = dto.IsAnonymous ? null : dto.SubmittedByEmployeeId,
                RecipientEmployeeId = dto.RecipientEmployeeId,
                Rating = dto.Rating,
                Comments = dto.FeedbackComments,
                IsAnonymous = dto.IsAnonymous,
                Status = FeedbackConstants.Status.Submitted,
                FeedbackType = FeedbackConstants.Type.OrganizationalGoal
            };

            var feedbackId = await _orgGoalFeedbackRepo.CreateOrgGoalFeedbackAsync(feedback);

            _logger.LogInformation("Organization goal feedback created. FeedbackId: {FeedbackId}", feedbackId);

            return await GetOrgGoalFeedbackByIdAsync(feedbackId);
        }

        public async Task<OrgGoalFeedbackResponseDto?> GetOrgGoalFeedbackByIdAsync(int feedbackId)
        {
            if (feedbackId <= 0)
                return null;

            var feedback = await _orgGoalFeedbackRepo.GetOrgGoalFeedbackByIdAsync(feedbackId);
            return feedback == null ? null : MapToResponseDto(feedback);
        }

        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByOrgGoalAsync(int goalId)
        {
            if (goalId <= 0)
                return new List<OrgGoalFeedbackResponseDto>();

            var feedbacks = await _orgGoalFeedbackRepo.GetFeedbackByOrgGoalAsync(goalId);
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackBySubmitterAsync(int employeeId)
        {
            if (employeeId <= 0)
                return new List<OrgGoalFeedbackResponseDto>();

            var feedbacks = await _orgGoalFeedbackRepo.GetFeedbackBySubmitterAsync(employeeId);
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<OrgGoalFeedbackResponseDto>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            var feedbacks = await _orgGoalFeedbackRepo.GetAllOrgGoalFeedbackAsync(pageNumber, pageSize);
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return new List<OrgGoalFeedbackResponseDto>();

            var feedbacks = await _orgGoalFeedbackRepo.GetFeedbackByStatusAsync(status);
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<OrgGoalFeedbackResponseDto>> GetAnonymousOrgGoalFeedbackAsync()
        {
            var feedbacks = await _orgGoalFeedbackRepo.GetAnonymousOrgGoalFeedbackAsync();
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<OrgGoalFeedbackResponseDto?> UpdateOrgGoalFeedbackAsync(int feedbackId, UpdateOrgGoalFeedbackRequestDto dto)
        {
            if (feedbackId <= 0)
                return null;

            ArgumentNullException.ThrowIfNull(dto);

            var feedback = await _orgGoalFeedbackRepo.GetOrgGoalFeedbackByIdAsync(feedbackId);
            if (feedback == null)
                return null;

            if (!string.Equals(feedback.Status, FeedbackConstants.Status.Submitted, StringComparison.OrdinalIgnoreCase))
                return null;

            if (dto.Rating.HasValue)
            {
                if (dto.Rating.Value < 1 || dto.Rating.Value > 5)
                    return null;

                feedback.Rating = dto.Rating.Value;
            }

            if (!string.IsNullOrWhiteSpace(dto.FeedbackComments))
                feedback.Comments = dto.FeedbackComments;

            await _orgGoalFeedbackRepo.UpdateOrgGoalFeedbackAsync(feedback);

            _logger.LogInformation("Organization goal feedback updated. FeedbackId: {FeedbackId}", feedbackId);

            return await GetOrgGoalFeedbackByIdAsync(feedbackId);
        }

        public async Task<bool> ArchiveOrgGoalFeedbackAsync(int feedbackId)
        {
            if (feedbackId <= 0)
                return false;

            var archived = await _orgGoalFeedbackRepo.UpdateFeedbackStatusAsync(feedbackId, FeedbackConstants.Status.Archived);

            if (archived)
                _logger.LogInformation("Organization goal feedback archived. FeedbackId: {FeedbackId}", feedbackId);

            return archived;
        }

        public async Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId)
        {
            if (feedbackId <= 0)
                return false;

            var deleted = await _orgGoalFeedbackRepo.DeleteOrgGoalFeedbackAsync(feedbackId);

            if (deleted)
                _logger.LogInformation("Organization goal feedback deleted. FeedbackId: {FeedbackId}", feedbackId);

            return deleted;
        }

        public Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId)
        {
            if (feedbackId <= 0)
                return Task.FromResult(false);

            return _orgGoalFeedbackRepo.OrgGoalFeedbackExistsAsync(feedbackId);
        }

        private static OrgGoalFeedbackResponseDto MapToResponseDto(Feedback feedback)
        {
            return new OrgGoalFeedbackResponseDto
            {
                OrgGoalFeedbackId = feedback.FeedbackId,
                GoalId = feedback.RelatedGoalId ?? 0,
                OrganizationGoalName = feedback.RelatedGoal?.GoalTitle ?? MessageConstants.UnknownUser,

                GoalDescription = feedback.RelatedGoal?.GoalDescription ?? string.Empty,
                GoalType = feedback.RelatedGoal?.GoalType ?? string.Empty,

                SubmittedByEmployeeId = feedback.SubmittedByEmployeeId ?? 0,
                SubmitterName = feedback.IsAnonymous
                   ? MessageConstants.AnonymousUser
                   : (feedback.SubmittedByEmployee?.EmployeeId.ToString() ?? MessageConstants.UnknownUser),


                RecipientEmployeeId = feedback.RecipientEmployeeId,
                RecipientName = feedback.RecipientEmployee?.EmployeeId.ToString() ?? MessageConstants.UnknownUser,


                Rating = feedback.Rating ?? 0,
                FeedbackComments = feedback.Comments ?? string.Empty,
                IsAnonymous = feedback.IsAnonymous,
                Status = feedback.Status,
                CreatedAt = feedback.CreatedAt,
                UpdatedAt = feedback.UpdatedAt,
                SubmittedAt = feedback.SubmittedAt
            };
        }
    }
}

using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
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

        public async Task<MentorFeedbackResponseDto?> CreateMentorFeedbackAsync(CreateMentorFeedbackRequestDto dto)
        {
            ArgumentNullException.ThrowIfNull(dto);


            var feedback = new Mentorfeedbacktracking
            {
                SmeId = dto.SmeId,
                MentorEmployeeId = dto.MentorEmployeeId,
                MenteeEmployeeId = dto.MenteeEmployeeId,
                SkillIdReference = dto.SkillIdReference,
                Rating = dto.Rating,
                FeedbackComments = dto.FeedbackComments,
                SubmittedByEmployeeId = dto.SubmittedByEmployeeId,
                FeedbackFrom = dto.FeedbackFrom,
                IsAnonymous = dto.IsAnonymous,
                Status = StatusSubmitted
            };

            var trackingId = await _mentorFeedbackRepo.CreateMentorFeedbackAsync(feedback);

            _logger.LogInformation("Mentor feedback created. TrackingId: {TrackingId}", trackingId);

            return await GetMentorFeedbackByIdAsync(trackingId);
        }

        public async Task<MentorFeedbackResponseDto?> GetMentorFeedbackByIdAsync(int trackingId)
        {
            if (trackingId <= 0)
                return null;

            var feedback = await _mentorFeedbackRepo.GetMentorFeedbackByIdAsync(trackingId);
            return feedback == null ? null : MapToResponseDto(feedback);
        }

        public async Task<List<MentorFeedbackResponseDto>> GetFeedbackAboutMeAsync(int mentorEmployeeId)
        {
            if (mentorEmployeeId <= 0)
                return new List<MentorFeedbackResponseDto>();

            var feedbacks = await _mentorFeedbackRepo.GetFeedbackByMentorAsync(mentorEmployeeId);
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<MentorFeedbackResponseDto>> GetMyMentorFeedbackAsync(int menteeEmployeeId)
        {
            if (menteeEmployeeId <= 0)
                return new List<MentorFeedbackResponseDto>();

            var feedbacks = await _mentorFeedbackRepo.GetFeedbackByMenteeAsync(menteeEmployeeId);
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<MentorFeedbackResponseDto>> GetAllMentorFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            var feedbacks = await _mentorFeedbackRepo.GetAllMentorFeedbackAsync(pageNumber, pageSize);
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<MentorFeedbackResponseDto>> GetFeedbackByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return new List<MentorFeedbackResponseDto>();

            var feedbacks = await _mentorFeedbackRepo.GetFeedbackByStatusAsync(status);
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<MentorFeedbackResponseDto>> GetPendingHRReviewAsync()
        {
            var feedbacks = await _mentorFeedbackRepo.GetPendingHRReviewAsync();
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<List<MentorFeedbackResponseDto>> GetAnonymousMentorFeedbackAsync()
        {
            var feedbacks = await _mentorFeedbackRepo.GetAnonymousMentorFeedbackAsync();
            return feedbacks.Select(MapToResponseDto).ToList();
        }

        public async Task<MentorFeedbackResponseDto?> UpdateMentorFeedbackAsync(int trackingId, UpdateMentorFeedbackRequestDto dto)
        {
            if (trackingId <= 0)
                return null;

            ArgumentNullException.ThrowIfNull(dto);

            var feedback = await _mentorFeedbackRepo.GetMentorFeedbackByIdAsync(trackingId);
            if (feedback == null)
                return null;

            if (!string.Equals(feedback.Status, StatusSubmitted, StringComparison.OrdinalIgnoreCase))
                return null;

            if (dto.Rating.HasValue)
            {
                if (dto.Rating.Value < 1 || dto.Rating.Value > 5)
                    return null;

                feedback.Rating = dto.Rating.Value;
            }

            if (!string.IsNullOrWhiteSpace(dto.FeedbackComments))
                feedback.FeedbackComments = dto.FeedbackComments;

            await _mentorFeedbackRepo.UpdateMentorFeedbackAsync(feedback);

            _logger.LogInformation("Mentor feedback updated. TrackingId: {TrackingId}", trackingId);

            return await GetMentorFeedbackByIdAsync(trackingId);
        }

        public async Task<bool> AcknowledgeMentorFeedbackAsync(int trackingId)
        {
            if (trackingId <= 0)
                return false;

            var updated = await _mentorFeedbackRepo.UpdateFeedbackStatusAsync(trackingId, StatusAcknowledged);

            if (updated)
                _logger.LogInformation("Mentor feedback acknowledged. TrackingId: {TrackingId}", trackingId);

            return updated;
        }

        public async Task<bool> SetHRReviewAsync(int trackingId, string hrComments, int reviewedByHRId)
        {
            if (trackingId <= 0) return false;
            if (string.IsNullOrWhiteSpace(hrComments)) return false;
            if (reviewedByHRId <= 0) return false;

            var updated = await _mentorFeedbackRepo.SetHRReviewAsync(trackingId, hrComments, reviewedByHRId);

            if (updated)
                _logger.LogInformation("HR review set for mentor feedback. TrackingId: {TrackingId}", trackingId);

            return updated;
        }

        public async Task<bool> DeleteMentorFeedbackAsync(int trackingId)
        {
            if (trackingId <= 0)
                return false;

            var deleted = await _mentorFeedbackRepo.DeleteMentorFeedbackAsync(trackingId);

            if (deleted)
                _logger.LogInformation("Mentor feedback deleted. TrackingId: {TrackingId}", trackingId);

            return deleted;
        }

        public Task<bool> MentorFeedbackExistsAsync(int trackingId)
        {
            if (trackingId <= 0)
                return Task.FromResult(false);

            return _mentorFeedbackRepo.MentorFeedbackExistsAsync(trackingId);
        }

        private static MentorFeedbackResponseDto MapToResponseDto(Mentorfeedbacktracking feedback)
        {
            return new MentorFeedbackResponseDto
            {
                TrackingId = feedback.TrackingId,
                SmeId = feedback.SmeId,
                MentorEmployeeId = feedback.MentorEmployeeId,
                MentorName = feedback.MentorEmployee?.EmployeeId.ToString() ?? "Unknown",
                MenteeEmployeeId = feedback.MenteeEmployeeId,
                MenteeName = feedback.MenteeEmployee?.EmployeeId.ToString() ?? "Unknown",
                SkillIdReference = feedback.SkillIdReference,
                SkillName = feedback.SkillIdReferenceNavigation?.SkillName ?? "Unknown",
                Rating = feedback.Rating,
                FeedbackComments = feedback.FeedbackComments,
                FeedbackFrom = feedback.FeedbackFrom,
                IsAnonymous = feedback.IsAnonymous,
                Status = feedback.Status,
                CreatedAt = feedback.CreatedAt,
                ReviewedAt = feedback.ReviewedAt
            };
        }
    }
}

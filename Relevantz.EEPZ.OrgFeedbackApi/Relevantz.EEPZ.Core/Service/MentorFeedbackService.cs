using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces; 
using Relevantz.EEPZ.Common.Entities;
using Microsoft.Extensions.Logging;


namespace Relevantz.EEPZ.Core.Services.Implementations
{
    /// <summary>
    /// Service implementation for MentorFeedbackTracking business logic
    /// Handles mentor feedback operations
    /// </summary>
       public class MentorFeedbackService : IMentorFeedbackService
    {
        private readonly IMentorFeedbackRepository _mentorFeedbackRepo;
        private readonly ILogger<MentorFeedbackService> _logger;

        public MentorFeedbackService(
            IMentorFeedbackRepository mentorFeedbackRepo,
            ILogger<MentorFeedbackService> logger)
        {
            _mentorFeedbackRepo = mentorFeedbackRepo;
            _logger = logger;
        }
        public async Task<MentorFeedbackResponseDto> CreateMentorFeedbackAsync(CreateMentorFeedbackRequestDto dto)
        {
            try
            {
                if (dto.MentorEmployeeId <= 0)
                    throw new ArgumentException("MentorEmployeeId must be valid");
                if (dto.MenteeEmployeeId <= 0)
                    throw new ArgumentException("MenteeEmployeeId must be valid");
                if (dto.Rating < 1 || dto.Rating > 5)
                    throw new ArgumentException("Rating must be between 1 and 5");

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
                    Status = "Submitted"
                };

                var trackingId = await _mentorFeedbackRepo.CreateMentorFeedbackAsync(feedback);
                _logger.LogInformation($"Mentor feedback created: {trackingId}");

                return await GetMentorFeedbackByIdAsync(trackingId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating mentor feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<MentorFeedbackResponseDto> GetMentorFeedbackByIdAsync(int trackingId)
        {
            try
            {
                var feedback = await _mentorFeedbackRepo.GetMentorFeedbackByIdAsync(trackingId);
                if (feedback == null)
                    throw new KeyNotFoundException($"Mentor feedback {trackingId} not found");

                return MapToResponseDto(feedback);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting mentor feedback by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<List<MentorFeedbackResponseDto>> GetFeedbackAboutMeAsync(int mentorEmployeeId)
        {
            try
            {
                var feedbacks = await _mentorFeedbackRepo.GetFeedbackByMentorAsync(mentorEmployeeId);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback about me: {ex.Message}");
                throw;
            }
        }

        public async Task<List<MentorFeedbackResponseDto>> GetMyMentorFeedbackAsync(int menteeEmployeeId)
        {
            try
            {
                var feedbacks = await _mentorFeedbackRepo.GetFeedbackByMenteeAsync(menteeEmployeeId);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting my mentor feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<MentorFeedbackResponseDto>> GetAllMentorFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                var feedbacks = await _mentorFeedbackRepo.GetAllMentorFeedbackAsync(pageNumber, pageSize);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all mentor feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<MentorFeedbackResponseDto>> GetFeedbackByStatusAsync(string status)
        {
            try
            {
                var feedbacks = await _mentorFeedbackRepo.GetFeedbackByStatusAsync(status);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by status: {ex.Message}");
                throw;
            }
        }

        public async Task<List<MentorFeedbackResponseDto>> GetPendingHRReviewAsync()
        {
            try
            {
                var feedbacks = await _mentorFeedbackRepo.GetPendingHRReviewAsync();
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting pending HR review: {ex.Message}");
                throw;
            }
        }

        public async Task<List<MentorFeedbackResponseDto>> GetAnonymousMentorFeedbackAsync()
        {
            try
            {
                var feedbacks = await _mentorFeedbackRepo.GetAnonymousMentorFeedbackAsync();
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting anonymous mentor feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<MentorFeedbackResponseDto> UpdateMentorFeedbackAsync(int trackingId, UpdateMentorFeedbackRequestDto dto)
        {
            try
            {
                var feedback = await _mentorFeedbackRepo.GetMentorFeedbackByIdAsync(trackingId);
                if (feedback == null)
                    throw new KeyNotFoundException($"Mentor feedback {trackingId} not found");

                if (feedback.Status != "Submitted")
                    throw new InvalidOperationException($"Cannot edit feedback in {feedback.Status} status");

                if (dto.Rating.HasValue)
                {
                    if (dto.Rating < 1 || dto.Rating > 5)
                        throw new ArgumentException("Rating must be between 1 and 5");
                    feedback.Rating = dto.Rating.Value;
                }

                if (!string.IsNullOrEmpty(dto.FeedbackComments))
                    feedback.FeedbackComments = dto.FeedbackComments;

                await _mentorFeedbackRepo.UpdateMentorFeedbackAsync(feedback);
                _logger.LogInformation($"Mentor feedback updated: {trackingId}");

                return await GetMentorFeedbackByIdAsync(trackingId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating mentor feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> AcknowledgeMentorFeedbackAsync(int trackingId)
        {
            try
            {
                var result = await _mentorFeedbackRepo.UpdateFeedbackStatusAsync(trackingId, "Acknowledged");
                if (result)
                    _logger.LogInformation($"Mentor feedback acknowledged: {trackingId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error acknowledging mentor feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> SetHRReviewAsync(int trackingId, string hrComments, int reviewedByHRId)
        {
            try
            {
                var result = await _mentorFeedbackRepo.SetHRReviewAsync(trackingId, hrComments, reviewedByHRId);
                if (result)
                    _logger.LogInformation($"HR review set for mentor feedback: {trackingId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error setting HR review: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> DeleteMentorFeedbackAsync(int trackingId)
        {
            try
            {
                var result = await _mentorFeedbackRepo.DeleteMentorFeedbackAsync(trackingId);
                if (result)
                    _logger.LogInformation($"Mentor feedback deleted: {trackingId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting mentor feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> MentorFeedbackExistsAsync(int trackingId)
        {
            try
            {
                return await _mentorFeedbackRepo.MentorFeedbackExistsAsync(trackingId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking mentor feedback existence: {ex.Message}");
                throw;
            }
        }
       private MentorFeedbackResponseDto MapToResponseDto(Mentorfeedbacktracking feedback)
{
    return new MentorFeedbackResponseDto
    {
        TrackingId = feedback.TrackingId,
        SmeId = feedback.SmeId,
        MentorEmployeeId = feedback.MentorEmployeeId,
        MentorName = feedback.MentorEmployee != null 
            ? $"{feedback.MentorEmployee.EmployeeId}" 
            : "Unknown",
        MenteeEmployeeId = feedback.MenteeEmployeeId,
        MenteeName = feedback.MenteeEmployee != null 
            ? $"{feedback.MenteeEmployee.EmployeeId}" 
            : "Unknown",
        SkillIdReference = feedback.SkillIdReference,
        SkillName = feedback.SkillIdReferenceNavigation != null 
            ? feedback.SkillIdReferenceNavigation.SkillName 
            : "Unknown",
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

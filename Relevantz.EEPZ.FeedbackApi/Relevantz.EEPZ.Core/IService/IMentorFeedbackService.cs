using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for MentorFeedbackTracking business logic
    /// Handles mentor feedback operation
    /// </summary>
    public interface IMentorFeedbackService
    {
        /// <summary>
        /// Create mentor feedback
        /// </summary>
        Task<MentorFeedbackResponseDto> CreateMentorFeedbackAsync(CreateMentorFeedbackRequestDto dto);

        /// <summary>
        /// Get mentor feedback by ID
        /// </summary>
        Task<MentorFeedbackResponseDto> GetMentorFeedbackByIdAsync(int trackingId);

        /// <summary>
        /// Get all feedback ABOUT a specific mentor
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetFeedbackAboutMeAsync(int mentorEmployeeId);

        /// <summary>
        /// Get all feedback GIVEN BY mentee about their mentor
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetMyMentorFeedbackAsync(int menteeEmployeeId);

        /// <summary>
        /// Get all mentor feedback (for HR)
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetAllMentorFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Get feedback by status
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetFeedbackByStatusAsync(string status);

        /// <summary>
        /// Get pending HR review mentor feedback
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetPendingHRReviewAsync();

        /// <summary>
        /// Get anonymous mentor feedback
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetAnonymousMentorFeedbackAsync();

        /// <summary>
        /// Update mentor feedback record
        /// </summary>
        Task<MentorFeedbackResponseDto> UpdateMentorFeedbackAsync(int trackingId, UpdateMentorFeedbackRequestDto dto);

        /// <summary>
        /// Acknowledge mentor feedback
        /// Used by: Mentor acknowledges feedback
        /// </summary>
        Task<bool> AcknowledgeMentorFeedbackAsync(int trackingId);

        /// <summary>
        /// Set HR review on mentor feedback
        /// </summary>
        Task<bool> SetHRReviewAsync(int trackingId, string hrComments, int reviewedByHRId);

        /// <summary>
        /// Delete mentor feedback (only if Submitted status)
        /// </summary>
        Task<bool> DeleteMentorFeedbackAsync(int trackingId);

        /// <summary>
        /// Check if mentor feedback exists
        /// </summary>
        Task<bool> MentorFeedbackExistsAsync(int trackingId);
    }
}

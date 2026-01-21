using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for Mentor Feedback business logic.
    /// </summary>
    public interface IMentorFeedbackService
    {
        /// <summary>
        /// Creates mentor feedback.
        /// </summary>
        Task<MentorFeedbackResponseDto?> CreateMentorFeedbackAsync(CreateMentorFeedbackRequestDto dto);

        /// <summary>
        /// Retrieves mentor feedback by tracking identifier.
        /// </summary>
        Task<MentorFeedbackResponseDto?> GetMentorFeedbackByIdAsync(int trackingId);

        /// <summary>
        /// Retrieves all feedback about a mentor.
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetFeedbackAboutMeAsync(int mentorEmployeeId);

        /// <summary>
        /// Retrieves all mentor feedback submitted by a mentee.
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetMyMentorFeedbackAsync(int menteeEmployeeId);

        /// <summary>
        /// Retrieves all mentor feedback (paged).
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetAllMentorFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Retrieves mentor feedback entries filtered by status.
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetFeedbackByStatusAsync(string status);

        /// <summary>
        /// Retrieves mentor feedback entries pending HR review.
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetPendingHRReviewAsync();

        /// <summary>
        /// Retrieves anonymous mentor feedback entries.
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetAnonymousMentorFeedbackAsync();

        /// <summary>
        /// Updates mentor feedback record.
        /// </summary>
        Task<MentorFeedbackResponseDto?> UpdateMentorFeedbackAsync(int trackingId, UpdateMentorFeedbackRequestDto dto);

        /// <summary>
        /// Acknowledges mentor feedback.
        /// </summary>
        Task<bool> AcknowledgeMentorFeedbackAsync(int trackingId);

        /// <summary>
        /// Sets HR review comments on mentor feedback.
        /// </summary>
        Task<bool> SetHRReviewAsync(int trackingId, string hrComments, int reviewedByHRId);

        /// <summary>
        /// Deletes mentor feedback.
        /// </summary>
        Task<bool> DeleteMentorFeedbackAsync(int trackingId);

        /// <summary>
        /// Checks whether mentor feedback exists.
        /// </summary>
        Task<bool> MentorFeedbackExistsAsync(int trackingId);
    }
}

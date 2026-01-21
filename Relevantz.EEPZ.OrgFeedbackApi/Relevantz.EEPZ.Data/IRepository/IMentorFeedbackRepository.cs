using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for Mentor Feedback Tracking entity operations.
    /// </summary>
    public interface IMentorFeedbackRepository
    {
        /// <summary>
        /// Creates a new mentor feedback tracking entry.
        /// </summary>
        Task<int> CreateMentorFeedbackAsync(Mentorfeedbacktracking feedback);

        /// <summary>
        /// Retrieves mentor feedback by tracking identifier.
        /// </summary>
        Task<Mentorfeedbacktracking?> GetMentorFeedbackByIdAsync(int trackingId);

        /// <summary>
        /// Retrieves mentor feedback submitted for a mentor.
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetFeedbackByMentorAsync(int mentorEmployeeId);

        /// <summary>
        /// Retrieves mentor feedback received by a mentee.
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetFeedbackByMenteeAsync(int menteeEmployeeId);

        /// <summary>
        /// Retrieves mentor feedback related to a specific SME.
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetFeedbackBySmeAsync(int smeId);

        /// <summary>
        /// Retrieves all mentor feedback entries pending HR review.
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetPendingHRReviewAsync();

        /// <summary>
        /// Retrieves all mentor feedback entries with pagination support.
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetAllMentorFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Retrieves mentor feedback entries filtered by status.
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetFeedbackByStatusAsync(string status);

        /// <summary>
        /// Retrieves mentor feedback entries filtered by feedback source.
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetFeedbackBySourceAsync(string feedbackFrom);

        /// <summary>
        /// Retrieves mentor feedback entries marked as anonymous.
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetAnonymousMentorFeedbackAsync();

        /// <summary>
        /// Updates the mentor feedback entry.
        /// </summary>
        Task<bool> UpdateMentorFeedbackAsync(Mentorfeedbacktracking feedback);

        /// <summary>
        /// Updates the status of mentor feedback.
        /// </summary>
        Task<bool> UpdateFeedbackStatusAsync(int trackingId, string newStatus);

        /// <summary>
        /// Sets HR review comments for a feedback entry.
        /// </summary>
        Task<bool> SetHRReviewAsync(int trackingId, string hrComments, int reviewedByHRId);

        /// <summary>
        /// Deletes a mentor feedback entry.
        /// </summary>
        Task<bool> DeleteMentorFeedbackAsync(int trackingId);

        /// <summary>
        /// Checks whether mentor feedback exists for the given tracking identifier.
        /// </summary>
        Task<bool> MentorFeedbackExistsAsync(int trackingId);
    }
}

using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for feedback business logic.
    /// </summary>
    public interface IFeedbackService
    {
        /// <summary>
        /// Creates a new feedback entry.
        /// </summary>
        Task<FeedbackResponseDto?> CreateFeedbackAsync(CreateFeedbackRequestDto dto);

        /// <summary>
        /// Retrieves feedback by feedback identifier.
        /// </summary>
        Task<FeedbackResponseDto?> GetFeedbackByIdAsync(int feedbackId);

        /// <summary>
        /// Retrieves all feedback submitted by the given employee.
        /// </summary>
        Task<List<FeedbackResponseDto>> GetMyFeedbackAsync(int employeeId);

        /// <summary>
        /// Retrieves all feedback received by the given employee (as recipient).
        /// </summary>
        Task<List<FeedbackResponseDto>> GetFeedbackAsRecipientAsync(int employeeId);

        /// <summary>
        /// Retrieves team feedback for the given manager.
        /// </summary>
        Task<List<FeedbackResponseDto>> GetTeamFeedbackAsync(int managerId);

        /// <summary>
        /// Retrieves feedback form structure for a given feedback type.
        /// </summary>
        Task<FeedbackFormDto?> GetFeedbackFormAsync(string feedbackType);

        /// <summary>
        /// Retrieves feedback entries flagged for bias/fairness.
        /// </summary>
        Task<List<FeedbackResponseDto>> GetFlaggedFeedbackAsync(bool? isBias = null, bool? isFairness = null);

        /// <summary>
        /// Retrieves all anonymous feedback entries.
        /// </summary>
        Task<List<FeedbackResponseDto>> GetAnonymousFeedbackAsync();

        /// <summary>
        /// Retrieves feedback entries pending HR review.
        /// </summary>
        Task<List<FeedbackResponseDto>> GetPendingHRReviewAsync();

        /// <summary>
        /// Retrieves all feedback entries (paged).
        /// </summary>
        Task<List<FeedbackResponseDto>> GetAllFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Retrieves feedback entries for a given goal.
        /// </summary>
        Task<List<FeedbackResponseDto>> GetFeedbackByGoalAsync(int goalId);

        /// <summary>
        /// Retrieves feedback entries for a given project.
        /// </summary>
        Task<List<FeedbackResponseDto>> GetFeedbackByProjectAsync(int projectId);

        /// <summary>
        /// Updates feedback details (rating/comments/question responses).
        /// </summary>
        Task<FeedbackResponseDto?> UpdateFeedbackAsync(int feedbackId, UpdateFeedbackRequestDto dto);

        /// <summary>
        /// Submits feedback (changes status from Draft to Submitted).
        /// </summary>
        Task<bool> SubmitFeedbackAsync(int feedbackId);

        /// <summary>
        /// Flags feedback for HR review based on bias/fairness.
        /// </summary>
        Task<bool> FlagFeedbackForBiasAsync(int feedbackId, bool isBias, bool isFairness, int reviewedByHRId);

        /// <summary>
        /// Sets HR review comments and reviewer for feedback.
        /// </summary>
        Task<bool> SetHRReviewAsync(int feedbackId, string hrComments, int reviewedByHRId);

        /// <summary>
        /// Deletes feedback entry (only if Draft).
        /// </summary>
        Task<bool> DeleteFeedbackAsync(int feedbackId);

        /// <summary>
        /// Checks whether feedback can be edited.
        /// </summary>
        Task<bool> CanEditFeedbackAsync(int feedbackId);
    }
}

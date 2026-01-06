using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for Feedback business logic
    /// </summary>
    public interface IFeedbackService
    {
        /// <summary>
        /// Submit feedback
        /// </summary>
        Task<FeedbackResponseDto> CreateFeedbackAsync(CreateFeedbackRequestDto dto);

        /// <summary>
        /// Get feedback by ID with all question responses
        /// </summary>
        Task<FeedbackResponseDto> GetFeedbackByIdAsync(int feedbackId);

        /// <summary>
        /// Get all feedback submitted BY current user
        /// </summary>
        Task<List<FeedbackResponseDto>> GetMyFeedbackAsync(int employeeId);

        /// <summary>
        /// Get all feedback received BY current user (as recipient)        
        /// </summary>
        Task<List<FeedbackResponseDto>> GetFeedbackAsRecipientAsync(int employeeId);

        /// <summary>
        /// Get team feedback (from team members)
        /// </summary>
        Task<List<FeedbackResponseDto>> GetTeamFeedbackAsync(int managerId);

        /// <summary>
        /// Get feedback form structure for specific feedback type
        /// </summary>
        Task<FeedbackFormDto> GetFeedbackFormAsync(string feedbackType);
        Task<List<FeedbackResponseDto>> GetFlaggedFeedbackAsync(bool? isBias = null, bool? isFairness = null);

        /// <summary>
        /// Get anonymous feedback
        /// </summary>
        Task<List<FeedbackResponseDto>> GetAnonymousFeedbackAsync();

        /// <summary>
        /// Get feedback pending HR review
        /// </summary>
        Task<List<FeedbackResponseDto>> GetPendingHRReviewAsync();

        Task<List<FeedbackResponseDto>> GetAllFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Get feedback for specific goal
        /// </summary>
        Task<List<FeedbackResponseDto>> GetFeedbackByGoalAsync(int goalId);

        /// <summary>
        /// Get feedback for specific project
        /// </summary>
        Task<List<FeedbackResponseDto>> GetFeedbackByProjectAsync(int projectId);

        /// <summary>
        /// Update feedback (content, rating, comments)
        /// </summary>
        Task<FeedbackResponseDto> UpdateFeedbackAsync(int feedbackId, UpdateFeedbackRequestDto dto);

        /// <summary>
        /// Submit feedback (change status from Draft to Submitted)
        /// </summary>
        Task<bool> SubmitFeedbackAsync(int feedbackId);

        /// <summary>
        /// Flag feedback for bias/fairness review
        /// </summary>
        Task<bool> FlagFeedbackForBiasAsync(int feedbackId, bool isBias, bool isFairness, int reviewedByHRId);

        /// <summary>
        /// Set HR review on feedback
        /// </summary>
        Task<bool> SetHRReviewAsync(int feedbackId, string hrComments, int reviewedByHRId);

        /// <summary>
        /// Delete feedback (only if Draft status)
        /// </summary>
        Task<bool> DeleteFeedbackAsync(int feedbackId);

        /// <summary>
        /// Check if employee can edit feedback
        /// </summary>
        Task<bool> CanEditFeedbackAsync(int feedbackId);
    }
}

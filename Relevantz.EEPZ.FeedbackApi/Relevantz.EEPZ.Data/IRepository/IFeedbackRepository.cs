using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for Feedback entity
    /// Handles all CRUD operations for feedback (US032-US120)
    /// </summary>
    public interface IFeedbackRepository
    {
        /// <summary>
        /// Create new feedback record
        /// </summary>
        Task<int> CreateFeedbackAsync(Feedback feedback);

        /// <summary>
        /// Create question response for feedback
        /// Stores individual question ratings/answers
        /// </summary>
        Task<int> CreateQuestionResponseAsync(Feedbackquestionresponse response);

        /// <summary>
        /// Get feedback by ID with all relationships
        /// </summary>
        Task<Feedback> GetFeedbackByIdAsync(int feedbackId);

        /// <summary>
        /// Get all feedback submitted BY an employee
        /// </summary>
        Task<List<Feedback>> GetFeedbackBySubmitterAsync(int employeeId);

        /// <summary>
        /// Get all feedback received BY an employee (as recipient)
        /// </summary>
        Task<List<Feedback>> GetFeedbackByRecipientAsync(int employeeId);

        /// <summary>
        /// Get all feedback FROM team members (for manager dashboard)
        /// </summary>
        Task<List<Feedback>> GetTeamFeedbackAsync(int managerId);

        /// <summary>
        /// Get all feedback WITH bias or fairness flags
        /// </summary>
        Task<List<Feedback>> GetFlaggedFeedbackAsync(bool? isBias = null, bool? isFairness = null);

        /// <summary>
        /// Get all anonymous feedback
        /// </summary>
        Task<List<Feedback>> GetAnonymousFeedbackAsync();

        /// <summary>
        /// Get all feedback pending HR review
        /// </summary>
        Task<List<Feedback>> GetPendingHRReviewAsync();

        /// <summary>
        /// Get feedback by goal ID (for goal-based feedback context)
        /// </summary>
        Task<List<Feedback>> GetFeedbackByGoalAsync(int goalId);

        /// <summary>
        /// Get feedback by project ID (for project-based feedback context)
        /// </summary>
        Task<List<Feedback>> GetFeedbackByProjectAsync(int projectId);

        /// <summary>
        /// Get all question responses for a specific feedback
        /// </summary>
        Task<List<Feedbackquestionresponse>> GetFeedbackResponsesAsync(int feedbackId);

        /// <summary>
        /// Get specific question response
        /// </summary>
        Task<Feedbackquestionresponse> GetQuestionResponseAsync(int responseId);

        /// <summary>
        /// Get all feedback (with pagination for HR)
        /// Used by: US093 (HR views all feedback)
        /// </summary>
        Task<List<Feedback>> GetAllFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Update feedback record (content, rating, comments)
        /// </summary>
        Task<bool> UpdateFeedbackAsync(Feedback feedback);

        Task<bool> UpdateFeedbackStatusAsync(int feedbackId, string newStatus);

        Task<bool> FlagFeedbackForBiasAsync(int feedbackId, bool isBias, bool isFairness, int reviewedByHRId);

        Task<bool> SetHRReviewAsync(int feedbackId, string hrComments, int reviewedByHRId);
        Task<bool> UpdateQuestionResponseAsync(Feedbackquestionresponse response);

        /// <summary>
        /// Delete feedback (only if Draft status)
        /// </summary>
        Task<bool> DeleteFeedbackAsync(int feedbackId);

        /// <summary>
        /// Delete question response
        /// </summary>
        Task<bool> DeleteQuestionResponseAsync(int responseId);

        /// <summary>
        /// Check if feedback exists
        /// </summary>
        Task<bool> FeedbackExistsAsync(int feedbackId);

        /// <summary>
        /// Check if employee can edit feedback (Draft status)
        /// </summary>
        Task<bool> CanEditFeedbackAsync(int feedbackId);
    }
}

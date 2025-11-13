using Relevantz.EEPZ.Common.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;


namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for Feedback entity
    /// Handles all CRUD operations for feedback (US032-US120)
    /// </summary>
    public interface IFeedbackRepository
    {
        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Create new feedback record
        /// Used by: US032, US033, US036, US037, US039
        /// </summary>
        Task<int> CreateFeedbackAsync(Feedback feedback);

        /// <summary>
        /// Create question response for feedback
        /// Stores individual question ratings/answers
        /// </summary>
        Task<int> CreateQuestionResponseAsync(Feedbackquestionresponse response);

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        /// <summary>
        /// Get feedback by ID with all relationships
        /// Used by: US038 (View feedback), US046 (Manager view)
        /// </summary>
        Task<Feedback> GetFeedbackByIdAsync(int feedbackId);

        /// <summary>
        /// Get all feedback submitted BY an employee
        /// Used by: US038 (View own submitted feedback)
        /// </summary>
        Task<List<Feedback>> GetFeedbackBySubmitterAsync(int employeeId);

        /// <summary>
        /// Get all feedback received BY an employee (as recipient)
        /// Used by: Employee viewing feedback about them
        /// </summary>
        Task<List<Feedback>> GetFeedbackByRecipientAsync(int employeeId);

        /// <summary>
        /// Get all feedback FROM team members (for manager dashboard)
        /// Used by: US046 (Manager views team feedback), US047 (Org goal feedback view)
        /// </summary>
        Task<List<Feedback>> GetTeamFeedbackAsync(int managerId);

        /// <summary>
        /// Get all feedback WITH bias or fairness flags
        /// Used by: US113 (HR views bias/fairness concerns)
        /// </summary>
        Task<List<Feedback>> GetFlaggedFeedbackAsync(bool? isBias = null, bool? isFairness = null);

        /// <summary>
        /// Get all anonymous feedback
        /// Used by: US120 (HR views anonymous feedback)
        /// </summary>
        Task<List<Feedback>> GetAnonymousFeedbackAsync();

        /// <summary>
        /// Get all feedback pending HR review
        /// Used by: US112, US113, US114 (HR review workflow)
        /// </summary>
        Task<List<Feedback>> GetPendingHRReviewAsync();

        /// <summary>
        /// Get feedback by goal ID (for goal-based feedback context)
        /// Used by: US032, US074 (View feedback within goal context)
        /// </summary>
        Task<List<Feedback>> GetFeedbackByGoalAsync(int goalId);

        /// <summary>
        /// Get feedback by project ID (for project-based feedback context)
        /// Used by: US032, US074 (View feedback within project context)
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

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Update feedback record (content, rating, comments)
        /// Used by: US038 (Edit feedback - Draft only)
        /// </summary>
        Task<bool> UpdateFeedbackAsync(Feedback feedback);

        /// <summary>
        /// Update feedback status only (Draft → Submitted → UnderHRReview → Reviewed → Archived)
        /// Used by: US038 (Submit feedback), US113 (HR moves to review)
        /// </summary>
        Task<bool> UpdateFeedbackStatusAsync(int feedbackId, string newStatus);

        /// <summary>
        /// Flag feedback for bias/fairness review
        /// Used by: US112, US113 (HR flags feedback)
        /// </summary>
        Task<bool> FlagFeedbackForBiasAsync(int feedbackId, bool isBias, bool isFairness, int reviewedByHRId);

        /// <summary>
        /// Set HR review comments on feedback
        /// Used by: US114 (HR submits review based on bias)
        /// </summary>
        Task<bool> SetHRReviewAsync(int feedbackId, string hrComments, int reviewedByHRId);

        /// <summary>
        /// Update question response
        /// </summary>
        Task<bool> UpdateQuestionResponseAsync(Feedbackquestionresponse response);

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Delete feedback (only if Draft status)
        /// Used by: US038 (Delete feedback)
        /// </summary>
        Task<bool> DeleteFeedbackAsync(int feedbackId);

        /// <summary>
        /// Delete question response
        /// </summary>
        Task<bool> DeleteQuestionResponseAsync(int responseId);

        // ============================================================================
        // EXISTENCE CHECKS
        // ============================================================================

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

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for Feedback business logic
    /// Handles all feedback operations (US032-US120)
    /// </summary>
    public interface IFeedbackService
    {
        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Submit feedback (all types: goal, project, peer, mentor, etc.)
        /// Used by: US032, US033, US036, US037, US039
        /// </summary>
        Task<FeedbackResponseDto> CreateFeedbackAsync(CreateFeedbackRequestDto dto);

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        /// <summary>
        /// Get feedback by ID with all question responses
        /// </summary>
        Task<FeedbackResponseDto> GetFeedbackByIdAsync(int feedbackId);

        /// <summary>
        /// Get all feedback submitted BY current user
        /// Used by: US038 (View own submitted feedback)
        /// </summary>
        Task<List<FeedbackResponseDto>> GetMyFeedbackAsync(int employeeId);

        /// <summary>
        /// Get all feedback received BY current user (as recipient)
        /// Used by: Employee views feedback about them
        /// </summary>
        Task<List<FeedbackResponseDto>> GetFeedbackAsRecipientAsync(int employeeId);

        /// <summary>
        /// Get team feedback (from team members)
        /// Used by: US046 (Manager views team feedback)
        /// </summary>
        Task<List<FeedbackResponseDto>> GetTeamFeedbackAsync(int managerId);

        /// <summary>
        /// Get feedback form structure for specific feedback type
        /// Used by: All feedback submissions (populate form)
        /// </summary>
        Task<FeedbackFormDto> GetFeedbackFormAsync(string feedbackType);

        /// <summary>
        /// Get flagged feedback (bias or fairness concerns)
        /// Used by: US113 (HR views flagged feedback)
        /// </summary>
        Task<List<FeedbackResponseDto>> GetFlaggedFeedbackAsync(bool? isBias = null, bool? isFairness = null);

        /// <summary>
        /// Get anonymous feedback
        /// Used by: US120 (HR views anonymous feedback)
        /// </summary>
        Task<List<FeedbackResponseDto>> GetAnonymousFeedbackAsync();

        /// <summary>
        /// Get feedback pending HR review
        /// Used by: US113, US114 (HR review workflow)
        /// </summary>
        Task<List<FeedbackResponseDto>> GetPendingHRReviewAsync();

        /// <summary>
        /// Get all feedback (with pagination for HR)
        /// Used by: US093 (HR views all feedback)
        /// </summary>
        Task<List<FeedbackResponseDto>> GetAllFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Get feedback for specific goal
        /// Used by: US032, US074 (Context view)
        /// </summary>
        Task<List<FeedbackResponseDto>> GetFeedbackByGoalAsync(int goalId);

        /// <summary>
        /// Get feedback for specific project
        /// Used by: US032, US074 (Context view)
        /// </summary>
        Task<List<FeedbackResponseDto>> GetFeedbackByProjectAsync(int projectId);

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Update feedback (content, rating, comments)
        /// Used by: US038 (Edit feedback - Draft only)
        /// </summary>
        Task<FeedbackResponseDto> UpdateFeedbackAsync(int feedbackId, UpdateFeedbackRequestDto dto);

        /// <summary>
        /// Submit feedback (change status from Draft to Submitted)
        /// Used by: US038 (Submit feedback)
        /// </summary>
        Task<bool> SubmitFeedbackAsync(int feedbackId);

        /// <summary>
        /// Flag feedback for bias/fairness review
        /// Used by: US112, US113 (HR flags concerns)
        /// </summary>
        Task<bool> FlagFeedbackForBiasAsync(int feedbackId, bool isBias, bool isFairness, int reviewedByHRId);

        /// <summary>
        /// Set HR review on feedback
        /// Used by: US114 (HR completes review)
        /// </summary>
        Task<bool> SetHRReviewAsync(int feedbackId, string hrComments, int reviewedByHRId);

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Delete feedback (only if Draft status)
        /// Used by: US038 (Delete feedback)
        /// </summary>
        Task<bool> DeleteFeedbackAsync(int feedbackId);

        // ============================================================================
        // VALIDATION OPERATIONS
        // ============================================================================

        /// <summary>
        /// Check if employee can edit feedback
        /// </summary>
        Task<bool> CanEditFeedbackAsync(int feedbackId);
    }
}

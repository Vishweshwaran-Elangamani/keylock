using Relevantz.EEPZ.Common.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for MentorFeedbackTracking entity
    /// Handles mentor feedback (US037, US078, US121, US122)
    /// Linked to SME table (mentor + skill combo)
    /// </summary>
    public interface IMentorFeedbackRepository
    {
        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Create mentor feedback tracking record
        /// Used by: US037 (Employee submit), US121 (HR submit), US037 (Manager submit)
        /// </summary>
        Task<int> CreateMentorFeedbackAsync(Mentorfeedbacktracking feedback);

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        /// <summary>
        /// Get mentor feedback by ID
        /// </summary>
        Task<Mentorfeedbacktracking> GetMentorFeedbackByIdAsync(int trackingId);

        /// <summary>
        /// Get all feedback ABOUT a specific mentor
        /// Used by: US078 (Mentor views feedback about them)
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetFeedbackByMentorAsync(int mentorEmployeeId);

        /// <summary>
        /// Get all feedback GIVEN BY a mentee about their mentor
        /// Used by: US037 (Employee views feedback they gave)
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetFeedbackByMenteeAsync(int menteeEmployeeId);

        /// <summary>
        /// Get all feedback linked to specific SME (mentor + skill combo)
        /// Used by: US037, US122 (Context-based queries)
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetFeedbackBySmeAsync(int smeId);

        /// <summary>
        /// Get all mentor feedback pending HR review
        /// Used by: US122 (HR manages mentor feedback)
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetPendingHRReviewAsync();

        /// <summary>
        /// Get all mentor feedback (with pagination for HR)
        /// Used by: US122 (HR views all mentor feedback)
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetAllMentorFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Get feedback by status (Submitted, Acknowledged, Reviewed, Archived)
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetFeedbackByStatusAsync(string status);

        /// <summary>
        /// Get feedback submitted BY specific role
        /// Used by: US121 (HR-submitted feedback), US037 (Mentee-submitted)
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetFeedbackBySourceAsync(string feedbackFrom);

        /// <summary>
        /// Get anonymous mentor feedback
        /// </summary>
        Task<List<Mentorfeedbacktracking>> GetAnonymousMentorFeedbackAsync();

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Update mentor feedback record
        /// </summary>
        Task<bool> UpdateMentorFeedbackAsync(Mentorfeedbacktracking feedback);

        /// <summary>
        /// Update feedback status (Submitted → Acknowledged → Reviewed → Archived)
        /// Used by: US122 (HR manages status)
        /// </summary>
        Task<bool> UpdateFeedbackStatusAsync(int trackingId, string newStatus);

        /// <summary>
        /// Set HR review on mentor feedback
        /// Used by: US122 (HR adds comments/archiving)
        /// </summary>
        Task<bool> SetHRReviewAsync(int trackingId, string hrComments, int reviewedByHRId);

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Delete mentor feedback (only if Submitted status)
        /// </summary>
        Task<bool> DeleteMentorFeedbackAsync(int trackingId);

        // ============================================================================
        // EXISTENCE CHECKS
        // ============================================================================

        /// <summary>
        /// Check if mentor feedback exists
        /// </summary>
        Task<bool> MentorFeedbackExistsAsync(int trackingId);
    }
}

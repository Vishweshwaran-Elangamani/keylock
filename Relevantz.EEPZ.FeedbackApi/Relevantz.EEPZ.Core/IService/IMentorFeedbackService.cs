using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace  Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for MentorFeedbackTracking business logic
    /// Handles mentor feedback operations (US037, US078, US121, US122)
    /// </summary>
    public interface IMentorFeedbackService
    {
        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Create mentor feedback
        /// Used by: US037 (Employee submit), US121 (HR submit), US037 (Manager submit)
        /// </summary>
        Task<MentorFeedbackResponseDto> CreateMentorFeedbackAsync(CreateMentorFeedbackRequestDto dto);

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        /// <summary>
        /// Get mentor feedback by ID
        /// </summary>
        Task<MentorFeedbackResponseDto> GetMentorFeedbackByIdAsync(int trackingId);

        /// <summary>
        /// Get all feedback ABOUT a specific mentor
        /// Used by: US078 (Mentor views feedback about them)
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetFeedbackAboutMeAsync(int mentorEmployeeId);

        /// <summary>
        /// Get all feedback GIVEN BY mentee about their mentor
        /// Used by: US037 (Mentee views feedback they gave)
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetMyMentorFeedbackAsync(int menteeEmployeeId);

        /// <summary>
        /// Get all mentor feedback (for HR)
        /// Used by: US122 (HR manages mentor feedback)
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetAllMentorFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Get feedback by status (Submitted, Acknowledged, Reviewed, Archived)
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetFeedbackByStatusAsync(string status);

        /// <summary>
        /// Get pending HR review mentor feedback
        /// Used by: US122 (HR review queue)
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetPendingHRReviewAsync();

        /// <summary>
        /// Get anonymous mentor feedback
        /// </summary>
        Task<List<MentorFeedbackResponseDto>> GetAnonymousMentorFeedbackAsync();

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

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
        // VALIDATION OPERATIONS
        // ============================================================================

        /// <summary>
        /// Check if mentor feedback exists
        /// </summary>
        Task<bool> MentorFeedbackExistsAsync(int trackingId);
    }
}

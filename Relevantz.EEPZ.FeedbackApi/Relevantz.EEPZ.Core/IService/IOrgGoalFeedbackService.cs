using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace  Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for OrganizationGoalFeedback business logic
    /// Handles org-wide goal feedback (US047, US049, US051)
    /// </summary>
    public interface IOrgGoalFeedbackService
    {
        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Create organization goal feedback
        /// Used by: US047 (Employee feedback), US049 (Manager feedback)
        /// </summary>
        Task<OrgGoalFeedbackResponseDto> CreateOrgGoalFeedbackAsync(CreateOrgGoalFeedbackRequestDto dto);

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        /// <summary>
        /// Get org goal feedback by ID
        /// </summary>
        Task<OrgGoalFeedbackResponseDto> GetOrgGoalFeedbackByIdAsync(int feedbackId);

        /// <summary>
        /// Get all feedback on specific organization objective
        /// Used by: US047, US049 (View feedback for org goal)
        /// </summary>
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByOrgGoalAsync(int organizationObjectiveId);

        /// <summary>
        /// Get all feedback submitted BY an employee
        /// Used by: Employee views own org goal feedback
        /// </summary>
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackBySubmitterAsync(int employeeId);

        /// <summary>
        /// Get feedback by source (Employee, Manager, DeptHead, HR)
        /// </summary>
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackBySourceAsync(string feedbackFrom);

        /// <summary>
        /// Get all org goal feedback (for HR)
        /// Used by: HR views all org goal feedback
        /// </summary>
        Task<List<OrgGoalFeedbackResponseDto>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Get feedback by status (Submitted, Reviewed, Archived)
        /// </summary>
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByStatusAsync(string status);

        /// <summary>
        /// Get anonymous org goal feedback
        /// </summary>
        Task<List<OrgGoalFeedbackResponseDto>> GetAnonymousOrgGoalFeedbackAsync();

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Update org goal feedback record
        /// </summary>
        Task<OrgGoalFeedbackResponseDto> UpdateOrgGoalFeedbackAsync(int feedbackId, UpdateOrgGoalFeedbackRequestDto dto);

        /// <summary>
        /// Archive org goal feedback
        /// </summary>
        Task<bool> ArchiveOrgGoalFeedbackAsync(int feedbackId);

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Delete org goal feedback (only if Submitted status)
        /// </summary>
        Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId);

        // ============================================================================
        // VALIDATION OPERATIONS
        // ============================================================================

        /// <summary>
        /// Check if org goal feedback exists
        /// </summary>
        Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId);
    }
}

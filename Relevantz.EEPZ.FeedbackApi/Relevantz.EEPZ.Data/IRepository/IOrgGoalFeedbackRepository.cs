using Relevantz.EEPZ.Common.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for OrganizationGoalFeedback entity
    /// Handles organization-wide goal feedback (US047, US049, US051)
    /// </summary>
    public interface IOrgGoalFeedbackRepository
    {
        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Create organization goal feedback
        /// Used by: US047 (Employee feedback), US049 (Manager feedback)
        /// </summary>
        Task<int> CreateOrgGoalFeedbackAsync(Organizationgoalfeedback feedback);

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        /// <summary>
        /// Get org goal feedback by ID
        /// </summary>
        Task<Organizationgoalfeedback> GetOrgGoalFeedbackByIdAsync(int feedbackId);

        /// <summary>
        /// Get all feedback on specific organization objective
        /// Used by: US047, US049 (View feedback for org goal)
        /// </summary>
        Task<List<Organizationgoalfeedback>> GetFeedbackByOrgObjectiveAsync(int organizationObjectiveId);

        /// <summary>
        /// Get all feedback submitted BY an employee
        /// Used by: Employee views own org goal feedback
        /// </summary>
        Task<List<Organizationgoalfeedback>> GetFeedbackBySubmitterAsync(int employeeId);

        /// <summary>
        /// Get feedback by feedback source (Employee, Manager, DeptHead, HR)
        /// </summary>
        Task<List<Organizationgoalfeedback>> GetFeedbackBySourceAsync(string feedbackFrom);

        /// <summary>
        /// Get all org goal feedback (with pagination for HR)
        /// Used by: HR views all org goal feedback
        /// </summary>
        Task<List<Organizationgoalfeedback>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Get feedback by status (Submitted, Reviewed, Archived)
        /// </summary>
        Task<List<Organizationgoalfeedback>> GetFeedbackByStatusAsync(string status);

        /// <summary>
        /// Get anonymous org goal feedback
        /// </summary>
        Task<List<Organizationgoalfeedback>> GetAnonymousOrgGoalFeedbackAsync();

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Update org goal feedback record
        /// </summary>
        Task<bool> UpdateOrgGoalFeedbackAsync(Organizationgoalfeedback feedback);

        /// <summary>
        /// Update feedback status (Submitted → Reviewed → Archived)
        /// </summary>
        Task<bool> UpdateFeedbackStatusAsync(int feedbackId, string newStatus);

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Delete org goal feedback (only if Submitted status)
        /// </summary>
        Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId);

        // ============================================================================
        // EXISTENCE CHECKS
        // ============================================================================

        /// <summary>
        /// Check if org goal feedback exists
        /// </summary>
        Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId);
    }
}

using Relevantz.EEPZ.Common.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for ManagerReviewComments entity
    /// Handles manager reviews on team/org goals (US048-US051, US083, US093)
    /// </summary>
    public interface IManagerReviewRepository
    {
        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Create manager review on team goal
        /// Used by: US048 (Manager submit review on team goals)
        /// </summary>
        Task<int> CreateReviewAsync(Managerreviewcomment review);

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        /// <summary>
        /// Get review by ID
        /// </summary>
        Task<Managerreviewcomment> GetReviewByIdAsync(int reviewId);

        /// <summary>
        /// Get all reviews created BY a manager
        /// Used by: US050 (Manager view own reviews to modify)
        /// </summary>
        Task<List<Managerreviewcomment>> GetReviewsByManagerAsync(int managerId);

        /// <summary>
        /// Get all reviews FOR an employee (as recipient)
        /// </summary>
        Task<List<Managerreviewcomment>> GetReviewsForEmployeeAsync(int employeeId);

        /// <summary>
        /// Get reviews on specific goal
        /// Used by: US048, US074 (Context-based view)
        /// </summary>
        Task<List<Managerreviewcomment>> GetReviewsByGoalAsync(int goalId);

        /// <summary>
        /// Get reviews on specific organization goal
        /// Used by: US049, US051 (Org goal reviews)
        /// </summary>
        Task<List<Managerreviewcomment>> GetReviewsByOrgGoalAsync(int orgGoalId);

        /// <summary>
        /// Get all reviews (for HR and DeptHead)
        /// Used by: US083 (DeptHead view), US093 (HR view all)
        /// </summary>
        Task<List<Managerreviewcomment>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Get reviews by status (Draft, Submitted, Modified, Finalized)
        /// </summary>
        Task<List<Managerreviewcomment>> GetReviewsByStatusAsync(string status);

        /// <summary>
        /// Get all reviews pending submission
        /// Used by: US050 (Manager see draft reviews to submit)
        /// </summary>
        Task<List<Managerreviewcomment>> GetPendingReviewsAsync(int managerId);

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Update review (content and rating)
        /// Used by: US050 (Manager modify own reviews)
        /// </summary>
        Task<bool> UpdateReviewAsync(Managerreviewcomment review);

        /// <summary>
        /// Update review status (Draft → Submitted → Modified → Finalized)
        /// Used by: US050, US051 (Status transitions)
        /// </summary>
        Task<bool> UpdateReviewStatusAsync(int reviewId, string newStatus);

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Delete review (only if Draft status)
        /// </summary>
        Task<bool> DeleteReviewAsync(int reviewId);

        // ============================================================================
        // EXISTENCE CHECKS
        // ============================================================================

        /// <summary>
        /// Check if review exists
        /// </summary>
        Task<bool> ReviewExistsAsync(int reviewId);

        /// <summary>
        /// Check if manager can edit review (Draft or Modified status)
        /// </summary>
        Task<bool> CanEditReviewAsync(int reviewId);
    }
}

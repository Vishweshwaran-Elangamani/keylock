using Relevantz.EEPZ.Common.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for ManagerReviewComments entity
    /// </summary>
    public interface IManagerReviewRepository
    {
        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Create manager review on team goal
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
        /// </summary>
        Task<List<Managerreviewcomment>> GetReviewsByManagerAsync(int managerId);

        /// <summary>
        /// Get all reviews FOR an employee (as recipient)
        /// </summary>
        Task<List<Managerreviewcomment>> GetReviewsForEmployeeAsync(int employeeId);

        /// <summary>
        /// Get reviews on specific goal
        /// </summary>
        Task<List<Managerreviewcomment>> GetReviewsByGoalAsync(int goalId);

        /// <summary>
        /// Get reviews on specific organization goal
        /// </summary>
        Task<List<Managerreviewcomment>> GetReviewsByOrgGoalAsync(int orgGoalId);

        /// <summary>
        /// Get all reviews (for HR and DeptHead)
        /// </summary>
        Task<List<Managerreviewcomment>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 20);

        Task<List<Managerreviewcomment>> GetReviewsByStatusAsync(string status);

        /// <summary>
        /// Get all reviews pending submission
        /// </summary>
        Task<List<Managerreviewcomment>> GetPendingReviewsAsync(int managerId);

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Update review (content and rating)
        /// </summary>
        Task<bool> UpdateReviewAsync(Managerreviewcomment review);
        Task<bool> UpdateReviewStatusAsync(int reviewId, string newStatus);

        Task<bool> DeleteReviewAsync(int reviewId);
        Task<bool> ReviewExistsAsync(int reviewId);
        Task<bool> CanEditReviewAsync(int reviewId);
    }
}

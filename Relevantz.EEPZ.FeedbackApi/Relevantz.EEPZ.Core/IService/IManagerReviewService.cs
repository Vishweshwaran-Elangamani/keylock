
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace  Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for ManagerReviewComments business logic
    /// Handles manager reviews on team/org goals (US048-US051, US083, US093)
    /// </summary>
    public interface IManagerReviewService
    {
        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Create manager review on team/org goal
        /// Used by: US048 (Manager submit), US049 (Manager org goal review)
        /// </summary>
        Task<ManagerReviewResponseDto> CreateReviewAsync(CreateManagerReviewRequestDto dto);

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        /// <summary>
        /// Get review by ID
        /// </summary>
        Task<ManagerReviewResponseDto> GetReviewByIdAsync(int reviewId);

        /// <summary>
        /// Get all reviews created BY manager (draft/pending)
        /// Used by: US050 (Manager views own reviews to modify)
        /// </summary>
        Task<List<ManagerReviewResponseDto>> GetMyReviewsAsync(int managerId);

        /// <summary>
        /// Get all reviews FOR an employee (as recipient)
        /// </summary>
        Task<List<ManagerReviewResponseDto>> GetReviewsForMeAsync(int employeeId);

        /// <summary>
        /// Get reviews on specific goal with context
        /// Used by: US048 (View goal reviews)
        /// </summary>
        Task<List<ManagerReviewResponseDto>> GetReviewsByGoalAsync(int goalId);

        /// <summary>
        /// Get reviews on organization goal
        /// Used by: US049, US051 (Org goal reviews)
        /// </summary>
        Task<List<ManagerReviewResponseDto>> GetReviewsByOrgGoalAsync(int orgGoalId);

        /// <summary>
        /// Get all manager reviews for HR/DeptHead
        /// Used by: US083 (DeptHead view), US093 (HR view all)
        /// </summary>
        Task<List<ManagerReviewResponseDto>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Get reviews by status (Draft, Submitted, Modified, Finalized)
        /// </summary>
        Task<List<ManagerReviewResponseDto>> GetReviewsByStatusAsync(string status);

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Update review (content and rating)
        /// Used by: US050 (Manager modify draft review)
        /// </summary>
        Task<ManagerReviewResponseDto> UpdateReviewAsync(int reviewId, UpdateManagerReviewRequestDto dto);

        /// <summary>
        /// Submit review (Draft → Submitted)
        /// Used by: US050 (Manager submit review)
        /// </summary>
        Task<bool> SubmitReviewAsync(int reviewId);

        /// <summary>
        /// Modify submitted review (Submitted → Modified)
        /// Used by: US050 (Manager modify submitted review)
        /// </summary>
        Task<bool> ModifyReviewAsync(int reviewId);

        /// <summary>
        /// Finalize review (Modified/Submitted → Finalized)
        /// </summary>
        Task<bool> FinalizeReviewAsync(int reviewId);

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Delete review (only if Draft status)
        /// </summary>
        Task<bool> DeleteReviewAsync(int reviewId);

        // ============================================================================
        // VALIDATION OPERATIONS
        // ============================================================================

        /// <summary>
        /// Check if manager can edit review
        /// </summary>
        Task<bool> CanEditReviewAsync(int reviewId);

    }
}

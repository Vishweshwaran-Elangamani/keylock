using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for ManagerReviewComments business logic
    /// </summary>
    public interface IManagerReviewService
    {
        /// <summary>
        /// Create manager review on team/org goal       
        /// </summary>
        Task<ManagerReviewResponseDto> CreateReviewAsync(CreateManagerReviewRequestDto dto);

        /// <summary>
        /// Get review by ID
        /// </summary>
        Task<ManagerReviewResponseDto> GetReviewByIdAsync(int reviewId);

        /// <summary>
        /// Get all reviews created BY manager (draft/pending)
        /// </summary>
        Task<List<ManagerReviewResponseDto>> GetMyReviewsAsync(int managerId);

        /// <summary>
        /// Get all reviews FOR an employee (as recipient)
        /// </summary>
        Task<List<ManagerReviewResponseDto>> GetReviewsForMeAsync(int employeeId);

        /// <summary>
        /// Get reviews on specific goal with context
        /// </summary>
        Task<List<ManagerReviewResponseDto>> GetReviewsByGoalAsync(int goalId);

        /// <summary>
        /// Get reviews on organization goal
        /// </summary>
        Task<List<ManagerReviewResponseDto>> GetReviewsByOrgGoalAsync(int orgGoalId);

        /// <summary>
        /// Get all manager reviews for HR/DeptHead
        /// </summary>
        Task<List<ManagerReviewResponseDto>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Get reviews by status (Draft, Submitted, Modified, Finalized)
        /// </summary>
        Task<List<ManagerReviewResponseDto>> GetReviewsByStatusAsync(string status);

        /// <summary>
        /// Update review (content and rating)
        /// </summary>
        Task<ManagerReviewResponseDto> UpdateReviewAsync(int reviewId, UpdateManagerReviewRequestDto dto);

        /// <summary>
        /// Submit review
        /// </summary>
        Task<bool> SubmitReviewAsync(int reviewId);

        /// <summary>
        /// Modify submitted review
        /// </summary>
        Task<bool> ModifyReviewAsync(int reviewId);

        /// <summary>
        /// Finalize review 
        /// </summary>
        Task<bool> FinalizeReviewAsync(int reviewId);

        /// <summary>
        /// Delete review (only if Draft status)
        /// </summary>
        Task<bool> DeleteReviewAsync(int reviewId);

        /// <summary>
        /// Check if manager can edit review
        /// </summary>
        Task<bool> CanEditReviewAsync(int reviewId);

    }
}

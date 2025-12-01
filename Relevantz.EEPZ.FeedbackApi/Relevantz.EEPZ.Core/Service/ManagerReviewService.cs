using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    /// <summary>
    /// Service implementation for ManagerReviewComments business logic
    /// Handles manager reviews on team/org goals
    /// </summary>
    public class ManagerReviewService : IManagerReviewService
    {
        private readonly IManagerReviewRepository _reviewRepo;
        private readonly ILogger<ManagerReviewService> _logger;

        public ManagerReviewService(
            IManagerReviewRepository reviewRepo,
            ILogger<ManagerReviewService> logger)
        {
            _reviewRepo = reviewRepo;
            _logger = logger;
        }

        public async Task<ManagerReviewResponseDto> CreateReviewAsync(CreateManagerReviewRequestDto dto)
        {
            try
            {
                if (dto.ManagerEmployeeId <= 0)
                    throw new ArgumentException("ManagerEmployeeId must be valid");
                if (dto.TargetEmployeeId <= 0)
                    throw new ArgumentException("TargetEmployeeId must be valid");
                if (dto.Rating < 1 || dto.Rating > 5)
                    throw new ArgumentException("Rating must be between 1 and 5");

                var review = new Managerreviewcomment
                {
                    ManagerEmployeeId = dto.ManagerEmployeeId,
                    TargetEmployeeId = dto.TargetEmployeeId,
                    TargetGoalId = dto.TargetGoalId,
                    TargetOrganizationGoalId = dto.TargetOrganizationGoalId,
                    Rating = dto.Rating,
                    ReviewComment = dto.ReviewComment,
                    Status = "Draft"
                };

                var reviewId = await _reviewRepo.CreateReviewAsync(review);
                _logger.LogInformation($"Manager review created: {reviewId}");

                return await GetReviewByIdAsync(reviewId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating manager review: {ex.Message}");
                throw;
            }
        }
        public async Task<ManagerReviewResponseDto> GetReviewByIdAsync(int reviewId)
        {
            try
            {
                var review = await _reviewRepo.GetReviewByIdAsync(reviewId);
                if (review == null)
                    throw new KeyNotFoundException($"Review {reviewId} not found");

                return MapToResponseDto(review);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting review by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<List<ManagerReviewResponseDto>> GetMyReviewsAsync(int managerId)
        {
            try
            {
                var reviews = await _reviewRepo.GetReviewsByManagerAsync(managerId);
                return reviews.Select(r => MapToResponseDto(r)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting my reviews: {ex.Message}");
                throw;
            }
        }

        public async Task<List<ManagerReviewResponseDto>> GetReviewsForMeAsync(int employeeId)
        {
            try
            {
                var reviews = await _reviewRepo.GetReviewsForEmployeeAsync(employeeId);
                return reviews.Select(r => MapToResponseDto(r)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting reviews for me: {ex.Message}");
                throw;
            }
        }

        public async Task<List<ManagerReviewResponseDto>> GetReviewsByGoalAsync(int goalId)
        {
            try
            {
                var reviews = await _reviewRepo.GetReviewsByGoalAsync(goalId);
                return reviews.Select(r => MapToResponseDto(r)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting reviews by goal: {ex.Message}");
                throw;
            }
        }

        public async Task<List<ManagerReviewResponseDto>> GetReviewsByOrgGoalAsync(int orgGoalId)
        {
            try
            {
                var reviews = await _reviewRepo.GetReviewsByOrgGoalAsync(orgGoalId);
                return reviews.Select(r => MapToResponseDto(r)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting reviews by org goal: {ex.Message}");
                throw;
            }
        }

        public async Task<List<ManagerReviewResponseDto>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                var reviews = await _reviewRepo.GetAllReviewsAsync(pageNumber, pageSize);
                return reviews.Select(r => MapToResponseDto(r)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all reviews: {ex.Message}");
                throw;
            }
        }

        public async Task<List<ManagerReviewResponseDto>> GetReviewsByStatusAsync(string status)
        {
            try
            {
                var reviews = await _reviewRepo.GetReviewsByStatusAsync(status);
                return reviews.Select(r => MapToResponseDto(r)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting reviews by status: {ex.Message}");
                throw;
            }
        }
        public async Task<ManagerReviewResponseDto> UpdateReviewAsync(int reviewId, UpdateManagerReviewRequestDto dto)
        {
            try
            {
                var review = await _reviewRepo.GetReviewByIdAsync(reviewId);
                if (review == null)
                    throw new KeyNotFoundException($"Review {reviewId} not found");

                if (review.Status != "Draft")
                    throw new InvalidOperationException($"Cannot edit review in {review.Status} status");

                if (dto.Rating.HasValue)
                {
                    if (dto.Rating < 1 || dto.Rating > 5)
                        throw new ArgumentException("Rating must be between 1 and 5");
                    review.Rating = dto.Rating.Value;
                }

                if (!string.IsNullOrEmpty(dto.ReviewComment))
                    review.ReviewComment = dto.ReviewComment;

                review.ModifiedAt = DateTime.UtcNow;

                await _reviewRepo.UpdateReviewAsync(review);
                _logger.LogInformation($"Manager review updated: {reviewId}");

                return await GetReviewByIdAsync(reviewId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating manager review: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> SubmitReviewAsync(int reviewId)
        {
            try
            {
                var review = await _reviewRepo.GetReviewByIdAsync(reviewId);
                if (review == null)
                    throw new KeyNotFoundException($"Review {reviewId} not found");

                if (review.Status != "Draft")
                    throw new InvalidOperationException($"Cannot submit review in {review.Status} status");

                review.Status = "Submitted";
                review.SubmittedAt = DateTime.UtcNow;

                var result = await _reviewRepo.UpdateReviewAsync(review);
                if (result)
                    _logger.LogInformation($"Manager review submitted: {reviewId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error submitting review: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> ModifyReviewAsync(int reviewId)
        {
            try
            {
                var review = await _reviewRepo.GetReviewByIdAsync(reviewId);
                if (review == null)
                    throw new KeyNotFoundException($"Review {reviewId} not found");

                if (review.Status != "Submitted")
                    throw new InvalidOperationException($"Cannot modify review in {review.Status} status");

                review.Status = "Modified";
                review.ModifiedAt = DateTime.UtcNow;

                var result = await _reviewRepo.UpdateReviewAsync(review);
                if (result)
                    _logger.LogInformation($"Manager review status changed to Modified: {reviewId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error modifying review: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> FinalizeReviewAsync(int reviewId)
        {
            try
            {
                var review = await _reviewRepo.GetReviewByIdAsync(reviewId);
                if (review == null)
                    throw new KeyNotFoundException($"Review {reviewId} not found");

                if (review.Status != "Submitted" && review.Status != "Modified")
                    throw new InvalidOperationException($"Cannot finalize review in {review.Status} status");

                review.Status = "Finalized";

                var result = await _reviewRepo.UpdateReviewAsync(review);
                if (result)
                    _logger.LogInformation($"Manager review finalized: {reviewId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error finalizing review: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> DeleteReviewAsync(int reviewId)
        {
            try
            {
                var result = await _reviewRepo.DeleteReviewAsync(reviewId);
                if (result)
                    _logger.LogInformation($"Manager review deleted: {reviewId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting review: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> CanEditReviewAsync(int reviewId)
        {
            try
            {
                return await _reviewRepo.CanEditReviewAsync(reviewId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking if can edit: {ex.Message}");
                throw;
            }
        }
                private ManagerReviewResponseDto MapToResponseDto(Managerreviewcomment review)
        {
            return new ManagerReviewResponseDto
            {
                ReviewcommentId = review.ReviewCommentId,
                ManagerEmployeeId = review.ManagerEmployeeId,
                ManagerName = review.ManagerEmployee != null 
                    ? $"{review.ManagerEmployee.EmployeeId}" 
                    : "Unknown",
                TargetEmployeeId = review.TargetEmployeeId,
                TargetEmployeeName = review.TargetEmployee != null 
                    ? $"{review.TargetEmployee.EmployeeId}" 
                    : "Unknown",
                TargetGoalId = review.TargetGoalId,
                TargetGoalName = review.TargetGoal != null 
                    ? review.TargetGoal.GoalTitle 
                    : "N/A",
                TargetOrganizationGoalId = review.TargetOrganizationGoalId,
                
                Rating = review.Rating,
                ReviewComment = review.ReviewComment,
                Status = review.Status,
                CreatedAt = review.CreatedAt,
                SubmittedAt = review.SubmittedAt,
                ModifiedAt = review.ModifiedAt
            };
        }

    }
}

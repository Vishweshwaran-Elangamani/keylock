using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class ManagerReviewService : IManagerReviewService
    {
        private readonly IManagerReviewRepository _reviewRepo;
        private readonly ILogger<ManagerReviewService> _logger;

        public ManagerReviewService(IManagerReviewRepository reviewRepo, ILogger<ManagerReviewService> logger)
        {
            _reviewRepo = reviewRepo;
            _logger = logger;
        }

        public async Task<ManagerReviewResponseDto> CreateReviewAsync(CreateManagerReviewRequestDto dto)
        {
            if (dto.ManagerEmployeeId <= 0)
                throw new ArgumentException("ManagerEmployeeId must be valid");
            if (dto.TargetEmployeeId <= 0)
                throw new ArgumentException("TargetEmployeeId must be valid");
            if (dto.Rating < 1 || dto.Rating > 5)
                throw new ArgumentException("Rating must be between 1 and 5");

            _logger.LogInformation("Creating manager review. Manager: {ManagerId}, Target: {TargetId}, Rating: {Rating}",
                dto.ManagerEmployeeId, dto.TargetEmployeeId, dto.Rating);

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

            _logger.LogInformation("Manager review created. ReviewId: {ReviewId}", reviewId);

            return await GetReviewByIdAsync(reviewId);
        }

        public async Task<ManagerReviewResponseDto> GetReviewByIdAsync(int reviewId)
        {
            var review = await _reviewRepo.GetReviewByIdAsync(reviewId);
            if (review == null)
                throw new KeyNotFoundException($"Review {reviewId} not found");

            return MapToResponseDto(review);
        }

        public async Task<List<ManagerReviewResponseDto>> GetMyReviewsAsync(int managerId) =>
            (await _reviewRepo.GetReviewsByManagerAsync(managerId)).Select(MapToResponseDto).ToList();

        public async Task<List<ManagerReviewResponseDto>> GetReviewsForMeAsync(int employeeId) =>
            (await _reviewRepo.GetReviewsForEmployeeAsync(employeeId)).Select(MapToResponseDto).ToList();

        public async Task<List<ManagerReviewResponseDto>> GetReviewsByGoalAsync(int goalId) =>
            (await _reviewRepo.GetReviewsByGoalAsync(goalId)).Select(MapToResponseDto).ToList();

        public async Task<List<ManagerReviewResponseDto>> GetReviewsByOrgGoalAsync(int orgGoalId) =>
            (await _reviewRepo.GetReviewsByOrgGoalAsync(orgGoalId)).Select(MapToResponseDto).ToList();

        public async Task<List<ManagerReviewResponseDto>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 20) =>
            (await _reviewRepo.GetAllReviewsAsync(pageNumber, pageSize)).Select(MapToResponseDto).ToList();

        public async Task<List<ManagerReviewResponseDto>> GetReviewsByStatusAsync(string status) =>
            (await _reviewRepo.GetReviewsByStatusAsync(status)).Select(MapToResponseDto).ToList();

        public async Task<ManagerReviewResponseDto> UpdateReviewAsync(int reviewId, UpdateManagerReviewRequestDto dto)
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

            _logger.LogInformation("Manager review updated. ReviewId: {ReviewId}", reviewId);

            return await GetReviewByIdAsync(reviewId);
        }

        public async Task<bool> SubmitReviewAsync(int reviewId)
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
                _logger.LogInformation("Manager review submitted. ReviewId: {ReviewId}", reviewId);

            return result;
        }

        public async Task<bool> ModifyReviewAsync(int reviewId)
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
                _logger.LogInformation("Manager review moved to Modified. ReviewId: {ReviewId}", reviewId);

            return result;
        }

        public async Task<bool> FinalizeReviewAsync(int reviewId)
        {
            var review = await _reviewRepo.GetReviewByIdAsync(reviewId);
            if (review == null)
                throw new KeyNotFoundException($"Review {reviewId} not found");

            if (review.Status != "Submitted" && review.Status != "Modified")
                throw new InvalidOperationException($"Cannot finalize review in {review.Status} status");

            review.Status = "Finalized";

            var result = await _reviewRepo.UpdateReviewAsync(review);

            if (result)
                _logger.LogInformation("Manager review finalized. ReviewId: {ReviewId}", reviewId);

            return result;
        }

        public async Task<bool> DeleteReviewAsync(int reviewId)
        {
            var result = await _reviewRepo.DeleteReviewAsync(reviewId);

            if (result)
                _logger.LogWarning("Manager review deleted. ReviewId: {ReviewId}", reviewId);

            return result;
        }

        public async Task<bool> CanEditReviewAsync(int reviewId) =>
            await _reviewRepo.CanEditReviewAsync(reviewId);

        private ManagerReviewResponseDto MapToResponseDto(Managerreviewcomment review)
        {
            return new ManagerReviewResponseDto
            {
                ReviewcommentId = review.ReviewCommentId,
                ManagerEmployeeId = review.ManagerEmployeeId,
                TargetEmployeeId = review.TargetEmployeeId,
                ManagerName = review.ManagerEmployeeId.ToString(),
                TargetEmployeeName = review.TargetEmployeeId.ToString(),


                TargetGoalId = review.TargetGoalId,
                TargetGoalName = review.TargetGoal != null ? review.TargetGoal.GoalTitle : "N/A",
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

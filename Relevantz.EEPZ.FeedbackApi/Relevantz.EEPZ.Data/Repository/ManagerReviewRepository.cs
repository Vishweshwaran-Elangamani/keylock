using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class ManagerReviewRepository : IManagerReviewRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<ManagerReviewRepository> _logger;

        public ManagerReviewRepository(EEPZDbContext context, ILogger<ManagerReviewRepository> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<int> CreateReviewAsync(Managerreviewcomment review)
        {
            try
            {
                review.CreatedAt = DateTime.UtcNow;
                review.Status = "Draft";

                _context.Managerreviewcomments.Add(review);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Manager review created: {review.ReviewCommentId}");
                return review.ReviewCommentId;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating manager review: {ex.Message}");
                throw;
            }
        }
        public async Task<Managerreviewcomment> GetReviewByIdAsync(int reviewId)
        {
            try
            {
                return await _context.Managerreviewcomments
                    .Include(r => r.ManagerEmployee)
                    .Include(r => r.TargetEmployee)
                    .Include(r => r.TargetGoal)
                    .FirstOrDefaultAsync(r => r.ReviewCommentId == reviewId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting review by ID: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Managerreviewcomment>> GetReviewsByManagerAsync(int managerId)
        {
            try
            {
                return await _context.Managerreviewcomments
                    .Where(r => r.ManagerEmployeeId == managerId)
                    .Include(r => r.TargetEmployee)
                    .Include(r => r.TargetGoal)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting reviews by manager: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Managerreviewcomment>> GetReviewsForEmployeeAsync(int employeeId)
        {
            try
            {
                return await _context.Managerreviewcomments
                    .Where(r => r.TargetEmployeeId == employeeId && r.Status == "Submitted")
                    .Include(r => r.ManagerEmployee)
                    .Include(r => r.TargetGoal)
                    .OrderByDescending(r => r.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting reviews for employee: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Managerreviewcomment>> GetReviewsByGoalAsync(int goalId)
        {
            try
            {
                return await _context.Managerreviewcomments
                    .Where(r => r.TargetGoalId == goalId)
                    .Include(r => r.ManagerEmployee)
                    .Include(r => r.TargetEmployee)
                    .OrderByDescending(r => r.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting reviews by goal: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Managerreviewcomment>> GetReviewsByOrgGoalAsync(int orgGoalId)
        {
            try
            {
                return await _context.Managerreviewcomments
                    .Where(r => r.TargetOrganizationGoalId == orgGoalId)
                    .Include(r => r.ManagerEmployee)
                    .Include(r => r.TargetEmployee)
                    .OrderByDescending(r => r.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting reviews by org goal: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Managerreviewcomment>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                return await _context.Managerreviewcomments
                    .Include(r => r.ManagerEmployee)
                    .Include(r => r.TargetEmployee)
                    .OrderByDescending(r => r.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all reviews: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Managerreviewcomment>> GetReviewsByStatusAsync(string status)
        {
            try
            {
                return await _context.Managerreviewcomments
                    .Where(r => r.Status == status)
                    .Include(r => r.ManagerEmployee)
                    .Include(r => r.TargetEmployee)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting reviews by status: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Managerreviewcomment>> GetPendingReviewsAsync(int managerId)
        {
            try
            {
                return await _context.Managerreviewcomments
                    .Where(r => r.ManagerEmployeeId == managerId && (r.Status == "Draft" || r.Status == "Modified"))
                    .Include(r => r.TargetEmployee)
                    .Include(r => r.TargetGoal)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting pending reviews: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> UpdateReviewAsync(Managerreviewcomment review)
        {
            try
            {
                review.ModifiedAt = DateTime.UtcNow;

                _context.Managerreviewcomments.Update(review);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Manager review updated: {review.ReviewCommentId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating manager review: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> UpdateReviewStatusAsync(int reviewId, string newStatus)
        {
            try
            {
                var review = await _context.Managerreviewcomments.FindAsync(reviewId);
                if (review == null)
                    return false;

                review.Status = newStatus;
                review.ModifiedAt = DateTime.UtcNow;

                if (newStatus == "Submitted" && review.SubmittedAt == null)
                    review.SubmittedAt = DateTime.UtcNow;

                _context.Managerreviewcomments.Update(review);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Manager review status updated: {reviewId} → {newStatus}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating review status: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> DeleteReviewAsync(int reviewId)
        {
            try
            {
                var review = await _context.Managerreviewcomments.FindAsync(reviewId);
                if (review == null)
                    return false;

                if (review.Status != "Draft")
                    throw new InvalidOperationException($"Cannot delete review in {review.Status} status. Only Draft reviews can be deleted.");

                _context.Managerreviewcomments.Remove(review);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Manager review deleted: {reviewId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting manager review: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> ReviewExistsAsync(int reviewId)
        {
            try
            {
                return await _context.Managerreviewcomments.AnyAsync(r => r.ReviewCommentId == reviewId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking review existence: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> CanEditReviewAsync(int reviewId)
        {
            try
            {
                var review = await _context.Managerreviewcomments.FindAsync(reviewId);
                return review != null && (review.Status == "Draft" || review.Status == "Modified");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking if review can be edited: {ex.Message}");
                throw;
            }
        }
    }
}

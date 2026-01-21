using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    /// <summary>
    /// Repository for Organization Goal Feedback
    /// Filters Feedback table by RelatedGoal.GoalType = "org"
    /// </summary>
    public class OrgGoalFeedbackRepository : IOrgGoalFeedbackRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<OrgGoalFeedbackRepository> _logger;

        public OrgGoalFeedbackRepository(EEPZDbContext context, ILogger<OrgGoalFeedbackRepository> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<int> CreateOrgGoalFeedbackAsync(Feedback feedback)
        {
            ArgumentNullException.ThrowIfNull(feedback);

            var goalId = feedback.RelatedGoalId;
            if (!goalId.HasValue || goalId <= 0)
                throw new ArgumentException("RelatedGoalId is required for organization goal feedback.", nameof(feedback));

            var isOrgGoal = await _context.Goals
                .AsNoTracking()
                .AnyAsync(g => g.GoalId == goalId.Value && g.GoalType == GoalTypeConstants.Organization);

            if (!isOrgGoal)
                throw new InvalidOperationException($"Goal {goalId} is not an organization-level goal.");

            feedback.CreatedAt = DateTime.UtcNow;
            feedback.Status = FeedbackConstants.Status.Submitted;
            feedback.FeedbackType = FeedbackConstants.Type.OrganizationalGoal;

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Organization goal feedback created: {FeedbackId}", feedback.FeedbackId);

            return feedback.FeedbackId;
        }

        public async Task<Feedback?> GetOrgGoalFeedbackByIdAsync(int feedbackId)
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .Include(f => f.RelatedGoal)
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .Where(f =>
                    f.FeedbackId == feedbackId &&
                    f.RelatedGoal != null &&
                    f.RelatedGoal.GoalType == GoalTypeConstants.Organization)
                .FirstOrDefaultAsync();
        }

        public async Task<List<Feedback>> GetFeedbackByOrgGoalAsync(int goalId)
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .Include(f => f.RelatedGoal)
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .Where(f =>
                    f.RelatedGoalId == goalId &&
                    f.RelatedGoal != null &&
                    f.RelatedGoal.GoalType == GoalTypeConstants.Organization &&
                    f.Status != FeedbackConstants.Status.Archived)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Feedback>> GetFeedbackBySubmitterAsync(int employeeId)
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .Include(f => f.RelatedGoal)
                .Include(f => f.RecipientEmployee)
                .Where(f =>
                    f.SubmittedByEmployeeId == employeeId &&
                    f.RelatedGoal != null &&
                    f.RelatedGoal.GoalType == GoalTypeConstants.Organization)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Feedback>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            pageNumber = pageNumber <= 0 ? 1 : pageNumber;
            pageSize = pageSize <= 0 ? 20 : pageSize;
            pageSize = pageSize > 100 ? 100 : pageSize;

            return await _context.Feedbacks
                .AsNoTracking()
                .Include(f => f.RelatedGoal)
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .Where(f => f.RelatedGoal != null && f.RelatedGoal.GoalType == GoalTypeConstants.Organization)
                .OrderByDescending(f => f.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<Feedback>> GetFeedbackByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                throw new ArgumentException("Status cannot be null or empty.", nameof(status));

            return await _context.Feedbacks
                .AsNoTracking()
                .Include(f => f.RelatedGoal)
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .Where(f =>
                    f.Status == status &&
                    f.RelatedGoal != null &&
                    f.RelatedGoal.GoalType == GoalTypeConstants.Organization)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Feedback>> GetAnonymousOrgGoalFeedbackAsync()
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .Include(f => f.RelatedGoal)
                .Include(f => f.RecipientEmployee)
                .Where(f =>
                    f.IsAnonymous &&
                    f.Status != FeedbackConstants.Status.Archived &&
                    f.RelatedGoal != null &&
                    f.RelatedGoal.GoalType == GoalTypeConstants.Organization)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> UpdateOrgGoalFeedbackAsync(Feedback feedback)
        {
            ArgumentNullException.ThrowIfNull(feedback);

            feedback.UpdatedAt = DateTime.UtcNow;

            _context.Feedbacks.Update(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Organization goal feedback updated: {FeedbackId}", feedback.FeedbackId);

            return true;
        }

        public async Task<bool> UpdateFeedbackStatusAsync(int feedbackId, string newStatus)
        {
            if (string.IsNullOrWhiteSpace(newStatus))
                throw new ArgumentException("Status cannot be null or empty.", nameof(newStatus));

            var feedback = await _context.Feedbacks
                .Include(f => f.RelatedGoal)
                .FirstOrDefaultAsync(f =>
                    f.FeedbackId == feedbackId &&
                    f.RelatedGoal != null &&
                    f.RelatedGoal.GoalType == GoalTypeConstants.Organization);

            if (feedback == null)
                return false;

            feedback.Status = newStatus;
            feedback.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Org goal feedback status updated. FeedbackId: {FeedbackId}, Status: {Status}", feedbackId, newStatus);

            return true;
        }

        public async Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId)
        {
            var feedback = await _context.Feedbacks
                .Include(f => f.RelatedGoal)
                .FirstOrDefaultAsync(f =>
                    f.FeedbackId == feedbackId &&
                    f.RelatedGoal != null &&
                    f.RelatedGoal.GoalType == GoalTypeConstants.Organization);

            if (feedback == null)
                return false;

            if (feedback.Status != FeedbackConstants.Status.Submitted)
                throw new InvalidOperationException($"Cannot delete feedback in '{feedback.Status}' status.");

            _context.Feedbacks.Remove(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Organization goal feedback deleted: {FeedbackId}", feedbackId);

            return true;
        }

        public async Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId)
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .AnyAsync(f =>
                    f.FeedbackId == feedbackId &&
                    f.RelatedGoal != null &&
                    f.RelatedGoal.GoalType == GoalTypeConstants.Organization);
        }
    }
}

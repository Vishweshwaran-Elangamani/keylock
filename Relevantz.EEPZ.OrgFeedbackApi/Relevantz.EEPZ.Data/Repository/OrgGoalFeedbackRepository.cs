using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    /// <summary>
    /// Repository for Organization Goal Feedback
    /// Filters Feedback table by Goal.GoalType = "Organization"
    /// </summary>
    public class OrgGoalFeedbackRepository : IOrgGoalFeedbackRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<OrgGoalFeedbackRepository> _logger;
        private const string ORG_GOAL_TYPE = "org";

        public OrgGoalFeedbackRepository(EEPZDbContext context, ILogger<OrgGoalFeedbackRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> CreateOrgGoalFeedbackAsync(Feedback feedback)
        {
            try
            {
                var goal = await _context.Goals
                    .Where(g => g.GoalId == feedback.RelatedGoalId && g.GoalType == ORG_GOAL_TYPE)
                    .FirstOrDefaultAsync();

                if (goal == null)
                    throw new InvalidOperationException($"Goal {feedback.RelatedGoalId} is not an organization-level goal");

                feedback.CreatedAt = DateTime.UtcNow;
                feedback.Status = "Submitted";
                feedback.FeedbackType = "OrganizationalGoal";

                _context.Feedbacks.Add(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Organization goal feedback created: {feedback.FeedbackId}");
                return feedback.FeedbackId;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating org goal feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<Feedback> GetOrgGoalFeedbackByIdAsync(int feedbackId)
        {
            try
            {
                return await _context.Feedbacks
                    .Include(f => f.RelatedGoal)
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .Where(f => f.FeedbackId == feedbackId
                        && f.RelatedGoal != null
                        && f.RelatedGoal.GoalType == ORG_GOAL_TYPE)
                    .FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting org goal feedback by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Feedback>> GetFeedbackByOrgGoalAsync(int goalId)
        {
            try
            {
                return await _context.Feedbacks
                    .Include(f => f.RelatedGoal)
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .Where(f => f.RelatedGoalId == goalId
                        && f.RelatedGoal.GoalType == ORG_GOAL_TYPE
                        && f.Status != "Archived")
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by org goal: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Feedback>> GetFeedbackBySubmitterAsync(int employeeId)
        {
            try
            {
                return await _context.Feedbacks
                    .Include(f => f.RelatedGoal)
                    .Include(f => f.RecipientEmployee)
                    .Where(f => f.SubmittedByEmployeeId == employeeId
                        && f.RelatedGoal != null
                        && f.RelatedGoal.GoalType == ORG_GOAL_TYPE)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by submitter: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Feedback>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                return await _context.Feedbacks
                    .Include(f => f.RelatedGoal)
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .Where(f => f.RelatedGoal != null && f.RelatedGoal.GoalType == ORG_GOAL_TYPE)
                    .OrderByDescending(f => f.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all org goal feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Feedback>> GetFeedbackByStatusAsync(string status)
        {
            try
            {
                return await _context.Feedbacks
                    .Include(f => f.RelatedGoal)
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .Where(f => f.Status == status
                        && f.RelatedGoal != null
                        && f.RelatedGoal.GoalType == ORG_GOAL_TYPE)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by status: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Feedback>> GetAnonymousOrgGoalFeedbackAsync()
        {
            try
            {
                return await _context.Feedbacks
                    .Include(f => f.RelatedGoal)
                    .Include(f => f.RecipientEmployee)
                    .Where(f => f.IsAnonymous
                        && f.Status != "Archived"
                        && f.RelatedGoal != null
                        && f.RelatedGoal.GoalType == ORG_GOAL_TYPE)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting anonymous org goal feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateOrgGoalFeedbackAsync(Feedback feedback)
        {
            try
            {
                _context.Feedbacks.Update(feedback);
                feedback.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Organization goal feedback updated: {feedback.FeedbackId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating org goal feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateFeedbackStatusAsync(int feedbackId, string newStatus)
        {
            try
            {
                var feedback = await _context.Feedbacks
                    .Include(f => f.RelatedGoal)
                    .Where(f => f.FeedbackId == feedbackId
                        && f.RelatedGoal != null
                        && f.RelatedGoal.GoalType == ORG_GOAL_TYPE)
                    .FirstOrDefaultAsync();

                if (feedback == null)
                    return false;

                feedback.Status = newStatus;
                feedback.UpdatedAt = DateTime.UtcNow;

                _context.Feedbacks.Update(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Org goal feedback status updated: {feedbackId} → {newStatus}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating feedback status: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId)
        {
            try
            {
                var feedback = await _context.Feedbacks
                    .Include(f => f.RelatedGoal)
                    .Where(f => f.FeedbackId == feedbackId
                        && f.RelatedGoal != null
                        && f.RelatedGoal.GoalType == ORG_GOAL_TYPE)
                    .FirstOrDefaultAsync();

                if (feedback == null)
                    return false;

                if (feedback.Status != "Submitted")
                    throw new InvalidOperationException($"Cannot delete feedback in {feedback.Status} status");

                _context.Feedbacks.Remove(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Organization goal feedback deleted: {feedbackId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting org goal feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId)
        {
            try
            {
                return await _context.Feedbacks
                    .Include(f => f.RelatedGoal)
                    .AnyAsync(f => f.FeedbackId == feedbackId
                        && f.RelatedGoal != null
                        && f.RelatedGoal.GoalType == ORG_GOAL_TYPE);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking org goal feedback existence: {ex.Message}");
                throw;
            }
        }
    }
}

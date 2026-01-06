using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class FeedbackRepository : IFeedbackRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<FeedbackRepository> _logger;

        public FeedbackRepository(EEPZDbContext context, ILogger<FeedbackRepository> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<int> CreateFeedbackAsync(Feedback feedback)
        {
            try
            {
                feedback.CreatedAt = DateTime.UtcNow;
                feedback.Status = "Draft";

                _context.Feedbacks.Add(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Feedback created: {feedback.FeedbackId}");
                return feedback.FeedbackId;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<int> CreateQuestionResponseAsync(Feedbackquestionresponse response)
        {
            try
            {
                response.CreatedAt = DateTime.UtcNow;

                _context.Feedbackquestionresponses.Add(response);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Question response created: {response.ResponseId}");
                return response.ResponseId;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating question response: {ex.Message}");
                throw;
            }
        }
        public async Task<Feedback> GetFeedbackByIdAsync(int feedbackId)
        {
            try
            {
                return await _context.Feedbacks
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .Include(f => f.RelatedGoal)
                    .Include(f => f.RelatedProject)
                    .Include(f => f.RelatedMentor)
                    .Include(f => f.ReviewedByHr)
                    .FirstOrDefaultAsync(f => f.FeedbackId == feedbackId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by ID: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Feedback>> GetFeedbackBySubmitterAsync(int employeeId)
        {
            try
            {
                return await _context.Feedbacks
                    .Where(f => f.SubmittedByEmployeeId == employeeId)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by submitter: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Feedback>> GetFeedbackByRecipientAsync(int employeeId)
        {
            try
            {
                return await _context.Feedbacks
                    .Where(f => f.RecipientEmployeeId == employeeId && f.Status == "Submitted")
                    .Include(f => f.SubmittedByEmployee)
                    .OrderByDescending(f => f.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by recipient: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Feedback>> GetTeamFeedbackAsync(int managerId)
        {
            try
            {
                var teamMemberIds = await _context.Employees
                    .Where(e => e.ReportingManagerEmployeeId == managerId && e.IsActive == true)
                    .Select(e => e.EmployeeId)
                    .ToListAsync();

                if (!teamMemberIds.Any())
                    return new List<Feedback>();

                return await _context.Feedbacks
                    .Where(f => (teamMemberIds.Contains(f.SubmittedByEmployeeId ?? 0) ||
                                 teamMemberIds.Contains(f.RecipientEmployeeId)) &&
                                f.Status == "Submitted")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting team feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Feedback>> GetFlaggedFeedbackAsync(bool? isBias = null, bool? isFairness = null)
        {
            try
            {
                var query = _context.Feedbacks.AsQueryable();

                if (isBias.HasValue)
                    query = query.Where(f => f.BiasFlag == isBias.Value);

                if (isFairness.HasValue)
                    query = query.Where(f => f.FairnessFlag == isFairness.Value);

                return await query
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting flagged feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Feedback>> GetAnonymousFeedbackAsync()
        {
            try
            {
                return await _context.Feedbacks
                    .Where(f => f.IsAnonymous && f.Status == "Submitted")
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting anonymous feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Feedback>> GetPendingHRReviewAsync()
        {
            try
            {
                return await _context.Feedbacks
                    .Where(f => f.Status == "UnderHRReview")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting pending HR review: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Feedback>> GetFeedbackByGoalAsync(int goalId)
        {
            try
            {
                return await _context.Feedbacks
                    .Where(f => f.RelatedGoalId == goalId && f.FeedbackType == "GoalBased")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by goal: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Feedback>> GetFeedbackByProjectAsync(int projectId)
        {
            try
            {
                return await _context.Feedbacks
                    .Where(f => f.RelatedProjectId == projectId && f.FeedbackType == "ProjectBased")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by project: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Feedbackquestionresponse>> GetFeedbackResponsesAsync(int feedbackId)
        {
            try
            {
                return await _context.Feedbackquestionresponses
                    .Where(r => r.FeedbackId == feedbackId)
                    .Include(r => r.Question)
                    .OrderBy(r => r.Question.DisplayOrder)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback responses: {ex.Message}");
                throw;
            }
        }
        public async Task<Feedbackquestionresponse> GetQuestionResponseAsync(int responseId)
        {
            try
            {
                return await _context.Feedbackquestionresponses
                    .Include(r => r.Question)
                    .FirstOrDefaultAsync(r => r.ResponseId == responseId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting question response: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Feedback>> GetAllFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                return await _context.Feedbacks
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> UpdateFeedbackAsync(Feedback feedback)
        {
            try
            {
                feedback.UpdatedAt = DateTime.UtcNow;

                _context.Feedbacks.Update(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Feedback updated: {feedback.FeedbackId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> UpdateFeedbackStatusAsync(int feedbackId, string newStatus)
        {
            try
            {
                var feedback = await _context.Feedbacks.FindAsync(feedbackId);
                if (feedback == null)
                    return false;

                feedback.Status = newStatus;
                feedback.UpdatedAt = DateTime.UtcNow;


                if (newStatus == "Submitted" && feedback.SubmittedAt == null)
                    feedback.SubmittedAt = DateTime.UtcNow;

                _context.Feedbacks.Update(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Feedback status updated: {feedbackId} → {newStatus}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating feedback status: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> FlagFeedbackForBiasAsync(int feedbackId, bool isBias, bool isFairness, int reviewedByHRId)
        {
            try
            {
                var feedback = await _context.Feedbacks.FindAsync(feedbackId);
                if (feedback == null)
                    return false;

                feedback.BiasFlag = isBias;
                feedback.FairnessFlag = isFairness;
                feedback.ReviewedByHrid = reviewedByHRId;
                feedback.Status = "UnderHRReview";
                feedback.UpdatedAt = DateTime.UtcNow;

                _context.Feedbacks.Update(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Feedback flagged for review: {feedbackId} (Bias: {isBias}, Fairness: {isFairness})");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error flagging feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> SetHRReviewAsync(int feedbackId, string hrComments, int reviewedByHRId)
        {
            try
            {
                var feedback = await _context.Feedbacks.FindAsync(feedbackId);
                if (feedback == null)
                    return false;

                feedback.HrreviewComments = hrComments;
                feedback.ReviewedByHrid = reviewedByHRId;
                feedback.Status = "Reviewed";
                feedback.UpdatedAt = DateTime.UtcNow;

                _context.Feedbacks.Update(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"HR review set for feedback: {feedbackId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error setting HR review: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> UpdateQuestionResponseAsync(Feedbackquestionresponse response)
        {
            try
            {
                _context.Feedbackquestionresponses.Update(response);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Question response updated: {response.ResponseId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating question response: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> DeleteFeedbackAsync(int feedbackId)
        {
            try
            {
                var feedback = await _context.Feedbacks.FindAsync(feedbackId);
                if (feedback == null)
                    return false;

                if (feedback.Status != "Draft")
                    throw new InvalidOperationException($"Cannot delete feedback in {feedback.Status} status. Only Draft feedback can be deleted.");

                var responses = await _context.Feedbackquestionresponses
                    .Where(r => r.FeedbackId == feedbackId)
                    .ToListAsync();

                _context.Feedbackquestionresponses.RemoveRange(responses);
                _context.Feedbacks.Remove(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Feedback deleted: {feedbackId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> DeleteQuestionResponseAsync(int responseId)
        {
            try
            {
                var response = await _context.Feedbackquestionresponses.FindAsync(responseId);
                if (response == null)
                    return false;

                _context.Feedbackquestionresponses.Remove(response);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Question response deleted: {responseId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting question response: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> FeedbackExistsAsync(int feedbackId)
        {
            try
            {
                return await _context.Feedbacks.AnyAsync(f => f.FeedbackId == feedbackId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking feedback existence: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> CanEditFeedbackAsync(int feedbackId)
        {
            try
            {
                var feedback = await _context.Feedbacks.FindAsync(feedbackId);
                return feedback != null && feedback.Status == "Draft";
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking if feedback can be edited: {ex.Message}");
                throw;
            }
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

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
            feedback.CreatedAt = DateTime.UtcNow;
            feedback.Status = "Draft";

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Feedback created: {FeedbackId}", feedback.FeedbackId);

            return feedback.FeedbackId;
        }

        public async Task<int> CreateQuestionResponseAsync(Feedbackquestionresponse response)
        {
            response.CreatedAt = DateTime.UtcNow;

            _context.Feedbackquestionresponses.Add(response);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Question response created: {ResponseId}", response.ResponseId);

            return response.ResponseId;
        }

        public async Task<Feedback?> GetFeedbackByIdAsync(int feedbackId)
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .Include(f => f.RelatedGoal)
                .Include(f => f.RelatedProject)
                .Include(f => f.RelatedMentor)
                .Include(f => f.ReviewedByHr)
                .FirstOrDefaultAsync(f => f.FeedbackId == feedbackId);
        }

        public async Task<List<Feedback>> GetFeedbackBySubmitterAsync(int employeeId)
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .Where(f => f.SubmittedByEmployeeId == employeeId)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Feedback>> GetFeedbackByRecipientAsync(int employeeId)
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .Where(f => f.RecipientEmployeeId == employeeId && f.Status == "Submitted")
                .Include(f => f.SubmittedByEmployee)
                .OrderByDescending(f => f.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Feedback>> GetTeamFeedbackAsync(int managerId)
        {
            var teamMemberIds = await _context.Employees
                .AsNoTracking()
                .Where(e => e.ReportingManagerEmployeeId == managerId && e.IsActive == true)
                .Select(e => e.EmployeeId)
                .ToListAsync();

            if (!teamMemberIds.Any())
                return new List<Feedback>();

            return await _context.Feedbacks
                .AsNoTracking()
                .Where(f =>
                    (teamMemberIds.Contains(f.SubmittedByEmployeeId ?? 0) ||
                     teamMemberIds.Contains(f.RecipientEmployeeId)) &&
                    f.Status == "Submitted")
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Feedback>> GetFlaggedFeedbackAsync(bool? isBias = null, bool? isFairness = null)
        {
            var query = _context.Feedbacks
                .AsNoTracking()
                .AsQueryable();

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

        public async Task<List<Feedback>> GetAnonymousFeedbackAsync()
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .Where(f => f.IsAnonymous && f.Status == "Submitted")
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Feedback>> GetPendingHRReviewAsync()
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .Where(f => f.Status == "UnderHRReview")
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Feedback>> GetFeedbackByGoalAsync(int goalId)
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .Where(f => f.RelatedGoalId == goalId && f.FeedbackType == "GoalBased")
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Feedback>> GetFeedbackByProjectAsync(int projectId)
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .Where(f => f.RelatedProjectId == projectId && f.FeedbackType == "ProjectBased")
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Feedbackquestionresponse>> GetFeedbackResponsesAsync(int feedbackId)
        {
            return await _context.Feedbackquestionresponses
                .AsNoTracking()
                .Where(r => r.FeedbackId == feedbackId)
                .Include(r => r.Question)
                .OrderBy(r => r.Question.DisplayOrder)
                .ToListAsync();
        }

        public async Task<Feedbackquestionresponse?> GetQuestionResponseAsync(int responseId)
        {
            return await _context.Feedbackquestionresponses
                .AsNoTracking()
                .Include(r => r.Question)
                .FirstOrDefaultAsync(r => r.ResponseId == responseId);
        }

        public async Task<List<Feedback>> GetAllFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            pageNumber = pageNumber <= 0 ? 1 : pageNumber;
            pageSize = pageSize <= 0 ? 20 : pageSize;

            return await _context.Feedbacks
                .AsNoTracking()
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<bool> UpdateFeedbackAsync(Feedback feedback)
        {
            feedback.UpdatedAt = DateTime.UtcNow;

            _context.Feedbacks.Update(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Feedback updated: {FeedbackId}", feedback.FeedbackId);

            return true;
        }

        public async Task<bool> UpdateFeedbackStatusAsync(int feedbackId, string newStatus)
        {
            var feedback = await _context.Feedbacks
                .FirstOrDefaultAsync(f => f.FeedbackId == feedbackId);

            if (feedback == null)
                return false;

            feedback.Status = newStatus;
            feedback.UpdatedAt = DateTime.UtcNow;

            if (newStatus == "Submitted" && feedback.SubmittedAt == null)
                feedback.SubmittedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Feedback status updated. FeedbackId: {FeedbackId}, Status: {Status}", feedbackId, newStatus);

            return true;
        }

        public async Task<bool> FlagFeedbackForBiasAsync(int feedbackId, bool isBias, bool isFairness, int reviewedByHRId)
        {
            var feedback = await _context.Feedbacks
                .FirstOrDefaultAsync(f => f.FeedbackId == feedbackId);

            if (feedback == null)
                return false;

            feedback.BiasFlag = isBias;
            feedback.FairnessFlag = isFairness;
            feedback.ReviewedByHrid = reviewedByHRId;
            feedback.Status = "UnderHRReview";
            feedback.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Feedback flagged. FeedbackId: {FeedbackId}, Bias: {Bias}, Fairness: {Fairness}",
                feedbackId, isBias, isFairness);

            return true;
        }

        public async Task<bool> SetHRReviewAsync(int feedbackId, string hrComments, int reviewedByHRId)
        {
            var feedback = await _context.Feedbacks
                .FirstOrDefaultAsync(f => f.FeedbackId == feedbackId);

            if (feedback == null)
                return false;

            feedback.HrreviewComments = hrComments;
            feedback.ReviewedByHrid = reviewedByHRId;
            feedback.Status = "Reviewed";
            feedback.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("HR review updated. FeedbackId: {FeedbackId}", feedbackId);

            return true;
        }

        public async Task<bool> UpdateQuestionResponseAsync(Feedbackquestionresponse response)
        {
            _context.Feedbackquestionresponses.Update(response);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Question response updated: {ResponseId}", response.ResponseId);

            return true;
        }

        public async Task<bool> DeleteFeedbackAsync(int feedbackId)
        {
            var feedback = await _context.Feedbacks
                .FirstOrDefaultAsync(f => f.FeedbackId == feedbackId);

            if (feedback == null)
                return false;

            if (feedback.Status != "Draft")
                throw new InvalidOperationException(
                    $"Cannot delete feedback in '{feedback.Status}' status. Only Draft feedback can be deleted.");

            var responses = await _context.Feedbackquestionresponses
                .Where(r => r.FeedbackId == feedbackId)
                .ToListAsync();

            _context.Feedbackquestionresponses.RemoveRange(responses);
            _context.Feedbacks.Remove(feedback);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Feedback deleted: {FeedbackId}", feedbackId);

            return true;
        }

        public async Task<bool> DeleteQuestionResponseAsync(int responseId)
        {
            var response = await _context.Feedbackquestionresponses
                .FirstOrDefaultAsync(r => r.ResponseId == responseId);

            if (response == null)
                return false;

            _context.Feedbackquestionresponses.Remove(response);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Question response deleted: {ResponseId}", responseId);

            return true;
        }

        public async Task<bool> FeedbackExistsAsync(int feedbackId)
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .AnyAsync(f => f.FeedbackId == feedbackId);
        }

        public async Task<bool> CanEditFeedbackAsync(int feedbackId)
        {
            return await _context.Feedbacks
                .AsNoTracking()
                .AnyAsync(f => f.FeedbackId == feedbackId && f.Status == "Draft");
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class MentorFeedbackRepository : IMentorFeedbackRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<MentorFeedbackRepository> _logger;

        public MentorFeedbackRepository(EEPZDbContext context, ILogger<MentorFeedbackRepository> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<int> CreateMentorFeedbackAsync(Mentorfeedbacktracking feedback)
        {
            ArgumentNullException.ThrowIfNull(feedback);

            if (feedback.SmeId <= 0) throw new ArgumentException("Invalid SmeId", nameof(feedback));
            if (feedback.MentorEmployeeId <= 0) throw new ArgumentException("Invalid MentorEmployeeId", nameof(feedback));
            if (feedback.MenteeEmployeeId <= 0) throw new ArgumentException("Invalid MenteeEmployeeId", nameof(feedback));
            if (feedback.SkillIdReference <= 0) throw new ArgumentException("Invalid SkillIdReference", nameof(feedback));

            feedback.CreatedAt = DateTime.UtcNow;
            feedback.Status = MentorFeedbackConstants.Status.Submitted;

            _context.Mentorfeedbacktrackings.Add(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Mentor feedback created: {TrackingId}", feedback.TrackingId);

            return feedback.TrackingId;
        }

        public async Task<Mentorfeedbacktracking?> GetMentorFeedbackByIdAsync(int trackingId)
        {
            if (trackingId <= 0)
                throw new ArgumentException("Invalid tracking ID", nameof(trackingId));

            return await _context.Mentorfeedbacktrackings
                .AsNoTracking()
                .Include(f => f.Sme)
                .Include(f => f.MentorEmployee)
                .Include(f => f.MenteeEmployee)
                .Include(f => f.SkillIdReferenceNavigation)
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.ReviewedByHr)
                .FirstOrDefaultAsync(f => f.TrackingId == trackingId);
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackByMentorAsync(int mentorEmployeeId)
        {
            if (mentorEmployeeId <= 0)
                throw new ArgumentException("Invalid mentor employee ID", nameof(mentorEmployeeId));

            return await _context.Mentorfeedbacktrackings
                .AsNoTracking()
                .Where(f => f.MentorEmployeeId == mentorEmployeeId && f.Status != MentorFeedbackConstants.Status.Archived)
                .Include(f => f.MenteeEmployee)
                .Include(f => f.SkillIdReferenceNavigation)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackByMenteeAsync(int menteeEmployeeId)
        {
            if (menteeEmployeeId <= 0)
                throw new ArgumentException("Invalid mentee employee ID", nameof(menteeEmployeeId));

            return await _context.Mentorfeedbacktrackings
                .AsNoTracking()
                .Where(f => f.MenteeEmployeeId == menteeEmployeeId)
                .Include(f => f.MentorEmployee)
                .Include(f => f.SkillIdReferenceNavigation)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackBySmeAsync(int smeId)
        {
            if (smeId <= 0)
                throw new ArgumentException("Invalid SME ID", nameof(smeId));

            return await _context.Mentorfeedbacktrackings
                .AsNoTracking()
                .Where(f => f.SmeId == smeId)
                .Include(f => f.MentorEmployee)
                .Include(f => f.MenteeEmployee)
                .Include(f => f.SkillIdReferenceNavigation)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Mentorfeedbacktracking>> GetPendingHRReviewAsync()
        {
            return await _context.Mentorfeedbacktrackings
                .AsNoTracking()
                .Where(f => f.Status == MentorFeedbackConstants.Status.Submitted ||
                            f.Status == MentorFeedbackConstants.Status.Acknowledged)
                .Include(f => f.MentorEmployee)
                .Include(f => f.MenteeEmployee)
                .Include(f => f.SkillIdReferenceNavigation)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Mentorfeedbacktracking>> GetAllMentorFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            pageNumber = pageNumber <= 0 ? 1 : pageNumber;
            pageSize = pageSize <= 0 ? 20 : pageSize;
            pageSize = pageSize > 100 ? 100 : pageSize;

            return await _context.Mentorfeedbacktrackings
                .AsNoTracking()
                .Include(f => f.MentorEmployee)
                .Include(f => f.MenteeEmployee)
                .Include(f => f.SkillIdReferenceNavigation)
                .OrderByDescending(f => f.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                throw new ArgumentException("Status cannot be null or empty", nameof(status));

            if (!MentorFeedbackConstants.ValidStatuses.Contains(status))
                throw new ArgumentException($"Invalid status: {status}", nameof(status));

            return await _context.Mentorfeedbacktrackings
                .AsNoTracking()
                .Where(f => f.Status == status)
                .Include(f => f.MentorEmployee)
                .Include(f => f.MenteeEmployee)
                .Include(f => f.SkillIdReferenceNavigation)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackBySourceAsync(string feedbackFrom)
        {
            if (string.IsNullOrWhiteSpace(feedbackFrom))
                throw new ArgumentException("FeedbackFrom cannot be null or empty", nameof(feedbackFrom));

            if (!MentorFeedbackConstants.ValidSources.Contains(feedbackFrom))
                throw new ArgumentException($"Invalid feedback source: {feedbackFrom}", nameof(feedbackFrom));

            return await _context.Mentorfeedbacktrackings
                .AsNoTracking()
                .Where(f => f.FeedbackFrom == feedbackFrom)
                .Include(f => f.MentorEmployee)
                .Include(f => f.MenteeEmployee)
                .Include(f => f.SkillIdReferenceNavigation)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Mentorfeedbacktracking>> GetAnonymousMentorFeedbackAsync()
        {
            return await _context.Mentorfeedbacktrackings
                .AsNoTracking()
                .Where(f => f.IsAnonymous && f.Status != MentorFeedbackConstants.Status.Archived)
                .Include(f => f.MentorEmployee)
                .Include(f => f.SkillIdReferenceNavigation)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> UpdateMentorFeedbackAsync(Mentorfeedbacktracking feedback)
        {
            if (feedback == null)
                throw new ArgumentNullException(nameof(feedback));

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var existingFeedback = await _context.Mentorfeedbacktrackings.FindAsync(feedback.TrackingId);
                if (existingFeedback == null)
                {
                    _logger.LogWarning($"Mentor feedback not found: {feedback.TrackingId}");
                    return false;
                }

                _context.Entry(existingFeedback).CurrentValues.SetValues(feedback);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation($"Mentor feedback updated: {feedback.TrackingId}");
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Error updating mentor feedback: {feedback.TrackingId}");
                throw;
            }
        }


        public async Task<bool> UpdateFeedbackStatusAsync(int trackingId, string newStatus)
        {
            if (trackingId <= 0)
                throw new ArgumentException("Invalid tracking ID", nameof(trackingId));

            if (string.IsNullOrWhiteSpace(newStatus))
                throw new ArgumentException("Status cannot be null or empty", nameof(newStatus));

            if (!MentorFeedbackConstants.ValidStatuses.Contains(newStatus))
                throw new ArgumentException($"Invalid status: {newStatus}", nameof(newStatus));

            var feedback = await _context.Mentorfeedbacktrackings
                .FirstOrDefaultAsync(f => f.TrackingId == trackingId);

            if (feedback == null)
                return false;

           feedback.Status = newStatus;


            await _context.SaveChangesAsync();

            _logger.LogInformation("Mentor feedback status updated. TrackingId: {TrackingId}, Status: {Status}", trackingId, newStatus);

            return true;
        }

        public async Task<bool> SetHRReviewAsync(int trackingId, string hrComments, int reviewedByHRId)
        {
            if (trackingId <= 0)
                throw new ArgumentException("Invalid tracking ID", nameof(trackingId));

            if (reviewedByHRId <= 0)
                throw new ArgumentException("Invalid reviewer ID", nameof(reviewedByHRId));

            var feedback = await _context.Mentorfeedbacktrackings
                .FirstOrDefaultAsync(f => f.TrackingId == trackingId);

            if (feedback == null)
                return false;

            feedback.HrreviewComments = hrComments;
            feedback.ReviewedByHrid = reviewedByHRId;
            feedback.ReviewedAt = DateTime.UtcNow;
            feedback.Status = MentorFeedbackConstants.Status.Reviewed;
         

            await _context.SaveChangesAsync();

            _logger.LogInformation("HR review set for mentor feedback: {TrackingId}", trackingId);

            return true;
        }

        public async Task<bool> DeleteMentorFeedbackAsync(int trackingId)
        {
            if (trackingId <= 0)
                throw new ArgumentException("Invalid tracking ID", nameof(trackingId));

            var feedback = await _context.Mentorfeedbacktrackings
                .FirstOrDefaultAsync(f => f.TrackingId == trackingId);

            if (feedback == null)
                return false;

            if (feedback.Status != MentorFeedbackConstants.Status.Submitted)
                throw new InvalidOperationException(
                    $"Cannot delete feedback in '{feedback.Status}' status. Only Submitted feedback can be deleted.");

            _context.Mentorfeedbacktrackings.Remove(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Mentor feedback deleted: {TrackingId}", trackingId);

            return true;
        }

        public async Task<bool> MentorFeedbackExistsAsync(int trackingId)
        {
            if (trackingId <= 0)
                return false;

            return await _context.Mentorfeedbacktrackings
                .AsNoTracking()
                .AnyAsync(f => f.TrackingId == trackingId);
        }
    }
}

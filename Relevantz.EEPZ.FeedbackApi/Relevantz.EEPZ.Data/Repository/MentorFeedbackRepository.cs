using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using Relevantz.EEPZ.Data.DBContexts;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    /// <summary>
    /// Repository implementation for MentorFeedbackTracking entity
    /// Handles mentor feedback linked to SME (mentor + skill)
    /// </summary>
    public class MentorFeedbackRepository : IMentorFeedbackRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<MentorFeedbackRepository> _logger;

        // Status constants
        private const string STATUS_SUBMITTED = "Submitted";
        private const string STATUS_ACKNOWLEDGED = "Acknowledged";
        private const string STATUS_REVIEWED = "Reviewed";
        private const string STATUS_ARCHIVED = "Archived";

        // FeedbackFrom constants
        private const string FEEDBACK_FROM_MENTEE = "Mentee";
        private const string FEEDBACK_FROM_HR = "HR";
        private const string FEEDBACK_FROM_MANAGER = "Manager";

        public MentorFeedbackRepository(EEPZDbContext context, ILogger<MentorFeedbackRepository> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        public async Task<int> CreateMentorFeedbackAsync(Mentorfeedbacktracking feedback)
        {
            if (feedback == null)
                throw new ArgumentNullException(nameof(feedback));

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate required fields
                if (feedback.SmeId <= 0)
                    throw new ArgumentException("Invalid SmeId", nameof(feedback));
                if (feedback.MentorEmployeeId <= 0)
                    throw new ArgumentException("Invalid MentorEmployeeId", nameof(feedback));
                if (feedback.MenteeEmployeeId <= 0)
                    throw new ArgumentException("Invalid MenteeEmployeeId", nameof(feedback));
                if (feedback.SkillIdReference <= 0)
                    throw new ArgumentException("Invalid SkillIdReference", nameof(feedback));

                feedback.CreatedAt = DateTime.UtcNow;
                feedback.Status = STATUS_SUBMITTED; // Default status
                
                _context.Mentorfeedbacktrackings.Add(feedback);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                
                _logger.LogInformation($"Mentor feedback created: {feedback.TrackingId}");
                return feedback.TrackingId;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Error creating mentor feedback");
                throw;
            }
        }

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        public async Task<Mentorfeedbacktracking?> GetMentorFeedbackByIdAsync(int trackingId)
        {
            try
            {
                if (trackingId <= 0)
                    throw new ArgumentException("Invalid tracking ID", nameof(trackingId));

                return await _context.Mentorfeedbacktrackings
                    .Include(f => f.Sme)
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.MenteeEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.ReviewedByHr)
                    .FirstOrDefaultAsync(f => f.TrackingId == trackingId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting mentor feedback by ID: {trackingId}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackByMentorAsync(int mentorEmployeeId)
        {
            try
            {
                if (mentorEmployeeId <= 0)
                    throw new ArgumentException("Invalid mentor employee ID", nameof(mentorEmployeeId));

                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.MentorEmployeeId == mentorEmployeeId && f.Status != STATUS_ARCHIVED)
                    .Include(f => f.MenteeEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting feedback by mentor: {mentorEmployeeId}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackByMenteeAsync(int menteeEmployeeId)
        {
            try
            {
                if (menteeEmployeeId <= 0)
                    throw new ArgumentException("Invalid mentee employee ID", nameof(menteeEmployeeId));

                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.MenteeEmployeeId == menteeEmployeeId)
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting feedback by mentee: {menteeEmployeeId}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackBySmeAsync(int smeId)
        {
            try
            {
                if (smeId <= 0)
                    throw new ArgumentException("Invalid SME ID", nameof(smeId));

                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.SmeId == smeId)
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.MenteeEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting feedback by SME: {smeId}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetPendingHRReviewAsync()
        {
            try
            {
                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.Status == STATUS_SUBMITTED || f.Status == STATUS_ACKNOWLEDGED)
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.MenteeEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending HR review feedback");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetAllMentorFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                if (pageNumber <= 0)
                    throw new ArgumentException("Page number must be greater than 0", nameof(pageNumber));
                if (pageSize <= 0 || pageSize > 100)
                    throw new ArgumentException("Page size must be between 1 and 100", nameof(pageSize));

                return await _context.Mentorfeedbacktrackings
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.MenteeEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .OrderByDescending(f => f.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting all mentor feedback (page {pageNumber})");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackByStatusAsync(string status)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(status))
                    throw new ArgumentException("Status cannot be null or empty", nameof(status));

                // Validate status
                var validStatuses = new[] { STATUS_SUBMITTED, STATUS_ACKNOWLEDGED, STATUS_REVIEWED, STATUS_ARCHIVED };
                if (!validStatuses.Contains(status))
                    throw new ArgumentException($"Invalid status: {status}", nameof(status));

                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.Status == status)
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.MenteeEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting feedback by status: {status}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackBySourceAsync(string feedbackFrom)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(feedbackFrom))
                    throw new ArgumentException("FeedbackFrom cannot be null or empty", nameof(feedbackFrom));

                // Validate feedbackFrom
                var validSources = new[] { FEEDBACK_FROM_MENTEE, FEEDBACK_FROM_HR, FEEDBACK_FROM_MANAGER };
                if (!validSources.Contains(feedbackFrom))
                    throw new ArgumentException($"Invalid feedback source: {feedbackFrom}", nameof(feedbackFrom));

                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.FeedbackFrom == feedbackFrom)
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.MenteeEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting feedback by source: {feedbackFrom}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetAnonymousMentorFeedbackAsync()
        {
            try
            {
                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.IsAnonymous && f.Status != STATUS_ARCHIVED)
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting anonymous mentor feedback");
                throw;
            }
        }

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

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

            // Validate status
            var validStatuses = new[] { STATUS_SUBMITTED, STATUS_ACKNOWLEDGED, STATUS_REVIEWED, STATUS_ARCHIVED };
            if (!validStatuses.Contains(newStatus))
                throw new ArgumentException($"Invalid status: {newStatus}", nameof(newStatus));

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var feedback = await _context.Mentorfeedbacktrackings.FindAsync(trackingId);
                if (feedback == null)
                {
                    _logger.LogWarning($"Mentor feedback not found: {trackingId}");
                    return false;
                }

                // Status transitions: Submitted → Acknowledged → Reviewed → Archived
                feedback.Status = newStatus;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                
                _logger.LogInformation($"Mentor feedback status updated: {trackingId} → {newStatus}");
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Error updating feedback status: {trackingId}");
                throw;
            }
        }

        public async Task<bool> SetHRReviewAsync(int trackingId, string hrComments, int reviewedByHRId)
        {
            if (trackingId <= 0)
                throw new ArgumentException("Invalid tracking ID", nameof(trackingId));
            if (string.IsNullOrWhiteSpace(hrComments))
                throw new ArgumentException("HR comments cannot be null or empty", nameof(hrComments));
            if (reviewedByHRId <= 0)
                throw new ArgumentException("Invalid reviewer ID", nameof(reviewedByHRId));

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var feedback = await _context.Mentorfeedbacktrackings.FindAsync(trackingId);
                if (feedback == null)
                {
                    _logger.LogWarning($"Mentor feedback not found: {trackingId}");
                    return false;
                }

                feedback.HrreviewComments = hrComments;
                feedback.ReviewedByHrid = reviewedByHRId;
                feedback.ReviewedAt = DateTime.UtcNow;
                feedback.Status = STATUS_REVIEWED;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                
                _logger.LogInformation($"HR review set for mentor feedback: {trackingId}");
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Error setting HR review: {trackingId}");
                throw;
            }
        }

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        public async Task<bool> DeleteMentorFeedbackAsync(int trackingId)
        {
            if (trackingId <= 0)
                throw new ArgumentException("Invalid tracking ID", nameof(trackingId));

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var feedback = await _context.Mentorfeedbacktrackings.FindAsync(trackingId);
                if (feedback == null)
                {
                    _logger.LogWarning($"Mentor feedback not found: {trackingId}");
                    return false;
                }

                // Only allow deletion if Submitted status
                if (feedback.Status != STATUS_SUBMITTED)
                {
                    throw new InvalidOperationException(
                        $"Cannot delete feedback in {feedback.Status} status. Only Submitted feedback can be deleted.");
                }

                _context.Mentorfeedbacktrackings.Remove(feedback);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                
                _logger.LogInformation($"Mentor feedback deleted: {trackingId}");
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Error deleting mentor feedback: {trackingId}");
                throw;
            }
        }

        // ============================================================================
        // EXISTENCE CHECKS
        // ============================================================================

        public async Task<bool> MentorFeedbackExistsAsync(int trackingId)
        {
            if (trackingId <= 0)
                return false;

            try
            {
                return await _context.Mentorfeedbacktrackings.AnyAsync(f => f.TrackingId == trackingId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking mentor feedback existence: {trackingId}");
                throw;
            }
        }
    }
}

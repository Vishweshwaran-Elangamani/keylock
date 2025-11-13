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

        public MentorFeedbackRepository(EEPZDbContext context, ILogger<MentorFeedbackRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        public async Task<int> CreateMentorFeedbackAsync(Mentorfeedbacktracking feedback)
        {
            try
            {
                feedback.CreatedAt = DateTime.UtcNow;
                feedback.Status = "Submitted"; // Default status
                
                _context.Mentorfeedbacktrackings.Add(feedback);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Mentor feedback created: {feedback.TrackingId}");
                return feedback.TrackingId;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating mentor feedback: {ex.Message}");
                throw;
            }
        }

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        public async Task<Mentorfeedbacktracking> GetMentorFeedbackByIdAsync(int trackingId)
        {
            try
            {
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
                _logger.LogError($"Error getting mentor feedback by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackByMentorAsync(int mentorEmployeeId)
        {
            try
            {
                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.MentorEmployeeId == mentorEmployeeId && f.Status != "Archived")
                    .Include(f => f.MenteeEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by mentor: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackByMenteeAsync(int menteeEmployeeId)
        {
            try
            {
                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.MenteeEmployeeId == menteeEmployeeId)
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by mentee: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackBySmeAsync(int smeId)
        {
            try
            {
                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.SmeId == smeId)
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.MenteeEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by SME: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetPendingHRReviewAsync()
        {
            try
            {
                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.Status == "Submitted" || f.Status == "Acknowledged")
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.MenteeEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting pending HR review: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetAllMentorFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
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
                _logger.LogError($"Error getting all mentor feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackByStatusAsync(string status)
        {
            try
            {
                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.Status == status)
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.MenteeEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by status: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetFeedbackBySourceAsync(string feedbackFrom)
        {
            try
            {
                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.FeedbackFrom == feedbackFrom)
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.MenteeEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by source: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Mentorfeedbacktracking>> GetAnonymousMentorFeedbackAsync()
        {
            try
            {
                return await _context.Mentorfeedbacktrackings
                    .Where(f => f.IsAnonymous && f.Status != "Archived")
                    .Include(f => f.MentorEmployee)
                    .Include(f => f.SkillIdReferenceNavigation)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting anonymous mentor feedback: {ex.Message}");
                throw;
            }
        }

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        public async Task<bool> UpdateMentorFeedbackAsync(Mentorfeedbacktracking feedback)
        {
            try
            {
                _context.Mentorfeedbacktrackings.Update(feedback);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Mentor feedback updated: {feedback.TrackingId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating mentor feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateFeedbackStatusAsync(int trackingId, string newStatus)
        {
            try
            {
                var feedback = await _context.Mentorfeedbacktrackings.FindAsync(trackingId);
                if (feedback == null)
                    return false;

                // Status transitions: Submitted → Acknowledged → Reviewed → Archived
                feedback.Status = newStatus;

                _context.Mentorfeedbacktrackings.Update(feedback);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Mentor feedback status updated: {trackingId} → {newStatus}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating feedback status: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> SetHRReviewAsync(int trackingId, string hrComments, int reviewedByHRId)
        {
            try
            {
                var feedback = await _context.Mentorfeedbacktrackings.FindAsync(trackingId);
                if (feedback == null)
                    return false;

                feedback.HrreviewComments = hrComments;
                feedback.ReviewedByHrid = reviewedByHRId;
                feedback.ReviewedAt = DateTime.UtcNow;
                feedback.Status = "Reviewed";

                _context.Mentorfeedbacktrackings.Update(feedback);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"HR review set for mentor feedback: {trackingId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error setting HR review: {ex.Message}");
                throw;
            }
        }

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        public async Task<bool> DeleteMentorFeedbackAsync(int trackingId)
        {
            try
            {
                var feedback = await _context.Mentorfeedbacktrackings.FindAsync(trackingId);
                if (feedback == null)
                    return false;

                // Only allow deletion if Submitted status
                if (feedback.Status != "Submitted")
                    throw new InvalidOperationException($"Cannot delete feedback in {feedback.Status} status. Only Submitted feedback can be deleted.");

                _context.Mentorfeedbacktrackings.Remove(feedback);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Mentor feedback deleted: {trackingId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting mentor feedback: {ex.Message}");
                throw;
            }
        }

        // ============================================================================
        // EXISTENCE CHECKS
        // ============================================================================

        public async Task<bool> MentorFeedbackExistsAsync(int trackingId)
        {
            try
            {
                return await _context.Mentorfeedbacktrackings.AnyAsync(f => f.TrackingId == trackingId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking mentor feedback existence: {ex.Message}");
                throw;
            }
        }
    }
}

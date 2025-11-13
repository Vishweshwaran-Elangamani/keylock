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
    /// Repository implementation for OrganizationGoalFeedback entity
    /// Handles organization-wide goal feedback management
    /// </summary>
    public class OrgGoalFeedbackRepository : IOrgGoalFeedbackRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<OrgGoalFeedbackRepository> _logger;

        public OrgGoalFeedbackRepository(EEPZDbContext context, ILogger<OrgGoalFeedbackRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        public async Task<int> CreateOrgGoalFeedbackAsync(Organizationgoalfeedback feedback)
        {
            try
            {
                feedback.CreatedAt = DateTime.UtcNow;
                feedback.Status = "Submitted"; // Default status
                
                _context.Organizationgoalfeedbacks.Add(feedback);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Organization goal feedback created: {feedback.OrgGoalFeedbackId}");
                return feedback.OrgGoalFeedbackId;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating org goal feedback: {ex.Message}");
                throw;
            }
        }

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        public async Task<Organizationgoalfeedback> GetOrgGoalFeedbackByIdAsync(int feedbackId)
        {
            try
            {
                return await _context.Organizationgoalfeedbacks
                    .Include(f => f.OrganizationObjective)
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.ManagerEmployee)
                    .FirstOrDefaultAsync(f => f.OrgGoalFeedbackId == feedbackId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting org goal feedback by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Organizationgoalfeedback>> GetFeedbackByOrgObjectiveAsync(int organizationObjectiveId)
        {
            try
            {
                return await _context.Organizationgoalfeedbacks
                    .Where(f => f.OrganizationObjectiveId == organizationObjectiveId && f.Status != "Archived")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.ManagerEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by org objective: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Organizationgoalfeedback>> GetFeedbackBySubmitterAsync(int employeeId)
        {
            try
            {
                return await _context.Organizationgoalfeedbacks
                    .Where(f => f.SubmittedByEmployeeId == employeeId)
                    .Include(f => f.OrganizationObjective)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by submitter: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Organizationgoalfeedback>> GetFeedbackBySourceAsync(string feedbackFrom)
        {
            try
            {
                return await _context.Organizationgoalfeedbacks
                    .Where(f => f.FeedbackFrom == feedbackFrom)
                    .Include(f => f.OrganizationObjective)
                    .Include(f => f.SubmittedByEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by source: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Organizationgoalfeedback>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                return await _context.Organizationgoalfeedbacks
                    .Include(f => f.OrganizationObjective)
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.ManagerEmployee)
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

        public async Task<List<Organizationgoalfeedback>> GetFeedbackByStatusAsync(string status)
        {
            try
            {
                return await _context.Organizationgoalfeedbacks
                    .Where(f => f.Status == status)
                    .Include(f => f.OrganizationObjective)
                    .Include(f => f.SubmittedByEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by status: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Organizationgoalfeedback>> GetAnonymousOrgGoalFeedbackAsync()
        {
            try
            {
                return await _context.Organizationgoalfeedbacks
                    .Where(f => f.IsAnonymous && f.Status != "Archived")
                    .Include(f => f.OrganizationObjective)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting anonymous org goal feedback: {ex.Message}");
                throw;
            }
        }

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        public async Task<bool> UpdateOrgGoalFeedbackAsync(Organizationgoalfeedback feedback)
        {
            try
            {
                _context.Organizationgoalfeedbacks.Update(feedback);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Organization goal feedback updated: {feedback.OrgGoalFeedbackId}");
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
                var feedback = await _context.Organizationgoalfeedbacks.FindAsync(feedbackId);
                if (feedback == null)
                    return false;

                // Status transitions: Submitted → Reviewed → Archived
                feedback.Status = newStatus;

                _context.Organizationgoalfeedbacks.Update(feedback);
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

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        public async Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId)
        {
            try
            {
                var feedback = await _context.Organizationgoalfeedbacks.FindAsync(feedbackId);
                if (feedback == null)
                    return false;

                // Only allow deletion if Submitted status
                if (feedback.Status != "Submitted")
                    throw new InvalidOperationException($"Cannot delete feedback in {feedback.Status} status. Only Submitted feedback can be deleted.");

                _context.Organizationgoalfeedbacks.Remove(feedback);
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

        // ============================================================================
        // EXISTENCE CHECKS
        // ============================================================================

        public async Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId)
        {
            try
            {
                return await _context.Organizationgoalfeedbacks.AnyAsync(f => f.OrgGoalFeedbackId == feedbackId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking org goal feedback existence: {ex.Message}");
                throw;
            }
        }
    }
}

using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class PeerFeedbackQueueRepository : IPeerFeedbackQueueRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<PeerFeedbackQueueRepository> _logger;

        public PeerFeedbackQueueRepository(EEPZDbContext context, ILogger<PeerFeedbackQueueRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> CreatePeerFeedbackAsync(Peerfeedbackqueue feedback)
        {
            try
            {
                feedback.CreatedAt = DateTime.UtcNow;
                feedback.Status = "Pending";

                _context.Peerfeedbackqueues.Add(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Peer feedback created in queue: {feedback.QueueId}");
                return feedback.QueueId;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating peer feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<Peerfeedbackqueue> GetQueueItemByIdAsync(int queueId)
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .Include(f => f.ApprovedByHr)
                    .FirstOrDefaultAsync(f => f.QueueId == queueId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting queue item by ID: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Peerfeedbackqueue>> GetPendingFeedbackAsync()
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .Where(f => f.Status == "Pending")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting pending feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Peerfeedbackqueue>> GetUnderReviewFeedbackAsync()
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .Where(f => f.Status == "UnderHRReview")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting under review feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Peerfeedbackqueue>> GetApprovedFeedbackAsync()
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .Where(f => f.Status == "Approved")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.ApprovedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting approved feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Peerfeedbackqueue>> GetRejectedFeedbackAsync()
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .Where(f => f.Status == "Rejected")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting rejected feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Peerfeedbackqueue>> GetFeedbackByRecipientAsync(int employeeId)
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .Where(f => f.RecipientEmployeeId == employeeId && f.Status == "Approved")
                    .Include(f => f.SubmittedByEmployee)
                    .OrderByDescending(f => f.ApprovedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by recipient: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Peerfeedbackqueue>> GetFeedbackBySubmitterAsync(int employeeId)
        {
            try
            {
                return await _context.Peerfeedbackqueues
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
        public async Task<List<Peerfeedbackqueue>> GetAllPeerFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .Include(f => f.ApprovedByHr)
                    .OrderByDescending(f => f.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all peer feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Peerfeedbackqueue>> GetFeedbackByStatusAsync(string status)
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .Where(f => f.Status == status)
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by status: {ex.Message}");
                throw;
            }
        }
        public async Task<List<Peerfeedbackqueue>> GetAnonymousPeerFeedbackAsync()
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .Where(f => f.IsAnonymous && f.Status == "Approved")
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.ApprovedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting anonymous peer feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> UpdatePeerFeedbackAsync(Peerfeedbackqueue feedback)
        {
            try
            {
                _context.Peerfeedbackqueues.Update(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Peer feedback updated: {feedback.QueueId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating peer feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> ApprovePeerFeedbackAsync(int queueId, bool isProfessional, bool isRelevant, int approvedByHRId)
        {
            try
            {
                var feedback = await _context.Peerfeedbackqueues.FindAsync(queueId);
                if (feedback == null)
                    return false;

                feedback.IsProfessional = isProfessional;
                feedback.IsRelevant = isRelevant;
                feedback.ApprovedByHrid = approvedByHRId;
                feedback.Status = "Approved";
                feedback.ApprovedAt = DateTime.UtcNow;

                _context.Peerfeedbackqueues.Update(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Peer feedback approved: {queueId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error approving peer feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> RejectPeerFeedbackAsync(int queueId, int rejectedByHRId)
        {
            try
            {
                var feedback = await _context.Peerfeedbackqueues.FindAsync(queueId);
                if (feedback == null)
                    return false;

                feedback.ApprovedByHrid = rejectedByHRId;
                feedback.Status = "Rejected";
                feedback.ApprovedAt = DateTime.UtcNow;

                _context.Peerfeedbackqueues.Update(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Peer feedback rejected: {queueId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error rejecting peer feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> UpdateFeedbackStatusAsync(int queueId, string newStatus)
        {
            try
            {
                var feedback = await _context.Peerfeedbackqueues.FindAsync(queueId);
                if (feedback == null)
                    return false;

                feedback.Status = newStatus;

                _context.Peerfeedbackqueues.Update(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Peer feedback status updated: {queueId} → {newStatus}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating feedback status: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> DeleteQueueItemAsync(int queueId)
        {
            try
            {
                var feedback = await _context.Peerfeedbackqueues.FindAsync(queueId);
                if (feedback == null)
                    return false;

                if (feedback.Status != "Pending")
                    throw new InvalidOperationException($"Cannot delete feedback in {feedback.Status} status. Only Pending feedback can be deleted.");

                _context.Peerfeedbackqueues.Remove(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Peer feedback deleted: {queueId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting peer feedback: {ex.Message}");
                throw;
            }
        }
        public async Task<bool> QueueItemExistsAsync(int queueId)
        {
            try
            {
                return await _context.Peerfeedbackqueues.AnyAsync(f => f.QueueId == queueId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking queue item existence: {ex.Message}");
                throw;
            }
        }
    }
}

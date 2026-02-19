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

        public PeerFeedbackQueueRepository(
            EEPZDbContext context,
            ILogger<PeerFeedbackQueueRepository> logger)
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

                _logger.LogInformation("Peer feedback created. QueueId: {QueueId}", feedback.QueueId);
                return feedback.QueueId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating peer feedback.");
                throw;
            }
        }

        public async Task<Peerfeedbackqueue> GetQueueItemByIdAsync(int queueId)
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .Include(f => f.ApprovedByHr)
                    .FirstOrDefaultAsync(f => f.QueueId == queueId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving peer feedback. QueueId: {QueueId}", queueId);
                throw;
            }
        }

        public async Task<List<Peerfeedbackqueue>> GetPendingFeedbackAsync()
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Where(f => f.Status == "Pending")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending feedback.");
                throw;
            }
        }

        public async Task<List<Peerfeedbackqueue>> GetUnderReviewFeedbackAsync()
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Where(f => f.Status == "UnderHRReview")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving under-review feedback.");
                throw;
            }
        }

        public async Task<List<Peerfeedbackqueue>> GetApprovedFeedbackAsync()
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Where(f => f.Status == "Approved")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.ApprovedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving approved feedback.");
                throw;
            }
        }

        public async Task<List<Peerfeedbackqueue>> GetRejectedFeedbackAsync()
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Where(f => f.Status == "Rejected")
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving rejected feedback.");
                throw;
            }
        }

        public async Task<List<Peerfeedbackqueue>> GetFeedbackByRecipientAsync(int employeeId)
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .AsNoTracking()
                    .Where(f => f.RecipientEmployeeId == employeeId && f.Status == "Approved")
                    .Include(f => f.SubmittedByEmployee)
                    .OrderByDescending(f => f.ApprovedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving feedback by recipient. EmployeeId: {EmployeeId}", employeeId);
                throw;
            }
        }

        public async Task<List<Peerfeedbackqueue>> GetFeedbackBySubmitterAsync(int employeeId)
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .AsNoTracking()
                    .Where(f => f.SubmittedByEmployeeId == employeeId)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving feedback by submitter. EmployeeId: {EmployeeId}", employeeId);
                throw;
            }
        }

        public async Task<List<Peerfeedbackqueue>> GetAllPeerFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                // TODO: Consider implementing caching for frequently accessed HR feedback records.

                return await _context.Peerfeedbackqueues
                    .AsNoTracking()
                    .AsSplitQuery()
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
                _logger.LogError(ex,
                    "Error retrieving paginated feedback. PageNumber: {PageNumber}, PageSize: {PageSize}",
                    pageNumber, pageSize);
                throw;
            }
        }

        public async Task<List<Peerfeedbackqueue>> GetFeedbackByStatusAsync(string status)
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Where(f => f.Status == status)
                    .Include(f => f.SubmittedByEmployee)
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving feedback by status. Status: {Status}", status);
                throw;
            }
        }

        public async Task<List<Peerfeedbackqueue>> GetAnonymousPeerFeedbackAsync()
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .AsNoTracking()
                    .Where(f => f.IsAnonymous && f.Status == "Approved")
                    .Include(f => f.RecipientEmployee)
                    .OrderByDescending(f => f.ApprovedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving anonymous feedback.");
                throw;
            }
        }

        public async Task<bool> UpdatePeerFeedbackAsync(Peerfeedbackqueue feedback)
        {
            try
            {
                _context.Entry(feedback).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Peer feedback updated. QueueId: {QueueId}", feedback.QueueId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating peer feedback. QueueId: {QueueId}", feedback.QueueId);
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
                await _context.SaveChangesAsync();

                _logger.LogInformation("Feedback status updated. QueueId: {QueueId}, Status: {Status}", queueId, newStatus);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating feedback status. QueueId: {QueueId}", queueId);
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
                    throw new InvalidOperationException("Only pending feedback can be deleted.");

                _context.Peerfeedbackqueues.Remove(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Peer feedback deleted. QueueId: {QueueId}", queueId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting peer feedback. QueueId: {QueueId}", queueId);
                throw;
            }
        }

        public async Task<bool> QueueItemExistsAsync(int queueId)
        {
            try
            {
                return await _context.Peerfeedbackqueues
                    .AsNoTracking()
                    .AnyAsync(f => f.QueueId == queueId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking queue item existence. QueueId: {QueueId}", queueId);
                throw;
            }
        }

        public async Task<bool> ApprovePeerFeedbackAsync(
    int queueId,
    bool isProfessional,
    bool isRelevant,
    int approvedByHRId)
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

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Peer feedback approved. QueueId: {QueueId}, HRId: {HRId}",
                    queueId,
                    approvedByHRId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error approving peer feedback. QueueId: {QueueId}",
                    queueId);
                throw;
            }
        }
        public async Task<bool> RejectPeerFeedbackAsync(
            int queueId,
            int rejectedByHRId)
        {
            try
            {
                var feedback = await _context.Peerfeedbackqueues.FindAsync(queueId);
                if (feedback == null)
                    return false;

                feedback.ApprovedByHrid = rejectedByHRId;
                feedback.Status = "Rejected";
                feedback.ApprovedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Peer feedback rejected. QueueId: {QueueId}, HRId: {HRId}",
                    queueId,
                    rejectedByHRId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error rejecting peer feedback. QueueId: {QueueId}",
                    queueId);
                throw;
            }
        }

    }
}

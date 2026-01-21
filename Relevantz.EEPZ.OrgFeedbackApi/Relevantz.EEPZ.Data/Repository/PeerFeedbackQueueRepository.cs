using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    /// <summary>
    /// Repository implementation for PeerFeedbackQueue entity
    /// Manages peer feedback quality control workflow.
    /// </summary>
    public class PeerFeedbackQueueRepository : IPeerFeedbackQueueRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<PeerFeedbackQueueRepository> _logger;

        public PeerFeedbackQueueRepository(EEPZDbContext context, ILogger<PeerFeedbackQueueRepository> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<int> CreatePeerFeedbackAsync(Peerfeedbackqueue feedback)
        {
            ArgumentNullException.ThrowIfNull(feedback);

            feedback.CreatedAt = DateTime.UtcNow;
            feedback.Status = PeerFeedbackConstants.Status.Pending;

            _context.Peerfeedbackqueues.Add(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Peer feedback created in queue: {QueueId}", feedback.QueueId);

            return feedback.QueueId;
        }

        public async Task<Peerfeedbackqueue?> GetQueueItemByIdAsync(int queueId)
        {
            return await _context.Peerfeedbackqueues
                .AsNoTracking()
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .Include(f => f.ApprovedByHr)
                .FirstOrDefaultAsync(f => f.QueueId == queueId);
        }

        public async Task<List<Peerfeedbackqueue>> GetPendingFeedbackAsync()
        {
            return await _context.Peerfeedbackqueues
                .AsNoTracking()
                .Where(f => f.Status == PeerFeedbackConstants.Status.Pending)
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Peerfeedbackqueue>> GetUnderReviewFeedbackAsync()
        {
            return await _context.Peerfeedbackqueues
                .AsNoTracking()
                .Where(f => f.Status == PeerFeedbackConstants.Status.UnderHRReview)
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Peerfeedbackqueue>> GetApprovedFeedbackAsync()
        {
            return await _context.Peerfeedbackqueues
                .AsNoTracking()
                .Where(f => f.Status == PeerFeedbackConstants.Status.Approved)
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.ApprovedAt)
                .ToListAsync();
        }

        public async Task<List<Peerfeedbackqueue>> GetRejectedFeedbackAsync()
        {
            return await _context.Peerfeedbackqueues
                .AsNoTracking()
                .Where(f => f.Status == PeerFeedbackConstants.Status.Rejected)
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Peerfeedbackqueue>> GetFeedbackByRecipientAsync(int employeeId)
        {
            return await _context.Peerfeedbackqueues
                .AsNoTracking()
                .Where(f => f.RecipientEmployeeId == employeeId && f.Status == PeerFeedbackConstants.Status.Approved)
                .Include(f => f.SubmittedByEmployee)
                .OrderByDescending(f => f.ApprovedAt)
                .ToListAsync();
        }

        public async Task<List<Peerfeedbackqueue>> GetFeedbackBySubmitterAsync(int employeeId)
        {
            return await _context.Peerfeedbackqueues
                .AsNoTracking()
                .Where(f => f.SubmittedByEmployeeId == employeeId)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Peerfeedbackqueue>> GetAllPeerFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            pageNumber = pageNumber <= 0 ? 1 : pageNumber;
            pageSize = pageSize <= 0 ? 20 : pageSize;
            pageSize = pageSize > 100 ? 100 : pageSize;

            return await _context.Peerfeedbackqueues
                .AsNoTracking()
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .Include(f => f.ApprovedByHr)
                .OrderByDescending(f => f.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<Peerfeedbackqueue>> GetFeedbackByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                throw new ArgumentException("Status cannot be null or empty.", nameof(status));

            return await _context.Peerfeedbackqueues
                .AsNoTracking()
                .Where(f => f.Status == status)
                .Include(f => f.SubmittedByEmployee)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Peerfeedbackqueue>> GetAnonymousPeerFeedbackAsync()
        {
            return await _context.Peerfeedbackqueues
                .AsNoTracking()
                .Where(f => f.IsAnonymous && f.Status == PeerFeedbackConstants.Status.Approved)
                .Include(f => f.RecipientEmployee)
                .OrderByDescending(f => f.ApprovedAt)
                .ToListAsync();
        }

        public async Task<bool> UpdatePeerFeedbackAsync(Peerfeedbackqueue feedback)
        {
            ArgumentNullException.ThrowIfNull(feedback);

            _context.Peerfeedbackqueues.Update(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Peer feedback updated: {QueueId}", feedback.QueueId);

            return true;
        }

        public async Task<bool> ApprovePeerFeedbackAsync(int queueId, bool isProfessional, bool isRelevant, int approvedByHRId)
        {
            var feedback = await _context.Peerfeedbackqueues
                .FirstOrDefaultAsync(x => x.QueueId == queueId);

            if (feedback == null)
                return false;

            feedback.IsProfessional = isProfessional;
            feedback.IsRelevant = isRelevant;
            feedback.ApprovedByHrid = approvedByHRId;
            feedback.Status = PeerFeedbackConstants.Status.Approved;
            feedback.ApprovedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Peer feedback approved: {QueueId}", queueId);

            return true;
        }

        public async Task<bool> RejectPeerFeedbackAsync(int queueId, int rejectedByHRId)
        {
            var feedback = await _context.Peerfeedbackqueues
                .FirstOrDefaultAsync(x => x.QueueId == queueId);

            if (feedback == null)
                return false;

            feedback.ApprovedByHrid = rejectedByHRId;
            feedback.Status = PeerFeedbackConstants.Status.Rejected;
            feedback.ApprovedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Peer feedback rejected: {QueueId}", queueId);

            return true;
        }

        public async Task<bool> UpdateFeedbackStatusAsync(int queueId, string newStatus)
        {
            if (string.IsNullOrWhiteSpace(newStatus))
                throw new ArgumentException("Status cannot be null or empty.", nameof(newStatus));

            var feedback = await _context.Peerfeedbackqueues
                .FirstOrDefaultAsync(x => x.QueueId == queueId);

            if (feedback == null)
                return false;

            feedback.Status = newStatus;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Peer feedback status updated. QueueId: {QueueId}, Status: {Status}", queueId, newStatus);

            return true;
        }

        public async Task<bool> DeleteQueueItemAsync(int queueId)
        {
            var feedback = await _context.Peerfeedbackqueues
                .FirstOrDefaultAsync(x => x.QueueId == queueId);

            if (feedback == null)
                return false;

            if (feedback.Status != PeerFeedbackConstants.Status.Pending)
                throw new InvalidOperationException(
                    $"Cannot delete feedback in '{feedback.Status}' status. Only Pending feedback can be deleted.");

            _context.Peerfeedbackqueues.Remove(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Peer feedback deleted: {QueueId}", queueId);

            return true;
        }

        public async Task<bool> QueueItemExistsAsync(int queueId)
        {
            return await _context.Peerfeedbackqueues
                .AsNoTracking()
                .AnyAsync(f => f.QueueId == queueId);
        }
    }
}

using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for PeerFeedbackQueue entity
    /// Handles peer feedback quality control workflow (US115, US116)
    /// Peer feedback goes through HR approval before going to recipient
    /// </summary>
    public interface IPeerFeedbackQueueRepository
    {
        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Create peer feedback in queue (pending HR review)
        /// Used by: US033, US075 (Peer and Manager submit peer feedback)
        /// </summary>
        Task<int> CreatePeerFeedbackAsync(Peerfeedbackqueue feedback);

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        /// <summary>
        /// Get peer feedback queue item by ID
        /// </summary>
        Task<Peerfeedbackqueue> GetQueueItemByIdAsync(int queueId);

        /// <summary>
        /// Get all peer feedback pending HR approval
        /// Used by: US115 (HR views pending peer feedback for review)
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetPendingFeedbackAsync();

        /// <summary>
        /// Get all peer feedback under HR review
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetUnderReviewFeedbackAsync();

        /// <summary>
        /// Get all approved peer feedback
        /// Used by: US116 (Approved feedback visible to recipient)
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetApprovedFeedbackAsync();

        /// <summary>
        /// Get all rejected peer feedback
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetRejectedFeedbackAsync();

        /// <summary>
        /// Get all peer feedback for specific recipient
        /// Used by: US033 (View all feedback about me)
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetFeedbackByRecipientAsync(int employeeId);

        /// <summary>
        /// Get all peer feedback submitted BY specific employee
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetFeedbackBySubmitterAsync(int employeeId);

        /// <summary>
        /// Get all peer feedback (with pagination for HR)
        /// Used by: HR views all peer feedback
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetAllPeerFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Get peer feedback by status (Pending, UnderHRReview, Approved, Rejected)
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetFeedbackByStatusAsync(string status);

        /// <summary>
        /// Get anonymous peer feedback
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetAnonymousPeerFeedbackAsync();

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Update peer feedback record
        /// </summary>
        Task<bool> UpdatePeerFeedbackAsync(Peerfeedbackqueue feedback);

        /// <summary>
        /// Approve peer feedback (set professionalism/relevance flags)
        /// Used by: US115 (HR approves feedback)
        /// </summary>
        Task<bool> ApprovePeerFeedbackAsync(int queueId, bool isProfessional, bool isRelevant, int approvedByHRId);

        /// <summary>
        /// Reject peer feedback
        /// Used by: US116 (HR rejects feedback)
        /// </summary>
        Task<bool> RejectPeerFeedbackAsync(int queueId, int rejectedByHRId);

        /// <summary>
        /// Update feedback status (Pending → UnderHRReview → Approved/Rejected)
        /// </summary>
        Task<bool> UpdateFeedbackStatusAsync(int queueId, string newStatus);

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Delete peer feedback from queue (only if Pending status)
        /// </summary>
        Task<bool> DeleteQueueItemAsync(int queueId);

        // ============================================================================
        // EXISTENCE CHECKS
        // ============================================================================

        /// <summary>
        /// Check if queue item exists
        /// </summary>
        Task<bool> QueueItemExistsAsync(int queueId);
    }
}

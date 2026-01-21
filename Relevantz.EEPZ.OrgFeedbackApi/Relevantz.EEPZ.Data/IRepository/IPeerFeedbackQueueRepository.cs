using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for Peer Feedback Queue operations.
    /// </summary>
    public interface IPeerFeedbackQueueRepository
    {
        /// <summary>
        /// Creates a new peer feedback queue item.
        /// </summary>
        Task<int> CreatePeerFeedbackAsync(Peerfeedbackqueue feedback);

        /// <summary>
        /// Retrieves a queue item by queue identifier.
        /// </summary>
        Task<Peerfeedbackqueue?> GetQueueItemByIdAsync(int queueId);

        /// <summary>
        /// Retrieves peer feedback items in pending status.
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetPendingFeedbackAsync();

        /// <summary>
        /// Retrieves peer feedback items under HR review.
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetUnderReviewFeedbackAsync();

        /// <summary>
        /// Retrieves approved peer feedback items.
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetApprovedFeedbackAsync();

        /// <summary>
        /// Retrieves rejected peer feedback items.
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetRejectedFeedbackAsync();

        /// <summary>
        /// Retrieves feedback items for a specific recipient.
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetFeedbackByRecipientAsync(int employeeId);

        /// <summary>
        /// Retrieves feedback items submitted by a specific employee.
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetFeedbackBySubmitterAsync(int employeeId);

        /// <summary>
        /// Retrieves all peer feedback items with pagination.
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetAllPeerFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Retrieves peer feedback items filtered by status.
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetFeedbackByStatusAsync(string status);

        /// <summary>
        /// Retrieves anonymous peer feedback items.
        /// </summary>
        Task<List<Peerfeedbackqueue>> GetAnonymousPeerFeedbackAsync();

        /// <summary>
        /// Updates peer feedback queue item.
        /// </summary>
        Task<bool> UpdatePeerFeedbackAsync(Peerfeedbackqueue feedback);

        /// <summary>
        /// Approves a peer feedback item (HR action).
        /// </summary>
        Task<bool> ApprovePeerFeedbackAsync(int queueId, bool isProfessional, bool isRelevant, int approvedByHRId);

        /// <summary>
        /// Rejects a peer feedback item (HR action).
        /// </summary>
        Task<bool> RejectPeerFeedbackAsync(int queueId, int rejectedByHRId);

        /// <summary>
        /// Updates feedback item status.
        /// </summary>
        Task<bool> UpdateFeedbackStatusAsync(int queueId, string newStatus);

        /// <summary>
        /// Deletes a queue item.
        /// </summary>
        Task<bool> DeleteQueueItemAsync(int queueId);

        /// <summary>
        /// Checks whether a queue item exists.
        /// </summary>
        Task<bool> QueueItemExistsAsync(int queueId);
    }
}

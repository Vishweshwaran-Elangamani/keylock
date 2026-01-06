using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IPeerFeedbackQueueRepository
    {

        Task<int> CreatePeerFeedbackAsync(Peerfeedbackqueue feedback);

        Task<Peerfeedbackqueue> GetQueueItemByIdAsync(int queueId);

        Task<List<Peerfeedbackqueue>> GetPendingFeedbackAsync();


        Task<List<Peerfeedbackqueue>> GetUnderReviewFeedbackAsync();


        Task<List<Peerfeedbackqueue>> GetApprovedFeedbackAsync();


        Task<List<Peerfeedbackqueue>> GetRejectedFeedbackAsync();


        Task<List<Peerfeedbackqueue>> GetFeedbackByRecipientAsync(int employeeId);

        Task<List<Peerfeedbackqueue>> GetFeedbackBySubmitterAsync(int employeeId);


        Task<List<Peerfeedbackqueue>> GetAllPeerFeedbackAsync(int pageNumber = 1, int pageSize = 20);


        Task<List<Peerfeedbackqueue>> GetFeedbackByStatusAsync(string status);


        Task<List<Peerfeedbackqueue>> GetAnonymousPeerFeedbackAsync();


        Task<bool> UpdatePeerFeedbackAsync(Peerfeedbackqueue feedback);

        Task<bool> ApprovePeerFeedbackAsync(int queueId, bool isProfessional, bool isRelevant, int approvedByHRId);

        Task<bool> RejectPeerFeedbackAsync(int queueId, int rejectedByHRId);
        Task<bool> UpdateFeedbackStatusAsync(int queueId, string newStatus);

        Task<bool> DeleteQueueItemAsync(int queueId);

        Task<bool> QueueItemExistsAsync(int queueId);
    }
}

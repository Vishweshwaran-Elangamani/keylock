using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IPeerFeedbackQueueService
    {
        Task<PeerFeedbackQueueResponseDto?> CreatePeerFeedbackAsync(CreatePeerFeedbackRequestDto dto);
        Task<PeerFeedbackQueueResponseDto?> GetQueueItemByIdAsync(int queueId);

        Task<List<PeerFeedbackQueueResponseDto>> GetPendingFeedbackAsync();
        Task<List<PeerFeedbackQueueResponseDto>> GetUnderReviewFeedbackAsync();
        Task<List<PeerFeedbackQueueResponseDto>> GetApprovedFeedbackAsync();
        Task<List<PeerFeedbackQueueResponseDto>> GetRejectedFeedbackAsync();

        Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackByRecipientAsync(int employeeId);
        Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackBySubmitterAsync(int employeeId);

        Task<List<PeerFeedbackQueueResponseDto>> GetAllPeerFeedbackAsync(int pageNumber = 1, int pageSize = 20);
        Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackByStatusAsync(string status);
        Task<List<PeerFeedbackQueueResponseDto>> GetAnonymousPeerFeedbackAsync();

        Task<PeerFeedbackQueueResponseDto?> UpdatePeerFeedbackAsync(int queueId, UpdatePeerFeedbackRequestDto dto);

        Task<bool> ApprovePeerFeedbackAsync(int queueId, bool isProfessional, bool isRelevant, int approvedByHRId);
        Task<bool> RejectPeerFeedbackAsync(int queueId, int rejectedByHRId);

        Task<bool> UpdateFeedbackStatusAsync(int queueId, string newStatus);
        Task<bool> DeleteQueueItemAsync(int queueId);

        Task<bool> QueueItemExistsAsync(int queueId);
    }
}

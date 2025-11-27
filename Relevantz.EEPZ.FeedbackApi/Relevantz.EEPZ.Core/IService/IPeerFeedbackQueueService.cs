using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;

namespace  Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for PeerFeedbackQueue business logic
    /// </summary>
    public interface IPeerFeedbackQueueService
    {
        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Create peer feedback in queue (pending HR review)
        /// </summary>
        Task<PeerFeedbackQueueResponseDto> CreatePeerFeedbackAsync(CreatePeerFeedbackRequestDto dto);

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        /// <summary>
        /// Get peer feedback queue item by ID
        /// </summary>
        Task<PeerFeedbackQueueResponseDto> GetQueueItemByIdAsync(int queueId);

        /// <summary>
        /// Get all peer feedback pending HR approval
        /// </summary>
        Task<List<PeerFeedbackQueueResponseDto>> GetPendingFeedbackAsync();

        /// <summary>
        /// Get all peer feedback under HR review
        /// </summary>
        Task<List<PeerFeedbackQueueResponseDto>> GetUnderReviewFeedbackAsync();

        /// <summary>
        /// Get all approved peer feedback
        /// </summary>
        Task<List<PeerFeedbackQueueResponseDto>> GetApprovedFeedbackAsync();

        /// <summary>
        /// Get all rejected peer feedback
        /// </summary>
        Task<List<PeerFeedbackQueueResponseDto>> GetRejectedFeedbackAsync();

        /// <summary>
        /// Get all peer feedback for specific recipient
        /// </summary>
        Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackByRecipientAsync(int employeeId);

        /// <summary>
        /// Get all peer feedback submitted BY specific employee
        /// </summary>
        Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackBySubmitterAsync(int employeeId);

        /// <summary>
        /// Get all peer feedback (with pagination for HR)
        /// </summary>
        Task<List<PeerFeedbackQueueResponseDto>> GetAllPeerFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Get peer feedback
        /// </summary>
        Task<List<PeerFeedbackQueueResponseDto>> GetFeedbackByStatusAsync(string status);

        /// <summary>
        /// Get anonymous peer feedback
        /// </summary>
        Task<List<PeerFeedbackQueueResponseDto>> GetAnonymousPeerFeedbackAsync();

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Update peer feedback record
        /// </summary>
        Task<PeerFeedbackQueueResponseDto> UpdatePeerFeedbackAsync(int queueId, UpdatePeerFeedbackRequestDto dto);

        /// <summary>
        /// Approve peer feedback
        /// </summary>
        Task<bool> ApprovePeerFeedbackAsync(int queueId, bool isProfessional, bool isRelevant, int approvedByHRId);

        /// <summary>
        /// Reject peer feedback
        /// </summary>
        Task<bool> RejectPeerFeedbackAsync(int queueId, int rejectedByHRId);

        /// <summary>
        /// Update feedback status
        /// </summary>
        Task<bool> UpdateFeedbackStatusAsync(int queueId, string newStatus);

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        /// <summary>
        /// Delete peer feedback from queue
        /// </summary>
        Task<bool> DeleteQueueItemAsync(int queueId);

        // ============================================================================
        // VALIDATION OPERATIONS
        // ============================================================================

        /// <summary>
        /// Check if queue item exists
        /// </summary>
        Task<bool> QueueItemExistsAsync(int queueId);
    }
}

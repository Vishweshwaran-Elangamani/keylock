using Relevantz.EEPZ.Common.Entities;
using System.Linq;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for HrFeedbackForm and HrFeedbackFormResponse entities
    /// Handles HR form creation, distribution, and response collection
    /// </summary>
    public interface IHrFeedbackFormRepository
    {
        /// <summary>
        /// Create new HR feedback form template    
        /// </summary>
        Task<int> CreateFormAsync(Hrfeedbackform form, CancellationToken ct);

        /// <summary>
        /// Get form by ID
        /// </summary>
        Task<Hrfeedbackform> GetFormByIdAsync(int formId, CancellationToken ct);

        /// <summary>
        /// Get all HR feedback forms
        /// </summary>
        Task<List<Hrfeedbackform>> GetAllFormsAsync(CancellationToken ct);

        /// <summary>
        /// Get active forms (status = Active)
        /// </summary>
        Task<List<Hrfeedbackform>> GetActiveFormsAsync(CancellationToken ct);

        /// <summary>
        /// Get forms by type (GeneralFeedback, BiasReview, etc.)
        /// </summary>
        Task<List<Hrfeedbackform>> GetFormsByTypeAsync(string formType, CancellationToken ct);

        /// <summary>
        /// Get forms created by specific HR user
        /// </summary>
        Task<List<Hrfeedbackform>> GetFormsByCreatorAsync(int hrUserId, CancellationToken ct);

        /// <summary>
        /// Update form template
        /// </summary>
        Task<bool> UpdateFormAsync(Hrfeedbackform form, CancellationToken ct);

        Task<bool> UpdateFormStatusAsync(int formId, string newStatus, CancellationToken ct);

        /// <summary>
        /// Delete form (only if Draft status)
        /// </summary>
        Task<bool> DeleteFormAsync(int formId, CancellationToken ct);

        /// <summary>
        /// Check if form exists
        /// </summary>
        Task<bool> FormExistsAsync(int formId, CancellationToken ct);

        /// <summary>
        /// Create form response submission
        /// </summary>
        Task<int> CreateFormResponseAsync(Hrfeedbackformresponse response, CancellationToken ct);

        /// <summary>
        /// Get form response by ID
        /// </summary>
        Task<Hrfeedbackformresponse> GetFormResponseByIdAsync(int responseId, CancellationToken ct);

        /// <summary>
        /// Get all responses for specific form
        /// </summary>
        Task<List<Hrfeedbackformresponse>> GetResponsesByFormAsync(int formId, CancellationToken ct);

        /// <summary>
        /// Get all responses submitted BY specific employee
        /// </summary>
        Task<List<Hrfeedbackformresponse>> GetResponsesBySubmitterAsync(int employeeId, CancellationToken ct);

        /// <summary>
        /// Get responses by status (Draft, Submitted, Reviewed)
        /// </summary>
        Task<List<Hrfeedbackformresponse>> GetResponsesByStatusAsync(string status, CancellationToken ct);

        /// <summary>
        /// Get all submitted responses (for HR review)
        /// </summary>
        Task<List<Hrfeedbackformresponse>> GetSubmittedResponsesAsync(CancellationToken ct);

        /// <summary>
        /// Get all responses pending HR review
        /// </summary>
        Task<List<Hrfeedbackformresponse>> GetPendingReviewResponsesAsync(CancellationToken ct);

        /// <summary>
        /// Update form response
        /// </summary>
        Task<bool> UpdateFormResponseAsync(Hrfeedbackformresponse response, CancellationToken ct);

        /// <summary>
        /// Update response status (Draft → Submitted → Reviewed)
        /// </summary>
        Task<bool> UpdateResponseStatusAsync(int responseId, string newStatus, CancellationToken ct);

        /// <summary>
        /// Set HR review on response
        /// </summary>
        Task<bool> SetHRReviewAsync(int responseId, string hrComments, int reviewedByHRId, CancellationToken ct);

        /// <summary>
        /// Delete form response (only if Draft status)
        /// </summary>
        Task<bool> DeleteFormResponseAsync(int responseId, CancellationToken ct);

        /// <summary>
        /// Check if response exists
        /// </summary>
        Task<bool> ResponseExistsAsync(int responseId, CancellationToken ct);

        Task<bool> DistributeFormAsync(int formId, List<int> employeeIds, CancellationToken ct);

        Task<List<int>> GetFormDistributionAsync(int formId, CancellationToken ct);

        IQueryable<Hrfeedbackform> Query();
    }
}

using Relevantz.EEPZ.Common.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for HrFeedbackForm and HrFeedbackFormResponse entities
    /// Handles HR form creation, distribution, and response collection (US039)
    /// </summary>
    public interface IHrFeedbackFormRepository
    {
        // ============================================================================
        // HR FORM OPERATIONS (Template Management)
        // ============================================================================

        /// <summary>
        /// Create new HR feedback form template
        /// Used by: US039 (HR creates feedback form)
        /// </summary>
        Task<int> CreateFormAsync(Hrfeedbackform form);

        /// <summary>
        /// Get form by ID
        /// </summary>
        Task<Hrfeedbackform> GetFormByIdAsync(int formId);

        /// <summary>
        /// Get all HR feedback forms
        /// </summary>
        Task<List<Hrfeedbackform>> GetAllFormsAsync();

        /// <summary>
        /// Get active forms (status = Active)
        /// </summary>
        Task<List<Hrfeedbackform>> GetActiveFormsAsync();

        /// <summary>
        /// Get forms by type (GeneralFeedback, BiasReview, etc.)
        /// </summary>
        Task<List<Hrfeedbackform>> GetFormsByTypeAsync(string formType);

        /// <summary>
        /// Get forms created by specific HR user
        /// </summary>
        Task<List<Hrfeedbackform>> GetFormsByCreatorAsync(int hrUserId);

        /// <summary>
        /// Update form template
        /// </summary>
        Task<bool> UpdateFormAsync(Hrfeedbackform form);

        /// <summary>
        /// Update form status (Draft → Active → Closed)
        /// </summary>
        Task<bool> UpdateFormStatusAsync(int formId, string newStatus);

        /// <summary>
        /// Delete form (only if Draft status)
        /// </summary>
        Task<bool> DeleteFormAsync(int formId);

        /// <summary>
        /// Check if form exists
        /// </summary>
        Task<bool> FormExistsAsync(int formId);

        // ============================================================================
        // FORM RESPONSE OPERATIONS (Employee Submissions)
        // ============================================================================

        /// <summary>
        /// Create form response submission
        /// Used by: US039 (Employee submits form)
        /// </summary>
        Task<int> CreateFormResponseAsync(Hrfeedbackformresponse response);

        /// <summary>
        /// Get form response by ID
        /// </summary>
        Task<Hrfeedbackformresponse> GetFormResponseByIdAsync(int responseId);

        /// <summary>
        /// Get all responses for specific form
        /// Used by: US039 (HR views all responses for form)
        /// </summary>
        Task<List<Hrfeedbackformresponse>> GetResponsesByFormAsync(int formId);

        /// <summary>
        /// Get all responses submitted BY specific employee
        /// </summary>
        Task<List<Hrfeedbackformresponse>> GetResponsesBySubmitterAsync(int employeeId);

        /// <summary>
        /// Get responses by status (Draft, Submitted, Reviewed)
        /// </summary>
        Task<List<Hrfeedbackformresponse>> GetResponsesByStatusAsync(string status);

        /// <summary>
        /// Get all submitted responses (for HR review)
        /// </summary>
        Task<List<Hrfeedbackformresponse>> GetSubmittedResponsesAsync();

        /// <summary>
        /// Get all responses pending HR review
        /// </summary>
        Task<List<Hrfeedbackformresponse>> GetPendingReviewResponsesAsync();

        /// <summary>
        /// Update form response
        /// </summary>
        Task<bool> UpdateFormResponseAsync(Hrfeedbackformresponse response);

        /// <summary>
        /// Update response status (Draft → Submitted → Reviewed)
        /// </summary>
        Task<bool> UpdateResponseStatusAsync(int responseId, string newStatus);

        /// <summary>
        /// Set HR review on response
        /// </summary>
        Task<bool> SetHRReviewAsync(int responseId, string hrComments, int reviewedByHRId);

        /// <summary>
        /// Delete form response (only if Draft status)
        /// </summary>
        Task<bool> DeleteFormResponseAsync(int responseId);

        /// <summary>
        /// Check if response exists
        /// </summary>
        Task<bool> ResponseExistsAsync(int responseId);

        Task<bool> DistributeFormAsync(int formId, List<int> employeeIds);
         
         Task<List<int>> GetFormDistributionAsync(int formId);

    }
}

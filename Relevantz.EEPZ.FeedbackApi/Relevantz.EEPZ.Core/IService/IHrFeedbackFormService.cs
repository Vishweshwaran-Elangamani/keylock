using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;


namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IHrFeedbackFormService
    {
        Task<HrFeedbackFormResponseDto> CreateFormAsync(CreateHRFeedbackFormRequestDto dto);
        Task<HrFeedbackFormResponseDto> GetFormByIdAsync(int formId);
        Task<List<HrFeedbackFormResponseDto>> GetAllFormsAsync();
        Task<List<HrFeedbackFormResponseDto>> GetActiveFormsAsync();
        Task<List<HrFeedbackFormResponseDto>> GetFormsByTypeAsync(string formType);
        Task<List<HrFeedbackFormResponseDto>> GetFormsByCreatorAsync(int hrUserId);
        Task<HrFeedbackFormResponseDto> UpdateFormAsync(int formId, UpdateHRFormRequestDto dto);
        Task<bool> UpdateFormStatusAsync(int formId, string newStatus);
        Task<bool> DeleteFormAsync(int formId);
        Task<HrFeedbackFormResponseResponseDto> CreateFormResponseAsync(SubmitHRFormResponseRequestDto dto);
        Task<HrFeedbackFormResponseResponseDto> GetFormResponseByIdAsync(int responseId);
        Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesByFormAsync(int formId);
        Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesBySubmitterAsync(int employeeId);
        Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesByStatusAsync(string status);
        Task<List<HrFeedbackFormResponseResponseDto>> GetSubmittedResponsesAsync();
        Task<List<HrFeedbackFormResponseResponseDto>> GetPendingReviewResponsesAsync();
        Task<HrFeedbackFormResponseResponseDto> UpdateFormResponseAsync(int responseId, UpdateHRFormResponseRequestDto dto);
        Task<bool> SubmitFormResponseAsync(int responseId);
        Task<bool> SetHRReviewAsync(int responseId, string hrComments, int reviewedByHRId);
        Task<bool> DeleteFormResponseAsync(int responseId);
        Task<DistributeFormResponse> DistributeFormAsync(int formId, List<int> employeeIds);

    }
}

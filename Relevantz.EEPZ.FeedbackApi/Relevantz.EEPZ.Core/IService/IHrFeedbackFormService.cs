using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IHrFeedbackFormService
    {
        Task<HrFeedbackFormResponseDto> CreateFormAsync(CreateHRFeedbackFormRequestDto dto, CancellationToken ct);
        Task<HrFeedbackFormResponseDto> GetFormByIdAsync(int formId, CancellationToken ct);
        Task<PagedResultDto<HrFeedbackFormResponseDto>> GetAllFormsAsync(PaginationRequestDto pagination, CancellationToken ct);
        Task<PagedResultDto<HrFeedbackFormResponseDto>> GetActiveFormsAsync(PaginationRequestDto pagination, CancellationToken ct);

        Task<List<HrFeedbackFormResponseDto>> GetFormsByTypeAsync(string formType, CancellationToken ct);
        Task<List<HrFeedbackFormResponseDto>> GetFormsByCreatorAsync(int hrUserId, CancellationToken ct);
        Task<HrFeedbackFormResponseDto> UpdateFormAsync(int formId, UpdateHRFormRequestDto dto, CancellationToken ct);
        Task<bool> UpdateFormStatusAsync(int formId, string newStatus, CancellationToken ct);
        Task<bool> DeleteFormAsync(int formId, CancellationToken ct);

        Task<HrFeedbackFormResponseResponseDto> CreateFormResponseAsync(SubmitHRFormResponseRequestDto dto, CancellationToken ct);
        Task<HrFeedbackFormResponseResponseDto> GetFormResponseByIdAsync(int responseId, CancellationToken ct);
        Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesByFormAsync(int formId, CancellationToken ct);
        Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesBySubmitterAsync(int employeeId, CancellationToken ct);
        Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesByStatusAsync(string status, CancellationToken ct);
        Task<List<HrFeedbackFormResponseResponseDto>> GetSubmittedResponsesAsync(CancellationToken ct);
        Task<List<HrFeedbackFormResponseResponseDto>> GetPendingReviewResponsesAsync(CancellationToken ct);
        Task<HrFeedbackFormResponseResponseDto> UpdateFormResponseAsync(int responseId, UpdateHRFormResponseRequestDto dto, CancellationToken ct);
        Task<bool> SubmitFormResponseAsync(int responseId, CancellationToken ct);
        Task<bool> SetHRReviewAsync(int responseId, string hrComments, int reviewedByHRId, CancellationToken ct);
        Task<bool> DeleteFormResponseAsync(int responseId, CancellationToken ct);

        Task<DistributeFormResponse> DistributeFormAsync(int formId, List<int> employeeIds, CancellationToken ct);
    }
}

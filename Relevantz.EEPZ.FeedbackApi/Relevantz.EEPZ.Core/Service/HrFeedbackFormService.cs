using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class HrFeedbackFormService : IHrFeedbackFormService
    {
        private readonly IHrFeedbackFormRepository _formRepo;
        private readonly ILogger<HrFeedbackFormService> _logger;

        public HrFeedbackFormService(IHrFeedbackFormRepository formRepo, ILogger<HrFeedbackFormService> logger)
        {
            _formRepo = formRepo;
            _logger = logger;
        }

        public async Task<HrFeedbackFormResponseDto> CreateFormAsync(CreateHRFeedbackFormRequestDto dto, CancellationToken ct)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            _logger.LogInformation("Creating HR Feedback Form. Type: {Type}, Deadline: {Deadline}", dto.FormType, dto.Deadline);

            var form = new Hrfeedbackform
            {
                FormName = dto.FormName,
                FormDescription = dto.FormDescription,
                FormType = dto.FormType,
                CreatedByHrid = dto.CreatedByHRId,
                Status = FormStatuses.Draft,
                Deadline = dto.Deadline
            };

            var formId = await _formRepo.CreateFormAsync(form, ct);
            form.FormId = formId;

            return MapFormToResponseDto(form);
        }

        public async Task<HrFeedbackFormResponseDto> GetFormByIdAsync(int formId, CancellationToken ct)
        {
            var form = await _formRepo.GetFormByIdAsync(formId, ct)
                ?? throw new KeyNotFoundException($"HR Feedback Form with ID {formId} was not found.");

            return MapFormToResponseDto(form);
        }

        public async Task<PagedResultDto<HrFeedbackFormResponseDto>> GetAllFormsAsync(PaginationRequestDto pagination, CancellationToken ct)
        {
            var query = _formRepo.Query();

            if (!string.IsNullOrWhiteSpace(pagination.Search))
                query = query.Where(x => x.FormName.Contains(pagination.Search));

            var totalCount = await query.CountAsync(ct);

            var forms = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync(ct);

            return new PagedResultDto<HrFeedbackFormResponseDto>
            {
                Items = forms.Select(MapFormToResponseDto),
                TotalCount = totalCount,
                PageNumber = pagination.PageNumber,
                PageSize = pagination.PageSize
            };
        }

        public async Task<PagedResultDto<HrFeedbackFormResponseDto>> GetActiveFormsAsync(PaginationRequestDto pagination, CancellationToken ct)
        {
            var query = _formRepo.Query().Where(x => x.Status == FormStatuses.Active);

            var totalCount = await query.CountAsync(ct);

            var forms = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync(ct);

            return new PagedResultDto<HrFeedbackFormResponseDto>
            {
                Items = forms.Select(MapFormToResponseDto),
                TotalCount = totalCount,
                PageNumber = pagination.PageNumber,
                PageSize = pagination.PageSize
            };
        }

        public async Task<List<HrFeedbackFormResponseDto>> GetFormsByTypeAsync(string formType, CancellationToken ct) =>
            (await _formRepo.GetFormsByTypeAsync(formType, ct)).Select(MapFormToResponseDto).ToList();

        public async Task<List<HrFeedbackFormResponseDto>> GetFormsByCreatorAsync(int hrUserId, CancellationToken ct) =>
            (await _formRepo.GetFormsByCreatorAsync(hrUserId, ct)).Select(MapFormToResponseDto).ToList();

        public async Task<HrFeedbackFormResponseDto> UpdateFormAsync(int formId, UpdateHRFormRequestDto dto, CancellationToken ct)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            var form = await _formRepo.GetFormByIdAsync(formId, ct)
                ?? throw new KeyNotFoundException($"HR Feedback Form with ID {formId} was not found.");

            if (form.Status != FormStatuses.Draft)
                throw new InvalidOperationException($"HR Feedback Form {formId} cannot be edited.");

            if (!string.IsNullOrEmpty(dto.FormName)) form.FormName = dto.FormName;
            if (!string.IsNullOrEmpty(dto.FormDescription)) form.FormDescription = dto.FormDescription;
            if (dto.Deadline.HasValue) form.Deadline = dto.Deadline;

            await _formRepo.UpdateFormAsync(form, ct);

            return MapFormToResponseDto(form);
        }

        public async Task<bool> UpdateFormStatusAsync(int formId, string newStatus, CancellationToken ct) =>
            await _formRepo.UpdateFormStatusAsync(formId, newStatus, ct);

        public async Task<bool> DeleteFormAsync(int formId, CancellationToken ct) =>
            await _formRepo.DeleteFormAsync(formId, ct);

        public async Task<HrFeedbackFormResponseResponseDto> CreateFormResponseAsync(SubmitHRFormResponseRequestDto dto, CancellationToken ct)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));
            if (!await _formRepo.FormExistsAsync(dto.FormId, ct))
                throw new KeyNotFoundException($"Form {dto.FormId} not found.");

            var response = new Hrfeedbackformresponse
            {
                FormId = dto.FormId,
                SubmittedByEmployeeId = dto.SubmittedByEmployeeId,
                FormResponse = JsonSerializer.Serialize(dto.FormResponse),
                Status = FormStatuses.Draft
            };

            var id = await _formRepo.CreateFormResponseAsync(response, ct);
            response.ResponseId = id;

            return MapResponseToResponseDto(response);
        }

        public async Task<HrFeedbackFormResponseResponseDto> GetFormResponseByIdAsync(int responseId, CancellationToken ct) =>
            MapResponseToResponseDto(await _formRepo.GetFormResponseByIdAsync(responseId, ct)
                ?? throw new KeyNotFoundException($"Response {responseId} not found."));

        public async Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesByFormAsync(int formId, CancellationToken ct) =>
            (await _formRepo.GetResponsesByFormAsync(formId, ct)).Select(MapResponseToResponseDto).ToList();

        public async Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesBySubmitterAsync(int employeeId, CancellationToken ct) =>
            (await _formRepo.GetResponsesBySubmitterAsync(employeeId, ct)).Select(MapResponseToResponseDto).ToList();

        public async Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesByStatusAsync(string status, CancellationToken ct) =>
            (await _formRepo.GetResponsesByStatusAsync(status, ct)).Select(MapResponseToResponseDto).ToList();

        public async Task<List<HrFeedbackFormResponseResponseDto>> GetSubmittedResponsesAsync(CancellationToken ct) =>
            (await _formRepo.GetSubmittedResponsesAsync(ct)).Select(MapResponseToResponseDto).ToList();

        public async Task<List<HrFeedbackFormResponseResponseDto>> GetPendingReviewResponsesAsync(CancellationToken ct) =>
            (await _formRepo.GetPendingReviewResponsesAsync(ct)).Select(MapResponseToResponseDto).ToList();

        public async Task<bool> SetHRReviewAsync(int responseId, string hrComments, int reviewedByHRId, CancellationToken ct) =>
            await _formRepo.SetHRReviewAsync(responseId, hrComments, reviewedByHRId, ct);

        public async Task<bool> DeleteFormResponseAsync(int responseId, CancellationToken ct) =>
            await _formRepo.DeleteFormResponseAsync(responseId, ct);

        public async Task<bool> SubmitFormResponseAsync(int responseId, CancellationToken ct) =>
            await _formRepo.UpdateResponseStatusAsync(responseId, FormStatuses.Submitted, ct);

        public async Task<DistributeFormResponse> DistributeFormAsync(int formId, List<int> employeeIds, CancellationToken ct)
        {
            var success = await _formRepo.DistributeFormAsync(formId, employeeIds, ct);
            return new DistributeFormResponse { Success = success, FormId = formId, EmployeeCount = employeeIds.Count };
        }

        private HrFeedbackFormResponseDto MapFormToResponseDto(Hrfeedbackform form) => new()
        {
            FormId = form.FormId,
            FormName = form.FormName ?? "Unknown",
            FormDescription = form.FormDescription ?? "N/A",
            FormType = form.FormType ?? "Unknown",
            CreatedByHRId = form.CreatedByHrid,
            Status = form.Status ?? FormStatuses.Draft,
            CreatedAt = form.CreatedAt,
            Deadline = form.Deadline
        };

        private HrFeedbackFormResponseResponseDto MapResponseToResponseDto(Hrfeedbackformresponse response) => new()
        {
            ResponseId = response.ResponseId,
            FormId = response.FormId,
            SubmittedByEmployeeId = response.SubmittedByEmployeeId,
            FormResponse = string.IsNullOrEmpty(response.FormResponse)
                ? new()
                : JsonSerializer.Deserialize<Dictionary<string, object>>(response.FormResponse) ?? new(),
            Status = response.Status ?? FormStatuses.Draft
        };

        public async Task<HrFeedbackFormResponseResponseDto> UpdateFormResponseAsync(int responseId, UpdateHRFormResponseRequestDto dto, CancellationToken ct)
        {
            var response = await _formRepo.GetFormResponseByIdAsync(responseId, ct)
                ?? throw new KeyNotFoundException($"Response {responseId} not found.");

            response.FormResponse = JsonSerializer.Serialize(dto.FormResponse);
            await _formRepo.UpdateFormResponseAsync(response, ct);

            return MapResponseToResponseDto(response);
        }
    }
}

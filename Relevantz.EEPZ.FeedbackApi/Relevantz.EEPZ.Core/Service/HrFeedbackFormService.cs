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
    /// <summary>
    /// Service responsible for managing HR feedback forms and form responses.
    /// Handles creation, retrieval, updates, distribution, and response lifecycle.
    /// </summary>
    public class HrFeedbackFormService : IHrFeedbackFormService
    {
        private readonly IHrFeedbackFormRepository _formRepo;
        private readonly ILogger<HrFeedbackFormService> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="HrFeedbackFormService"/> class.
        /// </summary>
        public HrFeedbackFormService(IHrFeedbackFormRepository formRepo, ILogger<HrFeedbackFormService> logger)
        {
            _formRepo = formRepo;
            _logger = logger;
        }

        /// <summary>
        /// Creates a new HR feedback form in draft state.
        /// </summary>
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

        /// <summary>
        /// Retrieves a feedback form by its identifier.
        /// </summary>
        public async Task<HrFeedbackFormResponseDto> GetFormByIdAsync(int formId, CancellationToken ct)
        {
            var form = await _formRepo.GetFormByIdAsync(formId, ct)
                ?? throw new KeyNotFoundException($"HR Feedback Form with ID {formId} was not found.");

            return MapFormToResponseDto(form);
        }

        /// <summary>
        /// Retrieves all feedback forms with pagination.
        /// </summary>
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

        /// <summary>
        /// Retrieves active feedback forms with pagination.
        /// </summary>
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

        /// <summary>Retrieves forms by form type.</summary>
        public async Task<List<HrFeedbackFormResponseDto>> GetFormsByTypeAsync(string formType, CancellationToken ct) =>
            (await _formRepo.GetFormsByTypeAsync(formType, ct)).Select(MapFormToResponseDto).ToList();

        /// <summary>Retrieves forms created by a specific HR user.</summary>
        public async Task<List<HrFeedbackFormResponseDto>> GetFormsByCreatorAsync(int hrUserId, CancellationToken ct) =>
            (await _formRepo.GetFormsByCreatorAsync(hrUserId, ct)).Select(MapFormToResponseDto).ToList();

        /// <summary>
        /// Updates a draft feedback form.
        /// </summary>
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

        /// <summary>Updates the status of a feedback form.</summary>
        public async Task<bool> UpdateFormStatusAsync(int formId, string newStatus, CancellationToken ct) =>
            await _formRepo.UpdateFormStatusAsync(formId, newStatus, ct);

        /// <summary>Deletes a draft feedback form.</summary>
        public async Task<bool> DeleteFormAsync(int formId, CancellationToken ct) =>
            await _formRepo.DeleteFormAsync(formId, ct);

        /// <summary>
        /// Creates a response entry for a feedback form.
        /// </summary>
        public async Task<HrFeedbackFormResponseResponseDto> CreateFormResponseAsync(
    SubmitHRFormResponseRequestDto dto,
    int loggedInEmployeeId,
    CancellationToken ct)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            var form = await _formRepo.GetFormByIdAsync(dto.FormId, ct)
                ?? throw new KeyNotFoundException($"Form {dto.FormId} not found.");


            var existingResponses = await _formRepo.GetResponsesBySubmitterAsync(loggedInEmployeeId, ct);

            if (existingResponses.Any(r => r.FormId == dto.FormId))
                throw new InvalidOperationException("You have already submitted this form.");

            var response = new Hrfeedbackformresponse
            {
                FormId = dto.FormId,
                SubmittedByEmployeeId = loggedInEmployeeId,
                FormResponse = JsonSerializer.Serialize(dto.FormResponse),
                Status = FormStatuses.Draft,
                CreatedAt = DateTime.UtcNow
            };

            var id = await _formRepo.CreateFormResponseAsync(response, ct);
            response.ResponseId = id;

            return MapResponseToResponseDto(response);
        }


        /// <summary>Retrieves a specific form response.</summary>
        public async Task<HrFeedbackFormResponseResponseDto> GetFormResponseByIdAsync(int responseId, CancellationToken ct) =>
            MapResponseToResponseDto(await _formRepo.GetFormResponseByIdAsync(responseId, ct)
                ?? throw new KeyNotFoundException($"Response {responseId} not found."));

        /// <summary>Retrieves responses by form.</summary>
        public async Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesByFormAsync(int formId, CancellationToken ct) =>
            (await _formRepo.GetResponsesByFormAsync(formId, ct)).Select(MapResponseToResponseDto).ToList();

        /// <summary>Retrieves responses submitted by an employee.</summary>
        public async Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesBySubmitterAsync(int employeeId, CancellationToken ct) =>
            (await _formRepo.GetResponsesBySubmitterAsync(employeeId, ct)).Select(MapResponseToResponseDto).ToList();

        /// <summary>Retrieves responses filtered by status.</summary>
        public async Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesByStatusAsync(string status, CancellationToken ct) =>
            (await _formRepo.GetResponsesByStatusAsync(status, ct)).Select(MapResponseToResponseDto).ToList();

        /// <summary>Retrieves all submitted responses.</summary>
        public async Task<List<HrFeedbackFormResponseResponseDto>> GetSubmittedResponsesAsync(CancellationToken ct) =>
            (await _formRepo.GetSubmittedResponsesAsync(ct)).Select(MapResponseToResponseDto).ToList();

        /// <summary>Retrieves responses pending HR review.</summary>
        public async Task<List<HrFeedbackFormResponseResponseDto>> GetPendingReviewResponsesAsync(CancellationToken ct) =>
            (await _formRepo.GetPendingReviewResponsesAsync(ct)).Select(MapResponseToResponseDto).ToList();

        /// <summary>Sets HR review comments and marks response reviewed.</summary>
        public async Task<bool> SetHRReviewAsync(int responseId, string hrComments, int reviewedByHRId, CancellationToken ct) =>
            await _formRepo.SetHRReviewAsync(responseId, hrComments, reviewedByHRId, ct);

        /// <summary>Deletes a form response.</summary>
        public async Task<bool> DeleteFormResponseAsync(
     int responseId,
     int loggedInEmployeeId,
     CancellationToken ct)
        {
            var response = await _formRepo.GetFormResponseByIdAsync(responseId, ct)
                ?? throw new KeyNotFoundException($"Response {responseId} not found.");

            if (response.SubmittedByEmployeeId != loggedInEmployeeId)
                throw new UnauthorizedAccessException("You cannot delete this response.");

            if (response.Status == FormStatuses.Submitted)
                throw new InvalidOperationException("Submitted responses cannot be deleted.");

            await _formRepo.DeleteFormResponseAsync(responseId, ct);

            return true;
        }


        /// <summary>Marks a form response as submitted.</summary>
        public async Task<bool> SubmitFormResponseAsync(
     int responseId,
     int loggedInEmployeeId,
     CancellationToken ct)
        {
            var response = await _formRepo.GetFormResponseByIdAsync(responseId, ct)
                ?? throw new KeyNotFoundException($"Response {responseId} not found.");

            if (response.SubmittedByEmployeeId != loggedInEmployeeId)
                throw new UnauthorizedAccessException("You cannot submit this response.");

            if (response.Status == FormStatuses.Submitted)
                throw new InvalidOperationException("Response already submitted.");

            response.Status = FormStatuses.Submitted;
            response.SubmittedAt = DateTime.UtcNow;

            await _formRepo.UpdateFormResponseAsync(response, ct);

            return true;
        }

        /// <summary>Distributes a form to employees.</summary>
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

        /// <summary>
        /// Updates an existing form response.
        /// </summary>
        public async Task<HrFeedbackFormResponseResponseDto> UpdateFormResponseAsync(
     int responseId,
     UpdateHRFormResponseRequestDto dto,
     int loggedInEmployeeId,
     CancellationToken ct)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            var response = await _formRepo.GetFormResponseByIdAsync(responseId, ct)
                ?? throw new KeyNotFoundException($"Response {responseId} not found.");

            if (response.SubmittedByEmployeeId != loggedInEmployeeId)
                throw new UnauthorizedAccessException("You cannot modify this response.");

            if (response.Status == FormStatuses.Submitted)
                throw new InvalidOperationException("Submitted responses cannot be modified.");

            response.FormResponse = JsonSerializer.Serialize(dto.FormResponse);

            await _formRepo.UpdateFormResponseAsync(response, ct);

            return MapResponseToResponseDto(response);
        }

    }
}

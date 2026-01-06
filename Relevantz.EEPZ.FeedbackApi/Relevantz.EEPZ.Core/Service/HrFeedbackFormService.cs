using Microsoft.Extensions.Logging;
using System.Text.Json;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class HrFeedbackFormService : IHrFeedbackFormService
    {
        private readonly IHrFeedbackFormRepository _formRepo;
        private readonly ILogger<HrFeedbackFormService> _logger;
        public HrFeedbackFormService(
            IHrFeedbackFormRepository formRepo,
            ILogger<HrFeedbackFormService> logger)
        {
            _formRepo = formRepo;
            _logger = logger;
        }

        public async Task<HrFeedbackFormResponseDto> CreateFormAsync(CreateHRFeedbackFormRequestDto dto)
        {
            try
            {
                var form = new Hrfeedbackform
                {
                    FormName = dto.FormName,
                    FormDescription = dto.FormDescription,
                    FormType = dto.FormType,
                    CreatedByHrid = dto.CreatedByHRId,
                    Status = "Draft",
                    Deadline = dto.Deadline
                };

                var formId = await _formRepo.CreateFormAsync(form);
                _logger.LogInformation($"HR feedback form created: {formId}");

                return await GetFormByIdAsync(formId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating HR form: {ex.Message}");
                throw;
            }
        }

        public async Task<HrFeedbackFormResponseDto> GetFormByIdAsync(int formId)
        {
            try
            {
                var form = await _formRepo.GetFormByIdAsync(formId);
                if (form == null)
                    throw new KeyNotFoundException($"HR form {formId} not found");

                return MapFormToResponseDto(form);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting form by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<List<HrFeedbackFormResponseDto>> GetAllFormsAsync()
        {
            try
            {
                var forms = await _formRepo.GetAllFormsAsync();
                return forms.Select(f => MapFormToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all forms: {ex.Message}");
                throw;
            }
        }

        public async Task<List<HrFeedbackFormResponseDto>> GetActiveFormsAsync()
        {
            try
            {
                var forms = await _formRepo.GetActiveFormsAsync();
                return forms.Select(f => MapFormToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting active forms: {ex.Message}");
                throw;
            }
        }

        public async Task<List<HrFeedbackFormResponseDto>> GetFormsByTypeAsync(string formType)
        {
            try
            {
                var forms = await _formRepo.GetFormsByTypeAsync(formType);
                return forms.Select(f => MapFormToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting forms by type: {ex.Message}");
                throw;
            }
        }

        public async Task<List<HrFeedbackFormResponseDto>> GetFormsByCreatorAsync(int hrUserId)
        {
            try
            {
                var forms = await _formRepo.GetFormsByCreatorAsync(hrUserId);
                return forms.Select(f => MapFormToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting forms by creator: {ex.Message}");
                throw;
            }
        }

        public async Task<HrFeedbackFormResponseDto> UpdateFormAsync(int formId, UpdateHRFormRequestDto dto)
        {
            try
            {
                var form = await _formRepo.GetFormByIdAsync(formId);
                if (form == null)
                    throw new KeyNotFoundException($"HR form {formId} not found");

                if (form.Status != "Draft")
                    throw new InvalidOperationException($"Cannot edit form in {form.Status} status");

                if (!string.IsNullOrEmpty(dto.FormName))
                    form.FormName = dto.FormName;

                if (!string.IsNullOrEmpty(dto.FormDescription))
                    form.FormDescription = dto.FormDescription;

                if (dto.Deadline.HasValue)
                    form.Deadline = dto.Deadline;

                await _formRepo.UpdateFormAsync(form);
                _logger.LogInformation($"HR form updated: {formId}");

                return await GetFormByIdAsync(formId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating HR form: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateFormStatusAsync(int formId, string newStatus)
        {
            try
            {
                var result = await _formRepo.UpdateFormStatusAsync(formId, newStatus);
                if (result)
                    _logger.LogInformation($"HR form status updated: {formId} → {newStatus}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating form status: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteFormAsync(int formId)
        {
            try
            {
                var result = await _formRepo.DeleteFormAsync(formId);
                if (result)
                    _logger.LogInformation($"HR form deleted: {formId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting HR form: {ex.Message}");
                throw;
            }
        }

        public async Task<HrFeedbackFormResponseResponseDto> CreateFormResponseAsync(SubmitHRFormResponseRequestDto dto)
        {
            try
            {
                if (!await _formRepo.FormExistsAsync(dto.FormId))
                    throw new KeyNotFoundException($"HR form {dto.FormId} not found");

                var response = new Hrfeedbackformresponse
                {
                    FormId = dto.FormId,
                    SubmittedByEmployeeId = dto.SubmittedByEmployeeId,
                    FormResponse = JsonSerializer.Serialize(dto.FormResponse),
                    Status = "Draft"
                };

                var responseId = await _formRepo.CreateFormResponseAsync(response);
                _logger.LogInformation($"HR form response created: {responseId}");

                return await GetFormResponseByIdAsync(responseId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating form response: {ex.Message}");
                throw;
            }
        }

        public async Task<HrFeedbackFormResponseResponseDto> GetFormResponseByIdAsync(int responseId)
        {
            try
            {
                var response = await _formRepo.GetFormResponseByIdAsync(responseId);
                if (response == null)
                    throw new KeyNotFoundException($"HR form response {responseId} not found");

                return MapResponseToResponseDto(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting form response by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesByFormAsync(int formId)
        {
            try
            {
                var responses = await _formRepo.GetResponsesByFormAsync(formId);
                return responses.Select(r => MapResponseToResponseDto(r)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting responses by form: {ex.Message}");
                throw;
            }
        }

        public async Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesBySubmitterAsync(int employeeId)
        {
            try
            {
                var responses = await _formRepo.GetResponsesBySubmitterAsync(employeeId);
                return responses.Select(r => MapResponseToResponseDto(r)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting responses by submitter: {ex.Message}");
                throw;
            }
        }

        public async Task<List<HrFeedbackFormResponseResponseDto>> GetResponsesByStatusAsync(string status)
        {
            try
            {
                var responses = await _formRepo.GetResponsesByStatusAsync(status);
                return responses.Select(r => MapResponseToResponseDto(r)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting responses by status: {ex.Message}");
                throw;
            }
        }

        public async Task<List<HrFeedbackFormResponseResponseDto>> GetSubmittedResponsesAsync()
        {
            try
            {
                var responses = await _formRepo.GetSubmittedResponsesAsync();
                return responses.Select(r => MapResponseToResponseDto(r)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting submitted responses: {ex.Message}");
                throw;
            }
        }

        public async Task<List<HrFeedbackFormResponseResponseDto>> GetPendingReviewResponsesAsync()
        {
            try
            {
                var responses = await _formRepo.GetPendingReviewResponsesAsync();
                return responses.Select(r => MapResponseToResponseDto(r)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting pending review responses: {ex.Message}");
                throw;
            }
        }

        public async Task<HrFeedbackFormResponseResponseDto> UpdateFormResponseAsync(int responseId, UpdateHRFormResponseRequestDto dto)
        {
            try
            {
                var response = await _formRepo.GetFormResponseByIdAsync(responseId);
                if (response == null)
                    throw new KeyNotFoundException($"HR form response {responseId} not found");

                if (response.Status != "Draft")
                    throw new InvalidOperationException($"Cannot edit response in {response.Status} status");

                response.FormResponse = JsonSerializer.Serialize(dto.FormResponse);

                await _formRepo.UpdateFormResponseAsync(response);
                _logger.LogInformation($"HR form response updated: {responseId}");

                return await GetFormResponseByIdAsync(responseId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating form response: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> SubmitFormResponseAsync(int responseId)
        {
            try
            {
                var result = await _formRepo.UpdateResponseStatusAsync(responseId, "Submitted");
                if (result)
                    _logger.LogInformation($"HR form response submitted: {responseId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error submitting form response: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> SetHRReviewAsync(int responseId, string hrComments, int reviewedByHRId)
        {
            try
            {
                var result = await _formRepo.SetHRReviewAsync(responseId, hrComments, reviewedByHRId);
                if (result)
                    _logger.LogInformation($"HR review set: {responseId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error setting HR review: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteFormResponseAsync(int responseId)
        {
            try
            {
                var result = await _formRepo.DeleteFormResponseAsync(responseId);
                if (result)
                    _logger.LogInformation($"HR form response deleted: {responseId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting form response: {ex.Message}");
                throw;
            }
        }

        private HrFeedbackFormResponseDto MapFormToResponseDto(Hrfeedbackform form)
        {
            return new HrFeedbackFormResponseDto
            {
                FormId = form.FormId,
                FormName = form.FormName ?? "Unknown",
                FormDescription = form.FormDescription ?? "N/A",
                FormType = form.FormType ?? "Unknown",
                CreatedByHRId = form.CreatedByHrid,
                CreatedByHRName = form.CreatedByHr != null
                    ? $"{form.CreatedByHr.EmployeeId}"
                    : "Unknown",
                Status = form.Status ?? "Draft",
                CreatedAt = form.CreatedAt,
                Deadline = form.Deadline,
                TotalResponsesCount = form.Hrfeedbackformresponses?.Count ?? 0,
                SubmittedResponsesCount = form.Hrfeedbackformresponses?.Count(r => r.Status == "Submitted") ?? 0
            };
        }

        private HrFeedbackFormResponseResponseDto MapResponseToResponseDto(Hrfeedbackformresponse response)
        {
            var formResponse = new Dictionary<string, object>();
            if (!string.IsNullOrEmpty(response.FormResponse))
            {
                try
                {
                    formResponse = JsonSerializer.Deserialize<Dictionary<string, object>>(response.FormResponse) ?? new Dictionary<string, object>();
                }
                catch { }
            }

            return new HrFeedbackFormResponseResponseDto
            {
                ResponseId = response.ResponseId,
                FormId = response.FormId,
                FormName = response.Form?.FormName ?? "Unknown",
                SubmittedByEmployeeId = response.SubmittedByEmployeeId,
                SubmitterName = response.SubmittedByEmployee != null
                    ? $"{response.SubmittedByEmployee.EmployeeId}"
                    : "Unknown",
                FormResponse = formResponse,
                Status = response.Status ?? "Draft",
                HRReviewComments = response.HrreviewComments ?? "N/A",
                ReviewedByHRId = response.ReviewedByHrid,
                ReviewedByHRName = response.ReviewedByHr != null
                    ? $"{response.ReviewedByHr.EmployeeId}"
                    : "Unknown",
                CreatedAt = response.CreatedAt,
                SubmittedAt = response.SubmittedAt,
                ReviewedAt = response.ReviewedAt
            };
        }

        public async Task<DistributeFormResponse> DistributeFormAsync(int formId, List<int> employeeIds)
        {
            try
            {
                if (employeeIds == null || employeeIds.Count == 0)
                    throw new ArgumentException("At least one employee must be selected");

                var form = await _formRepo.GetFormByIdAsync(formId);
                if (form == null)
                    throw new KeyNotFoundException($"Form with ID {formId} not found");

                var success = await _formRepo.DistributeFormAsync(formId, employeeIds);

                if (!success)
                    throw new Exception("Failed to distribute form");

                _logger.LogInformation($"Form {formId} distributed to {employeeIds.Count} employees");

                return new DistributeFormResponse
                {
                    Success = true,
                    FormId = formId,
                    EmployeeCount = employeeIds.Count,
                    Message = $"Form distributed to {employeeIds.Count} employees"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error distributing form: {ex.Message}");
                throw;
            }
        }
    }
}

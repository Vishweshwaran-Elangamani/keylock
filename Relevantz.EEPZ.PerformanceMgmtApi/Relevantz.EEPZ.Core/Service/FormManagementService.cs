using FluentValidation;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class FormManagementService : IFormManagementService
    {
        private readonly IFormManagementRepository _repository;
       private readonly IValidator<CreateFormRequestDto> _createFormValidator;

public FormManagementService(
    IFormManagementRepository repository,
    IValidator<CreateFormRequestDto> createFormValidator)
{
    _repository = repository;
    _createFormValidator = createFormValidator;
}



        public async Task<ApiResponse<FormResponseDto>> CreateFormAsync(CreateFormRequestDto request)
        {
            var validation = await _createFormValidator.ValidateAsync(request);
if (!validation.IsValid)
{
    return ApiResponse<FormResponseDto>.ErrorResponse(
        "Validation failed: " + string.Join("; ", validation.Errors.Select(e => e.ErrorMessage))
    );
}
            try
            {
                var creator = await _repository.GetUserWithEmployeeAsync(request.CreatedBy);
                if (creator == null)
                    return ApiResponse<FormResponseDto>.ErrorResponse("User not found");

                var creatorDetails = await _repository.GetEmployeeDetailsWithRoleAsync(creator.EmployeeId);
                if (creatorDetails == null || creatorDetails.Role == null ||
                    !string.Equals(creatorDetails.Role.RoleCode, "HR", StringComparison.OrdinalIgnoreCase))
                {
                    return ApiResponse<FormResponseDto>.ErrorResponse("Only HR users can create forms.");
                }

                

               

                var form = new Assessmentform
                {
                    Name = request.Name ?? string.Empty,
                    Type = request.Type ?? string.Empty,
                    DeliveryEnablement = request.DeliveryEnablement ?? string.Empty,
                    CreatedBy = request.CreatedBy,
                    CreatedAt = DateTime.UtcNow
                };

                await _repository.AddFormAsync(form);

                var competencies = request.Competencies.Select(c => new Competency
                {
                    FormId = form.FormId,
                    Name = c.Name,
                    Description = c.Description,
                    DisplayOrder = c.DisplayOrder ?? 0
                }).ToList();

                await _repository.AddCompetenciesAsync(competencies);

                var createdForm = await _repository.GetFormByIdWithCompetenciesAsync(form.FormId);
                var response = MapToFormResponse(createdForm!);
                return ApiResponse<FormResponseDto>.SuccessResponse(response, "Form created successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<FormResponseDto>.ErrorResponse($"Error creating form: {ex.Message}");
            }
        }

        public async Task<ApiResponse<FormResponseDto>> UpdateFormAsync(int formId, CreateFormRequestDto request)
        {
            if (formId <= 0)
    return ApiResponse<FormResponseDto>.ErrorResponse("Invalid formId");

var validation = await _createFormValidator.ValidateAsync(request);
if (!validation.IsValid)
{
    return ApiResponse<FormResponseDto>.ErrorResponse(
        "Validation failed: " + string.Join("; ", validation.Errors.Select(e => e.ErrorMessage))
    );
}
            try
            {
                var form = await _repository.GetFormByIdWithCompetenciesAsync(formId);
                if (form == null)
                    return ApiResponse<FormResponseDto>.ErrorResponse("Form not found");

                var creator = await _repository.GetUserWithEmployeeAsync(request.CreatedBy);
                if (creator == null)
                    return ApiResponse<FormResponseDto>.ErrorResponse("User not found");

                var creatorDetails = await _repository.GetEmployeeDetailsWithRoleAsync(creator.EmployeeId);
                if (creatorDetails == null || creatorDetails.Role == null ||
                    !string.Equals(creatorDetails.Role.RoleCode, "HR", StringComparison.OrdinalIgnoreCase))
                {
                    return ApiResponse<FormResponseDto>.ErrorResponse("Only HR users can update forms.");
                }


                form.Name = request.Name ?? string.Empty;
                form.Type = request.Type ?? string.Empty;
                form.DeliveryEnablement = request.DeliveryEnablement ?? string.Empty;
                form.CreatedBy = request.CreatedBy;
                form.CreatedAt = DateTime.UtcNow;

                await _repository.DeleteCompetenciesByFormIdAsync(formId);

                var newCompetencies = request.Competencies.Select(c => new Competency
                {
                    FormId = form.FormId,
                    Name = c.Name,
                    Description = c.Description,
                    DisplayOrder = c.DisplayOrder ?? 0
                }).ToList();

                await _repository.AddCompetenciesAsync(newCompetencies);

                var updatedForm = await _repository.GetFormByIdWithCompetenciesAsync(formId);
                var response = new FormResponseDto
                {
                    FormId = updatedForm!.FormId,
                    Name = updatedForm.Name ?? string.Empty,
                    Type = updatedForm.Type ?? string.Empty,
                    DeliveryEnablement = updatedForm.DeliveryEnablement ?? string.Empty,
                    CreatedBy = updatedForm.CreatedBy ?? 0,
                    CreatedByName = updatedForm.CreatedByNavigation?.Email ?? string.Empty,
                    CreatedAt = updatedForm.CreatedAt ?? DateTime.UtcNow,
                    CompetencyCount = updatedForm.Competencies?.Count ?? 0,
                    Competencies = updatedForm.Competencies?.Select(c => new CompetencyResponseDto
                    {
                        CompetencyId = c.CompetencyId,
                        Name = c.Name ?? string.Empty,
                        Description = c.Description ?? string.Empty,
                        DisplayOrder = c.DisplayOrder ?? 0
                    }).ToList() ?? new()
                };
                return ApiResponse<FormResponseDto>.SuccessResponse(response, "Form updated successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<FormResponseDto>.ErrorResponse($"Error updating form: {ex.Message}");
            }
        }

        public async Task<ApiResponse<FormResponseDto>> GetFormByIdAsync(int formId)
        {
            try
            {
                var form = await _repository.GetFormByIdWithCompetenciesAsync(formId);
                if (form == null)
                    return ApiResponse<FormResponseDto>.ErrorResponse("Form not found");

                var response = MapToFormResponse(form);
                return ApiResponse<FormResponseDto>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                return ApiResponse<FormResponseDto>.ErrorResponse($"Error fetching form: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<FormResponseDto>>> GetAllFormsAsync()
        {
            try
            {
                var forms = await _repository.GetAllFormsWithDetailsAsync();
                if (!forms.Any())
                    return ApiResponse<List<FormResponseDto>>.ErrorResponse("No forms found");

                var response = forms.Select(f => MapToFormResponse(f)).ToList();
                return ApiResponse<List<FormResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<FormResponseDto>>.ErrorResponse($"Error fetching forms: {ex.Message}");
            }
        }

        public async Task<ApiResponse<bool>> DeleteFormAsync(int formId)
        {
            try
            {
                var form = await _repository.GetFormForDeleteAsync(formId);
                if (form == null)
                    return ApiResponse<bool>.ErrorResponse("Form not found");

                if (form.Assignments.Any())
                    return ApiResponse<bool>.ErrorResponse("Cannot delete form with active assignments");

                await _repository.DeleteFormAsync(form);
                return ApiResponse<bool>.SuccessResponse(true, "Form deleted successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error deleting form: {ex.Message}");
            }
        }
        private FormResponseDto MapToFormResponse(Assessmentform form)
        {
            string creatorName = form.CreatedByNavigation?.Email ?? "Unknown";

            return new FormResponseDto
            {
                FormId = form.FormId,
                Name = form.Name ?? string.Empty,
                Type = form.Type ?? string.Empty,
                DeliveryEnablement = form.DeliveryEnablement ?? string.Empty,
                CreatedBy = form.CreatedBy ?? 0,
                CreatedByName = creatorName,
                CreatedAt = form.CreatedAt,
                CompetencyCount = form.Competencies?.Count ?? 0,
                Competencies = form.Competencies?.Select(c => new CompetencyResponseDto
                {
                    CompetencyId = c.CompetencyId,
                    Name = c.Name ?? string.Empty,
                    Description = c.Description ?? string.Empty,
                    DisplayOrder = c.DisplayOrder ?? 0
                }).OrderBy(c => c.DisplayOrder).ToList() ?? new List<CompetencyResponseDto>()
            };
        }
    }
}

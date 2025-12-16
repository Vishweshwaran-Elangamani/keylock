using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Implementations
{

    public class FormManagementService : IFormManagementService
    {
        private readonly EEPZDbContext _context;

        public FormManagementService(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<FormResponseDto>> CreateFormAsync(CreateFormRequestDto request)
        {
            try
            {

                var creator = await _context.Userauthentications
                    .Include(u => u.Employee)
                    .FirstOrDefaultAsync(u => u.UserId == request.CreatedBy);

                if (creator == null)
                    return ApiResponse<FormResponseDto>.ErrorResponse("User not found");

                var creatorDetails = await _context.Employeedetailsmasters
                    .Include(d => d.Role)
                    .FirstOrDefaultAsync(d => d.EmployeeId == creator.EmployeeId);

                if (creatorDetails == null || creatorDetails.Role == null ||
                    !string.Equals(creatorDetails.Role.RoleCode, "HR", StringComparison.OrdinalIgnoreCase))
                {
                    return ApiResponse<FormResponseDto>.ErrorResponse("Only HR users can create forms.");
                }

                if (request.Competencies == null || !request.Competencies.Any())
                    return ApiResponse<FormResponseDto>.ErrorResponse("At least one competency is required");

                if (string.IsNullOrWhiteSpace(request.Name))
                    return ApiResponse<FormResponseDto>.ErrorResponse("Form name is required");

                var form = new Assessmentform
                {
                    Name = request.Name ?? string.Empty,
                    Type = request.Type ?? string.Empty,
                    DeliveryEnablement = request.DeliveryEnablement ?? string.Empty,
                    CreatedBy = request.CreatedBy,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Assessmentforms.Add(form);
                await _context.SaveChangesAsync();

                var competencies = request.Competencies.Select(c => new Competency
                {
                    FormId = form.FormId,
                    Name = c.Name,
                    Description = c.Description,
                    DisplayOrder = c.DisplayOrder ?? 0
                }).ToList();

                _context.Competencies.AddRange(competencies);
                await _context.SaveChangesAsync();

                var createdForm = await _context.Assessmentforms
                    .Include(f => f.CreatedByNavigation)
                    .Include(f => f.Competencies)
                    .FirstOrDefaultAsync(f => f.FormId == form.FormId);

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
            try
            {

                var form = await _context.Assessmentforms
                    .Include(f => f.Competencies)
                    .FirstOrDefaultAsync(f => f.FormId == formId);

                if (form == null)
                    return ApiResponse<FormResponseDto>.ErrorResponse("Form not found");

                var creator = await _context.Userauthentications
                    .Include(u => u.Employee)
                    .FirstOrDefaultAsync(u => u.UserId == request.CreatedBy);

                if (creator == null)
                    return ApiResponse<FormResponseDto>.ErrorResponse("User not found");

                var creatorDetails = await _context.Employeedetailsmasters
                    .Include(d => d.Role)
                    .FirstOrDefaultAsync(d => d.EmployeeId == creator.EmployeeId);

                if (creatorDetails == null || creatorDetails.Role == null ||
                    !string.Equals(creatorDetails.Role.RoleCode, "HR", StringComparison.OrdinalIgnoreCase))
                {
                    return ApiResponse<FormResponseDto>.ErrorResponse("Only HR users can update forms.");
                }

                if (request.Competencies == null || !request.Competencies.Any())
                    return ApiResponse<FormResponseDto>.ErrorResponse("At least one competency is required");

                form.Name = request.Name ?? string.Empty;
                form.Type = request.Type ?? string.Empty;
                form.DeliveryEnablement = request.DeliveryEnablement ?? string.Empty;
                form.CreatedBy = request.CreatedBy;
                form.CreatedAt = DateTime.UtcNow;

                _context.Competencies.RemoveRange(form.Competencies);

                var newCompetencies = request.Competencies.Select(c => new Competency
                {
                    FormId = form.FormId,
                    Name = c.Name,
                    Description = c.Description,
                    DisplayOrder = c.DisplayOrder ?? 0
                }).ToList();

                _context.Competencies.AddRange(newCompetencies);
                await _context.SaveChangesAsync();

                var updatedForm = await _context.Assessmentforms
                    .Include(f => f.CreatedByNavigation)
                    .Include(f => f.Competencies)
                    .FirstOrDefaultAsync(f => f.FormId == form.FormId);

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
                var form = await _context.Assessmentforms
                    .Include(f => f.CreatedByNavigation)
                    .Include(f => f.Competencies)
                    .FirstOrDefaultAsync(f => f.FormId == formId);

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
                var forms = await _context.Assessmentforms
                    .Include(f => f.CreatedByNavigation)
                    .Include(f => f.Competencies)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();

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

        public async Task<ApiResponse<List<FormResponseDto>>> GetFormsByTypeAsync(string formType)
        {
            try
            {
                var forms = await _context.Assessmentforms
                    .Include(f => f.CreatedByNavigation)
                    .Include(f => f.Competencies)
                    .Where(f => f.Type == formType)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();

                if (!forms.Any())
                    return ApiResponse<List<FormResponseDto>>.ErrorResponse($"No forms found of type: {formType}");

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
                var form = await _context.Assessmentforms
                    .Include(f => f.Assignments)
                    .FirstOrDefaultAsync(f => f.FormId == formId);

                if (form == null)
                    return ApiResponse<bool>.ErrorResponse("Form not found");

                if (form.Assignments.Any())
                    return ApiResponse<bool>.ErrorResponse("Cannot delete form with active assignments");

                _context.Assessmentforms.Remove(form);
                await _context.SaveChangesAsync();

                return ApiResponse<bool>.SuccessResponse(true, "Form deleted successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error deleting form: {ex.Message}");
            }
        }

        public async Task<ApiResponse<bool>> DeleteDraftAsync(int assignmentId)
        {
            try
            {
                var draft = await _context.Assignments
                    .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId && a.Action == "Save as Draft");

                if (draft == null)
                    return ApiResponse<bool>.ErrorResponse("Draft not found");

                _context.Assignments.Remove(draft);
                await _context.SaveChangesAsync();

                return ApiResponse<bool>.SuccessResponse(true, "Draft deleted successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error deleting draft: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<FormResponseDto>>> GetFormsByCreatorAsync(int createdBy)
        {
            try
            {
                var forms = await _context.Assessmentforms
                    .Include(f => f.CreatedByNavigation)
                    .Include(f => f.Competencies)
                    .Where(f => f.CreatedBy == createdBy)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();

                if (!forms.Any())
                    return ApiResponse<List<FormResponseDto>>.ErrorResponse("No forms found for this creator");

                var response = forms.Select(f => MapToFormResponse(f)).ToList();
                return ApiResponse<List<FormResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<FormResponseDto>>.ErrorResponse($"Error fetching forms: {ex.Message}");
            }
        }

        public async Task<ApiResponse<FormResponseDto>> CloneFormAsync(int formIdToClone, int createdBy)
        {
            try
            {

                var originalForm = await _context.Assessmentforms
                    .Include(f => f.Competencies)
                    .FirstOrDefaultAsync(f => f.FormId == formIdToClone);

                if (originalForm == null)
                    return ApiResponse<FormResponseDto>.ErrorResponse("Original form not found");

                var creator = await _context.Userauthentications
                    .Include(u => u.Employee)
                    .FirstOrDefaultAsync(u => u.UserId == createdBy);

                if (creator == null)
                    return ApiResponse<FormResponseDto>.ErrorResponse("User not found");

                var creatorDetails = await _context.Employeedetailsmasters
                    .Include(d => d.Role)
                    .FirstOrDefaultAsync(d => d.EmployeeId == creator.EmployeeId);

                if (creatorDetails == null || creatorDetails.Role == null ||
                    !string.Equals(creatorDetails.Role.RoleCode, "HR", StringComparison.OrdinalIgnoreCase))
                {
                    return ApiResponse<FormResponseDto>.ErrorResponse("Only HR users can clone forms.");
                }

                var newForm = new Assessmentform
                {
                    Name = $"{originalForm.Name} (Copy)",
                    Type = originalForm.Type,
                    DeliveryEnablement = originalForm.DeliveryEnablement,
                    CreatedBy = createdBy,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Assessmentforms.Add(newForm);
                await _context.SaveChangesAsync();

                var newCompetencies = originalForm.Competencies.Select(c => new Competency
                {
                    FormId = newForm.FormId,
                    Name = c.Name,
                    Description = c.Description,
                    DisplayOrder = c.DisplayOrder
                }).ToList();

                _context.Competencies.AddRange(newCompetencies);
                await _context.SaveChangesAsync();

                var clonedForm = await _context.Assessmentforms
                    .Include(f => f.CreatedByNavigation)
                    .Include(f => f.Competencies)
                    .FirstOrDefaultAsync(f => f.FormId == newForm.FormId);

                var response = MapToFormResponse(clonedForm!);
                return ApiResponse<FormResponseDto>.SuccessResponse(response, "Form cloned successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<FormResponseDto>.ErrorResponse($"Error cloning form: {ex.Message}");
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

 
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class SelfAssessmentService : ISelfAssessmentService
    {
        private readonly ISelfAssessmentRepository _repository;
        private readonly IConfiguration _configuration;
        private readonly string _uploadBasePath;

        public SelfAssessmentService(ISelfAssessmentRepository repository, IConfiguration configuration)
        {
            _repository = repository;
            _configuration = configuration;
            
            var basePath = _configuration["FileStorage:BasePath"] ?? @"D:\Capstone\Backend Push\Backend\eepz\SharedUploads";
            _uploadBasePath = Path.Combine(basePath, "assessments");
            
            if (!Directory.Exists(_uploadBasePath))
            {
                Directory.CreateDirectory(_uploadBasePath);
            }
        }

        public async Task<ApiResponse<SelfAssessmentResponseDto>> SubmitSelfAssessmentAsync(SubmitSelfAssessmentRequestDto request)
        {
            await _repository.BeginTransactionAsync();
            try
            {
                var form = await _repository.GetFormWithCompetenciesAsync(request.FormId);
                if (form == null)
                    return ApiResponse<SelfAssessmentResponseDto>.ErrorResponse("Form not found");

                var userAuth = await _repository.GetUserByIdAsync(request.UserId);
                if (userAuth == null)
                    return ApiResponse<SelfAssessmentResponseDto>.ErrorResponse("User not found or inactive");

                var existingAssessment = await _repository.GetAssessmentForUpsertAsync(request.FormId, request.UserId);
                Selfassessment assessment;

                if (existingAssessment != null)
                {
                    existingAssessment.Status = request.Status;
                    existingAssessment.SubmittedAt = request.Status == "Submitted" ? DateTime.Now : existingAssessment.SubmittedAt;
                    assessment = existingAssessment;
                    await _repository.DeleteAssessmentDetailsAsync(existingAssessment.AssessmentId);
                }
                else
                {
                    assessment = new Selfassessment
                    {
                        FormId = request.FormId,
                        EmployeeId = request.UserId,
                        Status = request.Status,
                        SubmittedAt = request.Status == "Submitted" ? DateTime.Now : null
                    };
                    await _repository.UpsertSelfAssessmentAsync(assessment);
                }

                var details = request.AssessmentDetails.Select(d => new Assessmentdetail
                {
                    AssessmentId = assessment.AssessmentId,
                    CompetencyId = d.CompetencyId,
                    EmployeeRating = d.EmployeeRating,
                    EmployeeComments = d.EmployeeComments
                }).ToList();

                await _repository.AddAssessmentDetailsAsync(details);

                if (request.Attachments != null && request.Attachments.Any())
                {
                    await ProcessAttachmentsAsync(assessment.AssessmentId, request.UserId, request.Attachments);
                }

                if (request.Status == "Submitted")
                {
                    var assignment = await _repository.GetAssignmentWithProgressAsync(request.FormId, request.UserId);
                    var progress = assignment?.Formprogresstrackers.FirstOrDefault();
                    if (progress != null)
                    {
                        progress.SentToEmployee = true;
                        progress.EmployeeCompleted = true;
                        progress.SentToManager = true;
                        progress.LastUpdated = DateTime.Now;
                        await _repository.UpdateProgressTrackerAsync(progress);
                    }
                }

                await _repository.CommitTransactionAsync();

                var responseData = await GetSelfAssessmentAsync(assessment.AssessmentId);
                return responseData;
            }
            catch (Exception ex)
            {
                await _repository.RollbackTransactionAsync();
                return ApiResponse<SelfAssessmentResponseDto>.ErrorResponse($"Error submitting assessment: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<SelfAssessmentResponseDto>>> GetAssessmentsByUserAsync(int userId)
        {
            try
            {
                var assessments = await _repository.GetSelfAssessmentsByUserAsync(userId);
                if (assessments == null || !assessments.Any())
                {
                    return ApiResponse<List<SelfAssessmentResponseDto>>.SuccessResponse(new List<SelfAssessmentResponseDto>());
                }

                var dtoList = assessments.Select(a => new SelfAssessmentResponseDto
                {
                    AssessmentId = a.AssessmentId,
                    FormName = a.Form?.Name ?? $"Form #{a.FormId}",
                    Status = a.Status ?? string.Empty,
                    SubmittedAt = a.SubmittedAt
                }).ToList();

                return ApiResponse<List<SelfAssessmentResponseDto>>.SuccessResponse(dtoList);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<SelfAssessmentResponseDto>>.ErrorResponse($"Failed to retrieve assessments: {ex.Message}");
            }
        }

        public async Task<ApiResponse<SelfAssessmentResponseDto>> GetSelfAssessmentAsync(int assessmentId)
        {
            try
            {
                var assessment = await _repository.GetSelfAssessmentByIdWithDetailsAsync(assessmentId);
                if (assessment == null)
                    return ApiResponse<SelfAssessmentResponseDto>.ErrorResponse("Assessment not found");

                var response = MapToSelfAssessmentResponse(assessment);
                return ApiResponse<SelfAssessmentResponseDto>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                return ApiResponse<SelfAssessmentResponseDto>.ErrorResponse($"Error fetching assessment: {ex.Message}");
            }
        }

        public async Task<ApiResponse<SelfAssessmentResponseDto>> GetSelfAssessmentByFormAndUserAsync(int formId, int userId)
        {
            try
            {
                var assessment = await _repository.GetSelfAssessmentByFormAndUserWithDetailsAsync(formId, userId);
                if (assessment == null)
                    return ApiResponse<SelfAssessmentResponseDto>.ErrorResponse("Assessment not found");

                var response = MapToSelfAssessmentResponse(assessment);
                return ApiResponse<SelfAssessmentResponseDto>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                return ApiResponse<SelfAssessmentResponseDto>.ErrorResponse($"Error fetching assessment: {ex.Message}");
            }
        }

        public async Task<ApiResponse<ViewSubmittedFormsResponseDto>> GetAllSubmittedFormsAsync(string? status = null)
        {
            try
            {
                var assessments = await _repository.GetAllSelfAssessmentsWithDetailsAsync(status);

                var response = new ViewSubmittedFormsResponseDto
                {
                    TotalCount = assessments.Count,
                    SubmittedCount = assessments.Count(a => a.Status == "Submitted"),
                    DraftCount = assessments.Count(a => a.Status == "Draft"),
                    Assessments = assessments.Select(a => new SelfAssessmentSummaryDto
                    {
                        AssessmentId = a.AssessmentId,
                        FormId = a.FormId,
                        FormName = a.Form?.Name ?? "Unknown",
                        FormType = a.Form?.Type ?? "Unknown",
                        DeliveryEnablement = a.Form?.DeliveryEnablement ?? "Unknown",
                        UserId = a.EmployeeId,
                        UserName = a.Employee?.Email ?? "Unknown",
                        Email = a.Employee?.Email ?? "Unknown",
                        Status = a.Status ?? string.Empty,
                        SubmittedAt = a.SubmittedAt,
                        CompetencyCount = a.Assessmentdetails.Count
                    }).ToList()
                };

                return ApiResponse<ViewSubmittedFormsResponseDto>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                return ApiResponse<ViewSubmittedFormsResponseDto>.ErrorResponse($"Error fetching submitted forms: {ex.Message}");
            }
        }

        public async Task<ApiResponse<bool>> UpdateAssessmentStatusAsync(int assessmentId, string status)
        {
            try
            {
                var assessment = await _repository.GetAssessmentForStatusUpdateAsync(assessmentId);
                if (assessment == null)
                    return ApiResponse<bool>.ErrorResponse("Assessment not found");

                assessment.Status = status;
                if (status == "Submitted")
                {
                    assessment.SubmittedAt = DateTime.Now;
                }

                await _repository.SaveChangesAsync();
                return ApiResponse<bool>.SuccessResponse(true, "Status updated successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error updating status: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<AttachmentResponseDto>>> GetAssessmentAttachmentsAsync(int assessmentId)
        {
            try
            {
                var attachments = await _repository.GetAttachmentsByAssessmentIdAsync(assessmentId);

                var response = attachments.Select(a => new AttachmentResponseDto
                {
                    AttachmentId = a.AttachmentId,
                    FileName = a.FileName,
                    FilePath = a.FilePath,
                    FileType = a.FileType,
                    FileSize = a.FileSize,
                    AttachmentNote = a.AttachmentNote,
                    DisplayOrder = a.DisplayOrder,
                    UploadedAt = a.UploadedAt,
                    UploadedBy = a.UploadedBy
                }).ToList();

                return ApiResponse<List<AttachmentResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<AttachmentResponseDto>>.ErrorResponse($"Error fetching attachments: {ex.Message}");
            }
        }

        public async Task<ApiResponse<bool>> DeleteAttachmentAsync(int attachmentId)
        {
            try
            {
                var attachment = await _repository.GetAttachmentByIdAsync(attachmentId);
                if (attachment == null)
                    return ApiResponse<bool>.ErrorResponse("Attachment not found");

                if (!string.IsNullOrEmpty(attachment.FilePath))
                {
                    var basePath = _configuration["FileStorage:BasePath"] ?? @"D:\Capstone\Backend Push\Backend\eepz\SharedUploads";
                    var cleanPath = attachment.FilePath
                        .Replace("uploads\\", "", StringComparison.OrdinalIgnoreCase)
                        .Replace("uploads/", "", StringComparison.OrdinalIgnoreCase)
                        .TrimStart('\\', '/');
                    
                    var fullPath = Path.Combine(basePath, cleanPath);
                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                    }
                }

                await _repository.DeleteAttachmentAsync(attachmentId);
                return ApiResponse<bool>.SuccessResponse(true, "Attachment deleted successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error deleting attachment: {ex.Message}");
            }
        }

        private async Task ProcessAttachmentsAsync(int assessmentId, int userId, List<AttachmentRequestDto> attachments)
        {
            var savedAttachments = new List<Selfassessmentattachment>();

            foreach (var attachment in attachments)
            {
                string filePath = attachment.FilePath ?? string.Empty;

                if (!string.IsNullOrEmpty(attachment.Base64Content))
                {
                    filePath = await SaveFileFromBase64Async(assessmentId, attachment.FileName, attachment.Base64Content);
                }

                var dbAttachment = new Selfassessmentattachment
                {
                    AssessmentId = assessmentId,
                    UploadedBy = userId,
                    FileName = attachment.FileName,
                    FilePath = filePath,
                    FileType = attachment.FileType,
                    FileSize = attachment.FileSize,
                    AttachmentNote = attachment.AttachmentNote,
                    DisplayOrder = attachment.DisplayOrder ?? 0,
                    UploadedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                savedAttachments.Add(dbAttachment);
            }

            if (savedAttachments.Any())
            {
                await _repository.AddAttachmentsAsync(savedAttachments);
            }
        }

        private async Task<string> SaveFileFromBase64Async(int assessmentId, string fileName, string base64Content)
        {
            try
            {
                var base64Data = base64Content;
                if (base64Content.Contains(","))
                {
                    base64Data = base64Content.Split(',')[1];
                }

                var bytes = Convert.FromBase64String(base64Data);

                var assessmentDir = Path.Combine(_uploadBasePath, assessmentId.ToString());
                if (!Directory.Exists(assessmentDir))
                {
                    Directory.CreateDirectory(assessmentDir);
                }

                var fileExtension = Path.GetExtension(fileName);
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var fullPath = Path.Combine(assessmentDir, uniqueFileName);

                await File.WriteAllBytesAsync(fullPath, bytes);

                return Path.Combine("assessments", assessmentId.ToString(), uniqueFileName);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error saving file {fileName}: {ex.Message}");
            }
        }

        private SelfAssessmentResponseDto MapToSelfAssessmentResponse(Selfassessment assessment)
        {
            var userName = assessment.Employee?.Email ?? "Unknown";

            return new SelfAssessmentResponseDto
            {
                AssessmentId = assessment.AssessmentId,
                FormId = assessment.FormId,
                FormName = assessment.Form?.Name ?? "Unknown",
                UserId = assessment.EmployeeId,
                UserName = userName,
                Status = assessment.Status ?? string.Empty,
                SubmittedAt = assessment.SubmittedAt,
                Details = assessment.Assessmentdetails.Select(ad => new AssessmentDetailResponseDto
                {
                    DetailId = ad.DetailId,
                    CompetencyId = ad.CompetencyId,
                    CompetencyName = ad.Competency?.Name ?? "Unknown",
                    CompetencyDescription = ad.Competency?.Description,
                    EmployeeRating = ad.EmployeeRating,
                    EmployeeComments = ad.EmployeeComments
                }).ToList(),
                Attachments = assessment.Selfassessmentattachments?.Select(a => new AttachmentResponseDto
                {
                    AttachmentId = a.AttachmentId,
                    FileName = a.FileName,
                    FilePath = a.FilePath,
                    FileType = a.FileType,
                    FileSize = a.FileSize,
                    AttachmentNote = a.AttachmentNote,
                    DisplayOrder = a.DisplayOrder,
                    UploadedAt = a.UploadedAt,
                    UploadedBy = a.UploadedBy
                }).OrderBy(a => a.DisplayOrder).ToList() ?? new List<AttachmentResponseDto>()
            };
        }
    }
}

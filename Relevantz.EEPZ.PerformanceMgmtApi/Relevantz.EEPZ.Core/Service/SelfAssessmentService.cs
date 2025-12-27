using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class SelfAssessmentService : ISelfAssessmentService
    {
        private readonly ISelfAssessmentRepository _repository;
        private readonly IFileStorageService _fileStorage;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SelfAssessmentService> _logger;

        public SelfAssessmentService(
            ISelfAssessmentRepository repository,
            IFileStorageService fileStorage,
            IConfiguration configuration,
            ILogger<SelfAssessmentService> logger)
        {
            _repository = repository;
            _fileStorage = fileStorage;
            _configuration = configuration;
            _logger = logger;
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
                }

                await _repository.UpsertSelfAssessmentAsync(assessment);

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
                _logger.LogError(ex, "Error submitting assessment");
                return ApiResponse<SelfAssessmentResponseDto>.ErrorResponse($"Error submitting assessment: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<SelfAssessmentResponseDto>>> GetAssessmentsByUserAsync(int userId)
        {
            try
            {
                var assessments = await _repository.GetSelfAssessmentsByUserAsync(userId);

                if (assessments == null || !assessments.Any())
                    return ApiResponse<List<SelfAssessmentResponseDto>>.SuccessResponse(new List<SelfAssessmentResponseDto>());

                var dtoList = assessments.Select(a => new SelfAssessmentResponseDto
                {
                    AssessmentId = a.AssessmentId,
                    FormName = a.Form?.Name ?? $"Form {a.FormId}",
                    Status = a.Status ?? string.Empty,
                    SubmittedAt = a.SubmittedAt
                }).ToList();

                return ApiResponse<List<SelfAssessmentResponseDto>>.SuccessResponse(dtoList);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assessments for user {UserId}", userId);
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
                _logger.LogError(ex, "Error fetching assessment {AssessmentId}", assessmentId);
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
                _logger.LogError(ex, "Error fetching assessment for form {FormId} user {UserId}", formId, userId);
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
                _logger.LogError(ex, "Error fetching submitted forms");
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
                    assessment.SubmittedAt = DateTime.Now;

                await _repository.SaveChangesAsync();

                return ApiResponse<bool>.SuccessResponse(true, "Status updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating status for assessment {AssessmentId}", assessmentId);
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
                _logger.LogError(ex, "Error fetching attachments for assessment {AssessmentId}", assessmentId);
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

                // Delete file from MongoDB GridFS
                if (!string.IsNullOrEmpty(attachment.FilePath))
                {
                    var deleted = await _fileStorage.DeleteFileAsync(attachment.FilePath);
                    if (deleted)
                    {
                        _logger.LogInformation("File {FileId} deleted from MongoDB GridFS", attachment.FilePath);
                    }
                    else
                    {
                        _logger.LogWarning("File {FileId} not found in MongoDB GridFS during deletion", attachment.FilePath);
                    }
                }

                await _repository.DeleteAttachmentAsync(attachmentId);

                return ApiResponse<bool>.SuccessResponse(true, "Attachment deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting attachment {AttachmentId}", attachmentId);
                return ApiResponse<bool>.ErrorResponse($"Error deleting attachment: {ex.Message}");
            }
        }

        private async Task ProcessAttachmentsAsync(int assessmentId, int userId, List<AttachmentRequestDto> attachments)
        {
            var savedAttachments = new List<Selfassessmentattachment>();

            foreach (var attachment in attachments)
            {
                string fileId = attachment.FilePath ?? string.Empty;

                // Upload Base64 content to MongoDB GridFS
                if (!string.IsNullOrEmpty(attachment.Base64Content))
                {
                    fileId = await SaveFileFromBase64Async(
                        assessmentId,
                        attachment.FileName,
                        attachment.Base64Content,
                        attachment.FileType ?? "application/octet-stream");
                }

                var dbAttachment = new Selfassessmentattachment
                {
                    AssessmentId = assessmentId,
                    UploadedBy = userId,
                    FileName = attachment.FileName,
                    FilePath = fileId, // Store MongoDB ObjectId
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

        private async Task<string> SaveFileFromBase64Async(
            int assessmentId,
            string fileName,
            string base64Content,
            string contentType)
        {
            try
            {
                // Extract base64 data (remove data:xxx;base64, prefix if present)
                var base64Data = base64Content;
                if (base64Content.Contains(","))
                {
                    base64Data = base64Content.Split(',')[1];
                }

                var bytes = Convert.FromBase64String(base64Data);

                // Create temporary IFormFile from bytes
                using var memoryStream = new MemoryStream(bytes);
                var formFile = new FormFileWrapper(memoryStream, fileName, contentType, bytes.Length);

                // Upload to MongoDB GridFS
                var fileId = await _fileStorage.SaveFileAsync(formFile, $"assessments/{assessmentId}");

                _logger.LogInformation(
                    "File {FileName} uploaded to MongoDB GridFS with ID {FileId} for assessment {AssessmentId}",
                    fileName,
                    fileId,
                    assessmentId);

                return fileId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving file {FileName}", fileName);
                throw new Exception($"Error saving file '{fileName}': {ex.Message}");
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

    // Helper class to wrap byte array as IFormFile
    public class FormFileWrapper : Microsoft.AspNetCore.Http.IFormFile
    {
        private readonly Stream _stream;
        private readonly string _fileName;
        private readonly string _contentType;
        private readonly long _length;

        public FormFileWrapper(Stream stream, string fileName, string contentType, long length)
        {
            _stream = stream;
            _fileName = fileName;
            _contentType = contentType;
            _length = length;
        }

        public string ContentType => _contentType;
        public string ContentDisposition => $"form-data; name=\"file\"; filename=\"{_fileName}\"";
        public Microsoft.AspNetCore.Http.IHeaderDictionary Headers => new Microsoft.AspNetCore.Http.HeaderDictionary();
        public long Length => _length;
        public string Name => "file";
        public string FileName => _fileName;

        public void CopyTo(Stream target) => _stream.CopyTo(target);
        public Task CopyToAsync(Stream target, CancellationToken cancellationToken = default) 
            => _stream.CopyToAsync(target, cancellationToken);
        public Stream OpenReadStream() => _stream;
    }
}

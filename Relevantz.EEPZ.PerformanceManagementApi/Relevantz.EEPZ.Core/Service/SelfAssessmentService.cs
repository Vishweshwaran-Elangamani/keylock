using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class SelfAssessmentService : ISelfAssessmentService
    {
        private readonly EEPZDbContext _context;
        private readonly string _uploadBasePath; // Configure in appsettings.json

        public SelfAssessmentService(EEPZDbContext context)
        {
            _context = context;
            // TODO: Get from configuration
            _uploadBasePath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "assessments");
            
            // Ensure directory exists
            if (!Directory.Exists(_uploadBasePath))
            {
                Directory.CreateDirectory(_uploadBasePath);
            }
        }

        public async Task<ApiResponse<SelfAssessmentResponseDto>> SubmitSelfAssessmentAsync(SubmitSelfAssessmentRequestDto request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var form = await _context.Assessmentforms
                    .Include(f => f.Competencies)
                    .FirstOrDefaultAsync(f => f.FormId == request.FormId);

                if (form == null)
                    return ApiResponse<SelfAssessmentResponseDto>.ErrorResponse("Form not found");

                var userAuth = await _context.Userauthentications.FindAsync(request.UserId);
                if (userAuth == null)
                    return ApiResponse<SelfAssessmentResponseDto>.ErrorResponse("User not found or inactive");

                var existingAssessment = await _context.Selfassessments
                    .FirstOrDefaultAsync(sa => sa.FormId == request.FormId && sa.EmployeeId == request.UserId);

                Selfassessment assessment;

                if (existingAssessment != null)
                {
                    existingAssessment.Status = request.Status;
                    existingAssessment.SubmittedAt = request.Status == "Submitted" ? DateTime.Now : existingAssessment.SubmittedAt;
                    assessment = existingAssessment;

                    // Remove existing details
                    var existingDetails = await _context.Assessmentdetails
                        .Where(ad => ad.AssessmentId == existingAssessment.AssessmentId)
                        .ToListAsync();
                    _context.Assessmentdetails.RemoveRange(existingDetails);
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
                    _context.Selfassessments.Add(assessment);
                }

                await _context.SaveChangesAsync();

                // ✅ Save assessment details
                var details = request.AssessmentDetails.Select(d => new Assessmentdetail
                {
                    AssessmentId = assessment.AssessmentId,
                    CompetencyId = d.CompetencyId,
                    EmployeeRating = d.EmployeeRating,
                    EmployeeComments = d.EmployeeComments
                }).ToList();

                _context.Assessmentdetails.AddRange(details);
                await _context.SaveChangesAsync();

                // ✅ NEW: Handle attachments
                if (request.Attachments != null && request.Attachments.Any())
                {
                    await ProcessAttachmentsAsync(assessment.AssessmentId, request.UserId, request.Attachments);
                }

                // ✅ Update progress tracker if submitted
                if (request.Status == "Submitted")
                {
                    var assignment = await _context.Assignments
                        .Include(a => a.Formprogresstrackers)
                        .FirstOrDefaultAsync(a => a.FormId == request.FormId && a.EmployeeId == request.UserId);

                    var progress = assignment?.Formprogresstrackers.FirstOrDefault();
                    if (progress != null)
                    {
                        progress.SentToEmployee = true;
                        progress.EmployeeCompleted = true;
                        progress.SentToManager = true;
                        progress.LastUpdated = DateTime.Now;
                        await _context.SaveChangesAsync();
                    }
                }

                await transaction.CommitAsync();

                var responseData = await GetSelfAssessmentAsync(assessment.AssessmentId);
                return responseData;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ApiResponse<SelfAssessmentResponseDto>.ErrorResponse($"Error submitting assessment: {ex.Message}");
            }
        }

        // ✅ NEW: Process and save attachments
        private async Task ProcessAttachmentsAsync(int assessmentId, int userId, List<AttachmentRequestDto> attachments)
        {
            var savedAttachments = new List<Selfassessmentattachment>();

            foreach (var attachment in attachments)
            {
                string filePath = attachment.FilePath ?? string.Empty;

                // If Base64 content is provided, save the file
                if (!string.IsNullOrEmpty(attachment.Base64Content))
                {
                    filePath = await SaveFileFromBase64Async(
                        assessmentId, 
                        attachment.FileName, 
                        attachment.Base64Content
                    );
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
                _context.Selfassessmentattachments.AddRange(savedAttachments);
                await _context.SaveChangesAsync();
            }
        }

        // ✅ NEW: Save Base64 file to disk
        private async Task<string> SaveFileFromBase64Async(int assessmentId, string fileName, string base64Content)
        {
            try
            {
                // Remove data URL prefix if present (e.g., "data:image/png;base64,")
                var base64Data = base64Content;
                if (base64Content.Contains(","))
                {
                    base64Data = base64Content.Split(',')[1];
                }

                var bytes = Convert.FromBase64String(base64Data);
                
                // Create assessment-specific directory
                var assessmentDir = Path.Combine(_uploadBasePath, assessmentId.ToString());
                if (!Directory.Exists(assessmentDir))
                {
                    Directory.CreateDirectory(assessmentDir);
                }

                // Generate unique filename
                var fileExtension = Path.GetExtension(fileName);
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var fullPath = Path.Combine(assessmentDir, uniqueFileName);

                await File.WriteAllBytesAsync(fullPath, bytes);

                // Return relative path for storage
                return Path.Combine("uploads", "assessments", assessmentId.ToString(), uniqueFileName);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error saving file {fileName}: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<SelfAssessmentResponseDto>>> GetAssessmentsByUserAsync(int userId)
        {
            var result = new ApiResponse<List<SelfAssessmentResponseDto>>();

            try
            {
                var assessments = await _context.Selfassessments
                    .Where(a => a.EmployeeId == userId)
                    .Include(a => a.Form)
                    .ToListAsync();

                if (assessments == null || !assessments.Any())
                {
                    result.Success = true;
                    result.Data = new List<SelfAssessmentResponseDto>();
                    return result;
                }

                var dtoList = assessments.Select(a => new SelfAssessmentResponseDto
                {
                    AssessmentId = a.AssessmentId,
                    FormName = a.Form?.Name ?? $"Form #{a.FormId}",
                    Status = a.Status ?? string.Empty,
                    SubmittedAt = a.SubmittedAt
                }).ToList();

                result.Success = true;
                result.Data = dtoList;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.Errors.Add("Failed to retrieve assessments.");
                result.Errors.Add(ex.Message);
            }

            return result;
        }

        public async Task<ApiResponse<SelfAssessmentResponseDto>> GetSelfAssessmentAsync(int assessmentId)
        {
            try
            {
                var assessment = await _context.Selfassessments
                    .Include(sa => sa.Form)
                    .Include(sa => sa.Employee)
                    .Include(sa => sa.Assessmentdetails)
                        .ThenInclude(ad => ad.Competency)
                    .Include(sa => sa.Selfassessmentattachments) // ✅ Include attachments
                    .FirstOrDefaultAsync(sa => sa.AssessmentId == assessmentId);

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
                var assessment = await _context.Selfassessments
                    .Include(sa => sa.Form)
                    .Include(sa => sa.Employee)
                    .Include(sa => sa.Assessmentdetails)
                        .ThenInclude(ad => ad.Competency)
                    .Include(sa => sa.Selfassessmentattachments) // ✅ Include attachments
                    .FirstOrDefaultAsync(sa => sa.FormId == formId && sa.EmployeeId == userId);

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
                var query = _context.Selfassessments
                    .Include(sa => sa.Form)
                    .Include(sa => sa.Employee)
                    .Include(sa => sa.Assessmentdetails)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                    query = query.Where(sa => sa.Status == status);

                var assessments = await query.OrderByDescending(sa => sa.SubmittedAt).ToListAsync();

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
                var assessment = await _context.Selfassessments.FindAsync(assessmentId);
                if (assessment == null)
                {
                    return ApiResponse<bool>.ErrorResponse("Assessment not found");
                }

                assessment.Status = status;
                if (status == "Submitted")
                {
                    assessment.SubmittedAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                return ApiResponse<bool>.SuccessResponse(true, "Status updated successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error updating status: {ex.Message}");
            }
        }

        // ✅ NEW: Get attachments for specific assessment
        public async Task<ApiResponse<List<AttachmentResponseDto>>> GetAssessmentAttachmentsAsync(int assessmentId)
        {
            try
            {
                var attachments = await _context.Selfassessmentattachments
                    .Where(a => a.AssessmentId == assessmentId)
                    .OrderBy(a => a.DisplayOrder)
                    .ThenBy(a => a.UploadedAt)
                    .ToListAsync();

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

        // ✅ NEW: Delete attachment
        public async Task<ApiResponse<bool>> DeleteAttachmentAsync(int attachmentId)
        {
            try
            {
                var attachment = await _context.Selfassessmentattachments.FindAsync(attachmentId);
                if (attachment == null)
                {
                    return ApiResponse<bool>.ErrorResponse("Attachment not found");
                }

                // Delete physical file if exists
                if (!string.IsNullOrEmpty(attachment.FilePath))
                {
                    var fullPath = Path.Combine(Directory.GetCurrentDirectory(), attachment.FilePath);
                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                    }
                }

                _context.Selfassessmentattachments.Remove(attachment);
                await _context.SaveChangesAsync();

                return ApiResponse<bool>.SuccessResponse(true, "Attachment deleted successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error deleting attachment: {ex.Message}");
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
                // ✅ NEW: Map attachments
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
                }).OrderBy(a => a.DisplayOrder).ToList()
            };
        }
    }
}

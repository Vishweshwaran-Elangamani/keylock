using System.IO;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Core.IService;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class AssessmentDetailsService : IAssessmentDetailsService
    {
        private readonly IAssessmentDetailsRepository _repository;
        private readonly IFileStorageService _fileStorage;
        private readonly ILogger<AssessmentDetailsService> _logger;

        public AssessmentDetailsService(
            IAssessmentDetailsRepository repository,
            IFileStorageService fileStorage,
            ILogger<AssessmentDetailsService> logger)
        {
            _repository = repository;
            _fileStorage = fileStorage;
            _logger = logger;
        }

        public async Task<object> GetAllDetailsAsync()
        {
            var profiles = await _repository.GetAllUserProfilesAsync();
            var userAuths = await _repository.GetAllUserAuthenticationsAsync();
            var projects = await _repository.GetAllProjectsAsync();
            var projectEmployees = await _repository.GetAllProjectEmployeesAsync();
            var selfAssessments = await _repository.GetAllSelfAssessmentsWithDetailsAsync();
            var reviews = await _repository.GetAllAssessmentReviewsAsync();
            var assignments = await _repository.GetAssignmentsWithFormCompetenciesAsync();
            var attachments = await _repository.GetAllSelfAssessmentAttachmentsAsync();

            var results = new List<object>();

            foreach (var assignment in assignments)
            {
                var userAuth = userAuths.FirstOrDefault(ua => ua.UserId == assignment.EmployeeId);
                if (userAuth == null) continue;

                var profile = profiles.FirstOrDefault(p => p.EmployeeId == userAuth.EmployeeId);
                if (profile == null) continue;

                var pe = projectEmployees
                    .Where(x => x.EmployeeId == profile.EmployeeId && x.IsPrimary == true)
                    .FirstOrDefault();

                var project = pe != null
                    ? projects.FirstOrDefault(pj => pj.ProjectId == pe.ProjectId)
                    : null;

                var selfAssessment = selfAssessments
                    .Where(sa => sa.EmployeeId == assignment.EmployeeId && sa.FormId == assignment.FormId)
                    .OrderByDescending(sa => sa.SubmittedAt)
                    .FirstOrDefault();

                var l1Auth = project?.L1approverEmployeeId.HasValue == true
                    ? userAuths.FirstOrDefault(ua => ua.EmployeeId == project.L1approverEmployeeId)
                    : null;

                var l2Auth = project?.L2approverEmployeeId.HasValue == true
                    ? userAuths.FirstOrDefault(ua => ua.EmployeeId == project.L2approverEmployeeId)
                    : null;

                bool hasL1 = l1Auth != null;
                bool hasL2 = l2Auth != null;

                var competencies = new List<object>();

                if (selfAssessment != null && selfAssessment.Assessmentdetails != null && selfAssessment.Assessmentdetails.Any())
                {
                    foreach (var detail in selfAssessment.Assessmentdetails)
                    {
                        var l1Review = hasL1
                            ? reviews.FirstOrDefault(r => r.DetailId == detail.DetailId && r.ReviewerId == l1Auth.UserId)
                            : null;

                        var l2Review = hasL2
                            ? reviews.FirstOrDefault(r => r.DetailId == detail.DetailId && r.ReviewerId == l2Auth.UserId)
                            : null;

                        string status = (detail.EmployeeRating == null && string.IsNullOrEmpty(detail.EmployeeComments))
                            ? "Pending"
                            : (!hasL1 && !hasL2)
                                ? "Pending Review"
                                : (hasL1 && l1Review == null) || (hasL2 && l2Review == null)
                                    ? "Pending"
                                    : "Assessment Completed";

                        string l1ReviewerName = "No L1";
                        if (hasL1 && project?.L1approverEmployeeId.HasValue == true)
                        {
                            var l1Profile = profiles.FirstOrDefault(p => p.EmployeeId == project.L1approverEmployeeId);
                            l1ReviewerName = l1Profile != null
                                ? $"{l1Profile.FirstName ?? ""} {l1Profile.LastName ?? ""}".Trim()
                                : "L1 Reviewer";
                            if (string.IsNullOrEmpty(l1ReviewerName)) l1ReviewerName = "L1 Reviewer";
                        }

                        string l2ReviewerName = "No L2";
                        if (hasL2 && project?.L2approverEmployeeId.HasValue == true)
                        {
                            var l2Profile = profiles.FirstOrDefault(p => p.EmployeeId == project.L2approverEmployeeId);
                            l2ReviewerName = l2Profile != null
                                ? $"{l2Profile.FirstName ?? ""} {l2Profile.LastName ?? ""}".Trim()
                                : "L2 Reviewer";
                            if (string.IsNullOrEmpty(l2ReviewerName)) l2ReviewerName = "L2 Reviewer";
                        }

                        competencies.Add(new
                        {
                            CompetencyName = detail.Competency?.Name ?? "Unknown",
                            EmployeeRating = detail.EmployeeRating,
                            EmployeeComments = detail.EmployeeComments,
                            L1ReviewerName = l1ReviewerName,
                            L1Rating = l1Review?.Rating,
                            L1Comments = l1Review?.Comments,
                            L1ReviewStatus = l1Review?.ReviewStatus,
                            L2ReviewerName = l2ReviewerName,
                            L2Rating = l2Review?.Rating,
                            L2Comments = l2Review?.Comments,
                            L2ReviewStatus = l2Review?.ReviewStatus,
                            Status = status
                        });
                    }
                }
                else
                {
                    var formComps = assignment.Form?.Competencies ?? new List<Competency>();
                    foreach (var fc in formComps)
                    {
                        string l1ReviewerName = "No L1";
                        if (hasL1 && project?.L1approverEmployeeId.HasValue == true)
                        {
                            var l1Profile = profiles.FirstOrDefault(p => p.EmployeeId == project.L1approverEmployeeId);
                            l1ReviewerName = l1Profile != null
                                ? $"{l1Profile.FirstName ?? ""} {l1Profile.LastName ?? ""}".Trim()
                                : "No L1";
                        }

                        string l2ReviewerName = "No L2";
                        if (hasL2 && project?.L2approverEmployeeId.HasValue == true)
                        {
                            var l2Profile = profiles.FirstOrDefault(p => p.EmployeeId == project.L2approverEmployeeId);
                            l2ReviewerName = l2Profile != null
                                ? $"{l2Profile.FirstName ?? ""} {l2Profile.LastName ?? ""}".Trim()
                                : "No L2";
                        }

                        competencies.Add(new
                        {
                            CompetencyName = fc.Name ?? "Unknown",
                            EmployeeRating = (int?)null,
                            EmployeeComments = string.Empty,
                            L1ReviewerName = l1ReviewerName,
                            L1Rating = (int?)null,
                            L1Comments = string.Empty,
                            L1ReviewStatus = string.Empty,
                            L2ReviewerName = l2ReviewerName,
                            L2Rating = (int?)null,
                            L2Comments = string.Empty,
                            L2ReviewStatus = string.Empty,
                            Status = "Pending"
                        });
                    }
                }

                var assessmentAttachments = new List<object>();
                if (selfAssessment != null)
                {
                    var attList = attachments
                        .Where(a => a.AssessmentId == selfAssessment.AssessmentId)
                        .ToList();

                    foreach (var att in attList)
                    {
                        assessmentAttachments.Add(new
                        {
                            AttachmentId = att.AttachmentId,
                            FileName = att.FileName,
                            FileType = att.FileType,
                            FileSize = att.FileSize,
                            AttachmentNote = att.AttachmentNote ?? string.Empty,
                            UploadedAt = att.UploadedAt,
                            DisplayOrder = att.DisplayOrder
                        });
                    }
                }

                results.Add(new
                {
                    EmployeeId = profile.EmployeeId,
                    EmployeeName = $"{profile.FirstName} {profile.LastName}",
                    ProjectName = project?.ProjectName ?? string.Empty,
                    Competencies = competencies,
                    Goals = new List<object>(),
                    Attachments = assessmentAttachments
                });
            }

            return new { success = true, data = results };
        }

        public async Task<AssessmentDownloadResult> GetHrAttachmentAsync(int attachmentId)
        {
            var result = new AssessmentDownloadResult();

            try
            {
                var attachment = await _repository.GetAttachmentByIdAsync(attachmentId);

                if (attachment == null)
                {
                    result.Success = false;
                    result.ErrorMessage = "Attachment not found";
                    return result;
                }

                // Get file from MongoDB GridFS using stored ObjectId
                var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreviewAsync(
                    attachment.FilePath ?? "");

                result.Success = true;
                result.FileName = attachment.FileName;
                result.ContentType = contentType;
                result.FileBytes = fileBytes;

                _logger.LogInformation("HR attachment {AttachmentId} downloaded successfully", attachmentId);
                return result;
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogError(ex, "File not found for attachment {AttachmentId}", attachmentId);
                result.Success = false;
                result.ErrorMessage = "File not found in storage";
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading HR attachment {AttachmentId}", attachmentId);
                result.Success = false;
                result.ErrorMessage = $"Error: {ex.Message}";
                return result;
            }
        }
    }
}

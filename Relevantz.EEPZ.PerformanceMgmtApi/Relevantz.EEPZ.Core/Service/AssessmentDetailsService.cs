using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    /// <summary>
    /// Composes assessment details from multiple repositories and
    /// exposes operations to inspect/download HR attachments via the file storage service.
    /// </summary>
    public class AssessmentDetailsService : IAssessmentDetailsService
    {
        private readonly IAssessmentDetailsRepository _repository;
        private readonly IFileStorageService _fileStorage;
        private readonly ILogger<AssessmentDetailsService> _logger;

        /// <summary>
        /// Strict 24-hex pattern (e.g., GridFS ObjectId). Compiled for performance.
        /// </summary>
        private static readonly Regex ObjectIdRegex = new Regex("^[a-fA-F0-9]{24}$", RegexOptions.Compiled);

        private static class AssessmentStatuses
        {
            public const string Pending = "Pending";
            public const string PendingReview = "Pending Review";
            public const string Completed = "Assessment Completed";
        }

        public AssessmentDetailsService(
            IAssessmentDetailsRepository repository,
            IFileStorageService fileStorage,
            ILogger<AssessmentDetailsService> logger)
        {
            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
            _fileStorage = fileStorage ?? throw new ArgumentNullException(nameof(fileStorage));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Retrieves all assessment data by loading required datasets and
        /// composing them into a client-facing shape.
        /// </summary>
        /// <remarks>
        /// Fetches are performed <b>sequentially</b> to avoid EF DbContext concurrency issues.
        /// Returns an envelope: <c>{ success: true, data }</c> or <c>{ success: false, error }</c>.
        /// </remarks>
        public async Task<object> GetAllDetailsAsync()
        {
            using var scope = _logger.BeginScope("AssessmentDetailsService.GetAllDetails");
            var sw = Stopwatch.StartNew();

            try
            {
                _logger.LogInformation("Fetching datasets (sequential EF calls to avoid DbContext concurrency)...");

                // NOTE: Intentionally sequential; EF Core DbContext is not thread-safe by default.
                var profiles         = await _repository.GetAllUserProfilesAsync()                ?? new List<Userprofile>();
                var userAuths        = await _repository.GetAllUserAuthenticationsAsync()         ?? new List<Userauthentication>();
                var projects         = await _repository.GetAllProjectsAsync()                     ?? new List<Project>();
                var projectEmployees = await _repository.GetAllProjectEmployeesAsync()             ?? new List<Projectemployee>();
                var selfAssessments  = await _repository.GetAllSelfAssessmentsWithDetailsAsync()   ?? new List<Selfassessment>();
                var reviews          = await _repository.GetAllAssessmentReviewsAsync()            ?? new List<Assessmentreview>();
                var assignments      = await _repository.GetAssignmentsWithFormCompetenciesAsync() ?? new List<Assignment>();
                var attachments      = await _repository.GetAllSelfAssessmentAttachmentsAsync()    ?? new List<Selfassessmentattachment>();

                _logger.LogInformation("Building lookup dictionaries...");

                // Avoid duplicates by grouping and selecting First().
                var profileByEmpId = profiles
                    .Where(p => p != null)
                    .GroupBy(p => p.EmployeeId)
                    .ToDictionary(g => g.Key, g => g.First());

                var userAuthByEmpId = userAuths
                    .Where(ua => ua != null)
                    .GroupBy(ua => ua.EmployeeId)
                    .ToDictionary(g => g.Key, g => g.First());

                var primaryProjectEmployeeByEmpId = projectEmployees
                    .Where(pe => pe != null && pe.IsPrimary == true)
                    .GroupBy(pe => pe.EmployeeId)
                    .ToDictionary(g => g.Key, g => g.First());

                var projectById = projects
                    .Where(p => p != null)
                    .GroupBy(p => p.ProjectId)
                    .ToDictionary(g => g.Key, g => g.First());

                // Latest self-assessment per (EmployeeId, FormId)
                var latestSelfAssessmentByEmpForm = selfAssessments
                    .Where(sa => sa != null)
                    .GroupBy(sa => (sa.EmployeeId, sa.FormId))
                    .ToDictionary(
                        g => g.Key,
                        g => g.OrderByDescending(sa => sa.SubmittedAt).First()
                    );

                // Index reviews by (DetailId, ReviewerId) for O(1) lookup.
                var reviewsByDetailAndReviewer = reviews
                    .Where(r => r != null)
                    .GroupBy(r => (r.DetailId, r.ReviewerId))
                    .ToDictionary(g => g.Key, g => g.First());

                // Group attachments by assessment.
                var attachmentsByAssessmentId = attachments
                    .Where(a => a != null)
                    .GroupBy(a => a.AssessmentId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                _logger.LogInformation("Lookups built in {ElapsedMs} ms. Processing {AssignmentCount} assignments...",
                    sw.ElapsedMilliseconds, assignments.Count);

                var results = new List<object>(assignments.Count);

                foreach (var assignment in assignments)
                {
                    if (assignment == null) continue;

                    if (!userAuthByEmpId.TryGetValue(assignment.EmployeeId, out var employeeAuth) || employeeAuth == null)
                        continue;

                    if (!profileByEmpId.TryGetValue(employeeAuth.EmployeeId, out var profile) || profile == null)
                        continue;

                    // Resolve employee's primary project, then L1/L2 approvers (if any).
                    Project? project = null;
                    if (primaryProjectEmployeeByEmpId.TryGetValue(profile.EmployeeId, out var pe) && pe != null)
                    {
                        projectById.TryGetValue(pe.ProjectId, out project);
                    }

                    latestSelfAssessmentByEmpForm.TryGetValue((assignment.EmployeeId, assignment.FormId), out var selfAssessment);

                    Userauthentication? l1Auth = null;
                    Userauthentication? l2Auth = null;

                    var l1EmpId = project?.L1approverEmployeeId;
                    var l2EmpId = project?.L2approverEmployeeId;

                    if (l1EmpId.HasValue) userAuthByEmpId.TryGetValue(l1EmpId.Value, out l1Auth);
                    if (l2EmpId.HasValue) userAuthByEmpId.TryGetValue(l2EmpId.Value, out l2Auth);

                    var hasL1 = l1Auth != null;
                    var hasL2 = l2Auth != null;

                    var competencies = new List<object>();

                    if (selfAssessment != null && selfAssessment.Assessmentdetails != null && selfAssessment.Assessmentdetails.Any())
                    {
                        // Merge employee-entered details with L1/L2 review data.
                        foreach (var detail in selfAssessment.Assessmentdetails)
                        {
                            if (detail == null) continue;

                            reviewsByDetailAndReviewer.TryGetValue((detail.DetailId, l1Auth?.UserId ?? 0), out var l1Review);
                            reviewsByDetailAndReviewer.TryGetValue((detail.DetailId, l2Auth?.UserId ?? 0), out var l2Review);

                            var status = CalculateStatus(
                                detail.EmployeeRating,
                                detail.EmployeeComments,
                                hasL1,
                                hasL2,
                                l1Review,
                                l2Review
                            );

                            var l1ReviewerName = GetReviewerName(hasL1, l1EmpId, profileByEmpId, "No L1");
                            var l2ReviewerName = GetReviewerName(hasL2, l2EmpId, profileByEmpId, "No L2");

                            competencies.Add(new
                            {
                                CompetencyName = detail.Competency?.Name ?? "Unknown",
                                EmployeeRating = detail.EmployeeRating,
                                EmployeeComments = detail.EmployeeComments ?? string.Empty,
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
                        // No self-assessment yet; expand form-defined competencies as placeholders.
                        var formComps = assignment.Form?.Competencies ?? new List<Competency>();
                        var l1ReviewerName = GetReviewerName(hasL1, l1EmpId, profileByEmpId, "No L1");
                        var l2ReviewerName = GetReviewerName(hasL2, l2EmpId, profileByEmpId, "No L2");

                        foreach (var fc in formComps)
                        {
                            if (fc == null) continue;

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
                                Status = AssessmentStatuses.Pending
                            });
                        }
                    }

                    // Attachments (if any) for the current self-assessment.
                    var assessmentAttachments = new List<object>();
                    if (selfAssessment != null &&
                        attachmentsByAssessmentId.TryGetValue(selfAssessment.AssessmentId, out var attList) &&
                        attList != null)
                    {
                        foreach (var att in attList)
                        {
                            if (att == null) continue;

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
                        EmployeeName = BuildFullName(profile.FirstName, profile.LastName),
                        ProjectName = project?.ProjectName ?? string.Empty,
                        Competencies = competencies,
                        Goals = new List<object>(), // Reserved for future use.
                        Attachments = assessmentAttachments
                    });
                }

                _logger.LogInformation("Processed {Count} assignments in {ElapsedMs} ms.", results.Count, sw.ElapsedMilliseconds);
                return new { success = true, data = results };
            }
            catch (Exception ex)
            {
                // Maintain response envelope and shield internal details.
                _logger.LogError(ex, "Error while getting all assessment details.");
                return new { success = false, error = "An unexpected error occurred." };
            }
            finally
            {
                sw.Stop();
            }
        }

        /// <summary>
        /// Retrieves an HR attachment by ID, validates its storage identifier,
        /// and fetches bytes and metadata from the storage provider.
        /// </summary>
        /// <param name="attachmentId">Attachment primary key.</param>
        /// <returns>
        /// <see cref="AssessmentDownloadResult"/> with <c>Success</c>, <c>FileName</c>, <c>ContentType</c>, and <c>FileBytes</c> on success;
        /// otherwise <c>Success=false</c> and a friendly <c>ErrorMessage</c>.
        /// </returns>
        public async Task<AssessmentDownloadResult> GetHrAttachmentAsync(int attachmentId)
        {
            using var scope = _logger.BeginScope("AssessmentDetailsService.GetHrAttachment {AttachmentId}", attachmentId);

            var result = new AssessmentDownloadResult { Success = false };

            try
            {
                _logger.LogInformation("Fetching attachment metadata for AttachmentId={AttachmentId}", attachmentId);

                var attachment = await _repository.GetAttachmentByIdAsync(attachmentId);
                if (attachment == null)
                {
                    result.ErrorMessage = "Attachment not found";
                    _logger.LogWarning("Attachment not found. AttachmentId={AttachmentId}", attachmentId);
                    return result;
                }

                _logger.LogInformation(
                    "Attachment meta: Id={Id}, Name={Name}, Type={Type}, Size={Size}, UploadedAt={UploadedAt}, DisplayOrder={Order}",
                    attachment.AttachmentId, attachment.FileName, attachment.FileType, attachment.FileSize,
                    attachment.UploadedAt, attachment.DisplayOrder
                );

                // Validate storage id (e.g., GridFS ObjectId) before calling provider.
                var storageId = SanitizeStorageId(attachment.FilePath);
                if (storageId == null)
                {
                    result.ErrorMessage = "Invalid storage identifier";
                    _logger.LogWarning("Invalid storage identifier for AttachmentId={AttachmentId}. Raw={Raw}",
                        attachmentId, attachment.FilePath);
                    return result;
                }

                byte[] fileBytes;
                string contentType;
                string storageFileName;

                try
                {
                    (fileBytes, contentType, storageFileName) = await _fileStorage.GetFileForPreviewAsync(storageId);
                }
                catch (FileNotFoundException ex)
                {
                    _logger.LogError(ex, "File not found in storage for AttachmentId={AttachmentId}", attachmentId);
                    result.ErrorMessage = "File not found in storage";
                    return result;
                }

                if (fileBytes == null || fileBytes.Length == 0)
                {
                    result.ErrorMessage = "File not found in storage";
                    _logger.LogWarning("No file bytes returned for AttachmentId={AttachmentId}, StorageId={StorageId}",
                        attachmentId, storageId);
                    return result;
                }

                _logger.LogInformation("Storage file resolved for AttachmentId={AttachmentId}: {StorageFileName}",
                    attachmentId, storageFileName);

                result.Success = true;
                result.FileName = attachment.FileName;
                result.ContentType = contentType;
                result.FileBytes = fileBytes;

                _logger.LogInformation("Attachment downloaded successfully. AttachmentId={AttachmentId}, Bytes={Bytes}",
                    attachmentId, fileBytes.Length);

                return result;
            }
            catch (Exception ex)
            {
                // Preserve contract: convert exceptions into a friendly result.
                _logger.LogError(ex, "Error downloading HR attachment. AttachmentId={AttachmentId}", attachmentId);
                result.ErrorMessage = "Error occurred while downloading attachment.";
                return result;
            }
        }

        #region Private Helpers

        /// <summary>
        /// Builds a full name from first/last with trimming and a safe fallback.
        /// </summary>
        private static string BuildFullName(string? first, string? last)
        {
            var f = first?.Trim() ?? string.Empty;
            var l = last?.Trim() ?? string.Empty;
            var name = $"{f} {l}".Trim();
            return string.IsNullOrWhiteSpace(name) ? "Unknown" : name;
        }

        /// <summary>
        /// Validates a raw storage identifier and returns it in normalized form
        /// when it matches the strict 24-hex pattern.
        /// </summary>
        private static string? SanitizeStorageId(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            var trimmed = raw.Trim();
            return ObjectIdRegex.IsMatch(trimmed) ? trimmed : null;
        }

        /// <summary>
        /// Determines a composite status based on employee input and L1/L2 review presence.
        /// </summary>
        private static string CalculateStatus(
            int? employeeRating,
            string? employeeComments,
            bool hasL1,
            bool hasL2,
            Assessmentreview? l1Review,
            Assessmentreview? l2Review)
        {
            if (employeeRating == null && string.IsNullOrWhiteSpace(employeeComments))
                return AssessmentStatuses.Pending;

            if (!hasL1 && !hasL2)
                return AssessmentStatuses.PendingReview;

            var l1Pending = hasL1 && l1Review == null;
            var l2Pending = hasL2 && l2Review == null;

            if (l1Pending || l2Pending)
                return AssessmentStatuses.Pending;

            return AssessmentStatuses.Completed;
        }

        /// <summary>
        /// Resolves an approver's display name; returns a default label if not configured/found.
        /// </summary>
        private static string GetReviewerName(
            bool hasApprover,
            int? approverEmployeeId,
            IDictionary<int, Userprofile> profileByEmpId,
            string defaultWhenNoApprover)
        {
            if (!hasApprover || !approverEmployeeId.HasValue)
                return defaultWhenNoApprover;

            if (!profileByEmpId.TryGetValue(approverEmployeeId.Value, out var prof) || prof == null)
                return defaultWhenNoApprover;

            var name = $"{prof.FirstName ?? string.Empty} {prof.LastName ?? string.Empty}".Trim();
            return string.IsNullOrWhiteSpace(name) ? defaultWhenNoApprover : name;
        }

        #endregion
    }
}
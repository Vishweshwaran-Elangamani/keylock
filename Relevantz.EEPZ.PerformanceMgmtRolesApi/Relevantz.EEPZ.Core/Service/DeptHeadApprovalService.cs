using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class DeptHeadApprovalsService : IDeptHeadApprovalsService
    {
        private readonly IDeptHeadApprovalsRepository _repository;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DeptHeadApprovalsService> _logger;

        public DeptHeadApprovalsService(
            IDeptHeadApprovalsRepository repository,
            IConfiguration configuration,
            ILogger<DeptHeadApprovalsService> logger)
        {
            _repository = repository;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<ApiResponse<int>> ApproveDeptHeadEmployeeAsync(ApprovalRequestDto request, int deptHeadUserId)
        {
            try
            {
                var assessment = await _repository.GetAssessmentByIdAsync(request.AssessmentId);
                if (assessment == null)
                {
                    return ApiResponse<int>.ErrorResponse("Assessment not found");
                }

                var existingApproval = await _repository.GetExistingApprovalAsync(request.AssessmentId, request.EmployeeId);
                if (existingApproval != null)
                {
                    return ApiResponse<int>.ErrorResponse("Employee already approved");
                }

                var approvalId = await _repository.CreateApprovalAsync(request, deptHeadUserId);
                return ApiResponse<int>.SuccessResponse(approvalId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in ApproveDeptHeadEmployeeAsync: {ex.Message}");
                return ApiResponse<int>.ErrorResponse($"Error: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<object>>> GetDeptHeadSubmittedRatingsAsync(int? deptHeadEmployeeId)
        {
            try
            {
                _logger.LogInformation($"GetDeptHeadSubmittedRatings called with departmentHeadId: {deptHeadEmployeeId}");

                var profiles = await _repository.GetAllUserProfilesAsync();
                var userAuths = await _repository.GetAllUserAuthenticationsAsync();
                var projects = await _repository.GetAllProjectsAsync();
                var projectEmployees = await _repository.GetAllProjectEmployeesAsync();

                if (deptHeadEmployeeId.HasValue)
                {
                    var deptHeadDeptId = await _repository.GetDepartmentIdByEmployeeIdAsync(deptHeadEmployeeId.Value);

                    if (deptHeadDeptId > 0)
                    {
                        _logger.LogInformation($"Filtering by Department ID: {deptHeadDeptId}");
                        var departmentEmployeeIds = await _repository.GetEmployeeIdsByDepartmentAsync(deptHeadDeptId);
                        projectEmployees = projectEmployees.Where(pe => departmentEmployeeIds.Contains(pe.EmployeeId)).ToList();
                    }
                }

                var selfAssessments = await _repository.GetSubmittedSelfAssessmentsAsync();
                var reviews = await _repository.GetAllAssessmentReviewsAsync();
                var allEmployeeIds = projectEmployees.Select(pe => pe.EmployeeId).Distinct().ToList();
                var allGoals = await _repository.GetGoalsByEmployeeIdsAsync(allEmployeeIds);

                var results = new List<object>();

                foreach (var pe in projectEmployees)
                {
                    try
                    {
                        var profile = profiles.FirstOrDefault(up => up.EmployeeId == pe.EmployeeId);
                        if (profile == null) continue;

                        var userAuth = userAuths.FirstOrDefault(ua => ua.EmployeeId == pe.EmployeeId);
                        if (userAuth == null) continue;

                        var project = projects.FirstOrDefault(p => p.ProjectId == pe.ProjectId);
                        if (project == null) continue;

                        var employeeAssessments = selfAssessments
                            .Where(sa => sa.EmployeeId == userAuth.UserId && sa.Assessmentdetails != null && sa.Assessmentdetails.Any())
                            .OrderByDescending(sa => sa.SubmittedAt)
                            .ToList();

                        if (!employeeAssessments.Any()) continue;

                        foreach (var selfAssessment in employeeAssessments)
                        {
                            var approval = await _repository.GetDeptHeadApprovalAsync(pe.EmployeeId, pe.ProjectId, selfAssessment.AssessmentId);

                            if (approval != null)
                            {
                                _logger.LogDebug($"Skipping AssessmentId {selfAssessment.AssessmentId} - Already department head approved");
                                continue;
                            }

                            var l1Auth = project.L1approverEmployeeId.HasValue
                                ? userAuths.FirstOrDefault(ua => ua.EmployeeId == project.L1approverEmployeeId)
                                : null;

                            var l2Auth = project.L2approverEmployeeId.HasValue
                                ? userAuths.FirstOrDefault(ua => ua.EmployeeId == project.L2approverEmployeeId)
                                : null;

                            bool hasL2 = l2Auth != null;
                            bool allL2Approved = false;

                            if (hasL2)
                            {
                                allL2Approved = selfAssessment.Assessmentdetails.All(detail =>
                                    reviews.Any(r =>
                                        r.DetailId == detail.DetailId &&
                                        r.ReviewerId == l2Auth.UserId &&
                                        r.ReviewerRole == "Reviewer" &&
                                        r.ReviewStatus == "Approved"));
                            }

                            if (!hasL2)
                            {
                                _logger.LogDebug($"Skipping AssessmentId {selfAssessment.AssessmentId} - No L2 reviewer configured");
                                continue;
                            }

                            if (!allL2Approved)
                            {
                                _logger.LogDebug($"Skipping AssessmentId {selfAssessment.AssessmentId} - L2 has not approved all details");
                                continue;
                            }

                            _logger.LogInformation($"Including AssessmentId {selfAssessment.AssessmentId} - L2 approved");

                            string l1ReviewerName = "No L1";
                            if (l1Auth != null && project.L1approverEmployeeId.HasValue)
                            {
                                var l1Profile = profiles.FirstOrDefault(p => p.EmployeeId == project.L1approverEmployeeId);
                                if (l1Profile != null)
                                {
                                    l1ReviewerName = $"{l1Profile.FirstName ?? ""} {l1Profile.LastName ?? ""}".Trim();
                                    if (string.IsNullOrEmpty(l1ReviewerName))
                                        l1ReviewerName = "L1 Reviewer";
                                }
                            }

                            string l2ReviewerName = "No L2";
                            if (l2Auth != null && project.L2approverEmployeeId.HasValue)
                            {
                                var l2Profile = profiles.FirstOrDefault(p => p.EmployeeId == project.L2approverEmployeeId);
                                if (l2Profile != null)
                                {
                                    l2ReviewerName = $"{l2Profile.FirstName ?? ""} {l2Profile.LastName ?? ""}".Trim();
                                    if (string.IsNullOrEmpty(l2ReviewerName))
                                        l2ReviewerName = "L2 Reviewer";
                                }
                            }

                            var competencies = selfAssessment.Assessmentdetails.Select(detail =>
                            {
                                var l1Review = l1Auth != null ? reviews.FirstOrDefault(r =>
                                    r.DetailId == detail.DetailId &&
                                    r.ReviewerId == l1Auth.UserId &&
                                    r.ReviewerRole == "Approver") : null;

                                var l2Review = l2Auth != null ? reviews.FirstOrDefault(r =>
                                    r.DetailId == detail.DetailId &&
                                    r.ReviewerId == l2Auth.UserId &&
                                    r.ReviewerRole == "Reviewer") : null;

                                return new
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
                                    Status = "Completed"
                                };
                            }).ToList();

                            var employeeGoalIds = await _repository.GetGoalIdsByEmployeeIdAsync(pe.EmployeeId);
                            var employeeGoals = allGoals.Where(g => employeeGoalIds.Contains(g.GoalId)).ToList();

                            var formattedGoals = employeeGoals.Select(g => new
                            {
                                g.GoalId,
                                g.GoalTitle,
                                g.GoalDescription,
                                g.Goalstatus,
                                GoalComments = g.GoalComments.Select(c => new
                                {
                                    c.Goalcommentid,
                                    Comment = c.GoalComment1,
                                    c.CommentedOn
                                }),
                                GoalProgressLogs = g.Goalprogresslogs.Select(p => new
                                {
                                    p.ProgressId,
                                    p.ProgressPercent,
                                    p.UpdatedOn
                                }),
                                GoalAssignments = g.GoalAssignments.Select(a => new
                                {
                                    a.AssignmentId,
                                    a.AssignedBy,
                                    a.AssignedOn
                                }),
                                GoalChecklists = g.GoalChecklists.Select(cl => new
                                {
                                    cl.ChecklistId,
                                    cl.ItemTitle,
                                    cl.ItemDescription,
                                    Progresses = cl.Goalchecklistprogresses.Select(p => new
                                    {
                                        p.ChecklistProgressId,
                                        p.IsCompleted,
                                        p.CompletedOn
                                    })
                                }),
                                GoalAttachments = g.GoalAttachments.Select(att => new
                                {
                                    att.Goalattachmentsid,
                                    att.AttachmentTitle,
                                    att.Attachments,
                                    att.AttachedOn
                                })
                            }).ToList();

                            string employeeName = $"{profile.FirstName ?? ""} {profile.LastName ?? ""}".Trim();
                            if (string.IsNullOrEmpty(employeeName))
                                employeeName = $"Employee {pe.EmployeeId}";

                            var employeeDetails = await _repository.GetEmployeeDetailsByEmployeeIdAsync(pe.EmployeeId);

                            results.Add(new
                            {
                                EmployeeId = pe.EmployeeId,
                                EmployeeName = employeeName,
                                EmployeeCompanyId = employeeDetails?.EmployeeMasterId.ToString() ?? "",
                                ProjectId = project.ProjectId,
                                ProjectName = project.ProjectName ?? "Unknown",
                                AssessmentId = selfAssessment.AssessmentId,
                                Competencies = competencies,
                                Goals = formattedGoals
                            });
                        }
                    }
                    catch (Exception innerEx)
                    {
                        _logger.LogError($"Error processing employee {pe.EmployeeId}: {innerEx.Message}");
                        continue;
                    }
                }

                _logger.LogInformation($"Returning {results.Count} assessments for department head review");
                return ApiResponse<List<object>>.SuccessResponse(results);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetDeptHeadSubmittedRatingsAsync: {ex.Message}");
                return ApiResponse<List<object>>.ErrorResponse($"Failed to fetch submitted ratings: {ex.Message}");
            }
        }

        public async Task<(bool success, List<object> data, int totalRecords, int totalPages, List<string> errors)> GetManagerApprovedEmployeesAsync(int page, int pageSize, int? deptHeadEmployeeId)
        {
            try
            {
                _logger.LogInformation($"GetManagerApprovedEmployees - Department Head ID: {deptHeadEmployeeId}, Page: {page}");

                var (approvals, totalRecords) = await _repository.GetApprovedEmployeesAsync(page, pageSize, deptHeadEmployeeId);

                var results = new List<object>();

                foreach (var approval in approvals)
                {
                    try
                    {
                        _logger.LogInformation($"Processing ApprovalId: {approval.ApprovalId}, EmployeeId: {approval.EmployeeId}");

                        var pe = await _repository.GetProjectEmployeeByEmployeeIdAsync(approval.EmployeeId);

                        if (pe == null)
                        {
                            _logger.LogWarning($"ProjectEmployee not found for EmployeeId: {approval.EmployeeId}");
                            var empMaster = await _repository.GetEmployeeDetailsByMasterIdAsync(approval.EmployeeId);

                            if (empMaster == null)
                            {
                                _logger.LogWarning($"EmployeeDetailsMaster not found");
                                continue;
                            }

                            pe = await _repository.GetProjectEmployeeByEmployeeIdAsync(empMaster.EmployeeId);

                            if (pe == null)
                            {
                                _logger.LogWarning($"Still no ProjectEmployee found");
                                continue;
                            }
                        }

                        var profile = await _repository.GetUserProfileByEmployeeIdAsync(pe.EmployeeId);

                        if (profile == null)
                        {
                            _logger.LogWarning($"Profile not found for EmployeeId: {pe.EmployeeId}");
                            continue;
                        }

                        var project = await _repository.GetProjectByIdAsync(approval.ProjectId);

                        if (project == null)
                        {
                            _logger.LogWarning($"Project not found for ProjectId: {approval.ProjectId}");
                            continue;
                        }

                        string employeeName = $"{profile.FirstName ?? ""} {profile.LastName ?? ""}".Trim();
                        if (string.IsNullOrEmpty(employeeName))
                            employeeName = $"Employee {approval.EmployeeId}";

                        results.Add(new
                        {
                            ApprovalId = approval.ApprovalId,
                            EmployeeId = approval.EmployeeId,
                            EmployeeName = employeeName,
                            ProjectName = project.ProjectName ?? "Unknown",
                            ApprovedAt = approval.ApprovedAt
                        });

                        _logger.LogInformation($"Successfully processed ApprovalId: {approval.ApprovalId}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Error processing approval {approval.ApprovalId}: {ex.Message}");
                        continue;
                    }
                }

                _logger.LogInformation($"Returning {results.Count} approved employees out of {totalRecords} total");

                int totalPages = totalRecords > 0 ? (int)Math.Ceiling((double)totalRecords / pageSize) : 0;

                return (true, results, totalRecords, totalPages, new List<string>());
            }
            catch (Exception ex)
            {
                _logger.LogError($"Fatal error in GetManagerApprovedEmployeesAsync: {ex.Message}");
                return (false, new List<object>(), 0, 0, new List<string> { $"Error: {ex.Message}" });
            }
        }

        public async Task<ApiResponse<List<object>>> GetPendingAcknowledgmentsAsync(int employeeId, int userId)
        {
            try
            {
                _logger.LogWarning($"[EMPLOYEE PENDING ACK] Matching EmployeeId={employeeId} or UserId={userId}");

                var pendingApprovals = await _repository.GetPendingApprovalsForEmployeeAsync(employeeId, userId);

                _logger.LogWarning($"[EMPLOYEE PENDING ACK] Found {pendingApprovals.Count} records");

                var results = new List<object>();

                foreach (var approval in pendingApprovals)
                {
                    try
                    {
                        var project = await _repository.GetProjectByIdAsync(approval.ProjectId);
                        if (project == null) continue;

                        var assessment = await _repository.GetAssessmentWithDetailsAsync(approval.AssessmentId);
                        if (assessment == null) continue;

                        var detailIds = assessment.Assessmentdetails.Select(d => d.DetailId).ToList();
                        var reviews = await _repository.GetReviewsByDetailIdsAsync(detailIds);

                        var l1Name = "No L1";
                        var l2Name = "No L2";
                        int? l1UserId = null, l2UserId = null;

                        if (project.L1approverEmployeeId.HasValue)
                        {
                            var l1Profile = await _repository.GetUserProfileByEmployeeIdAsync(project.L1approverEmployeeId.Value);
                            if (l1Profile != null)
                                l1Name = $"{l1Profile.FirstName ?? ""} {l1Profile.LastName ?? ""}".Trim();

                            var l1Auth = await _repository.GetUserAuthByEmployeeIdAsync(project.L1approverEmployeeId.Value);
                            l1UserId = l1Auth?.UserId;
                        }

                        if (project.L2approverEmployeeId.HasValue)
                        {
                            var l2Profile = await _repository.GetUserProfileByEmployeeIdAsync(project.L2approverEmployeeId.Value);
                            if (l2Profile != null)
                                l2Name = $"{l2Profile.FirstName ?? ""} {l2Profile.LastName ?? ""}".Trim();

                            var l2Auth = await _repository.GetUserAuthByEmployeeIdAsync(project.L2approverEmployeeId.Value);
                            l2UserId = l2Auth?.UserId;
                        }

                        var competencies = assessment.Assessmentdetails.Select(detail =>
                        {
                            var l1Review = l1UserId.HasValue ? reviews.FirstOrDefault(r => r.DetailId == detail.DetailId && r.ReviewerId == l1UserId) : null;
                            var l2Review = l2UserId.HasValue ? reviews.FirstOrDefault(r => r.DetailId == detail.DetailId && r.ReviewerId == l2UserId) : null;

                            return new
                            {
                                CompetencyName = detail.Competency?.Name ?? "Unknown",
                                EmployeeRating = detail.EmployeeRating,
                                EmployeeComments = detail.EmployeeComments,
                                L1ReviewerName = l1Name,
                                L1Rating = l1Review?.Rating,
                                L1Comments = l1Review?.Comments,
                                L2ReviewerName = l2Name,
                                L2Rating = l2Review?.Rating,
                                L2Comments = l2Review?.Comments
                            };
                        }).ToList();

                        results.Add(new
                        {
                            ApprovalId = approval.ApprovalId,
                            ProjectName = project.ProjectName ?? "Unknown",
                            ApprovedAt = approval.ApprovedAt,
                            Competencies = competencies
                        });
                    }
                    catch (Exception innerEx)
                    {
                        _logger.LogWarning($"Error processing approval {approval.ApprovalId}: {innerEx.Message}");
                        continue;
                    }
                }

                return ApiResponse<List<object>>.SuccessResponse(results);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetPendingAcknowledgmentsAsync: {ex.Message}");
                return ApiResponse<List<object>>.ErrorResponse($"Error: {ex.Message}");
            }
        }

        public async Task<ApiResponse<DateTime?>> AcknowledgeRatingAsync(AcknowledgeRequestDto request, int employeeId, int userId)
        {
            try
            {
                _logger.LogInformation($"[ACK POST] ApprovalId={request.ApprovalId}, EmpId={employeeId}, UserId={userId}");

                var approval = await _repository.GetApprovalForAcknowledgmentAsync(request.ApprovalId, employeeId, userId);

                if (approval == null)
                {
                    _logger.LogWarning($"[ACK POST] NOT FOUND: approvalId={request.ApprovalId}, empId={employeeId}, userId={userId}");
                    return ApiResponse<DateTime?>.ErrorResponse($"NOT_FOUND - Approval record not found for ApprovalId={request.ApprovalId}");
                }

                if (approval.AcknowledgedByEmployee)
                {
                    return ApiResponse<DateTime?>.ErrorResponse("Already acknowledged");
                }

                var acknowledgedAt = await _repository.AcknowledgeApprovalAsync(approval, request.Comments);

                _logger.LogInformation($"[ACK POST] SUCCESS: Employee {employeeId} or User {userId} acknowledged {request.ApprovalId}");

                return ApiResponse<DateTime?>.SuccessResponse(acknowledgedAt);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in AcknowledgeRatingAsync: {ex.Message}");
                return ApiResponse<DateTime?>.ErrorResponse($"Error: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<object>>> GetEmployeeAcknowledgedCommentsAsync(int managerId)
        {
            try
            {
                var acknowledgments = await _repository.GetAcknowledgedCommentsByManagerAsync(managerId);
                return ApiResponse<List<object>>.SuccessResponse(acknowledgments);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetEmployeeAcknowledgedCommentsAsync: {ex.Message}");
                return ApiResponse<List<object>>.ErrorResponse($"Error: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<object>>> GetDeptHeadAssessmentAttachmentsAsync(int assessmentId)
        {
            try
            {
                var attachments = await _repository.GetAssessmentAttachmentsAsync(assessmentId);
                return ApiResponse<List<object>>.SuccessResponse(attachments);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetDeptHeadAssessmentAttachmentsAsync: {ex.Message}");
                return ApiResponse<List<object>>.ErrorResponse($"Error: {ex.Message}");
            }
        }

        public async Task<(bool success, byte[] fileBytes, string contentType, string fileName, List<string> errors)> DownloadDeptHeadAttachmentAsync(int attachmentId)
        {
            try
            {
                var attachment = await _repository.GetAttachmentByIdAsync(attachmentId);

                if (attachment == null)
                    return (false, null, null, null, new List<string> { "ATTACHMENT_NOT_FOUND - Attachment not found." });

                if (string.IsNullOrWhiteSpace(attachment.FilePath))
                    return (false, null, null, null, new List<string> { "FILE_NOT_FOUND - File path missing." });

                var basePath = _configuration["FileStorage:BasePath"] ?? "D:\\Capstone\\Backend\\eepz\\SharedUploads";

                var cleanPath = attachment.FilePath
                    .Replace("uploads\\", "", StringComparison.OrdinalIgnoreCase)
                    .Replace("uploads/", "", StringComparison.OrdinalIgnoreCase)
                    .TrimStart('\\', '/');

                var filePath = Path.Combine(basePath, cleanPath);

                _logger.LogInformation($"=== DEPT HEAD DOWNLOAD DEBUG ===");
                _logger.LogInformation($"Base Path: {basePath}");
                _logger.LogInformation($"Database Path: {attachment.FilePath}");
                _logger.LogInformation($"Cleaned Path: {cleanPath}");
                _logger.LogInformation($"Full Path: {filePath}");
                _logger.LogInformation($"File Exists: {System.IO.File.Exists(filePath)}");

                if (!System.IO.File.Exists(filePath))
                    return (false, null, null, null, new List<string> { $"FILE_NOT_FOUND - File not found on server. Attempted path: {filePath}" });

                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var contentType = attachment.FileType ?? "application/octet-stream";

                return (true, fileBytes, contentType, attachment.FileName, new List<string>());
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in DownloadDeptHeadAttachmentAsync: {ex.Message}");
                return (false, null, null, null, new List<string> { $"Error: {ex.Message}" });
            }
        }

        public async Task<int?> GetEmployeeIdFromUserIdAsync(int userId)
        {
            var userAuth = await _repository.GetUserAuthByUserIdAsync(userId);
            return userAuth?.EmployeeId;
        }
    }
}

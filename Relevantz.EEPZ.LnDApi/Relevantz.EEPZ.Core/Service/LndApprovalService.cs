using System.Text.Json;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class LnDApprovalService : ILnDApprovalService
    {
        private readonly ILnDApprovalRepository _approvalRepository;
        private readonly ILnDSmeRepository _smeRepository;
        private readonly ILnDAssignmentRepository _assignmentRepository;
        private readonly IFileStorageService _fileStorage;

        public LnDApprovalService(
            ILnDApprovalRepository approvalRepository,
            ILnDSmeRepository smeRepository,
            ILnDAssignmentRepository assignmentRepository,
            IFileStorageService fileStorage
        )
        {
            _approvalRepository = approvalRepository;
            _smeRepository = smeRepository;
            _assignmentRepository = assignmentRepository;
            _fileStorage = fileStorage;
        }

        public async Task<ApiResponse<PaginatedResponse<ApprovalDto>>> GetMyApprovals(
            int employeeId,
            string? approvalType,
            string? status,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize,
            string? searchTerm
        )
        {
            try
            {
                var (items, totalCount) = await _approvalRepository.GetMyApprovalsAsync(
                    employeeId,
                    approvalType,
                    status,
                    sortField,
                    sortOrder,
                    pageNumber,
                    pageSize,
                    searchTerm
                );

                var approvalDtos = items
                    .Select(a => new ApprovalDto
                    {
                        ApprovalId = a.ApprovalId,
                        ApprovalType = a.ApprovalType,
                        AssignmentId = a.AssignmentId,
                        SkillId = a.SkillId,
                        SkillName = a.Skill?.SkillName,
                        RequesterEmployeeId = a.RequesterEmployeeId,
                        RequesterName =
                            $"{a.RequesterEmployee.Userprofile.FirstName} {a.RequesterEmployee.Userprofile.LastName}",
                        ApproverEmployeeId = a.ApproverEmployeeId,
                        ApproverName =
                            a.ApproverEmployee != null
                                ? $"{a.ApproverEmployee.Userprofile.FirstName} {a.ApproverEmployee.Userprofile.LastName}"
                                : null,
                        Status = a.Status,
                        Notes = a.Notes,
                        RequestedOn = a.RequestedOn,
                        UpdatedOn = a.UpdatedOn,
                        AttachmentPath = a.Attachment?.FilePath,
                    })
                    .ToList();

                return new ApiResponse<PaginatedResponse<ApprovalDto>>
                {
                    Success = true,
                    Data = new PaginatedResponse<ApprovalDto>
                    {
                        Items = approvalDtos,
                        TotalCount = totalCount,
                        PageNumber = pageNumber,
                        PageSize = pageSize,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<ApprovalDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }


        public async Task<ApiResponse<bool>> ProcessApproval(
            int approverId,
            ApprovalDecisionRequest request
        )
        {
            try
            {
                var approval = await _approvalRepository.GetApprovalByIdAsync(request.ApprovalId);

                if (approval == null || approval.ApproverEmployeeId != approverId)
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Approval not found or you are not the approver",
                    };

                if (approval.Status != LnDConstants.APPROVAL_STATUS.PENDING)
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Approval has already been processed",
                    };

                approval.Status = request.IsApproved
                    ? LnDConstants.APPROVAL_STATUS.APPROVED
                    : LnDConstants.APPROVAL_STATUS.REJECTED;
                approval.Notes = request.Notes;
                approval.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                if (request.IsApproved)
                {
                    if (approval.ApprovalType == LnDConstants.APPROVAL_TYPE.SME_REGISTRATION)
                    {
                        var sme = new Lndsme
                        {
                            EmployeeId = approval.RequesterEmployeeId,
                            SkillId = approval.SkillId.Value,
                            AttachmentId = approval.AttachmentId,
                            ApprovedByEmployeeId = approverId,
                            ApprovedOn = DateOnly.FromDateTime(DateTime.Now),
                            CreatedOn = DateOnly.FromDateTime(DateTime.Now),
                            IsActive = true,
                        };

                        await _smeRepository.AddSmeAsync(sme);
                    }
                    else if (approval.ApprovalType == LnDConstants.APPROVAL_TYPE.SME_REQUEST)
                    {
                        var assignmentDetails = JsonSerializer.Deserialize<
                            Dictionary<string, object>
                        >(approval.Notes);

                        var sme = await _smeRepository.GetSmeFromEmployeeId(assignmentDetails);

                        if (sme == null)
                            return new ApiResponse<bool>
                            {
                                Success = false,
                                Message = "SME not found",
                            };

                        var menteeIdElement = (JsonElement)assignmentDetails["MenteeEmployeeId"];
                        var skillIdElement = (JsonElement)assignmentDetails["SkillId"];
                        var managerIdElement = (JsonElement)assignmentDetails["ManagerId"];

                        int menteeEmployeeId = menteeIdElement.GetInt32();
                        int skillId = skillIdElement.GetInt32();
                        int managerId = managerIdElement.GetInt32();

                        DateTime? deadline = null;
                        if (
                            assignmentDetails.ContainsKey("Deadline")
                            && assignmentDetails["Deadline"] != null
                        )
                        {
                            var deadlineElement = (JsonElement)assignmentDetails["Deadline"];
                            if (deadlineElement.ValueKind != JsonValueKind.Null)
                            {
                                deadline = deadlineElement.GetDateTime();
                            }
                        }

                        var assignment = new Lndassignment
                        {
                            MenteeEmployeeId = menteeEmployeeId,
                            SmeId = sme.SmeId,
                            SkillId = skillId,
                            Deadline = deadline,
                            Status = LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS,
                            CreatedByEmployeeId = managerId,
                            CreatedOn = DateOnly.FromDateTime(DateTime.Now),
                        };

                        await _assignmentRepository.AddAssignmentAsync(assignment);
                    }
                    else if (approval.ApprovalType == LnDConstants.APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT)
                    {

                        var assignment = await _assignmentRepository.GetAssignmentByIdAsync(
                            approval.AssignmentId.Value
                        );

                        if (assignment == null)
                            return new ApiResponse<bool>
                            {
                                Success = false,
                                Message = "Assignment not found",
                            };


                        assignment.Status = LnDConstants.ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT;
                        assignment.UpdatedByEmployeeId = approverId;
                        assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                        await _assignmentRepository.UpdateAssignmentAsync(assignment);


                        var managerApproval = new Lndapproval
                        {
                            ApprovalType = LnDConstants.APPROVAL_TYPE.ASSIGNMENT_COMPLETION,
                            AssignmentId = assignment.AssignmentId,
                            SkillId = assignment.SkillId,
                            AttachmentId = approval.AttachmentId,
                            RequesterEmployeeId = assignment.MenteeEmployeeId,
                            ApproverEmployeeId = assignment.MenteeEmployee.ReportingManagerEmployeeId,
                            Status = LnDConstants.APPROVAL_STATUS.PENDING,
                            Notes = approval.Notes,
                            RequestedOn = DateOnly.FromDateTime(DateTime.Now),


                        };

                        await _approvalRepository.AddApprovalAsync(managerApproval);
                    }
                }
                else
                {

                    if (approval.ApprovalType == LnDConstants.APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT)
                    {
                        var assignment = await _assignmentRepository.GetAssignmentByIdAsync(
                            approval.AssignmentId.Value
                        );

                        if (assignment != null)
                        {

                            assignment.Status = LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS;
                            assignment.ProofFilePath = null; // Clear the proof
                            assignment.CompletionNotes = null;
                            assignment.UpdatedByEmployeeId = approverId;
                            assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                            await _assignmentRepository.UpdateAssignmentAsync(assignment);
                        }
                    }
                }

                await _approvalRepository.UpdateApprovalAsync(approval);
                await _approvalRepository.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = request.IsApproved
                        ? "Approval processed successfully"
                        : "Request rejected successfully",
                    Data = true,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }



        public async Task<ApiResponse<PaginatedResponse<ApprovalDto>>> GetApprovalHistory(
           int employeeId,
           string? approvalType,
           string? status,
           string? role,
           string? searchTerm,
           string? sortField,
           string? sortOrder,
           int pageNumber,
           int pageSize = 10
       )
        {
            try
            {

                if (pageSize < 1)
                    pageSize = 10;
                if (pageSize > 100)
                    pageSize = 100;

                var (items, totalCount) = await _approvalRepository.GetApprovalHistoryAsync(
                    employeeId,
                    approvalType,
                    status,
                    role,
                    searchTerm,
                    sortField,
                    sortOrder,
                    pageNumber,
                    pageSize
                );

                var approvalDtos = items
                    .Select(a => new ApprovalDto
                    {
                        ApprovalId = a.ApprovalId,
                        ApprovalType = a.ApprovalType,
                        AssignmentId = a.AssignmentId,
                        SkillId = a.SkillId,
                        SkillName = a.Skill?.SkillName,
                        RequesterEmployeeId = a.RequesterEmployeeId,
                        RequesterName =
                            $"{a.RequesterEmployee.Userprofile.FirstName} {a.RequesterEmployee.Userprofile.LastName}",
                        ApproverEmployeeId = a.ApproverEmployeeId,
                        ApproverName =
                            a.ApproverEmployee != null
                                ? $"{a.ApproverEmployee.Userprofile.FirstName} {a.ApproverEmployee.Userprofile.LastName}"
                                : null,
                        Status = a.Status,
                        Notes = a.Notes,
                        RequestedOn = a.RequestedOn,
                        UpdatedOn = a.UpdatedOn,
                        AttachmentPath = a.Attachment?.FilePath,
                    })
                    .ToList();

                return new ApiResponse<PaginatedResponse<ApprovalDto>>
                {
                    Success = true,
                    Data = new PaginatedResponse<ApprovalDto>
                    {
                        Items = approvalDtos,
                        TotalCount = totalCount,
                        PageNumber = pageNumber,
                        PageSize = pageSize,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<ApprovalDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving approval history",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<ApprovalDetailsDto>> GetApprovalDetails(
           int employeeId,
           int approvalId
       )
        {
            try
            {
                var approval = await _approvalRepository.GetApprovalByIdAsync(approvalId);

                if (approval == null)
                    return new ApiResponse<ApprovalDetailsDto>
                    {
                        Success = false,
                        Message = "Approval not found",
                    };

                if (
                    approval.RequesterEmployeeId != employeeId
                    && approval.ApproverEmployeeId != employeeId
                )
                {
                    return new ApiResponse<ApprovalDetailsDto>
                    {
                        Success = false,
                        Message = "You do not have access to this approval",
                    };
                }

                var details = new ApprovalDetailsDto
                {
                    ApprovalId = approval.ApprovalId,
                    ApprovalType = approval.ApprovalType,
                    AssignmentId = approval.AssignmentId,
                    SkillId = approval.SkillId,
                    SkillName = approval.Skill?.SkillName,

                    RequesterEmployeeId = approval.RequesterEmployeeId,
                    RequesterName =
                        $"{approval.RequesterEmployee.Userprofile.FirstName} {approval.RequesterEmployee.Userprofile.LastName}",
                    RequesterEmail = approval.RequesterEmployee.Userprofile.PersonalEmail,

                    ApproverEmployeeId = approval.ApproverEmployeeId,
                    ApproverName =
                        approval.ApproverEmployee != null
                            ? $"{approval.ApproverEmployee.Userprofile.FirstName} {approval.ApproverEmployee.Userprofile.LastName}"
                            : null,
                    ApproverEmail = approval.ApproverEmployee?.Userprofile?.PersonalEmail,

                    Status = approval.Status,
                    Notes = approval.Notes,
                    RequestedOn = approval.RequestedOn,
                    UpdatedOn = approval.UpdatedOn,

                    AttachmentId = approval.AttachmentId,
                    AttachmentFileName = approval.Attachment?.FileName,
                    AttachmentFilePath = approval.Attachment?.FilePath,
                    AttachmentFileSize = approval.Attachment?.FileSize,
                    AttachmentType = approval.Attachment?.AttachmentType,

                    UserRole =
                        approval.RequesterEmployeeId == employeeId ? "Requester" : "Approver",
                    CanDownloadAttachment = approval.Attachment != null,
                };

                if (approval.AssignmentId.HasValue && approval.Assignment != null)
                {
                    details.Assignment = new AssignmentDetailsDto
                    {
                        AssignmentId = approval.Assignment.AssignmentId,
                        MenteeName =
                            $"{approval.Assignment.MenteeEmployee.Userprofile.FirstName} {approval.Assignment.MenteeEmployee.Userprofile.LastName}",
                        SmeName =
                            $"{approval.Assignment.Sme.Employee.Userprofile.FirstName} {approval.Assignment.Sme.Employee.Userprofile.LastName}",
                        SkillName = approval.Assignment.Skill.SkillName,
                        Deadline = approval.Assignment.Deadline,
                        Status = approval.Assignment.Status,
                        ProofFilePath = approval.Assignment.ProofFilePath,
                        CompletionNotes = approval.Assignment?.CompletionNotes,

                        CompletionRating = approval.Assignment.CompletionRating,
                    };
                }

                return new ApiResponse<ApprovalDetailsDto> { Success = true, Data = details };
            }
            catch (Exception ex)
            {
                return new ApiResponse<ApprovalDetailsDto>
                {
                    Success = false,
                    Message = "An error occurred while retrieving approval details",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<FileDownloadDto>> GetApprovalAttachment(
            int employeeId,
            int approvalId
        )
        {
            try
            {
                var approval = await _approvalRepository.GetApprovalByIdAsync(approvalId);

                if (
                    approval == null
                    || (
                        approval.RequesterEmployeeId != employeeId
                        && approval.ApproverEmployeeId != employeeId
                    )
                )
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "Approval not found or access denied",
                    };

                if (approval.Attachment == null)
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "No attachment found for this approval",
                    };

                var fileBytes = await _fileStorage.GetFileAsync(approval.Attachment.FilePath);
                var contentType = GetContentType(approval.Attachment.FileName);


                return new ApiResponse<FileDownloadDto>
                {
                    Success = true,
                    Data = new FileDownloadDto
                    {
                        FileBytes = fileBytes,
                        FileName = approval.Attachment.FileName,
                        ContentType = contentType,
                        FileSize = approval.Attachment.FileSize ?? 0,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<FileDownloadDto>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();

            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" =>
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".zip" => "application/zip",
                ".txt" => "text/plain",
                _ => "application/octet-stream",
            };
        }

        public async Task<ApiResponse<FileDownloadDto>> GetAssignmentProof(
            int employeeId,
            int assignmentId
        )
        {
            try
            {
                var assignment = await _assignmentRepository.GetAssignmentByIdAsync(assignmentId);

                if (
                    assignment == null
                    || (
                        assignment.MenteeEmployeeId != employeeId
                        && assignment.Sme.EmployeeId != employeeId
                        && assignment.MenteeEmployee.ReportingManagerEmployeeId != employeeId
                    )
                )
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "Assignment not found or access denied",
                    };

                if (string.IsNullOrEmpty(assignment.ProofFilePath))
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "No proof document found for this assignment",
                    };

                var fileBytes = await _fileStorage.GetFileAsync(assignment.ProofFilePath);
                var fileName = Path.GetFileName(assignment.ProofFilePath);

                return new ApiResponse<FileDownloadDto>
                {
                    Success = true,
                    Data = new FileDownloadDto
                    {
                        FileBytes = fileBytes,
                        FileName = fileName,
                        ContentType = "application/octet-stream",
                        FileSize = fileBytes.Length,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<FileDownloadDto>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<FileDownloadDto>> PreviewApprovalAttachment(
            int employeeId,
            int approvalId
        )
        {
            try
            {
                var approval = await _approvalRepository.GetApprovalByIdAsync(approvalId);

                if (
                    approval == null
                    || (
                        approval.RequesterEmployeeId != employeeId
                        && approval.ApproverEmployeeId != employeeId
                    )
                )
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "Approval not found or access denied",
                    };

                if (approval.Attachment == null)
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "No attachment found",
                    };

                var (fileBytes, contentType, fileName) =
                    await _fileStorage.GetFileForPreviewAsync(approval.Attachment.FilePath);

                return new ApiResponse<FileDownloadDto>
                {
                    Success = true,
                    Data = new FileDownloadDto
                    {
                        FileBytes = fileBytes,
                        FileName = fileName,
                        ContentType = contentType,
                        FileSize = fileBytes.Length,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<FileDownloadDto>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<FileDownloadDto>> PreviewAssignmentProof(
            int employeeId,
            int assignmentId
        )
        {
            try
            {
                var assignment = await _assignmentRepository.GetAssignmentByIdAsync(assignmentId);

                if (
                    assignment == null
                    || (
                        assignment.MenteeEmployeeId != employeeId
                        && assignment.Sme.EmployeeId != employeeId
                        && assignment.MenteeEmployee.ReportingManagerEmployeeId != employeeId
                    )
                )
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "Assignment not found or access denied",
                    };

                if (string.IsNullOrEmpty(assignment.ProofFilePath))
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "No proof document found",
                    };

                var (fileBytes, contentType, fileName) =
                    await _fileStorage.GetFileForPreviewAsync(assignment.ProofFilePath);

                return new ApiResponse<FileDownloadDto>
                {
                    Success = true,
                    Data = new FileDownloadDto
                    {
                        FileBytes = fileBytes,
                        FileName = fileName,
                        ContentType = contentType,
                        FileSize = fileBytes.Length,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<FileDownloadDto>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }
    }
}

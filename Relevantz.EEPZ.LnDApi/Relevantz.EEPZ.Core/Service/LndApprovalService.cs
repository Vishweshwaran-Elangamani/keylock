using System.Text.Json;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Serilog;
using MapsterMapper;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class LnDApprovalService : ILnDApprovalService
    {
        private readonly ILnDApprovalRepository _approvalRepository;
        private readonly ILnDSmeRepository _smeRepository;
        private readonly ILnDAssignmentRepository _assignmentRepository;
        private readonly IFileStorageService _fileStorage;
        private readonly ILnDBaseRepository _baseRepository;
        private readonly IMapper _mapper;

        #region Constructor

        public LnDApprovalService(
            ILnDApprovalRepository approvalRepository,
            ILnDSmeRepository smeRepository,
            ILnDAssignmentRepository assignmentRepository,
            IFileStorageService fileStorage,
            ILnDBaseRepository baseRepository,
            IMapper mapper
        )
        {
            _approvalRepository = approvalRepository;
            _smeRepository = smeRepository;
            _assignmentRepository = assignmentRepository;
            _fileStorage = fileStorage;
            _baseRepository = baseRepository;
            _mapper = mapper;
        }

        #endregion

        #region Public Methods

        /// <summary>
        /// Gets approvals assigned to the specified employee as approver, with filtering, sorting and pagination.
        /// </summary>
        public async Task<ApiResponse<PaginatedResponse<ApprovalResponseModel>>> GetMyApprovals(
            int employeeId,
            MyApprovalsRequestModel request
        )
        {
            Log.Information(
                "GetMyApprovals started. EmployeeId={EmployeeId}, ApprovalType={ApprovalType}, Status={Status}, Page={PageNumber}, PageSize={PageSize}, SearchTerm={SearchTerm}",
                employeeId,
                request.ApprovalType ?? "all",
                request.Status ?? "all",
                request.PageNumber,
                request.PageSize,
                request.SearchTerm ?? "none"
            );

            var (items, totalCount) = await _approvalRepository.GetMyApprovals(employeeId, request);

            var sortedItems = ApplyApprovalSorting(
                    items.AsQueryable(),
                    request.SortField,
                    request.SortOrder
                )
                .ToList();

            Log.Information(
                "GetMyApprovals succeeded. EmployeeId={EmployeeId}, Returned={Returned}, Total={Total}",
                employeeId,
                sortedItems.Count,
                totalCount
            );

            return new ApiResponse<PaginatedResponse<ApprovalResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<ApprovalResponseModel>
                {
                    Items = sortedItems,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                },
            };
        }

        /// <summary>
        /// Processes an approval decision (approve or reject) and applies the corresponding business workflow.
        /// </summary>
        public async Task<ApiResponse<bool>> ProcessApproval(
            int approverId,
            ApprovalDecisionRequestModel request
        )
        {
            Log.Information(
                "ProcessApproval started. ApprovalId={ApprovalId}, ApproverId={ApproverId}, IsApproved={IsApproved}",
                request.ApprovalId,
                approverId,
                request.IsApproved
            );

            var approval = await _approvalRepository.GetApprovalById(request.ApprovalId);

            if (approval == null || approval.ApproverEmployeeId != approverId)
            {
                Log.Warning(
                    "ProcessApproval: Approval not found or approver mismatch. ApprovalId={ApprovalId}, ApproverId={ApproverId}",
                    request.ApprovalId,
                    approverId
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.APPROVAL_NOT_FOUND_OR_NOT_APPROVER,
                };
            }

            if (approval.Status != LnDConstants.APPROVAL_STATUS.PENDING)
            {
                Log.Warning(
                    "ProcessApproval: Approval already processed. ApprovalId={ApprovalId}, Status={Status}",
                    request.ApprovalId,
                    approval.Status
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.APPROVAL_ALREADY_PROCESSED,
                };
            }

            approval.Status = request.IsApproved
                ? LnDConstants.APPROVAL_STATUS.APPROVED
                : LnDConstants.APPROVAL_STATUS.REJECTED;
            approval.Notes = request.Notes;
            approval.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

            Log.Debug(
                "ProcessApproval: Status updated. ApprovalId={ApprovalId}, NewStatus={NewStatus}",
                request.ApprovalId,
                approval.Status
            );

            if (request.IsApproved)
            {
                if (approval.ApprovalType == LnDConstants.APPROVAL_TYPE.SME_REGISTRATION)
                {
                    Log.Information(
                        "ProcessApproval: SME registration flow. ApprovalId={ApprovalId}, RequesterEmployeeId={RequesterEmployeeId}, SkillId={SkillId}",
                        approval.ApprovalId,
                        approval.RequesterEmployeeId,
                        approval.SkillId
                    );

                    // KEEP ORIGINAL - No mapper needed here since we're setting all properties manually
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

                    await _smeRepository.AddSme(sme);
                }
                else if (approval.ApprovalType == LnDConstants.APPROVAL_TYPE.SME_REQUEST)
                {
                    Log.Information(
                        "ProcessApproval: SME request flow. ApprovalId={ApprovalId}",
                        approval.ApprovalId
                    );

                    var assignmentDetails = JsonSerializer.Deserialize<Dictionary<string, object>>(
                        approval.Notes
                    );

                    var sme = await _smeRepository.GetSmeFromEmployeeId(assignmentDetails);

                    if (sme == null)
                    {
                        Log.Warning(
                            "ProcessApproval: SME not found for SME_REQUEST. ApprovalId={ApprovalId}",
                            approval.ApprovalId
                        );

                        return new ApiResponse<bool>
                        {
                            Success = false,
                            Message = LnDConstants.RESPONSE_MESSAGES.SME_NOT_FOUND,
                        };
                    }

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

                    await _assignmentRepository.AddAssignment(assignment);
                }
                else if (
                    approval.ApprovalType == LnDConstants.APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT
                )
                {
                    Log.Information(
                        "ProcessApproval: Assignment acknowledgement flow. ApprovalId={ApprovalId}, AssignmentId={AssignmentId}",
                        approval.ApprovalId,
                        approval.AssignmentId
                    );

                    var assignment = await _assignmentRepository.GetAssignmentById(
                        approval.AssignmentId.Value
                    );

                    if (assignment == null)
                    {
                        Log.Warning(
                            "ProcessApproval: Assignment not found. AssignmentId={AssignmentId}",
                            approval.AssignmentId
                        );

                        return new ApiResponse<bool>
                        {
                            Success = false,
                            Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_NOT_FOUND,
                        };
                    }

                    assignment.Status = LnDConstants
                        .ASSIGNMENT_STATUS
                        .PENDING_MANAGER_ACKNOWLEDGEMENT;
                    assignment.UpdatedByEmployeeId = approverId;
                    assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                    await _assignmentRepository.UpdateAssignment(assignment);

                    // KEEP ORIGINAL - No mapper needed here since we're setting all properties manually
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

                    await _approvalRepository.AddApproval(managerApproval);
                }
            }
            else
            {
                if (approval.ApprovalType == LnDConstants.APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT)
                {
                    Log.Information(
                        "ProcessApproval: Rejecting assignment acknowledgement. ApprovalId={ApprovalId}, AssignmentId={AssignmentId}",
                        approval.ApprovalId,
                        approval.AssignmentId
                    );

                    var assignment = await _assignmentRepository.GetAssignmentById(
                        approval.AssignmentId.Value
                    );

                    if (assignment != null)
                    {
                        assignment.Status = LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS;
                        assignment.ProofFilePath = null;
                        assignment.CompletionNotes = null;
                        assignment.UpdatedByEmployeeId = approverId;
                        assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                        await _assignmentRepository.UpdateAssignment(assignment);
                    }
                }
            }

            await _approvalRepository.UpdateApproval(approval);
            await _baseRepository.SaveChanges();

            Log.Information(
                "ProcessApproval succeeded. ApprovalId={ApprovalId}, ApproverId={ApproverId}, IsApproved={IsApproved}",
                request.ApprovalId,
                approverId,
                request.IsApproved
            );

            return new ApiResponse<bool>
            {
                Success = true,
                Message = request.IsApproved
                    ? LnDConstants.RESPONSE_MESSAGES.APPROVAL_PROCESSED_SUCCESS
                    : LnDConstants.RESPONSE_MESSAGES.APPROVAL_REJECTED_SUCCESS,

                Data = true,
            };
        }

        /// <summary>
        /// Gets complete approval history for an employee as requester or approver with filtering and pagination.
        /// Supports role-based filtering (requester/approver/all) and full-text search.
        /// </summary>
        public async Task<ApiResponse<PaginatedResponse<ApprovalResponseModel>>> GetApprovalHistory(
            int employeeId,
            ApprovalHistoryRequestModel request
        )
        {
            Log.Information(
                "GetApprovalHistory started. EmployeeId={EmployeeId}, Role={Role}, ApprovalType={ApprovalType}, Status={Status}, Page={PageNumber}, PageSize={PageSize}",
                employeeId,
                request.Role ?? "all",
                request.ApprovalType ?? "all",
                request.Status ?? "all",
                request.PageNumber,
                request.PageSize
            );

            var pageSize = request.PageSize;
            if (pageSize < 1)
                pageSize = 10;
            if (pageSize > 100)
                pageSize = 100;

            var (items, totalCount) = await _approvalRepository.GetApprovalHistory(
                employeeId,
                request
            );
            var sortedItems = ApplyApprovalSorting(
                    items.AsQueryable(),
                    request.SortField,
                    request.SortOrder
                )
                .ToList();

            Log.Information(
                "GetApprovalHistory succeeded for EmployeeId={EmployeeId}. Returned={Returned}, Total={Total}",
                employeeId,
                sortedItems.Count,
                totalCount
            );

            return new ApiResponse<PaginatedResponse<ApprovalResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<ApprovalResponseModel>
                {
                    Items = sortedItems,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = pageSize,
                },
            };
        }

        /// <summary>
        /// Gets detailed information about a specific approval, including assignment and attachment details, enforcing access control.
        /// </summary>
        public async Task<ApiResponse<ApprovalDetailsResponseModel>> GetApprovalDetails(
            int employeeId,
            int approvalId
        )
        {
            Log.Debug(
                "GetApprovalDetails started. ApprovalId={ApprovalId}, EmployeeId={EmployeeId}",
                approvalId,
                employeeId
            );

            var approval = await _approvalRepository.GetApprovalById(approvalId);

            if (approval == null)
            {
                Log.Warning(
                    "GetApprovalDetails: Approval not found. ApprovalId={ApprovalId}",
                    approvalId
                );

                return new ApiResponse<ApprovalDetailsResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.APPROVAL_NOT_FOUND,
                };
            }

            if (
                approval.RequesterEmployeeId != employeeId
                && approval.ApproverEmployeeId != employeeId
            )
            {
                Log.Warning(
                    "GetApprovalDetails: Access denied. ApprovalId={ApprovalId}, EmployeeId={EmployeeId}",
                    approvalId,
                    employeeId
                );

                return new ApiResponse<ApprovalDetailsResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ACCESS_DENIED,
                };
            }

            var details = _mapper.Map<ApprovalDetailsResponseModel>(approval);
            
         
            details.UserRole =
                approval.RequesterEmployeeId == employeeId
                    ? LnDConstants.ROLE_FILTERS.REQUESTER
                    : LnDConstants.ROLE_FILTERS.APPROVER;
            details.CanDownloadAttachment = approval.Attachment != null;
            if (approval.AssignmentId.HasValue && approval.Assignment != null)
            {
                if (details.Assignment == null)
                {
                    details.Assignment = _mapper.Map<AssignmentDetailsResponseModel>(approval.Assignment);
                }
            }

            Log.Debug(
                "GetApprovalDetails succeeded. ApprovalId={ApprovalId}, EmployeeId={EmployeeId}",
                approvalId,
                employeeId
            );

            return new ApiResponse<ApprovalDetailsResponseModel> { Success = true, Data = details };
        }

        /// <summary>
        /// Downloads the attachment associated with an approval, after validating access for the employee.
        /// </summary>
        public async Task<ApiResponse<FileDownloadResponseModel>> GetApprovalAttachment(
            int employeeId,
            int approvalId
        )
        {
            Log.Information(
                "GetApprovalAttachment started. ApprovalId={ApprovalId}, EmployeeId={EmployeeId}",
                approvalId,
                employeeId
            );

            var approval = await _approvalRepository.GetApprovalById(approvalId);

            if (
                approval == null
                || (
                    approval.RequesterEmployeeId != employeeId
                    && approval.ApproverEmployeeId != employeeId
                )
            )
            {
                Log.Warning(
                    "GetApprovalAttachment: Approval not found or access denied. ApprovalId={ApprovalId}, EmployeeId={EmployeeId}",
                    approvalId,
                    employeeId
                );

                return new ApiResponse<FileDownloadResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ATTACHMENT_ACCESS_DENIED,
                };
            }

            if (approval.Attachment == null)
            {
                Log.Warning(
                    "GetApprovalAttachment: No attachment for ApprovalId={ApprovalId}",
                    approvalId
                );

                return new ApiResponse<FileDownloadResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ATTACHMENT_NOT_FOUND,
                };
            }

            var fileBytes = await _fileStorage.GetFileAsync(approval.Attachment.FilePath);
            var contentType = _fileStorage.GetContentType(approval.Attachment.FileName);

            Log.Information(
                "GetApprovalAttachment succeeded. ApprovalId={ApprovalId}, FileName={FileName}, FileSize={FileSize}",
                approvalId,
                approval.Attachment.FileName,
                fileBytes.Length
            );

            return new ApiResponse<FileDownloadResponseModel>
            {
                Success = true,
                Data = new FileDownloadResponseModel
                {
                    FileBytes = fileBytes,
                    FileName = approval.Attachment.FileName,
                    ContentType = contentType,
                    FileSize = approval.Attachment.FileSize ?? 0,
                },
            };
        }

        /// <summary>
        /// Downloads the proof document of an assignment, enforcing mentee, SME, or manager access control.
        /// </summary>
        public async Task<ApiResponse<FileDownloadResponseModel>> GetAssignmentProof(
            int employeeId,
            int assignmentId
        )
        {
            Log.Information(
                "GetAssignmentProof started. AssignmentId={AssignmentId}, EmployeeId={EmployeeId}",
                assignmentId,
                employeeId
            );

            var assignment = await _assignmentRepository.GetAssignmentById(assignmentId);

            if (
                assignment == null
                || (
                    assignment.MenteeEmployeeId != employeeId
                    && assignment.Sme.EmployeeId != employeeId
                    && assignment.MenteeEmployee.ReportingManagerEmployeeId != employeeId
                )
            )
            {
                Log.Warning(
                    "GetAssignmentProof: Assignment not found or access denied. AssignmentId={AssignmentId}, EmployeeId={EmployeeId}",
                    assignmentId,
                    employeeId
                );

                return new ApiResponse<FileDownloadResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_ACCESS_DENIED,
                };
            }

            if (string.IsNullOrEmpty(assignment.ProofFilePath))
            {
                Log.Warning(
                    "GetAssignmentProof: No proof document for AssignmentId={AssignmentId}",
                    assignmentId
                );

                return new ApiResponse<FileDownloadResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_PROOF_NOT_FOUND,
                };
            }

            var fileBytes = await _fileStorage.GetFileAsync(assignment.ProofFilePath);
            var fileName = Path.GetFileName(assignment.ProofFilePath);

            Log.Information(
                "GetAssignmentProof succeeded. AssignmentId={AssignmentId}, FileName={FileName}, FileSize={FileSize}",
                assignmentId,
                fileName,
                fileBytes.Length
            );

            return new ApiResponse<FileDownloadResponseModel>
            {
                Success = true,
                Data = new FileDownloadResponseModel
                {
                    FileBytes = fileBytes,
                    FileName = fileName,
                    ContentType = "application/octet-stream",
                    FileSize = fileBytes.Length,
                },
            };
        }

        /// <summary>
        /// Returns a preview of an approval attachment for inline viewing, with access checks.
        /// </summary>
        public async Task<ApiResponse<FileDownloadResponseModel>> GetApprovalAttachmentPreview(
            int employeeId,
            int approvalId
        )
        {
            Log.Debug(
                "PreviewApprovalAttachment started. ApprovalId={ApprovalId}, EmployeeId={EmployeeId}",
                approvalId,
                employeeId
            );

            var approval = await _approvalRepository.GetApprovalById(approvalId);

            if (
                approval == null
                || (
                    approval.RequesterEmployeeId != employeeId
                    && approval.ApproverEmployeeId != employeeId
                )
            )
            {
                Log.Warning(
                    "PreviewApprovalAttachment: Approval not found or access denied. ApprovalId={ApprovalId}, EmployeeId={EmployeeId}",
                    approvalId,
                    employeeId
                );

                return new ApiResponse<FileDownloadResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ATTACHMENT_ACCESS_DENIED,
                };
            }

            if (approval.Attachment == null)
            {
                Log.Warning(
                    "PreviewApprovalAttachment: No attachment for ApprovalId={ApprovalId}",
                    approvalId
                );

                return new ApiResponse<FileDownloadResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ATTACHMENT_NOT_FOUND,
                };
            }

            var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreviewAsync(
                approval.Attachment.FilePath
            );

            Log.Debug(
                "PreviewApprovalAttachment succeeded. ApprovalId={ApprovalId}, FileName={FileName}",
                approvalId,
                fileName
            );

            return new ApiResponse<FileDownloadResponseModel>
            {
                Success = true,
                Data = new FileDownloadResponseModel
                {
                    FileBytes = fileBytes,
                    FileName = fileName,
                    ContentType = contentType,
                    FileSize = fileBytes.Length,
                },
            };
        }

        /// <summary>
        /// Returns a preview of an assignment proof document for inline viewing, with access checks.
        /// </summary>
        public async Task<ApiResponse<FileDownloadResponseModel>> GetAssignmentProofPreview(
            int employeeId,
            int assignmentId
        )
        {
            Log.Debug(
                "PreviewAssignmentProof started. AssignmentId={AssignmentId}, EmployeeId={EmployeeId}",
                assignmentId,
                employeeId
            );

            var assignment = await _assignmentRepository.GetAssignmentById(assignmentId);

            if (
                assignment == null
                || (
                    assignment.MenteeEmployeeId != employeeId
                    && assignment.Sme.EmployeeId != employeeId
                    && assignment.MenteeEmployee.ReportingManagerEmployeeId != employeeId
                )
            )
            {
                Log.Warning(
                    "PreviewAssignmentProof: Assignment not found or access denied. AssignmentId={AssignmentId}, EmployeeId={EmployeeId}",
                    assignmentId,
                    employeeId
                );

                return new ApiResponse<FileDownloadResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_ACCESS_DENIED,
                };
            }

            if (string.IsNullOrEmpty(assignment.ProofFilePath))
            {
                Log.Warning(
                    "PreviewAssignmentProof: No proof document for AssignmentId={AssignmentId}",
                    assignmentId
                );

                return new ApiResponse<FileDownloadResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_PROOF_NOT_FOUND,
                };
            }

            var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreviewAsync(
                assignment.ProofFilePath
            );

            Log.Debug(
                "PreviewAssignmentProof succeeded. AssignmentId={AssignmentId}, FileName={FileName}",
                assignmentId,
                fileName
            );

            return new ApiResponse<FileDownloadResponseModel>
            {
                Success = true,
                Data = new FileDownloadResponseModel
                {
                    FileBytes = fileBytes,
                    FileName = fileName,
                    ContentType = contentType,
                    FileSize = fileBytes.Length,
                },
            };
        }

        #endregion

        private IQueryable<ApprovalResponseModel> ApplyApprovalSorting(
            IQueryable<ApprovalResponseModel> query,
            string? sortField,
            string? sortOrder
        )
        {
            bool isAscending =
                string.IsNullOrEmpty(sortOrder)
                || sortOrder.Equals(
                    LnDConstants.SORT_ORDER.ASC,
                    StringComparison.OrdinalIgnoreCase
                );

            return sortField?.ToLower() switch
            {
                LnDConstants.SORT_FIELDS.APPROVAL_TYPE => isAscending
                    ? query.OrderBy(a => a.ApprovalType)
                    : query.OrderByDescending(a => a.ApprovalType),

                LnDConstants.SORT_FIELDS.REQUESTER_NAME => isAscending
                    ? query.OrderBy(a => a.RequesterName)
                    : query.OrderByDescending(a => a.RequesterName),

                LnDConstants.SORT_FIELDS.APPROVER_NAME => isAscending
                    ? query.OrderBy(a => a.ApproverName)
                    : query.OrderByDescending(a => a.ApproverName),

                LnDConstants.SORT_FIELDS.REQUESTED_ON => isAscending
                    ? query.OrderBy(a => a.RequestedOn)
                    : query.OrderByDescending(a => a.RequestedOn),

                LnDConstants.SORT_FIELDS.STATUS => isAscending
                    ? query.OrderBy(a => a.Status)
                    : query.OrderByDescending(a => a.Status),

                _ => query.OrderByDescending(a => a.RequestedOn),
            };
        }
    }
}

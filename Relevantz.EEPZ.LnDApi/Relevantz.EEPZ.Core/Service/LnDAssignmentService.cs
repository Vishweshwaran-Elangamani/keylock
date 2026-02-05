using System.Text.Json;
using ClosedXML.Excel;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Serilog;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class LnDAssignmentService : ILnDAssignmentService
    {
        #region Dependencies

        private readonly ILnDAssignmentRepository _assignmentRepository;
        private readonly ILnDEmployeeSkillRepository _skillRepository;
        private readonly ILnDApprovalRepository _approvalRepository;
        private readonly IFileStorageService _fileStorage;
        private readonly ILnDBaseRepository _baseRepository;

        public LnDAssignmentService(
            ILnDAssignmentRepository assignmentRepository,
            ILnDEmployeeSkillRepository skillRepository,
            ILnDApprovalRepository approvalRepository,
            IFileStorageService fileStorage,
            ILnDBaseRepository baseRepository
        )
        {
            _assignmentRepository = assignmentRepository;
            _skillRepository = skillRepository;
            _approvalRepository = approvalRepository;
            _fileStorage = fileStorage;
            _baseRepository = baseRepository;
        }

        #endregion

        #region Assignment Operations

        /// <summary>
        /// Checks and marks assignments as overdue based on deadline and current status
        /// </summary>
        public async Task<ApiResponse<int>> CheckAndMarkOverdueAssignments()
        {
            Log.Information("CheckAndMarkOverdueAssignments started");

            var overdueAssignments = await _assignmentRepository.GetOverdueAssignments();

            if (!overdueAssignments.Any())
            {
                Log.Information("No overdue assignments found");

                return new ApiResponse<int>
                {
                    Success = true,
                    Message = LnDConstants.RESPONSE_MESSAGES.OVERDUE_ASSIGNMENTS_MARKED,
                    Data = 0,
                };
            }

            foreach (var assignment in overdueAssignments)
            {
                assignment.Status = LnDConstants.ASSIGNMENT_STATUS.OVERDUE;
                assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);
            }

            await _baseRepository.SaveChanges();

            Log.Information(
                "CheckAndMarkOverdueAssignments completed. OverdueCount={Count}",
                overdueAssignments.Count
            );

            return new ApiResponse<int>
            {
                Success = true,
                Message =
                    $"{overdueAssignments.Count} {LnDConstants.RESPONSE_MESSAGES.OVERDUE_ASSIGNMENTS_MARKED}",
                Data = overdueAssignments.Count,
            };
        }

        /// <summary>
        /// Creates an SME assignment request for a team member requiring skill development
        /// </summary>
        public async Task<ApiResponse<int>> RequestSmeAssignment(
            int managerId,
            SmeRequestModel request
        )
        {
            Log.Information(
                "RequestSmeAssignment started. ManagerId={ManagerId}, MenteeId={MenteeId}, SkillId={SkillId}, MentorId={MentorId}",
                managerId,
                request.MenteeEmployeeId,
                request.SkillId,
                request.MentorEmployeeId
            );

            var mentee = await _skillRepository.GetEmployeeById(request.MenteeEmployeeId);

            if (mentee == null || mentee.ReportingManagerEmployeeId != managerId)
            {
                Log.Warning(
                    "RequestSmeAssignment: Employee validation failed. MenteeId={MenteeId}, ManagerId={ManagerId}",
                    request.MenteeEmployeeId,
                    managerId
                );

                return new ApiResponse<int>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.EMPLOYEE_NOT_FOUND_OR_NOT_SUBORDINATE,
                };
            }

            var skillMapping = await _skillRepository.GetEmployeeSkillMapping(
                request.MenteeEmployeeId,
                request.SkillId
            );

            if (skillMapping == null || skillMapping.Rating >= LnDConstants.MIN_REQUEST_SME_RATING)
            {
                Log.Warning(
                    "RequestSmeAssignment: Skill rating validation failed. MenteeId={MenteeId}, SkillId={SkillId}, Rating={Rating}",
                    request.MenteeEmployeeId,
                    request.SkillId,
                    skillMapping?.Rating
                );

                return new ApiResponse<int>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.SKILL_RATING_TOO_HIGH_FOR_SME_REQUEST,
                };
            }

            var approval = new Lndapproval
            {
                ApprovalType = LnDConstants.APPROVAL_TYPE.SME_REQUEST,
                SkillId = request.SkillId,
                RequesterEmployeeId = managerId,
                ApproverEmployeeId = request.MentorEmployeeId,
                Status = LnDConstants.APPROVAL_STATUS.PENDING,
                Notes = JsonSerializer.Serialize(
                    new
                    {
                        MenteeEmployeeId = request.MenteeEmployeeId,
                        SmeId = request.MentorEmployeeId,
                        SkillId = request.SkillId,
                        Deadline = request.Deadline,
                        ManagerId = managerId,
                    }
                ),
                RequestedOn = DateOnly.FromDateTime(DateTime.Now),
            };

            await _approvalRepository.AddApproval(approval);
            await _baseRepository.SaveChanges();

            Log.Information(
                "RequestSmeAssignment succeeded. ApprovalId={ApprovalId}, MenteeId={MenteeId}, MentorId={MentorId}",
                approval.ApprovalId,
                request.MenteeEmployeeId,
                request.MentorEmployeeId
            );

            return new ApiResponse<int>
            {
                Success = true,
                Message = LnDConstants.RESPONSE_MESSAGES.SME_ASSIGNMENT_REQUEST_SUCCESS,

                Data = approval.ApprovalId,
            };
        }

        /// <summary>
        /// Uploads completion proof document and creates approval request for SME acknowledgement
        /// </summary>
        public async Task<ApiResponse<bool>> UploadCompletionProof(
            int employeeId,
            UploadCompletionProofRequestModel request
        )
        {
            Log.Information(
                "UploadCompletionProof started. EmployeeId={EmployeeId}, AssignmentId={AssignmentId}, FileName={FileName}",
                employeeId,
                request.AssignmentId,
                request.ProofDocument?.FileName
            );

            var assignment = await _assignmentRepository.GetAssignmentById(request.AssignmentId);

            if (assignment == null || assignment.MenteeEmployeeId != employeeId)
            {
                Log.Warning(
                    "UploadCompletionProof: Assignment not found or access denied. AssignmentId={AssignmentId}, EmployeeId={EmployeeId}",
                    request.AssignmentId,
                    employeeId
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_NOT_FOUND,
                };
            }

            if (assignment.Status != LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS)
            {
                Log.Warning(
                    "UploadCompletionProof: Invalid assignment status. AssignmentId={AssignmentId}, Status={Status}",
                    request.AssignmentId,
                    assignment.Status
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_NOT_IN_PROGRESS,
                };
            }

            var filePath = await _fileStorage.SaveFileAsync(
                request.ProofDocument,
                "completion-proofs"
            );

            Log.Debug("UploadCompletionProof: File saved. FilePath={FilePath}", filePath);

            var attachment = new Lndattachment
            {
                FileName = request.ProofDocument.FileName,
                FilePath = filePath,
                FileSize = request.ProofDocument.Length,
                AttachmentType = LnDConstants.ATTACHMENT_TYPE.COMPLETION_PROOF,
                CreatedByEmployeeId = employeeId,
                CreatedOn = DateOnly.FromDateTime(DateTime.Now),
            };

            await _approvalRepository.AddAttachment(attachment);
            await _baseRepository.SaveChanges();

            assignment.ProofFilePath = filePath;
            assignment.CompletionNotes = request.CompletionNotes;
            assignment.Status = LnDConstants.ASSIGNMENT_STATUS.PENDING_SME_ACKNOWLEDGEMENT;
            assignment.UpdatedByEmployeeId = employeeId;
            assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

            var approval = new Lndapproval
            {
                ApprovalType = LnDConstants.APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT,
                AssignmentId = assignment.AssignmentId,
                SkillId = assignment.SkillId,
                AttachmentId = attachment.AttachmentId,
                RequesterEmployeeId = employeeId,
                ApproverEmployeeId = assignment.Sme.EmployeeId,
                Status = LnDConstants.APPROVAL_STATUS.PENDING,
                RequestedOn = DateOnly.FromDateTime(DateTime.Now),
            };

            await _approvalRepository.AddApproval(approval);
            await _assignmentRepository.UpdateAssignment(assignment);
            await _baseRepository.SaveChanges();

            Log.Information(
                "UploadCompletionProof succeeded. AssignmentId={AssignmentId}, ApprovalId={ApprovalId}, SmeId={SmeId}",
                request.AssignmentId,
                approval.ApprovalId,
                assignment.Sme.EmployeeId
            );

            return new ApiResponse<bool>
            {
                Success = true,
                Message = LnDConstants.RESPONSE_MESSAGES.COMPLETION_PROOF_UPLOAD_SUCCESS,

                Data = true,
            };
        }

        /// <summary>
        /// Completes assignment with rating update and marks associated approval as approved
        /// </summary>
        public async Task<ApiResponse<bool>> CompleteAssignment(
            int managerId,
            CompleteAssignmentRequestModel request
        )
        {
            Log.Information(
                "CompleteAssignment started. ManagerId={ManagerId}, AssignmentId={AssignmentId}, NewRating={NewRating}",
                managerId,
                request.AssignmentId,
                request.NewRating
            );

            var assignment = await _assignmentRepository.GetAssignmentById(request.AssignmentId);

            if (
                assignment == null
                || assignment.MenteeEmployee.ReportingManagerEmployeeId != managerId
            )
            {
                Log.Warning(
                    "CompleteAssignment: Assignment not found or access denied. AssignmentId={AssignmentId}, ManagerId={ManagerId}",
                    request.AssignmentId,
                    managerId
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_ACCESS_DENIED,
                };
            }

            if (assignment.Status != LnDConstants.ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT)
            {
                Log.Warning(
                    "CompleteAssignment: Invalid assignment status. AssignmentId={AssignmentId}, Status={Status}",
                    request.AssignmentId,
                    assignment.Status
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_NOT_READY_FOR_COMPLETION,
                };
            }

            var skillMapping = await _skillRepository.GetEmployeeSkillMapping(
                assignment.MenteeEmployeeId,
                assignment.SkillId
            );

            if (skillMapping != null)
            {
                Log.Debug(
                    "CompleteAssignment: Updating skill rating. MenteeId={MenteeId}, SkillId={SkillId}, OldRating={OldRating}, NewRating={NewRating}",
                    assignment.MenteeEmployeeId,
                    assignment.SkillId,
                    skillMapping.Rating,
                    request.NewRating
                );

                skillMapping.Rating = request.NewRating;
                skillMapping.UpdatedByEmployeeId = managerId;
                skillMapping.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);
                await _skillRepository.UpdateEmployeeSkill(skillMapping);
            }

            assignment.Status = LnDConstants.ASSIGNMENT_STATUS.COMPLETED;
            assignment.CompletionRating = request.NewRating;
            assignment.CompletionNotes = request.Notes;
            assignment.UpdatedByEmployeeId = managerId;
            assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

            await _assignmentRepository.UpdateAssignment(assignment);

            var pendingApproval = await _approvalRepository.GetPendingAssignmentApproval(
                assignment.AssignmentId,
                LnDConstants.APPROVAL_TYPE.ASSIGNMENT_COMPLETION
            );

            if (pendingApproval != null)
            {
                pendingApproval.Status = LnDConstants.APPROVAL_STATUS.APPROVED;
                pendingApproval.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);
                pendingApproval.Notes = request.Notes;
                await _approvalRepository.UpdateApproval(pendingApproval);

                Log.Debug(
                    "CompleteAssignment: Approval updated. ApprovalId={ApprovalId}",
                    pendingApproval.ApprovalId
                );
            }

            await _baseRepository.SaveChanges();

            Log.Information(
                "CompleteAssignment succeeded. AssignmentId={AssignmentId}, MenteeId={MenteeId}, NewRating={NewRating}",
                request.AssignmentId,
                assignment.MenteeEmployeeId,
                request.NewRating
            );

            return new ApiResponse<bool>
            {
                Success = true,
                Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_COMPLETED_SUCCESS,
                Data = true,
            };
        }

        #endregion

        #region Assignment Retrieval

        /// <summary>
        /// Gets paginated assignments for the employee as mentee with overdue calculation
        /// </summary>
        public async Task<ApiResponse<PaginatedResponse<AssignmentResponseModel>>> GetMyAssignments(
            int employeeId,
            AssignmentRequestModel request
        )
        {
            Log.Information(
                "GetMyAssignments started. EmployeeId={EmployeeId}, StatusFilter={StatusFilter}, Page={PageNumber}",
                employeeId,
                request.StatusFilter ?? "all",
                request.PageNumber
            );

            var (items, totalCount) = await _assignmentRepository.GetMyAssignments(
                employeeId,
                request
            );

            var sortedItems = ApplyAssignmentSorting(
                    items.AsQueryable(),
                    request.SortField,
                    request.SortOrder
                )
                .ToList();

            var today = DateTime.Now.Date;

            foreach (var item in items)
            {
                var isOverdue =
                    item.Deadline.HasValue
                    && item.Deadline.Value.Date < today
                    && item.Status != LnDConstants.ASSIGNMENT_STATUS.COMPLETED;

                item.IsOverdue = isOverdue;
                item.DaysOverdue =
                    isOverdue && item.Deadline.HasValue
                        ? (int)(today - item.Deadline.Value.Date).TotalDays
                        : null;
            }

            Log.Information(
                "GetMyAssignments succeeded. EmployeeId={EmployeeId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                employeeId,
                items.Count,
                totalCount
            );

            return new ApiResponse<PaginatedResponse<AssignmentResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<AssignmentResponseModel>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                },
            };
        }

        /// <summary>
        /// Gets paginated assignments for manager's team members with overdue calculation
        /// </summary>
        public async Task<
            ApiResponse<PaginatedResponse<AssignmentResponseModel>>
        > GetTeamAssignments(int managerId, AssignmentRequestModel request)
        {
            Log.Information(
                "GetTeamAssignments started. ManagerId={ManagerId}, StatusFilter={StatusFilter}, Page={PageNumber}",
                managerId,
                request.StatusFilter ?? "all",
                request.PageNumber
            );

            var (items, totalCount) = await _assignmentRepository.GetTeamAssignments(
                managerId,
                request
            );

            var sortedItems = ApplyAssignmentSorting(
                    items.AsQueryable(),
                    request.SortField,
                    request.SortOrder
                )
                .ToList();

            var today = DateTime.Now.Date;

            foreach (var item in sortedItems)
            {
                var isOverdue =
                    item.Deadline.HasValue
                    && item.Deadline.Value.Date < today
                    && item.Status != LnDConstants.ASSIGNMENT_STATUS.COMPLETED;

                item.IsOverdue = isOverdue;
                item.DaysOverdue =
                    isOverdue && item.Deadline.HasValue
                        ? (int)(today - item.Deadline.Value.Date).TotalDays
                        : null;
            }

            Log.Information(
                "GetTeamAssignments succeeded. ManagerId={ManagerId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                managerId,
                sortedItems.Count,
                totalCount
            );

            return new ApiResponse<PaginatedResponse<AssignmentResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<AssignmentResponseModel>
                {
                    Items = sortedItems,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                },
            };
        }

        /// <summary>
        /// Gets paginated assignments where the employee is the assigned SME
        /// </summary>
        public async Task<
            ApiResponse<PaginatedResponse<AssignmentResponseModel>>
        > GetSmeAssignments(int smeEmployeeId, AssignmentRequestModel request)
        {
            Log.Information(
                "GetSmeAssignments started. SmeEmployeeId={SmeEmployeeId}, StatusFilter={StatusFilter}, SearchTerm={SearchTerm}, SortField={SortField}, SortOrder={SortOrder}, Page={PageNumber}, PageSize={PageSize}",
                smeEmployeeId,
                request.StatusFilter ?? "all",
                request.SearchTerm ?? "none",
                request.SortField ?? "default",
                request.SortOrder ?? "default",
                request.PageNumber,
                request.PageSize
            );

            var (items, totalCount) = await _assignmentRepository.GetSmeAssignments(
                smeEmployeeId,
                request
            );

            Log.Debug(
                "GetSmeAssignments: Retrieved {ItemCount} items from repository. TotalCount={TotalCount}",
                items.Count,
                totalCount
            );

            var sortedItems = ApplySmeAssignmentSorting(
                    items.AsQueryable(),
                    request.SortField,
                    request.SortOrder
                )
                .ToList();

            var today = DateTime.Now.Date;
            Log.Debug("GetSmeAssignments: Current date for overdue calculation: {Today}", today);

            int overdueCount = 0;

            foreach (var item in sortedItems)
            {
                var deadlineDate = item.Deadline?.Date;
                var isCompleted = item.Status == LnDConstants.ASSIGNMENT_STATUS.COMPLETED;

                var isOverdue = deadlineDate.HasValue && deadlineDate.Value < today && !isCompleted;

                item.IsOverdue = isOverdue;
                item.DaysOverdue =
                    isOverdue && deadlineDate.HasValue
                        ? (int)(today - deadlineDate.Value).TotalDays
                        : null;

                if (isOverdue)
                {
                    overdueCount++;
                    Log.Debug(
                        "GetSmeAssignments: Overdue assignment detected. AssignmentId={AssignmentId}, Deadline={Deadline}, DaysOverdue={DaysOverdue}, Status={Status}",
                        item.AssignmentId,
                        deadlineDate,
                        item.DaysOverdue,
                        item.Status
                    );
                }
            }

            Log.Information(
                "GetSmeAssignments succeeded. SmeEmployeeId={SmeEmployeeId}, ReturnedCount={Count}, TotalCount={TotalCount}, OverdueCount={OverdueCount}",
                smeEmployeeId,
                sortedItems.Count,
                totalCount,
                overdueCount
            );

            return new ApiResponse<PaginatedResponse<AssignmentResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<AssignmentResponseModel>
                {
                    Items = sortedItems,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                },
            };
        }

        #endregion

        #region Export

        /// <summary>
        /// Exports team assignments to Excel with formatted headers and data columns
        /// </summary>
        public async Task<ApiResponse<byte[]>> GetTeamAssignmentsForExport(
            int managerId,
            ExportAssignmentRequestModel request
        )
        {
            Log.Information(
                "ExportTeamAssignmentsToExcel started. ManagerId={ManagerId}, StatusFilter={StatusFilter}",
                managerId,
                request.StatusFilter ?? "all"
            );

            var items = await _assignmentRepository.GetAllTeamAssignmentsForExport(
                managerId,
                request
            );

            var sortedItems = ApplyAssignmentEntitySorting(
                    items.AsQueryable(),
                    request.SortField,
                    request.SortOrder
                )
                .ToList();

            Log.Debug(
                "ExportTeamAssignmentsToExcel: Retrieved {Count} assignments for export",
                sortedItems.Count
            );

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add(LnDConstants.TEAM_EXPORT.TITLE);

                worksheet.Cell(1, 1).Value = LnDConstants.TEAM_EXPORT.EMPLOYEE_NAME;
                worksheet.Cell(1, 2).Value = LnDConstants.TEAM_EXPORT.SKILL_NAME;
                worksheet.Cell(1, 3).Value = LnDConstants.TEAM_EXPORT.SME_ASSIGNED;
                worksheet.Cell(1, 4).Value = LnDConstants.TEAM_EXPORT.ASSIGNMENT_STATUS;
                worksheet.Cell(1, 5).Value = LnDConstants.TEAM_EXPORT.START_DATE;
                worksheet.Cell(1, 6).Value = LnDConstants.TEAM_EXPORT.DUE_DATE;
                worksheet.Cell(1, 7).Value = LnDConstants.TEAM_EXPORT.SCORE;
                worksheet.Cell(1, 8).Value = LnDConstants.TEAM_EXPORT.COMMENTS;

                var headerRange = worksheet.Range(1, 1, 1, 8);
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Fill.BackgroundColor = XLColor.FromArgb(39, 35, 92);
                headerRange.Style.Font.FontColor = XLColor.White;
                headerRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                int row = 2;

                foreach (var assignment in sortedItems)
                {
                    var menteeName =
                        $"{assignment.MenteeEmployee?.Userprofile?.FirstName ?? ""} "
                        + $"{assignment.MenteeEmployee?.Userprofile?.LastName ?? ""}".Trim();

                    var skillName = assignment.Skill?.SkillName ?? "N/A";

                    var smeName =
                        $"{assignment.Sme?.Employee?.Userprofile?.FirstName ?? ""} "
                        + $"{assignment.Sme?.Employee?.Userprofile?.LastName ?? ""}".Trim();

                    worksheet.Cell(row, 1).Value = menteeName;
                    worksheet.Cell(row, 2).Value = skillName;
                    worksheet.Cell(row, 3).Value = smeName;
                    worksheet.Cell(row, 4).Value = assignment.Status ?? "N/A";
                    worksheet.Cell(row, 5).Value =
                        assignment.CreatedOn?.ToString("MM/dd/yyyy") ?? "";
                    worksheet.Cell(row, 6).Value =
                        assignment.Deadline?.ToString("MM/dd/yyyy") ?? "";
                    worksheet.Cell(row, 7).Value = assignment.CompletionRating?.ToString() ?? "N/A";
                    worksheet.Cell(row, 8).Value = assignment.CompletionNotes ?? "";

                    row++;
                }

                worksheet.Columns().AdjustToContents();

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    var fileBytes = stream.ToArray();

                    Log.Information(
                        "ExportTeamAssignmentsToExcel succeeded. ManagerId={ManagerId}, AssignmentCount={Count}, FileSize={FileSize} bytes",
                        managerId,
                        sortedItems.Count,
                        fileBytes.Length
                    );

                    return new ApiResponse<byte[]> { Success = true, Data = fileBytes };
                }
            }
        }

        #endregion


        private IQueryable<AssignmentResponseModel> ApplySmeAssignmentSorting(
            IQueryable<AssignmentResponseModel> query,
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
                LnDConstants.SORT_FIELDS.MENTEE_NAME => isAscending
                    ? query.OrderBy(a => a.MenteeName)
                    : query.OrderByDescending(a => a.MenteeName),

                LnDConstants.SORT_FIELDS.SKILL_NAME => isAscending
                    ? query.OrderBy(a => a.SkillName)
                    : query.OrderByDescending(a => a.SkillName),

                LnDConstants.SORT_FIELDS.STATUS => isAscending
                    ? query.OrderBy(a => a.Status)
                    : query.OrderByDescending(a => a.Status),

                LnDConstants.SORT_FIELDS.CREATED_ON => isAscending
                    ? query.OrderBy(a => a.CreatedOn)
                    : query.OrderByDescending(a => a.CreatedOn),

                LnDConstants.SORT_FIELDS.DEADLINE => isAscending
                    ? query.OrderBy(a => a.Deadline)
                    : query.OrderByDescending(a => a.Deadline),

                LnDConstants.SORT_FIELDS.COMPLETION_RATING => isAscending
                    ? query.OrderBy(a => a.CompletionRating ?? 0)
                    : query.OrderByDescending(a => a.CompletionRating ?? 0),

                _ => query.OrderByDescending(a => a.CreatedOn),
            };
        }

        private IQueryable<AssignmentResponseModel> ApplyAssignmentSorting(
            IQueryable<AssignmentResponseModel> query,
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
                LnDConstants.SORT_FIELDS.MENTEE_NAME => isAscending
                    ? query.OrderBy(a => a.MenteeName)
                    : query.OrderByDescending(a => a.MenteeName),

                LnDConstants.SORT_FIELDS.SKILL_NAME => isAscending
                    ? query.OrderBy(a => a.SkillName)
                    : query.OrderByDescending(a => a.SkillName),

                LnDConstants.SORT_FIELDS.SME_NAME => isAscending
                    ? query.OrderBy(a => a.SmeName)
                    : query.OrderByDescending(a => a.SmeName),

                LnDConstants.SORT_FIELDS.STATUS => isAscending
                    ? query.OrderBy(a => a.Status)
                    : query.OrderByDescending(a => a.Status),

                LnDConstants.SORT_FIELDS.CREATED_ON => isAscending
                    ? query.OrderBy(a => a.CreatedOn)
                    : query.OrderByDescending(a => a.CreatedOn),

                LnDConstants.SORT_FIELDS.DEADLINE => isAscending
                    ? query.OrderBy(a => a.Deadline)
                    : query.OrderByDescending(a => a.Deadline),

                LnDConstants.SORT_FIELDS.COMPLETION_RATING => isAscending
                    ? query.OrderBy(a => a.CompletionRating ?? 0)
                    : query.OrderByDescending(a => a.CompletionRating ?? 0),

                _ => query.OrderByDescending(a => a.CreatedOn),
            };
        }

        private IQueryable<Lndassignment> ApplyAssignmentEntitySorting(
            IQueryable<Lndassignment> query,
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
                LnDConstants.SORT_FIELDS.MENTEE_NAME => isAscending
                    ? query
                        .OrderBy(a => a.MenteeEmployee.Userprofile.FirstName)
                        .ThenBy(a => a.MenteeEmployee.Userprofile.LastName)
                    : query
                        .OrderByDescending(a => a.MenteeEmployee.Userprofile.FirstName)
                        .ThenByDescending(a => a.MenteeEmployee.Userprofile.LastName),

                LnDConstants.SORT_FIELDS.SKILL_NAME => isAscending
                    ? query.OrderBy(a => a.Skill.SkillName)
                    : query.OrderByDescending(a => a.Skill.SkillName),

                LnDConstants.SORT_FIELDS.SME_NAME => isAscending
                    ? query
                        .OrderBy(a => a.Sme.Employee.Userprofile.FirstName)
                        .ThenBy(a => a.Sme.Employee.Userprofile.LastName)
                    : query
                        .OrderByDescending(a => a.Sme.Employee.Userprofile.FirstName)
                        .ThenByDescending(a => a.Sme.Employee.Userprofile.LastName),

                LnDConstants.SORT_FIELDS.STATUS => isAscending
                    ? query.OrderBy(a => a.Status)
                    : query.OrderByDescending(a => a.Status),

                LnDConstants.SORT_FIELDS.CREATED_ON => isAscending
                    ? query.OrderBy(a => a.CreatedOn)
                    : query.OrderByDescending(a => a.CreatedOn),

                LnDConstants.SORT_FIELDS.DEADLINE => isAscending
                    ? query.OrderBy(a => a.Deadline)
                    : query.OrderByDescending(a => a.Deadline),

                LnDConstants.SORT_FIELDS.COMPLETION_RATING => isAscending
                    ? query.OrderBy(a => a.CompletionRating ?? 0)
                    : query.OrderByDescending(a => a.CompletionRating ?? 0),

                _ => query.OrderByDescending(a => a.CreatedOn),
            };
        }


        /// <summary>
        /// Employee requests to reopen an overdue assignment with explanation notes
        /// </summary>
        public async Task<ApiResponse<int>> RequestAssignmentReopen(
            int employeeId,
            ReopenAssignmentRequestModel request)
        {
            Log.Information(
                "RequestAssignmentReopen started. EmployeeId={EmployeeId}, AssignmentId={AssignmentId}",
                employeeId,
                request.AssignmentId
            );

            var assignment = await _assignmentRepository.GetAssignmentById(request.AssignmentId);

            if (assignment == null || assignment.MenteeEmployeeId != employeeId)
            {
                Log.Warning(
                    "RequestAssignmentReopen: Assignment not found or access denied. AssignmentId={AssignmentId}",
                    request.AssignmentId
                );
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_NOT_FOUND
                };
            }

            // Check if assignment is eligible for reopen
            // Must be IN_PROGRESS and deadline must be in the past
            if (assignment.Status != LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS)
            {
                Log.Warning(
                    "RequestAssignmentReopen: Assignment not in progress. Status={Status}",
                    assignment.Status
                );
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_NOT_ELIGIBLE_FOR_REOPEN
                };
            }

            // Check if assignment is actually overdue
            var today = DateTime.Now.Date;
            var isOverdue = assignment.Deadline.HasValue && assignment.Deadline.Value.Date < today;

            if (!isOverdue)
            {
                Log.Warning(
                    "RequestAssignmentReopen: Assignment is not overdue. Deadline={Deadline}",
                    assignment.Deadline
                );
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = "Assignment deadline has not passed yet. Reopen request is only available for overdue assignments."
                };
            }

            // Check if there's already a pending reopen request
            var existingRequest = await _approvalRepository.GetPendingReopenRequestByAssignment(
                request.AssignmentId);

            if (existingRequest != null)
            {
                Log.Warning(
                    "RequestAssignmentReopen: Pending request exists. AssignmentId={AssignmentId}",
                    request.AssignmentId
                );
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.PENDING_REOPEN_REQUEST_EXISTS
                };
            }

            // Calculate days overdue
            var daysOverdue = assignment.Deadline.HasValue
                ? (int)(today - assignment.Deadline.Value.Date).TotalDays
                : 0;

            // Store request notes in JSON format in the Notes field
            var notesData = new Dictionary<string, object>
    {
        { "RequestNotes", request.RequestNotes },
        { "OriginalDeadline", assignment.Deadline },
        { "DaysOverdue", daysOverdue }
    };

            var approval = new Lndapproval
            {
                ApprovalType = LnDConstants.APPROVAL_TYPE.ASSIGNMENT_REOPEN,
                AssignmentId = request.AssignmentId,
                SkillId = assignment.SkillId,
                RequesterEmployeeId = employeeId,
                ApproverEmployeeId = assignment.MenteeEmployee.ReportingManagerEmployeeId,
                Status = LnDConstants.APPROVAL_STATUS.PENDING,
                Notes = JsonSerializer.Serialize(notesData),
                RequestedOn = DateOnly.FromDateTime(DateTime.Now)
            };

            await _approvalRepository.AddApproval(approval);
            await _baseRepository.SaveChanges();

            Log.Information(
                "RequestAssignmentReopen succeeded. ApprovalId={ApprovalId}, DaysOverdue={DaysOverdue}",
                approval.ApprovalId,
                daysOverdue
            );

            return new ApiResponse<int>
            {
                Success = true,
                Message = LnDConstants.RESPONSE_MESSAGES.REOPEN_REQUEST_SUBMITTED,
                Data = approval.ApprovalId
            };
        }


        /// <summary>
        /// Manager approves or rejects reopen request and sets new deadline if approved
        /// </summary>
        public async Task<ApiResponse<bool>> ProcessReopenRequest(
            int managerId,
            ProcessReopenRequestModel request)
        {
            Log.Information(
                "ProcessReopenRequest started. ManagerId={ManagerId}, ApprovalId={ApprovalId}, IsApproved={IsApproved}",
                managerId,
                request.ApprovalId,
                request.IsApproved
            );

            var approval = await _approvalRepository.GetApprovalById(request.ApprovalId);

            if (approval == null ||
                approval.ApprovalType != LnDConstants.APPROVAL_TYPE.ASSIGNMENT_REOPEN)
            {
                Log.Warning(
                    "ProcessReopenRequest: Approval not found or wrong type. ApprovalId={ApprovalId}",
                    request.ApprovalId
                );
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.APPROVAL_NOT_FOUND_OR_NOT_APPROVER
                };
            }

            // Verify manager has access
            if (approval.ApproverEmployeeId != managerId)
            {
                Log.Warning("ProcessReopenRequest: Access denied. ManagerId={ManagerId}", managerId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.APPROVAL_NOT_FOUND_OR_NOT_APPROVER
                };
            }

            if (approval.Status != LnDConstants.APPROVAL_STATUS.PENDING)
            {
                Log.Warning(
                    "ProcessReopenRequest: Already processed. Status={Status}",
                    approval.Status
                );
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.APPROVAL_ALREADY_PROCESSED
                };
            }

            var assignment = await _assignmentRepository.GetAssignmentById(approval.AssignmentId.Value);

            if (assignment == null)
            {
                Log.Warning(
                    "ProcessReopenRequest: Assignment not found. AssignmentId={AssignmentId}",
                    approval.AssignmentId
                );
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ASSIGNMENT_NOT_FOUND
                };
            }

            if (request.IsApproved)
            {
                if (!request.NewDeadline.HasValue)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = LnDConstants.RESPONSE_MESSAGES.NEW_DEADLINE_REQUIRED
                    };
                }

                // Approve - reopen assignment with new deadline
                approval.Status = LnDConstants.APPROVAL_STATUS.APPROVED;

                // Update notes with manager response and new deadline
                var notesData = JsonSerializer.Deserialize<Dictionary<string, object>>(approval.Notes);
                notesData["ManagerNotes"] = request.ManagerNotes ?? string.Empty;
                notesData["NewDeadline"] = request.NewDeadline.Value;
                approval.Notes = JsonSerializer.Serialize(notesData);

                approval.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                // Update assignment - reopen and set new deadline
                assignment.Status = LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS;
                assignment.Deadline = request.NewDeadline;
                assignment.UpdatedByEmployeeId = managerId;
                assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                await _assignmentRepository.UpdateAssignment(assignment);

                Log.Information(
                    "ProcessReopenRequest: Approved. AssignmentId={AssignmentId}, NewDeadline={NewDeadline}",
                    assignment.AssignmentId,
                    request.NewDeadline
                );
            }
            else
            {
                // Reject request
                approval.Status = LnDConstants.APPROVAL_STATUS.REJECTED;

                // Update notes with manager rejection reason
                var notesData = JsonSerializer.Deserialize<Dictionary<string, object>>(approval.Notes);
                notesData["ManagerNotes"] = request.ManagerNotes ?? string.Empty;
                approval.Notes = JsonSerializer.Serialize(notesData);

                approval.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                Log.Information(
                    "ProcessReopenRequest: Rejected. ApprovalId={ApprovalId}",
                    request.ApprovalId
                );
            }

            await _approvalRepository.UpdateApproval(approval);
            await _baseRepository.SaveChanges();

            return new ApiResponse<bool>
            {
                Success = true,
                Message = request.IsApproved
                    ? LnDConstants.RESPONSE_MESSAGES.REOPEN_REQUEST_APPROVED
                    : LnDConstants.RESPONSE_MESSAGES.REOPEN_REQUEST_REJECTED,
                Data = true
            };
        }

        /// <summary>
        /// Gets employee's own reopen requests
        /// </summary>
        public async Task<ApiResponse<PaginatedResponse<ReopenRequestResponseModel>>> GetMyReopenRequests(
            int employeeId,
            MyApprovalsRequestModel request)
        {
            Log.Information("GetMyReopenRequests started. EmployeeId={EmployeeId}", employeeId);

            var (items, totalCount) = await _approvalRepository.GetMyReopenRequests(employeeId, request);

            return new ApiResponse<PaginatedResponse<ReopenRequestResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<ReopenRequestResponseModel>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                }
            };
        }

        /// <summary>
        /// Gets manager's team reopen requests for approval
        /// </summary>
        public async Task<ApiResponse<PaginatedResponse<ReopenRequestResponseModel>>> GetTeamReopenRequests(
            int managerId,
            MyApprovalsRequestModel request)
        {
            Log.Information("GetTeamReopenRequests started. ManagerId={ManagerId}", managerId);

            var (items, totalCount) = await _approvalRepository.GetTeamReopenRequests(managerId, request);

            return new ApiResponse<PaginatedResponse<ReopenRequestResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<ReopenRequestResponseModel>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                }
            };
        }

    }
}

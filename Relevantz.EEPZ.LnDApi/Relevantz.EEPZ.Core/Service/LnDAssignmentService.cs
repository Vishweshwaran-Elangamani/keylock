using System.Text.Json;
using ClosedXML.Excel;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
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

        /// <summary>Checks and marks assignments as overdue based on deadline and current status.</summary>
        public async Task<ApiResponse<int>> CheckAndMarkOverdueAssignments()
        {
            Log.Information("CheckAndMarkOverdueAssignments started");

            var count = await _assignmentRepository.MarkAssignmentsAsOverdue();

            Log.Information("CheckAndMarkOverdueAssignments completed. OverdueCount={Count}", count);

            return new ApiResponse<int>
            {
                Success = true,
                Message = $"{count} assignment(s) marked as overdue",
                Data = count,
            };
        }

        /// <summary>Creates an SME assignment request for a team member requiring skill development.</summary>
        public async Task<ApiResponse<int>> RequestSmeAssignment(
            int managerId,
            SmeRequestModel request
        )
        {
            Log.Information(
                "RequestSmeAssignment started. ManagerId={ManagerId}, MenteeId={MenteeId}, SkillId={SkillId}, MentorId={MentorId}",
                managerId, request.MenteeEmployeeId, request.SkillId, request.MentorEmployeeId
            );

            var mentee = await _skillRepository.GetEmployeeById(request.MenteeEmployeeId);

            if (mentee == null || mentee.ReportingManagerEmployeeId != managerId)
            {
                Log.Warning(
                    "RequestSmeAssignment: Employee validation failed. MenteeId={MenteeId}, ManagerId={ManagerId}",
                    request.MenteeEmployeeId, managerId
                );

                return new ApiResponse<int>
                {
                    Success = false,
                    Message = "Employee not found or not your subordinate",
                };
            }

            var skillMapping = await _skillRepository.GetEmployeeSkillMapping(
                request.MenteeEmployeeId,
                request.SkillId
            );

            if (
                skillMapping == null
                || skillMapping.Rating >= LnDConstants.MIN_REQUEST_SME_RATING
            )
            {
                Log.Warning(
                    "RequestSmeAssignment: Skill rating validation failed. MenteeId={MenteeId}, SkillId={SkillId}, Rating={Rating}",
                    request.MenteeEmployeeId, request.SkillId, skillMapping?.Rating
                );

                return new ApiResponse<int>
                {
                    Success = false,
                    Message =
                        $"Employee must have a skill rating below {LnDConstants.MIN_REQUEST_SME_RATING} to request SME assignment",
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
            await _baseRepository.SaveChangesAsync();

            Log.Information(
                "RequestSmeAssignment succeeded. ApprovalId={ApprovalId}, MenteeId={MenteeId}, MentorId={MentorId}",
                approval.ApprovalId, request.MenteeEmployeeId, request.MentorEmployeeId
            );

            return new ApiResponse<int>
            {
                Success = true,
                Message = "SME assignment request sent successfully",
                Data = approval.ApprovalId,
            };
        }

        /// <summary>Uploads completion proof document and creates approval request for SME acknowledgement.</summary>
        public async Task<ApiResponse<bool>> UploadCompletionProof(
            int employeeId,
            UploadCompletionProofRequestModel request
        )
        {
            Log.Information(
                "UploadCompletionProof started. EmployeeId={EmployeeId}, AssignmentId={AssignmentId}, FileName={FileName}",
                employeeId, request.AssignmentId, request.ProofDocument?.FileName
            );

            var assignment = await _assignmentRepository.GetAssignmentById(
                request.AssignmentId
            );

            if (assignment == null || assignment.MenteeEmployeeId != employeeId)
            {
                Log.Warning(
                    "UploadCompletionProof: Assignment not found or access denied. AssignmentId={AssignmentId}, EmployeeId={EmployeeId}",
                    request.AssignmentId, employeeId
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Assignment not found",
                };
            }

            if (assignment.Status != LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS)
            {
                Log.Warning(
                    "UploadCompletionProof: Invalid assignment status. AssignmentId={AssignmentId}, Status={Status}",
                    request.AssignmentId, assignment.Status
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Assignment is not in progress",
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
            await _baseRepository.SaveChangesAsync();

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
            await _baseRepository.SaveChangesAsync();

            Log.Information(
                "UploadCompletionProof succeeded. AssignmentId={AssignmentId}, ApprovalId={ApprovalId}, SmeId={SmeId}",
                request.AssignmentId, approval.ApprovalId, assignment.Sme.EmployeeId
            );

            return new ApiResponse<bool>
            {
                Success = true,
                Message =
                    "Completion proof uploaded successfully. Awaiting SME acknowledgement.",
                Data = true,
            };
        }

        /// <summary>Completes assignment with rating update and marks associated approval as approved.</summary>
        public async Task<ApiResponse<bool>> CompleteAssignment(
            int managerId,
            CompleteAssignmentRequestModel request
        )
        {
            Log.Information(
                "CompleteAssignment started. ManagerId={ManagerId}, AssignmentId={AssignmentId}, NewRating={NewRating}",
                managerId, request.AssignmentId, request.NewRating
            );

            var assignment = await _assignmentRepository.GetAssignmentById(
                request.AssignmentId
            );

            if (
                assignment == null
                || assignment.MenteeEmployee.ReportingManagerEmployeeId != managerId
            )
            {
                Log.Warning(
                    "CompleteAssignment: Assignment not found or access denied. AssignmentId={AssignmentId}, ManagerId={ManagerId}",
                    request.AssignmentId, managerId
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Assignment not found or employee not your subordinate",
                };
            }

            if (
                assignment.Status
                != LnDConstants.ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT
            )
            {
                Log.Warning(
                    "CompleteAssignment: Invalid assignment status. AssignmentId={AssignmentId}, Status={Status}",
                    request.AssignmentId, assignment.Status
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Assignment is not ready for completion",
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
                    assignment.MenteeEmployeeId, assignment.SkillId, skillMapping.Rating, request.NewRating
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

            await _baseRepository.SaveChangesAsync();

            Log.Information(
                "CompleteAssignment succeeded. AssignmentId={AssignmentId}, MenteeId={MenteeId}, NewRating={NewRating}",
                request.AssignmentId, assignment.MenteeEmployeeId, request.NewRating
            );

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Assignment completed successfully",
                Data = true,
            };
        }

        #endregion

        #region Assignment Retrieval

        /// <summary>Gets paginated assignments for the employee as mentee with overdue calculation.</summary>

        public async Task<ApiResponse<PaginatedResponse<AssignmentResponseModel>>> GetMyAssignments(
    int employeeId,
    AssignmentRequestModel request
)
        {
            Log.Information(
                "GetMyAssignments started. EmployeeId={EmployeeId}, StatusFilter={StatusFilter}, Page={PageNumber}",
                employeeId, request.StatusFilter ?? "all", request.PageNumber
            );

            var (items, totalCount) = await _assignmentRepository.GetMyAssignments(employeeId, request);

            var today = DateTime.Now.Date;

            foreach (var item in items)
            {
                var isOverdue = item.Deadline.HasValue
                    && item.Deadline.Value.Date < today
                    && item.Status != LnDConstants.ASSIGNMENT_STATUS.COMPLETED;

                item.IsOverdue = isOverdue;
                item.DaysOverdue = isOverdue && item.Deadline.HasValue
                    ? (int)(today - item.Deadline.Value.Date).TotalDays
                    : null;
            }

            Log.Information(
                "GetMyAssignments succeeded. EmployeeId={EmployeeId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                employeeId, items.Count, totalCount
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

        /// <summary>Gets paginated assignments for manager's team members with overdue calculation.</summary>
        public async Task<ApiResponse<PaginatedResponse<AssignmentResponseModel>>> GetTeamAssignments(
     int managerId,
     AssignmentRequestModel request
 )
        {
            Log.Information(
                "GetTeamAssignments started. ManagerId={ManagerId}, StatusFilter={StatusFilter}, Page={PageNumber}",
                managerId, request.StatusFilter ?? "all", request.PageNumber
            );

            var (items, totalCount) = await _assignmentRepository.GetTeamAssignments(managerId, request);

            var today = DateTime.Now.Date;


            foreach (var item in items)
            {
                var isOverdue = item.Deadline.HasValue
                    && item.Deadline.Value.Date < today
                    && item.Status != LnDConstants.ASSIGNMENT_STATUS.COMPLETED;

                item.IsOverdue = isOverdue;
                item.DaysOverdue = isOverdue && item.Deadline.HasValue
                    ? (int)(today - item.Deadline.Value.Date).TotalDays
                    : null;
            }

            Log.Information(
                "GetTeamAssignments succeeded. ManagerId={ManagerId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                managerId, items.Count, totalCount
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

        /// <summary>Gets paginated assignments where the employee is the assigned SME.</summary>
        public async Task<ApiResponse<PaginatedResponse<AssignmentResponseModel>>> GetSmeAssignments(
     int smeEmployeeId,
     AssignmentRequestModel request
 )
        {
            Log.Information(
                "GetSmeAssignments started. SmeEmployeeId={SmeEmployeeId}, StatusFilter={StatusFilter}, SearchTerm={SearchTerm}, SortField={SortField}, SortOrder={SortOrder}, Page={PageNumber}, PageSize={PageSize}",
                smeEmployeeId, request.StatusFilter ?? "all", request.SearchTerm ?? "none", request.SortField ?? "default", request.SortOrder ?? "default", request.PageNumber, request.PageSize
            );

            var (items, totalCount) = await _assignmentRepository.GetSmeAssignments(smeEmployeeId, request);

            Log.Debug("GetSmeAssignments: Retrieved {ItemCount} items from repository. TotalCount={TotalCount}", items.Count, totalCount);

            var today = DateTime.Now.Date;
            Log.Debug("GetSmeAssignments: Current date for overdue calculation: {Today}", today);

            int overdueCount = 0;
            foreach (var item in items)
            {
                var deadlineDate = item.Deadline?.Date;
                var isCompleted = item.Status == LnDConstants.ASSIGNMENT_STATUS.COMPLETED;
                var isOverdue = deadlineDate.HasValue && deadlineDate.Value < today && !isCompleted;

                item.IsOverdue = isOverdue;
                item.DaysOverdue = isOverdue && deadlineDate.HasValue
                    ? (int)(today - deadlineDate.Value).TotalDays
                    : null;

                if (isOverdue)
                {
                    overdueCount++;
                    Log.Debug(
                        "GetSmeAssignments: Overdue assignment detected. AssignmentId={AssignmentId}, Deadline={Deadline}, DaysOverdue={DaysOverdue}, Status={Status}",
                        item.AssignmentId, deadlineDate, item.DaysOverdue, item.Status
                    );
                }
            }

            Log.Information(
                "GetSmeAssignments succeeded. SmeEmployeeId={SmeEmployeeId}, ReturnedCount={Count}, TotalCount={TotalCount}, OverdueCount={OverdueCount}",
                smeEmployeeId, items.Count, totalCount, overdueCount
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

        #endregion

        #region Export

        /// <summary>Exports team assignments to Excel with formatted headers and data columns.</summary>
        public async Task<ApiResponse<byte[]>> ExportTeamAssignmentsToExcel(
            int managerId,
            ExportAssignmentRequestModel request
        )
        {
            Log.Information(
                "ExportTeamAssignmentsToExcel started. ManagerId={ManagerId}, StatusFilter={StatusFilter}",
                managerId, request.StatusFilter ?? "all"
            );

            var allAssignments =
                await _assignmentRepository.GetAllTeamAssignmentsForExport(
                    managerId,
                    request
                );

            Log.Debug(
                "ExportTeamAssignmentsToExcel: Retrieved {Count} assignments for export",
                allAssignments.Count
            );

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Team Assignments");
                worksheet.Cell(1, 1).Value = "Employee Name";
                worksheet.Cell(1, 2).Value = "Skill Name";
                worksheet.Cell(1, 3).Value = "SME Assigned";
                worksheet.Cell(1, 4).Value = "Assignment Status";
                worksheet.Cell(1, 5).Value = "Start Date";
                worksheet.Cell(1, 6).Value = "Due Date";
                worksheet.Cell(1, 7).Value = "Score";
                worksheet.Cell(1, 8).Value = "Comments";

                var headerRange = worksheet.Range(1, 1, 1, 8);
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Fill.BackgroundColor = XLColor.FromArgb(39, 35, 92);
                headerRange.Style.Font.FontColor = XLColor.White;
                headerRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                int row = 2;
                foreach (var assignment in allAssignments)
                {
                    var menteeName =
                        $"{assignment.MenteeEmployee?.Userprofile?.FirstName ?? ""} {assignment.MenteeEmployee?.Userprofile?.LastName ?? ""}".Trim();
                    var skillName = assignment.Skill?.SkillName ?? "N/A";
                    var smeName =
                        $"{assignment.Sme?.Employee?.Userprofile?.FirstName ?? ""} {assignment.Sme?.Employee?.Userprofile?.LastName ?? ""}".Trim();

                    worksheet.Cell(row, 1).Value = menteeName;
                    worksheet.Cell(row, 2).Value = skillName;
                    worksheet.Cell(row, 3).Value = smeName;
                    worksheet.Cell(row, 4).Value = assignment.Status ?? "N/A";
                    worksheet.Cell(row, 5).Value =
                        assignment.CreatedOn?.ToString("MM/dd/yyyy") ?? "";
                    worksheet.Cell(row, 6).Value =
                        assignment.Deadline?.ToString("MM/dd/yyyy") ?? "";
                    worksheet.Cell(row, 7).Value =
                        assignment.CompletionRating?.ToString() ?? "N/A";
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
                        managerId, allAssignments.Count, fileBytes.Length
                    );

                    return new ApiResponse<byte[]> { Success = true, Data = fileBytes };
                }
            }
        }

        #endregion
    }
}

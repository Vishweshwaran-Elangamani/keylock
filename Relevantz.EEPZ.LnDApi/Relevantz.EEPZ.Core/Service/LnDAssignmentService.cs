using System.Text.Json;
using ClosedXML.Excel;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class LnDAssignmentService : ILnDAssignmentService
    {
        private readonly ILnDAssignmentRepository _assignmentRepository;
        private readonly ILnDEmployeeSkillRepository _skillRepository;
        private readonly ILnDApprovalRepository _approvalRepository;
        private readonly IFileStorageService _fileStorage;

        public LnDAssignmentService(
            ILnDAssignmentRepository assignmentRepository,
            ILnDEmployeeSkillRepository skillRepository,
            ILnDApprovalRepository approvalRepository,
            IFileStorageService fileStorage
        )
        {
            _assignmentRepository = assignmentRepository;
            _skillRepository = skillRepository;
            _approvalRepository = approvalRepository;
            _fileStorage = fileStorage;
        }

        public async Task<ApiResponse<int>> CheckAndMarkOverdueAssignments()
        {
            try
            {
                var count = await _assignmentRepository.MarkAssignmentsAsOverdueAsync();

                return new ApiResponse<int>
                {
                    Success = true,
                    Message = $"{count} assignment(s) marked as overdue",
                    Data = count
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = "An error occurred while checking overdue assignments",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<int>> RequestSmeAssignment(
            int managerId,
            SmeRequestDto request
        )
        {
            try
            {
                var mentee = await _skillRepository.GetEmployeeByIdAsync(request.MenteeEmployeeId);

                if (mentee == null || mentee.ReportingManagerEmployeeId != managerId)
                    return new ApiResponse<int>
                    {
                        Success = false,
                        Message = "Employee not found or not your subordinate",
                    };

                var skillMapping = await _skillRepository.GetEmployeeSkillMappingAsync(
                    request.MenteeEmployeeId,
                    request.SkillId
                );

                if (
                    skillMapping == null
                    || skillMapping.Rating >= LnDConstants.MIN_REQUEST_SME_RATING
                )
                    return new ApiResponse<int>
                    {
                        Success = false,
                        Message =
                            $"Employee must have a skill rating below {LnDConstants.MIN_REQUEST_SME_RATING} to request SME assignment",
                    };

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

                await _approvalRepository.AddApprovalAsync(approval);
                await _approvalRepository.SaveChangesAsync();

                return new ApiResponse<int>
                {
                    Success = true,
                    Message = "SME assignment request sent successfully",
                    Data = approval.ApprovalId,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }


        public async Task<ApiResponse<PaginatedResponse<AssignmentDto>>> GetMyAssignments(
            int employeeId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        )
        {
            try
            {
                var (items, totalCount) = await _assignmentRepository.GetMyAssignmentsAsync(
                    employeeId,
                    statusFilter,
                    searchTerm,
                    sortField,
                    sortOrder,
                    pageNumber,
                    pageSize
                );

                var today = DateTime.Now.Date;

                var assignmentDtos = items
                    .Select(a =>
                    {
                        var isOverdue = a.Deadline.HasValue &&
                                       a.Deadline.Value.Date < today &&
                                       a.Status != LnDConstants.ASSIGNMENT_STATUS.COMPLETED;

                        var daysOverdue = isOverdue && a.Deadline.HasValue
                            ? (int)(today - a.Deadline.Value.Date).TotalDays
                            : (int?)null;

                        return new AssignmentDto
                        {
                            AssignmentId = a.AssignmentId,
                            MenteeEmployeeId = a.MenteeEmployeeId,
                            MenteeName = $"{a.MenteeEmployee.Userprofile.FirstName} {a.MenteeEmployee.Userprofile.LastName}",
                            SmeId = a.SmeId,
                            SmeEmployeeId = a.Sme.EmployeeId,
                            SmeName = $"{a.Sme.Employee.Userprofile.FirstName} {a.Sme.Employee.Userprofile.LastName}",
                            SkillId = a.SkillId,
                            SkillName = a.Skill.SkillName,
                            Deadline = a.Deadline,
                            Status = a.Status,
                            ProofFilePath = a.ProofFilePath,
                            CompletionNotes = a.CompletionNotes,
                            CompletionRating = a.CompletionRating,
                            CreatedOn = a.CreatedOn,
                            UpdatedOn = a.UpdatedOn,
                            IsOverdue = isOverdue,
                            DaysOverdue = daysOverdue
                        };
                    })
                    .ToList();

                return new ApiResponse<PaginatedResponse<AssignmentDto>>
                {
                    Success = true,
                    Data = new PaginatedResponse<AssignmentDto>
                    {
                        Items = assignmentDtos,
                        TotalCount = totalCount,
                        PageNumber = pageNumber,
                        PageSize = pageSize,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<AssignmentDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving assignments",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<PaginatedResponse<AssignmentDto>>> GetTeamAssignments(
     int managerId,
     string? statusFilter,
     string? searchTerm,
     string? sortField,
     string? sortOrder,
     int pageNumber,
     int pageSize)
        {
            try
            {
                var (items, totalCount) = await _assignmentRepository.GetTeamAssignmentsAsync(
                    managerId,
                    statusFilter,
                    searchTerm,
                    sortField,
                    sortOrder,
                    pageNumber,
                    pageSize
                );

                var today = DateTime.Now.Date;

                var assignmentDtos = items
                    .Select(a =>
                    {
                        var isOverdue = a.Deadline.HasValue &&
                                       a.Deadline.Value.Date < today &&
                                       a.Status != LnDConstants.ASSIGNMENT_STATUS.COMPLETED;

                        var daysOverdue = isOverdue && a.Deadline.HasValue
                            ? (int)(today - a.Deadline.Value.Date).TotalDays
                            : (int?)null;

                        return new AssignmentDto
                        {
                            AssignmentId = a.AssignmentId,
                            MenteeEmployeeId = a.MenteeEmployeeId,
                            MenteeName = $"{a.MenteeEmployee.Userprofile.FirstName} {a.MenteeEmployee.Userprofile.LastName}",
                            SmeId = a.SmeId,
                            SmeEmployeeId = a.Sme.EmployeeId,
                            SmeName = $"{a.Sme.Employee.Userprofile.FirstName} {a.Sme.Employee.Userprofile.LastName}",
                            SkillId = a.SkillId,
                            SkillName = a.Skill.SkillName,
                            Deadline = a.Deadline,
                            Status = a.Status,
                            ProofFilePath = a.ProofFilePath,
                            CompletionNotes = a.CompletionNotes,
                            CompletionRating = a.CompletionRating,
                            CreatedOn = a.CreatedOn,
                            UpdatedOn = a.UpdatedOn,
                            IsOverdue = isOverdue,
                            DaysOverdue = daysOverdue
                        };
                    })
                    .ToList();

                return new ApiResponse<PaginatedResponse<AssignmentDto>>
                {
                    Success = true,
                    Data = new PaginatedResponse<AssignmentDto>
                    {
                        Items = assignmentDtos,
                        TotalCount = totalCount,
                        PageNumber = pageNumber,
                        PageSize = pageSize,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<AssignmentDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }



        public async Task<ApiResponse<PaginatedResponse<AssignmentDto>>> GetSmeAssignments(
            int smeEmployeeId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        )
        {
            try
            {
                var (items, totalCount) = await _assignmentRepository.GetSmeAssignmentsAsync(
                    smeEmployeeId,
                    statusFilter,
                    searchTerm,
                    sortField,
                    sortOrder,
                    pageNumber,
                    pageSize
                );

                var assignmentDtos = items
                    .Select(a => new AssignmentDto
                    {
                        AssignmentId = a.AssignmentId,
                        MenteeEmployeeId = a.MenteeEmployeeId,
                        MenteeName =
                            $"{a.MenteeEmployee.Userprofile.FirstName} {a.MenteeEmployee.Userprofile.LastName}",
                        SmeId = a.SmeId,
                        SmeEmployeeId = a.Sme.EmployeeId,
                        SmeName =
                            $"{a.Sme.Employee.Userprofile.FirstName} {a.Sme.Employee.Userprofile.LastName}",
                        SkillId = a.SkillId,
                        SkillName = a.Skill.SkillName,
                        Deadline = a.Deadline,
                        Status = a.Status,
                        ProofFilePath = a.ProofFilePath,
                        CompletionNotes = a.CompletionNotes,
                        CompletionRating = a.CompletionRating,
                        CreatedOn = a.CreatedOn,
                        UpdatedOn = a.UpdatedOn,
                    })
                    .ToList();

                return new ApiResponse<PaginatedResponse<AssignmentDto>>
                {
                    Success = true,
                    Data = new PaginatedResponse<AssignmentDto>
                    {
                        Items = assignmentDtos,
                        TotalCount = totalCount,
                        PageNumber = pageNumber,
                        PageSize = pageSize,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<AssignmentDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<bool>> UploadCompletionProof(
      int employeeId,
      UploadCompletionProofRequest request
  )
        {
            try
            {
                var assignment = await _assignmentRepository.GetAssignmentByIdAsync(
                    request.AssignmentId
                );

                if (assignment == null || assignment.MenteeEmployeeId != employeeId)
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Assignment not found",
                    };

                if (assignment.Status != LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS)
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Assignment is not in progress",
                    };

                var filePath = await _fileStorage.SaveFileAsync(
                    request.ProofDocument,
                    "completion-proofs"
                );

                var attachment = new Lndattachment
                {
                    FileName = request.ProofDocument.FileName,
                    FilePath = filePath,
                    FileSize = request.ProofDocument.Length,
                    AttachmentType = LnDConstants.ATTACHMENT_TYPE.COMPLETION_PROOF,
                    CreatedByEmployeeId = employeeId,
                    CreatedOn = DateOnly.FromDateTime(DateTime.Now),
                };


                await _approvalRepository.AddAttachmentAsync(attachment);
                await _approvalRepository.SaveChangesAsync();

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

                await _approvalRepository.AddApprovalAsync(approval);
                await _assignmentRepository.UpdateAssignmentAsync(assignment);
                await _assignmentRepository.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message =
                        "Completion proof uploaded successfully. Awaiting SME acknowledgement.",
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

        public async Task<ApiResponse<bool>> CompleteAssignment(
            int managerId,
            CompleteAssignmentRequest request
        )
        {
            try
            {
                var assignment = await _assignmentRepository.GetAssignmentByIdAsync(
                    request.AssignmentId
                );

                if (
                    assignment == null
                    || assignment.MenteeEmployee.ReportingManagerEmployeeId != managerId
                )
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Assignment not found or employee not your subordinate",
                    };

                if (
                    assignment.Status
                    != LnDConstants.ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT
                )
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Assignment is not ready for completion",
                    };

                var skillMapping = await _skillRepository.GetEmployeeSkillMappingAsync(
                    assignment.MenteeEmployeeId,
                    assignment.SkillId
                );

                if (skillMapping != null)
                {
                    skillMapping.Rating = request.NewRating;
                    skillMapping.UpdatedByEmployeeId = managerId;
                    skillMapping.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);
                    await _skillRepository.UpdateEmployeeSkillAsync(skillMapping);
                }

                assignment.Status = LnDConstants.ASSIGNMENT_STATUS.COMPLETED;
                assignment.CompletionRating = request.NewRating;
                assignment.CompletionNotes = request.Notes;
                assignment.UpdatedByEmployeeId = managerId;
                assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                await _assignmentRepository.UpdateAssignmentAsync(assignment);

                var pendingApproval =
                    await _approvalRepository.GetPendingAssignmentApprovalAsync(
                        assignment.AssignmentId,
                        LnDConstants.APPROVAL_TYPE.ASSIGNMENT_COMPLETION
                    );

                if (pendingApproval != null)
                {
                    pendingApproval.Status = LnDConstants.APPROVAL_STATUS.APPROVED;
                    pendingApproval.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);
                    pendingApproval.Notes = request.Notes;
                    await _approvalRepository.UpdateApprovalAsync(pendingApproval);
                }

                await _assignmentRepository.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Assignment completed successfully",
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

        public async Task<ApiResponse<byte[]>> ExportTeamAssignmentsToExcel(
            int managerId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder
        )
        {
            try
            {
                var allAssignments = await _assignmentRepository.GetAllTeamAssignmentsForExportAsync(
                    managerId,
                    statusFilter,
                    searchTerm,
                    sortField,
                    sortOrder
                );

                using (var workbook = new XLWorkbook())
                {
                    var worksheet = workbook.Worksheets.Add("Team Assignments");

                    // Add headers
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
                            $"{assignment.MenteeEmployee?.Userprofile?.FirstName ?? ""} {assignment.MenteeEmployee?.Userprofile?.LastName ?? ""}"
                                .Trim();
                        var skillName = assignment.Skill?.SkillName ?? "N/A";
                        var smeName =
                            $"{assignment.Sme?.Employee?.Userprofile?.FirstName ?? ""} {assignment.Sme?.Employee?.Userprofile?.LastName ?? ""}"
                                .Trim();

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
                        return new ApiResponse<byte[]>
                        {
                            Success = true,
                            Data = stream.ToArray(),
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<byte[]>
                {
                    Success = false,
                    Message = $"Error exporting assignments: {ex.Message}",
                };
            }
        }
    }
}

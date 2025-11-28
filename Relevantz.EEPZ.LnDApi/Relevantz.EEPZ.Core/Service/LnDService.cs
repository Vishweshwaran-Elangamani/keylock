using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using System.Drawing;
using ClosedXML.Excel;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class LnDService : ILnDService  
    {
     
        private readonly ILnDRepository _repository;
        private readonly IFileStorageService _fileStorage;// NEW

        public LnDService(
            ILnDRepository repository,
            IFileStorageService fileStorage
           ) //  NEW
        {
            _repository = repository;
            _fileStorage = fileStorage;
             //
        }

        #region Employee Skills Management

        public async Task<
            ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
        > GetSubordinateEmployees(int managerId, string? searchTerm, int pageNumber, int pageSize)
        {
            try
            {
                var manager = await _repository.GetEmployeeByIdAsync(managerId);

                if (manager == null)
                {
                    return new ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
                    {
                        Success = false,
                        Message = "Manager not found",
                    };
                }

                var (items, totalCount) = await _repository.GetSubordinateEmployeesAsync(
                    managerId,
                    searchTerm,
                    pageNumber,
                    pageSize
                );

                var employeeDtos = items
                    .Select(e => new SubordinateEmployeeDto
                    {
                        EmployeeId = e.EmployeeId,
                        EmployeeName = $"{e.Userprofile?.FirstName} {e.Userprofile?.LastName}",
                        Email = e.Userauthentication?.Email,
                        DepartmentName = e
                            .Employeedetailsmasters.FirstOrDefault()
                            ?.Department?.DepartmentName,
                    })
                    .ToList();

                var paginatedResponse = new PaginatedResponse<SubordinateEmployeeDto>
                {
                    Items = employeeDtos,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                };

                return new ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
                {
                    Success = true,
                    Message = $"Found {totalCount} subordinate(s)",
                    Data = paginatedResponse,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
                {
                    Success = false,
                    Message = $"Error retrieving subordinates: {ex.Message}",
                };
            }
        }

        public async Task<ApiResponse<List<SkillDto>>> GetAllSkills()
        {
            try
            {
                var skills = await _repository.GetAllSkillsAsync();

                var skillDtos = skills
                    .Select(s => new SkillDto { SkillId = s.SkillId, SkillName = s.SkillName })
                    .ToList();

                return new ApiResponse<List<SkillDto>>
                {
                    Success = true,
                    Message = $"Found {skillDtos.Count} skill(s)",
                    Data = skillDtos,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<SkillDto>>
                {
                    Success = false,
                    Message = $"Error retrieving skills: {ex.Message}",
                };
            }
        }

        public async Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetSubordinateSkills(
            int managerId,
            int? employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize = 1_000_000
        )
        {
            try
            {
                var manager = await _repository.GetEmployeeByIdAsync(managerId);

                if (manager == null)
                    return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                    {
                        Success = false,
                        Message = "Manager not found",
                    };

                var (items, totalCount) = await _repository.GetSubordinateSkillsAsync(
                    managerId,
                    employeeId,
                    searchTerm,
                    sortBy,
                    pageNumber,
                    pageSize
                );

                var skillDtos = items
                    .Select(m => new EmployeeSkillDto
                    {
                        MapperId = m.MapperId,
                        EmployeeId = m.EmployeeId,
                        EmployeeName =
                            $"{m.Employee.Userprofile.FirstName} {m.Employee.Userprofile.LastName}",
                        SkillId = m.SkillId,
                        SkillName = m.Skill.SkillName,
                        Rating = m.Rating,
                        CreatedOn = m.CreatedOn,
                        UpdatedOn = m.UpdatedOn,
                        CanBecomeSme = m.Rating >= LnDConstants.MIN_SME_RATING,
                        IsSme = m.Skill.Lndsmes.Any(s =>
                            s.EmployeeId == m.EmployeeId && s.IsActive == true
                        ),
                    })
                    .ToList();

                return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                {
                    Success = true,
                    Data = new PaginatedResponse<EmployeeSkillDto>
                    {
                        Items = skillDtos,
                        TotalCount = totalCount,
                        PageNumber = pageNumber,
                        PageSize = pageSize,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }


        public async Task<ApiResponse<EmployeeSkillDto>> RecordEmployeeSkill(
            int managerId,
            RecordSkillRequest request
        )
        {
            try
            {
                var employee = await _repository.GetEmployeeByIdAsync(request.EmployeeId);

                if (employee == null || employee.ReportingManagerEmployeeId != managerId)
                    return new ApiResponse<EmployeeSkillDto>
                    {
                        Success = false,
                        Message = "Employee not found or not your subordinate",
                    };

                var skill = await _repository.GetSkillByIdAsync(request.SkillId);

                if (skill == null)
                    return new ApiResponse<EmployeeSkillDto>
                    {
                        Success = false,
                        Message = "Skill not found",
                    };

                var existingMapping = await _repository.GetEmployeeSkillMappingAsync(
                    request.EmployeeId,
                    request.SkillId
                );

                if (existingMapping != null)
                    return new ApiResponse<EmployeeSkillDto>
                    {
                        Success = false,
                        Message = "Skill already recorded for this employee",
                    };

                var mapper = new Lndemployeeskillmapper
                {
                    EmployeeId = request.EmployeeId,
                    SkillId = request.SkillId,
                    Rating = request.Rating,
                    CreatedByEmployeeId = managerId,
                    UpdatedByEmployeeId = managerId,
                    CreatedOn = DateOnly.FromDateTime(DateTime.Now),
                    UpdatedOn = DateOnly.FromDateTime(DateTime.Now),
                };

                var savedMapper = await _repository.AddEmployeeSkillAsync(mapper);
                await _repository.SaveChangesAsync();

                return new ApiResponse<EmployeeSkillDto>
                {
                    Success = true,
                    Message = "Skill recorded successfully",
                    Data = new EmployeeSkillDto
                    {
                        MapperId = savedMapper.MapperId,
                        EmployeeId = savedMapper.EmployeeId,
                        EmployeeName =
                            $"{employee.Userprofile.FirstName} {employee.Userprofile.LastName}",
                        SkillId = savedMapper.SkillId,
                        SkillName = skill.SkillName,
                        Rating = savedMapper.Rating,
                        CreatedOn = savedMapper.CreatedOn,
                        UpdatedOn = savedMapper.UpdatedOn,
                        CanBecomeSme = savedMapper.Rating >= LnDConstants.MIN_SME_RATING,
                        IsSme = false,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<EmployeeSkillDto>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<List<EmployeeSkillDto>>> BulkRecordEmployeeSkills(
            int managerId,
            BulkRecordSkillRequest request
        )
        {
            try
            {
                var employee = await _repository.GetEmployeeByIdAsync(request.EmployeeId);

                if (employee == null || employee.ReportingManagerEmployeeId != managerId)
                    return new ApiResponse<List<EmployeeSkillDto>>
                    {
                        Success = false,
                        Message = "Employee not found or not your subordinate",
                    };

                var skillIds = request.Skills.Select(s => s.SkillId).ToList();
                var skills = await _repository.GetAllSkillsAsync();
                var relevantSkills = skills.Where(s => skillIds.Contains(s.SkillId)).ToList();

                var existingMappings = await _repository.GetExistingSkillMappingsAsync(
                    request.EmployeeId,
                    skillIds
                );

                var newMappings = new List<Lndemployeeskillmapper>();
                var results = new List<EmployeeSkillDto>();

                foreach (var skillRating in request.Skills)
                {
                    if (existingMappings.Contains(skillRating.SkillId))
                        continue;

                    var skill = relevantSkills.FirstOrDefault(s =>
                        s.SkillId == skillRating.SkillId
                    );
                    if (skill == null)
                        continue;

                    var mapper = new Lndemployeeskillmapper
                    {
                        EmployeeId = request.EmployeeId,
                        SkillId = skillRating.SkillId,
                        Rating = skillRating.Rating,
                        CreatedByEmployeeId = managerId,
                        UpdatedByEmployeeId = managerId,
                        CreatedOn = DateOnly.FromDateTime(DateTime.Now),
                        UpdatedOn = DateOnly.FromDateTime(DateTime.Now),
                    };

                    newMappings.Add(mapper);
                }

                if (newMappings.Any())
                {
                    await _repository.AddEmployeeSkillsAsync(newMappings);
                    await _repository.SaveChangesAsync();

                    results = newMappings
                        .Select(m => new EmployeeSkillDto
                        {
                            MapperId = m.MapperId,
                            EmployeeId = m.EmployeeId,
                            EmployeeName =
                                $"{employee.Userprofile.FirstName} {employee.Userprofile.LastName}",
                            SkillId = m.SkillId,
                            SkillName = relevantSkills.First(s => s.SkillId == m.SkillId).SkillName,
                            Rating = m.Rating,
                            CreatedOn = m.CreatedOn,
                            UpdatedOn = m.UpdatedOn,
                            CanBecomeSme = m.Rating >= LnDConstants.MIN_SME_RATING,
                            IsSme = false,
                        })
                        .ToList();
                }

                return new ApiResponse<List<EmployeeSkillDto>>
                {
                    Success = true,
                    Message = $"{results.Count} skills recorded successfully",
                    Data = results,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<EmployeeSkillDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<EmployeeSkillDto>> UpdateEmployeeSkillRating(
            int managerId,
            UpdateSkillRatingRequest request
        )
        {
            try
            {
                var mapper = await _repository.GetEmployeeSkillMappingByIdAsync(request.MapperId);

                if (mapper == null || mapper.Employee.ReportingManagerEmployeeId != managerId)
                    return new ApiResponse<EmployeeSkillDto>
                    {
                        Success = false,
                        Message = "Skill mapping not found or employee not your subordinate",
                    };

                mapper.Rating = request.Rating;
                mapper.UpdatedByEmployeeId = managerId;
                mapper.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                var smeRecord = await _repository.GetActiveSmeAsync(
                    mapper.EmployeeId,
                    mapper.SkillId
                );

                if (smeRecord != null && request.Rating < LnDConstants.MIN_SME_RATING)
                {
                    smeRecord.IsActive = false;
                    await _repository.UpdateSmeAsync(smeRecord);
                }

                await _repository.UpdateEmployeeSkillAsync(mapper);
                await _repository.SaveChangesAsync();

                return new ApiResponse<EmployeeSkillDto>
                {
                    Success = true,
                    Message = "Skill rating updated successfully",
                    Data = new EmployeeSkillDto
                    {
                        MapperId = mapper.MapperId,
                        EmployeeId = mapper.EmployeeId,
                        EmployeeName =
                            $"{mapper.Employee.Userprofile.FirstName} {mapper.Employee.Userprofile.LastName}",
                        SkillId = mapper.SkillId,
                        SkillName = mapper.Skill.SkillName,
                        Rating = mapper.Rating,
                        CreatedOn = mapper.CreatedOn,
                        UpdatedOn = mapper.UpdatedOn,
                        CanBecomeSme = mapper.Rating >= LnDConstants.MIN_SME_RATING,
                        IsSme = smeRecord != null && smeRecord.IsActive == true,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<EmployeeSkillDto>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteEmployeeSkill(int managerId, int mapperId)
        {
            try
            {
                var mapper = await _repository.GetEmployeeSkillMappingByIdAsync(mapperId);

                if (mapper == null || mapper.Employee.ReportingManagerEmployeeId != managerId)
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Skill mapping not found or employee not your subordinate",
                    };

                var smeRecord = await _repository.GetActiveSmeAsync(
                    mapper.EmployeeId,
                    mapper.SkillId
                );

                if (smeRecord != null)
                {
                    smeRecord.IsActive = false;
                    await _repository.UpdateSmeAsync(smeRecord);
                }

                await _repository.DeleteEmployeeSkillAsync(mapper);
                await _repository.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Skill deleted successfully. SME status deactivated if applicable.",
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

        public async Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetMySkills(
            int employeeId,
            string searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            try
            {
                var (items, totalCount) = await _repository.GetMySkillsAsync(
                    employeeId,
                    searchTerm,
                    pageNumber,
                    pageSize
                );

                var skillDtos = items
                    .Select(m => new EmployeeSkillDto
                    {
                        MapperId = m.MapperId,
                        EmployeeId = m.EmployeeId,
                        EmployeeName =
                            $"{m.Employee.Userprofile.FirstName} {m.Employee.Userprofile.LastName}",
                        SkillId = m.SkillId,
                        SkillName = m.Skill.SkillName,
                        Rating = m.Rating,
                        CreatedOn = m.CreatedOn,
                        UpdatedOn = m.UpdatedOn,
                        CanBecomeSme = m.Rating >= LnDConstants.MIN_SME_RATING,
                        IsSme = m.Skill.Lndsmes.Any(s =>
                            s.EmployeeId == m.EmployeeId && s.IsActive == true
                        ),
                    })
                    .ToList();

                return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                {
                    Success = true,
                    Data = new PaginatedResponse<EmployeeSkillDto>
                    {
                        Items = skillDtos,
                        TotalCount = totalCount,
                        PageNumber = pageNumber,
                        PageSize = pageSize,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        #endregion

        #region SME Management

        public async Task<ApiResponse<bool>> CheckIfEmployeeIsSme(int employeeId)
        {
            try
            {
                var isSme = await _repository.IsEmployeeSmeAsync(employeeId);

                return new ApiResponse<bool> { Success = true, Data = isSme };
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

        public async Task<ApiResponse<int>> ApplyToBecomeSme(
            int employeeId,
            BecomeSmeRequest request
        )
        {
            try
            {
                var skillMapping = await _repository.GetEmployeeSkillMappingAsync(
                    employeeId,
                    request.SkillId
                );

                if (skillMapping == null || skillMapping.Rating < LnDConstants.MIN_SME_RATING)
                    return new ApiResponse<int>
                    {
                        Success = false,
                        Message =
                            $"You need a rating of at least {LnDConstants.MIN_SME_RATING} to become an SME",
                    };

                var existingSme = await _repository.GetActiveSmeAsync(employeeId, request.SkillId);

                if (existingSme != null)
                    return new ApiResponse<int>
                    {
                        Success = false,
                        Message = "You are already an active SME for this skill",
                    };

                var pendingApproval = await _repository.GetPendingSmeRegistrationAsync(
                    employeeId,
                    request.SkillId
                );

                if (pendingApproval != null)
                    return new ApiResponse<int>
                    {
                        Success = false,
                        Message = "You already have a pending SME registration request",
                    };

                var filePath = await _fileStorage.SaveFileAsync(
                    request.ProofDocument,
                    "sme-proofs"
                );

                var attachment = new Lndattachment
                {
                    FileName = request.ProofDocument.FileName,
                    FilePath = filePath,
                    FileSize = request.ProofDocument.Length,
                    AttachmentType = LnDConstants.ATTACHMENT_TYPE.SME_PROOF,
                    CreatedByEmployeeId = employeeId,
                    CreatedOn = DateOnly.FromDateTime(DateTime.Now),
                };

                await _repository.AddAttachmentAsync(attachment);
                await _repository.SaveChangesAsync();

                var approval = new Lndapproval
                {
                    ApprovalType = LnDConstants.APPROVAL_TYPE.SME_REGISTRATION,
                    SkillId = request.SkillId,
                    AttachmentId = attachment.AttachmentId,
                    RequesterEmployeeId = employeeId,
                    ApproverEmployeeId = skillMapping.Employee.ReportingManagerEmployeeId,
                    Status = LnDConstants.APPROVAL_STATUS.PENDING,
                    RequestedOn = DateOnly.FromDateTime(DateTime.Now),
                };

                await _repository.AddApprovalAsync(approval);
                await _repository.SaveChangesAsync();

                return new ApiResponse<int>
                {
                    Success = true,
                    Message = "SME registration request submitted successfully",
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

      

        public async Task<ApiResponse<PaginatedResponse<SmeDto>>> GetAvailableSmes(
    int skillId,
    string searchTerm,
    int pageNumber,
    int pageSize
)
        {
            try
            {
                var (items, totalCount) =
                    await _repository.GetAvailableSmesWithAssignmentCountsAsync(
                        skillId,
                        searchTerm,
                        pageNumber,
                        pageSize,
                        LnDConstants.MAX_SME_ASSIGNMENTS
                    );

                var smeDtos = new List<SmeDto>();
                foreach (var sme in items)
                {
                    var inProgressCount = await _repository.GetSmeInProgressAssignmentCountAsync(
                        sme.SmeId
                    );

                    smeDtos.Add(
                        new SmeDto
                        {
                            SmeId = sme.SmeId,
                            EmployeeId = sme.EmployeeId,
                            EmployeeName =
                                $"{sme.Employee.Userprofile.FirstName} {sme.Employee.Userprofile.LastName}",
                            SkillId = sme.SkillId,
                            SkillName = sme.Skill.SkillName,
                            InProgressAssignments = inProgressCount,
                            IsActive = sme.IsActive ?? true,
                            ApprovedOn = sme.ApprovedOn,
                        }
                    );
                }

                return new ApiResponse<PaginatedResponse<SmeDto>>
                {
                    Success = true,
                    Data = new PaginatedResponse<SmeDto>
                    {
                        Items = smeDtos,
                        TotalCount = totalCount,
                        PageNumber = pageNumber,
                        PageSize = pageSize,
                    },
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<SmeDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        #endregion

        #region Assignment Management

        public async Task<ApiResponse<int>> RequestSmeAssignment(
            int managerId,
            SmeRequestDto request
        )
        {
            try
            {
                var mentee = await _repository.GetEmployeeByIdAsync(request.MenteeEmployeeId);

                if (mentee == null || mentee.ReportingManagerEmployeeId != managerId)
                    return new ApiResponse<int>
                    {
                        Success = false,
                        Message = "Employee not found or not your subordinate",
                    };

                var skillMapping = await _repository.GetEmployeeSkillMappingAsync(
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
                    Notes = System.Text.Json.JsonSerializer.Serialize(
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

                await _repository.AddApprovalAsync(approval);
                await _repository.SaveChangesAsync();

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
                var (items, totalCount) = await _repository.GetMyAssignmentsAsync(
                    employeeId,
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
                    Message = "An error occurred while retrieving assignments",
                    Errors = new List<string> { ex.Message },
                };
            }
        }
        public async Task<ApiResponse<byte[]>> ExportTeamAssignmentsToExcel(
    int managerId,
    string? statusFilter,
    string? searchTerm,
    string? sortField,
    string? sortOrder)
        {
            try
            {

                var allAssignments = await _repository.GetAllTeamAssignmentsForExportAsync(
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
                        // Access through navigation properties
                        var menteeName = $"{assignment.MenteeEmployee?.Userprofile?.FirstName ?? ""} {assignment.MenteeEmployee?.Userprofile?.LastName ?? ""}".Trim();
                        var skillName = assignment.Skill?.SkillName ?? "N/A";
                        var smeName = $"{assignment.Sme?.Employee?.Userprofile?.FirstName ?? ""} {assignment.Sme?.Employee?.Userprofile?.LastName ?? ""}".Trim();

                        worksheet.Cell(row, 1).Value = menteeName;
                        worksheet.Cell(row, 2).Value = skillName;
                        worksheet.Cell(row, 3).Value = smeName;
                        worksheet.Cell(row, 4).Value = assignment.Status ?? "N/A";
                        worksheet.Cell(row, 5).Value = assignment.CreatedOn?.ToString("MM/dd/yyyy") ?? "";
                        worksheet.Cell(row, 6).Value = assignment.Deadline?.ToString("MM/dd/yyyy") ?? "";
                        worksheet.Cell(row, 7).Value = assignment.CompletionRating?.ToString() ?? "N/A";
                        worksheet.Cell(row, 8).Value = assignment.CompletionNotes ?? "";

                        row++;
                    }

                    // Auto-fit columns
                    worksheet.Columns().AdjustToContents();


                    if (row > 2)
                    {
                        var dataRange = worksheet.Range(1, 1, row - 1, 8);
                        dataRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                        dataRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    }

                    // Save to memory stream
                    using (var stream = new MemoryStream())
                    {
                        workbook.SaveAs(stream);
                        var excelBytes = stream.ToArray();

                        return new ApiResponse<byte[]>
                        {
                            Success = true,
                            Message = $"Successfully exported {allAssignments.Count} team assignments",
                            Data = excelBytes
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<byte[]>
                {
                    Success = false,
                    Message = "An error occurred while exporting team assignments",
                    Errors = new List<string> { ex.Message }
                };
            }
        }
        public async Task<ApiResponse<byte[]>> ExportAllActiveSmesToExcel(string? searchTerm)
        {
            try
            {
                // Get ALL active SMEs without pagination for export
                var allSmes = await _repository.GetAllActiveSmesForExportAsync(searchTerm);

                using (var workbook = new XLWorkbook())
                {
                    var worksheet = workbook.Worksheets.Add("SME Directory");

                    // Add headers
                    worksheet.Cell(1, 1).Value = "SME Name";
                    worksheet.Cell(1, 2).Value = "Skill";
                    worksheet.Cell(1, 3).Value = "Department";
                    worksheet.Cell(1, 4).Value = "Approved Date";

                    // Style headers
                    var headerRange = worksheet.Range(1, 1, 1, 4);
                    headerRange.Style.Font.Bold = true;
                    headerRange.Style.Fill.BackgroundColor = XLColor.FromArgb(39, 35, 92);
                    headerRange.Style.Font.FontColor = XLColor.White;
                    headerRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    // Add data rows
                    int row = 2;
                    foreach (var sme in allSmes)
                    {
                        var smeName = $"{sme.Employee?.Userprofile?.FirstName ?? ""} {sme.Employee?.Userprofile?.LastName ?? ""}".Trim();
                        var skillName = sme.Skill?.SkillName ?? "N/A";
                        var departmentName = sme.Employee?.Employeedetailsmasters?.FirstOrDefault()?.Department?.DepartmentName ?? "N/A";
                        var approvedDate = sme.ApprovedOn?.ToString("MM/dd/yyyy") ?? "";

                        worksheet.Cell(row, 1).Value = smeName;
                        worksheet.Cell(row, 2).Value = skillName;
                        worksheet.Cell(row, 3).Value = departmentName;
                        worksheet.Cell(row, 4).Value = approvedDate;

                        row++;
                    }

                    // Auto-fit columns
                    worksheet.Columns().AdjustToContents();

                    // Add borders to all cells with data
                    if (row > 2)
                    {
                        var dataRange = worksheet.Range(1, 1, row - 1, 4);
                        dataRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                        dataRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    }

                    // Save to memory stream
                    using (var stream = new MemoryStream())
                    {
                        workbook.SaveAs(stream);
                        var excelBytes = stream.ToArray();

                        return new ApiResponse<byte[]>
                        {
                            Success = true,
                            Message = $"Successfully exported {allSmes.Count} SMEs",
                            Data = excelBytes
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<byte[]>
                {
                    Success = false,
                    Message = "An error occurred while exporting SME directory",
                    Errors = new List<string> { ex.Message }
                };
            }
        }





        public async Task<ApiResponse<PaginatedResponse<AssignmentDto>>> GetTeamAssignments(
            int managerId,
            string statusFilter,
            string searchTerm,
            string sortField,
            string sortOrder,
            int pageNumber,
            int pageSize
        )
        {
            try
            {
                var (items, totalCount) = await _repository.GetTeamAssignmentsAsync(
                    managerId,
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

        public async Task<ApiResponse<PaginatedResponse<AssignmentDto>>> GetSmeAssignments(
            int smeEmployeeId,
            string statusFilter,
            string searchTerm,
            string sortField,
            string sortOrder,
            int pageNumber,
            int pageSize
        )
        {
            try
            {
                var (items, totalCount) = await _repository.GetSmeAssignmentsAsync(
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
                var assignment = await _repository.GetAssignmentByIdAsync(request.AssignmentId);

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

                await _repository.AddAttachmentAsync(attachment);
                await _repository.SaveChangesAsync();

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

                await _repository.AddApprovalAsync(approval);
                await _repository.UpdateAssignmentAsync(assignment);
                await _repository.SaveChangesAsync();

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
    //     public async Task<ApiResponse<bool>> UploadCompletionProof(
    // int employeeId, UploadCompletionProofRequest request)
    //     {
    //         try
    //         {
    //             var assignment = await _repository.GetAssignmentByIdAsync(request.AssignmentId);
    //             if (assignment == null || assignment.MenteeEmployeeId != employeeId)
    //             {
    //                 return new ApiResponse<bool>
    //                 {
    //                     Success = false,
    //                     Message = "Assignment not found",
    //                 };
    //             }

    //             if (assignment.Status != LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS)
    //             {
    //                 return new ApiResponse<bool>
    //                 {
    //                     Success = false,
    //                     Message = "Assignment is not in progress",
    //                 };
    //             }

    //             var filePath = await _fileStorage.SaveFileAsync(request.ProofDocument, "completion-proofs");

    //             var attachment = new Lndattachment
    //             {
    //                 FileName = request.ProofDocument.FileName,
    //                 FilePath = filePath,
    //                 FileSize = request.ProofDocument.Length,
    //                 AttachmentType = LnDConstants.ATTACHMENT_TYPE.COMPLETION_PROOF,
    //                 CreatedByEmployeeId = employeeId,
    //                 CreatedOn = DateOnly.FromDateTime(DateTime.Now),
    //             };

    //             await _repository.AddAttachmentAsync(attachment);
    //             await _repository.SaveChangesAsync();

    //             assignment.ProofFilePath = filePath;
    //             assignment.CompletionNotes = request.CompletionNotes;
    //             assignment.Status = LnDConstants.ASSIGNMENT_STATUS.PENDING_SME_ACKNOWLEDGEMENT;
    //             assignment.UpdatedByEmployeeId = employeeId;
    //             assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

    //             var approval = new Lndapproval
    //             {
    //                 ApprovalType = LnDConstants.APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT,
    //                 AssignmentId = assignment.AssignmentId,
    //                 SkillId = assignment.SkillId,
    //                 AttachmentId = attachment.AttachmentId,
    //                 RequesterEmployeeId = employeeId,
    //                 ApproverEmployeeId = assignment.Sme.EmployeeId,
    //                 Status = LnDConstants.APPROVAL_STATUS.PENDING,
    //                 RequestedOn = DateOnly.FromDateTime(DateTime.Now),
    //             };

    //             await _repository.AddApprovalAsync(approval);
    //             await _repository.UpdateAssignmentAsync(assignment);
    //             await _repository.SaveChangesAsync();

    //             // ✅ NEW: Send email to SME
    //             var sme = assignment.Sme?.Employee;
    //             var employee = assignment.MenteeEmployee;
    //             var skill = assignment.Skill;

    //             if (sme?.Userauthentication?.Email != null)
    //             {
    //                 var smeName = $"{sme.Userprofile?.FirstName} {sme.Userprofile?.LastName}";
    //                 var employeeName = $"{employee?.Userprofile?.FirstName} {employee?.Userprofile?.LastName}";

    //                 await _emailService.SendProofSubmittedEmailAsync(
    //                     sme.Userauthentication.Email,
    //                     smeName,
    //                     employeeName,
    //                     skill?.SkillName ?? "Unknown Skill"
    //                 );
    //             }

    //             return new ApiResponse<bool>
    //             {
    //                 Success = true,
    //                 Message = "Completion proof uploaded successfully. Awaiting SME acknowledgement.",
    //                 Data = true,
    //             };
    //         }
    //         catch (Exception ex)
    //         {
    //             return new ApiResponse<bool>
    //             {
    //                 Success = false,
    //                 Message = "An error occurred",
    //                 Errors = new List<string> { ex.Message }
    //             };
    //         }
    //     }


            public async Task<ApiResponse<bool>> CompleteAssignment(
            int managerId,
            CompleteAssignmentRequest request
        )
        {
            try
            {
                var assignment = await _repository.GetAssignmentByIdAsync(request.AssignmentId);

                if (assignment == null)
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Assignment not found",
                    };

                if (assignment.MenteeEmployee.ReportingManagerEmployeeId != managerId)
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "You are not authorized to complete this assignment",
                    };

                if (
                    assignment.Status
                    != LnDConstants.ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT
                )
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Assignment is not awaiting manager acknowledgement",
                    };

                assignment.Status = LnDConstants.ASSIGNMENT_STATUS.COMPLETED;
                assignment.CompletionRating = request.NewRating;
                assignment.CompletionNotes = request.Notes;
                assignment.UpdatedByEmployeeId = managerId;
                assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                var skillMapping = await _repository.GetEmployeeSkillMappingAsync(
                    assignment.MenteeEmployeeId,
                    assignment.SkillId
                );

                if (skillMapping != null)
                {
                    skillMapping.Rating = request.NewRating;
                    skillMapping.UpdatedByEmployeeId = managerId;
                    skillMapping.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);
                    await _repository.UpdateEmployeeSkillAsync(skillMapping);
                }

                var approval = await _repository.GetPendingAssignmentApprovalAsync(
                    request.AssignmentId,
                    LnDConstants.APPROVAL_TYPE.ASSIGNMENT_COMPLETION
                );

                if (approval != null)
                {
                    approval.Status = LnDConstants.APPROVAL_STATUS.APPROVED;
                    approval.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);
                    await _repository.UpdateApprovalAsync(approval);
                }

                await _repository.UpdateAssignmentAsync(assignment);
                await _repository.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message =
                        "Assignment completed successfully. Employee skill rating updated and approval marked approved.",
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
     
        #endregion

        #region Approvals Management

        public async Task<ApiResponse<PaginatedResponse<ApprovalDto>>> GetMyApprovals(
            int employeeId,
            string? approvalType,
            string? status,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        )
        {
            try
            {
                var (items, totalCount) = await _repository.GetMyApprovalsAsync(
                    employeeId,
                    approvalType,
                    status,
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
                var approval = await _repository.GetApprovalByIdAsync(request.ApprovalId);

                if (approval == null || approval.ApproverEmployeeId != approverId)
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Approval request not found",
                    };

                if (approval.Status != LnDConstants.APPROVAL_STATUS.PENDING)
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Approval request has already been processed",
                    };

                approval.Status = request.IsApproved
                    ? LnDConstants.APPROVAL_STATUS.APPROVED
                    : LnDConstants.APPROVAL_STATUS.REJECTED;
                approval.Notes = request.Notes;
                approval.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                if (request.IsApproved)
                {
                    switch (approval.ApprovalType)
                    {
                        case LnDConstants.APPROVAL_TYPE.SME_REGISTRATION:
                            await HandleSmeRegistrationApproval(approval);
                            break;

                        case LnDConstants.APPROVAL_TYPE.SME_REQUEST:
                            await HandleSmeRequestApproval(approval);
                            break;

                        case LnDConstants.APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT:
                            await HandleAssignmentAcknowledgement(approval);
                            break;
                    }
                }
                else
                {
                    if (
                        approval.ApprovalType
                        == LnDConstants.APPROVAL_TYPE.ASSIGNMENT_ACKNOWLEDGEMENT
                    )
                    {
                        var assignment = await _repository.GetAssignmentByIdAsync(
                            approval.AssignmentId.Value
                        );
                        if (assignment != null)
                        {
                            assignment.Status = LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS;
                            await _repository.UpdateAssignmentAsync(assignment);
                        }
                    }
                }

                await _repository.UpdateApprovalAsync(approval);
                await _repository.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message =
                        $"Approval request {(request.IsApproved ? "approved" : "rejected")} successfully",
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
    
        private async Task HandleSmeRegistrationApproval(Lndapproval approval)
        {
            var sme = new Lndsme
            {
                EmployeeId = approval.RequesterEmployeeId,
                SkillId = approval.SkillId.Value,
                AttachmentId = approval.AttachmentId,
                ApprovedByEmployeeId = approval.ApproverEmployeeId,
                ApprovedOn = DateOnly.FromDateTime(DateTime.Now),
                CreatedOn = DateOnly.FromDateTime(DateTime.Now),
                IsActive = true,
            };

            await _repository.AddSmeAsync(sme);
        }

        private async Task HandleSmeRequestApproval(Lndapproval approval)
        {
            var assignmentDetails =
                System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<
                    string,
                    object
                >>(approval.Notes);

            var sme = await _repository.GetSmeFromEmployeeId(assignmentDetails);

            var assignment = new Lndassignment
            {
                MenteeEmployeeId = int.Parse(assignmentDetails["MenteeEmployeeId"].ToString()),
                SmeId = sme.SmeId,
                SkillId = int.Parse(assignmentDetails["SkillId"].ToString()),
                Deadline = DateTime.Parse(assignmentDetails["Deadline"].ToString()),
                Status = LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS,
                CreatedByEmployeeId = int.Parse(assignmentDetails["ManagerId"].ToString()),
                CreatedOn = DateOnly.FromDateTime(DateTime.Now),
            };

            await _repository.AddAssignmentAsync(assignment);
            await _repository.SaveChangesAsync();

            approval.AssignmentId = assignment.AssignmentId;
        }

        private async Task HandleAssignmentAcknowledgement(Lndapproval approval)
        {
            var assignment = await _repository.GetAssignmentByIdAsync(approval.AssignmentId.Value);

            if (assignment != null)
            {
                assignment.Status = LnDConstants.ASSIGNMENT_STATUS.ACKNOWLEDGED;

                var managerApproval = new Lndapproval
                {
                    ApprovalType = LnDConstants.APPROVAL_TYPE.ASSIGNMENT_COMPLETION,
                    AssignmentId = assignment.AssignmentId,
                    SkillId = assignment.SkillId,
                    AttachmentId = approval.AttachmentId,
                    RequesterEmployeeId = approval.ApproverEmployeeId.Value,
                    ApproverEmployeeId = assignment.MenteeEmployee.ReportingManagerEmployeeId,
                    Status = LnDConstants.APPROVAL_STATUS.PENDING,
                    RequestedOn = DateOnly.FromDateTime(DateTime.Now),
                };

                await _repository.AddApprovalAsync(managerApproval);
                assignment.Status = LnDConstants.ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT;
                await _repository.UpdateAssignmentAsync(assignment);
            }
        }

        #endregion

        #region Approval History & File Downloads

        public async Task<ApiResponse<PaginatedResponse<ApprovalDto>>> GetApprovalHistory(
            int employeeId,
            string? approvalType,
            string? status,
            string? role,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize = 10 // Add this parameter with default value
        )
        {
            try
            {
                // Validate pageSize to prevent abuse
                if (pageSize < 1)
                    pageSize = 10;
                if (pageSize > 100)
                    pageSize = 100;

                var (items, totalCount) = await _repository.GetApprovalHistoryAsync(
                    employeeId,
                    approvalType,
                    status,
                    role,
                    searchTerm,
                    sortField,
                    sortOrder,
                    pageNumber,
                    pageSize // Use dynamic pageSize instead of LnDConstants.PAGE_SIZE
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
                        PageSize = pageSize, // Use dynamic pageSize
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
                var approval = await _repository.GetApprovalByIdAsync(approvalId);

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
                        CompletionNotes = approval.Assignment.CompletionNotes,
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
                var approval = await _repository.GetApprovalByIdAsync(approvalId);

                if (approval == null)
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "Approval not found",
                    };

                if (
                    approval.RequesterEmployeeId != employeeId
                    && approval.ApproverEmployeeId != employeeId
                )
                {
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "You do not have access to this file",
                    };
                }

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
                    Message = "An error occurred while downloading the file",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<FileDownloadDto>> GetAssignmentProof(
            int employeeId,
            int assignmentId
        )
        {
            try
            {
                var assignment = await _repository.GetAssignmentByIdAsync(assignmentId);

                if (assignment == null)
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "Assignment not found",
                    };

                var isMentee = assignment.MenteeEmployeeId == employeeId;
                var isSme = assignment.Sme.EmployeeId == employeeId;
                var isManager = assignment.MenteeEmployee.ReportingManagerEmployeeId == employeeId;

                if (!isMentee && !isSme && !isManager)
                {
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "You do not have access to this file",
                    };
                }

                if (string.IsNullOrEmpty(assignment.ProofFilePath))
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "No completion proof uploaded yet",
                    };

                var fileBytes = await _fileStorage.GetFileAsync(assignment.ProofFilePath);
                var fileName = Path.GetFileName(assignment.ProofFilePath);
                var contentType = GetContentType(fileName);

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
                    Message = "An error occurred while downloading the file",
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


        public async Task<ApiResponse<FileDownloadDto>> PreviewApprovalAttachment(int employeeId, int approvalId)
        {
            try
            {
                var approval = await _repository.GetApprovalByIdAsync(approvalId);

                if (approval == null)
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "Approval not found"
                    };

                // Authorization check
                if (approval.RequesterEmployeeId != employeeId && approval.ApproverEmployeeId != employeeId)
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "You do not have access to this file"
                    };

                if (approval.Attachment == null)
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "No attachment found for this approval"
                    };

                var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreviewAsync(approval.Attachment.FilePath);

                return new ApiResponse<FileDownloadDto>
                {
                    Success = true,
                    Data = new FileDownloadDto
                    {
                        FileBytes = fileBytes,
                        FileName = fileName,
                        ContentType = contentType,
                        FileSize = approval.Attachment.FileSize ?? 0
                    }
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<FileDownloadDto>
                {
                    Success = false,
                    Message = "An error occurred while previewing the file",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<FileDownloadDto>> PreviewAssignmentProof(int employeeId, int assignmentId)
        {
            try
            {
                var assignment = await _repository.GetAssignmentByIdAsync(assignmentId);

                if (assignment == null)
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "Assignment not found"
                    };

                // Authorization check
                var isMentee = assignment.MenteeEmployeeId == employeeId;
                var isSme = assignment.Sme.EmployeeId == employeeId;
                var isManager = assignment.MenteeEmployee.ReportingManagerEmployeeId == employeeId;

                if (!isMentee && !isSme && !isManager)
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "You do not have access to this file"
                    };

                if (string.IsNullOrEmpty(assignment.ProofFilePath))
                    return new ApiResponse<FileDownloadDto>
                    {
                        Success = false,
                        Message = "No completion proof uploaded yet"
                    };

                var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreviewAsync(assignment.ProofFilePath);

                return new ApiResponse<FileDownloadDto>
                {
                    Success = true,
                    Data = new FileDownloadDto
                    {
                        FileBytes = fileBytes,
                        FileName = fileName,
                        ContentType = contentType,
                        FileSize = fileBytes.Length
                    }
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<FileDownloadDto>
                {
                    Success = false,
                    Message = "An error occurred while previewing the file",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        #endregion

        public async Task<
            ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
        > GetAllOrganizationEmployees(string? searchTerm, int pageNumber, int pageSize)
        {
            try
            {
                var (items, totalCount) = await _repository.GetAllOrganizationEmployeesAsync(
                    searchTerm,
                    pageNumber,
                    pageSize
                );

                var employeeDtos = items
                    .Select(e => new SubordinateEmployeeDto
                    {
                        EmployeeId = e.EmployeeId,
                        EmployeeName = $"{e.Userprofile?.FirstName} {e.Userprofile?.LastName}",
                        Email = e.Userauthentication?.Email,
                        DepartmentName = e
                            .Employeedetailsmasters.FirstOrDefault()
                            ?.Department?.DepartmentName,
                    })
                    .ToList();

                var paginatedResponse = new PaginatedResponse<SubordinateEmployeeDto>
                {
                    Items = employeeDtos,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                };

                return new ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
                {
                    Success = true,
                    Message = $"Found {totalCount} employee(s)",
                    Data = paginatedResponse,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
                {
                    Success = false,
                    Message = $"Error retrieving employees: {ex.Message}",
                };
            }
        }

        public async Task<
            ApiResponse<PaginatedResponse<AssignmentDto>>
        > GetAllOrganizationAssignments(
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
                var (items, totalCount) = await _repository.GetAllOrganizationAssignmentsAsync(
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
                        SkillName = a.Skill?.SkillName,
                        MenteeName =
                            $"{a.MenteeEmployee?.Userprofile?.FirstName} {a.MenteeEmployee?.Userprofile?.LastName}",
                        SmeName =
                            $"{a.Sme?.Employee?.Userprofile?.FirstName} {a.Sme?.Employee?.Userprofile?.LastName}",
                        Status = a.Status,
                        CreatedOn = a.CreatedOn,
                        Deadline = a.Deadline,
                        CompletionRating = a.CompletionRating,
                        CompletionNotes = a.CompletionNotes,
                        ProofFilePath = a.ProofFilePath,
                    })
                    .ToList();

                var paginatedResponse = new PaginatedResponse<AssignmentDto>
                {
                    Items = assignmentDtos,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                };

                return new ApiResponse<PaginatedResponse<AssignmentDto>>
                {
                    Success = true,
                    Message = $"Found {totalCount} assignment(s)",
                    Data = paginatedResponse,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<AssignmentDto>>
                {
                    Success = false,
                    Message = $"Error retrieving assignments: {ex.Message}",
                };
            }
        }

        public async Task<ApiResponse<PaginatedResponse<SmeDto>>> GetAllActiveSmes(
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            try
            {
                var (items, totalCount) = await _repository.GetAllActiveSmesAsync(
                    searchTerm,
                    pageNumber,
                    pageSize
                );

                var smeDtos = items
                    .Select(s => new SmeDto
                    {
                        SmeId = s.SmeId,
                        EmployeeId = s.EmployeeId,
                        EmployeeName =
                            $"{s.Employee?.Userprofile?.FirstName} {s.Employee?.Userprofile?.LastName}",
                        SkillId = s.SkillId,
                        SkillName = s.Skill?.SkillName,
                        DepartmentName = s
                            .Employee?.Employeedetailsmasters.FirstOrDefault()
                            ?.Department?.DepartmentName,
                        ApprovedDate = s.ApprovedOn,
                        IsActive = s.IsActive.Value,
                    })
                    .ToList();

                var paginatedResponse = new PaginatedResponse<SmeDto>
                {
                    Items = smeDtos,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                };

                return new ApiResponse<PaginatedResponse<SmeDto>>
                {
                    Success = true,
                    Message = $"Found {totalCount} SME(s)",
                    Data = paginatedResponse,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<SmeDto>>
                {
                    Success = false,
                    Message = $"Error retrieving SMEs: {ex.Message}",
                };
            }
        }

        public async Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetEmployeeSkillsById(
            int employeeId,
            int pageNumber,
            string? searchTerm,
            string? sortBy
        )
        {
            try
            {
                var (items, totalCount) = await _repository.GetEmployeeSkillsByIdAsync(
                    employeeId,
                    searchTerm,
                    sortBy,
                    pageNumber,
                    LnDConstants.PAGE_SIZE
                );

                var skillDtos = items
                    .Select(m => new EmployeeSkillDto
                    {
                        MapperId = m.MapperId,
                        EmployeeId = m.EmployeeId,
                        SkillId = m.SkillId,
                        SkillName = m.Skill?.SkillName,
                        Rating = m.Rating,
                    })
                    .ToList();

                var paginatedResponse = new PaginatedResponse<EmployeeSkillDto>
                {
                    Items = skillDtos,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = LnDConstants.PAGE_SIZE,
                };

                return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                {
                    Success = true,
                    Message = $"Found {totalCount} skill(s)",
                    Data = paginatedResponse,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                {
                    Success = false,
                    Message = $"Error retrieving skills: {ex.Message}",
                };
            }
        }


        public async Task<ApiResponse<byte[]>> ExportOrganizationAssignmentsToExcel(
       string? statusFilter,
       string? searchTerm,
       string? sortField,
       string? sortOrder)
        {
            try
            {
                // Get ALL assignments without pagination for export
                var allAssignments = await _repository.GetAllOrganizationAssignmentsForExportAsync(
                    statusFilter,
                    searchTerm,
                    sortField,
                    sortOrder
                );

                // Set the license context for EPPlus
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using (var package = new ExcelPackage())
                {
                    var worksheet = package.Workbook.Worksheets.Add("Organizational Assignments");

                    // Add headers
                    worksheet.Cells[1, 1].Value = "Employee Name";
                    worksheet.Cells[1, 2].Value = "Skill Name";
                    worksheet.Cells[1, 3].Value = "SME Assigned";
                    worksheet.Cells[1, 4].Value = "Assignment Status";
                    worksheet.Cells[1, 5].Value = "Start Date";
                    worksheet.Cells[1, 6].Value = "Due Date";
                    worksheet.Cells[1, 7].Value = "Score";

                    // Style headers
                    using (var range = worksheet.Cells[1, 1, 1, 7])
                    {
                        range.Style.Font.Bold = true;
                        range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                        range.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(79, 129, 189));
                        range.Style.Font.Color.SetColor(Color.White);
                        range.Style.Border.BorderAround(ExcelBorderStyle.Thin);
                    }

                    // Add data rows - CORRECTED TO ACCESS NAVIGATION PROPERTIES
                    int row = 2;
                    foreach (var assignment in allAssignments)
                    {
                        // Access through navigation properties
                        var menteeName = $"{assignment.MenteeEmployee?.Userprofile?.FirstName} {assignment.MenteeEmployee?.Userprofile?.LastName}".Trim();
                        var skillName = assignment.Skill?.SkillName ?? "N/A";
                        var smeName = $"{assignment.Sme?.Employee?.Userprofile?.FirstName} {assignment.Sme?.Employee?.Userprofile?.LastName}".Trim();

                        worksheet.Cells[row, 1].Value = menteeName;
                        worksheet.Cells[row, 2].Value = skillName;
                        worksheet.Cells[row, 3].Value = smeName;
                        worksheet.Cells[row, 4].Value = assignment.Status ?? "N/A";
                        worksheet.Cells[row, 5].Value = assignment.CreatedOn?.ToString("MM/dd/yyyy") ?? "";
                        worksheet.Cells[row, 6].Value = assignment.Deadline?.ToString("MM/dd/yyyy") ?? "";
                        worksheet.Cells[row, 7].Value = assignment.CompletionRating?.ToString() ?? "N/A";

                        row++;
                    }

                    // Auto-fit columns
                    worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

                    // Add borders to all cells
                    if (row > 2) // Only add borders if there's data
                    {
                        var dataRange = worksheet.Cells[1, 1, row - 1, 7];
                        dataRange.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                        dataRange.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                        dataRange.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                        dataRange.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                    }

                    var excelBytes = package.GetAsByteArray();

                    return new ApiResponse<byte[]>
                    {
                        Success = true,
                        Message = $"Successfully exported {allAssignments.Count} assignments",
                        Data = excelBytes
                    };
                }
            }
            catch (Exception ex)
            {
                return new ApiResponse<byte[]>
                {
                    Success = false,
                    Message = "An error occurred while exporting assignments",
                    Errors = new List<string> { ex.Message }
                };
            }
        }


    }

}
using ClosedXML.Excel;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class LnDSmeService : ILnDSmeService
    {
        private readonly ILnDSmeRepository _smeRepository;
        private readonly ILnDEmployeeSkillRepository _skillRepository;
        private readonly ILnDApprovalRepository _approvalRepository;
        private readonly IFileStorageService _fileStorage;

        public LnDSmeService(
            ILnDSmeRepository smeRepository,
            ILnDEmployeeSkillRepository skillRepository,
            ILnDApprovalRepository approvalRepository,
            IFileStorageService fileStorage
        )
        {
            _smeRepository = smeRepository;
            _skillRepository = skillRepository;
            _approvalRepository = approvalRepository;
            _fileStorage = fileStorage;
        }

        public async Task<ApiResponse<bool>> CheckIfEmployeeIsSme(int employeeId)
        {
            try
            {
                var isSme = await _smeRepository.IsEmployeeSmeAsync(employeeId);

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
                var skillMapping = await _skillRepository.GetEmployeeSkillMappingAsync(
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

                var existingSme = await _smeRepository.GetActiveSmeAsync(employeeId, request.SkillId);

                if (existingSme != null)
                    return new ApiResponse<int>
                    {
                        Success = false,
                        Message = "You are already an active SME for this skill",
                    };

                var pendingApproval = await _approvalRepository.GetPendingSmeRegistrationAsync(
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
                    LnDConstants.FILE_STORAGE.SME_PROOFS
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

                await _approvalRepository.AddAttachmentAsync(attachment);
                await _approvalRepository.SaveChangesAsync();

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

                await _approvalRepository.AddApprovalAsync(approval);
                await _approvalRepository.SaveChangesAsync();

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
                    await _smeRepository.GetAvailableSmesWithAssignmentCountsAsync(
                        skillId,
                        searchTerm,
                        pageNumber,
                        pageSize,
                        LnDConstants.MAX_SME_ASSIGNMENTS
                    );

                var smeDtos = new List<SmeDto>();
                foreach (var sme in items)
                {
                    var inProgressCount = await _smeRepository.GetSmeInProgressAssignmentCountAsync(
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

        public async Task<ApiResponse<PaginatedResponse<SmeDto>>> GetAllActiveSmes(
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            try
            {
                var (items, totalCount) = await _smeRepository.GetAllActiveSmesAsync(
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
                            $"{s.Employee.Userprofile.FirstName} {s.Employee.Userprofile.LastName}",
                        SkillId = s.SkillId,
                        SkillName = s.Skill.SkillName,
                        DepartmentName = s
                            .Employee.Employeedetailsmasters.FirstOrDefault()
                            ?.Department?.DepartmentName,
                        IsActive = s.IsActive ?? false,
                        ApprovedDate = s.ApprovedOn,
                    })
                    .ToList();

                return new ApiResponse<PaginatedResponse<SmeDto>>
                {
                    Success = true,
                    Message = $"Found {totalCount} active SME(s)",
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
                    Message = $"Error retrieving SMEs: {ex.Message}",
                };
            }
        }

        public async Task<ApiResponse<byte[]>> ExportAllActiveSmesToExcel(string? searchTerm)
        {
            try
            {
                var allSmes = await _smeRepository.GetAllActiveSmesForExportAsync(searchTerm);

                using (var workbook = new XLWorkbook())
                {
                    var worksheet = workbook.Worksheets.Add("Active SMEs");

                    worksheet.Cell(1, 1).Value = "Employee Name";
                    worksheet.Cell(1, 2).Value = "Skill Name";
                    worksheet.Cell(1, 3).Value = "Department";
                    worksheet.Cell(1, 4).Value = "Approved Date";

                    var headerRange = worksheet.Range(1, 1, 1, 4);
                    headerRange.Style.Font.Bold = true;
                    headerRange.Style.Fill.BackgroundColor = XLColor.FromArgb(39, 35, 92);
                    headerRange.Style.Font.FontColor = XLColor.White;
                    headerRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    int row = 2;
                    foreach (var sme in allSmes)
                    {
                        var employeeName =
                            $"{sme.Employee?.Userprofile?.FirstName ?? ""} {sme.Employee?.Userprofile?.LastName ?? ""}"
                                .Trim();
                        var skillName = sme.Skill?.SkillName ?? "N/A";
                        var departmentName =
                            sme.Employee?.Employeedetailsmasters.FirstOrDefault()
                                ?.Department?.DepartmentName ?? "N/A";

                        worksheet.Cell(row, 1).Value = employeeName;
                        worksheet.Cell(row, 2).Value = skillName;
                        worksheet.Cell(row, 3).Value = departmentName;
                        worksheet.Cell(row, 4).Value = sme.ApprovedOn?.ToString("MM/dd/yyyy") ?? "";

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
                    Message = $"Error exporting SMEs: {ex.Message}",
                };
            }
        }
    }
}

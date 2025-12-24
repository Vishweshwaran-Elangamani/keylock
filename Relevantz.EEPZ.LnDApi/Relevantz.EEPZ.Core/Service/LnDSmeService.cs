using ClosedXML.Excel;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Serilog;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class LnDSmeService : ILnDSmeService
    {
        #region Dependencies

        private readonly ILnDSmeRepository _smeRepository;
        private readonly ILnDEmployeeSkillRepository _skillRepository;
        private readonly ILnDApprovalRepository _approvalRepository;
        private readonly IFileStorageService _fileStorage;
        private readonly ILnDBaseRepository _baseRepository;

        public LnDSmeService(
            ILnDSmeRepository smeRepository,
            ILnDEmployeeSkillRepository skillRepository,
            ILnDApprovalRepository approvalRepository,
            IFileStorageService fileStorage,
            ILnDBaseRepository baseRepository
        )
        {
            _smeRepository = smeRepository;
            _skillRepository = skillRepository;
            _approvalRepository = approvalRepository;
            _fileStorage = fileStorage;
            _baseRepository = baseRepository;
        }

        #endregion

        #region SME Status

        /// <summary>Checks if an employee has active SME status for any skill.</summary>
        public async Task<ApiResponse<bool>> CheckIfEmployeeIsSme(int employeeId)
        {
            Log.Information("CheckIfEmployeeIsSme started. EmployeeId={EmployeeId}", employeeId);

            try
            {
                var isSme = await _smeRepository.IsEmployeeSmeAsync(employeeId);

                Log.Information(
                    "CheckIfEmployeeIsSme succeeded. EmployeeId={EmployeeId}, IsSme={IsSme}",
                    employeeId, isSme
                );

                return new ApiResponse<bool> { Success = true, Data = isSme };
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "CheckIfEmployeeIsSme failed. EmployeeId={EmployeeId}, Error={ErrorMessage}",
                    employeeId, ex.Message
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        #endregion

        #region SME Application

        /// <summary>Submits an SME registration application with proof document for manager approval.</summary>
        public async Task<ApiResponse<int>> ApplyToBecomeSme(
            int employeeId,
            BecomeSmeRequest request
        )
        {
            Log.Information(
                "ApplyToBecomeSme started. EmployeeId={EmployeeId}, SkillId={SkillId}, FileName={FileName}",
                employeeId, request.SkillId, request.ProofDocument?.FileName
            );

            try
            {
                var skillMapping = await _skillRepository.GetEmployeeSkillMappingAsync(
                    employeeId,
                    request.SkillId
                );

                if (skillMapping == null || skillMapping.Rating < LnDConstants.MIN_SME_RATING)
                {
                    Log.Warning(
                        "ApplyToBecomeSme: Skill rating validation failed. EmployeeId={EmployeeId}, SkillId={SkillId}, Rating={Rating}",
                        employeeId, request.SkillId, skillMapping?.Rating
                    );

                    return new ApiResponse<int>
                    {
                        Success = false,
                        Message =
                            $"You need a rating of at least {LnDConstants.MIN_SME_RATING} to become an SME",
                    };
                }

                var existingSme = await _smeRepository.GetActiveSmeAsync(
                    employeeId,
                    request.SkillId
                );

                if (existingSme != null)
                {
                    Log.Warning(
                        "ApplyToBecomeSme: Employee already an active SME. EmployeeId={EmployeeId}, SkillId={SkillId}, SmeId={SmeId}",
                        employeeId, request.SkillId, existingSme.SmeId
                    );

                    return new ApiResponse<int>
                    {
                        Success = false,
                        Message = "You are already an active SME for this skill",
                    };
                }

                var pendingApproval = await _approvalRepository.GetPendingSmeRegistrationAsync(
                    employeeId,
                    request.SkillId
                );

                if (pendingApproval != null)
                {
                    Log.Warning(
                        "ApplyToBecomeSme: Pending approval exists. EmployeeId={EmployeeId}, SkillId={SkillId}, ApprovalId={ApprovalId}",
                        employeeId, request.SkillId, pendingApproval.ApprovalId
                    );

                    return new ApiResponse<int>
                    {
                        Success = false,
                        Message = "You already have a pending SME registration request",
                    };
                }

                var filePath = await _fileStorage.SaveFileAsync(
                    request.ProofDocument,
                    LnDConstants.FILE_STORAGE.SME_PROOFS
                );

                Log.Debug("ApplyToBecomeSme: File saved. FilePath={FilePath}", filePath);

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
                await _baseRepository.SaveChangesAsync();

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
                await _baseRepository.SaveChangesAsync();

                Log.Information(
                    "ApplyToBecomeSme succeeded. EmployeeId={EmployeeId}, SkillId={SkillId}, ApprovalId={ApprovalId}, ApproverId={ApproverId}",
                    employeeId, request.SkillId, approval.ApprovalId, skillMapping.Employee.ReportingManagerEmployeeId
                );

                return new ApiResponse<int>
                {
                    Success = true,
                    Message = "SME registration request submitted successfully",
                    Data = approval.ApprovalId,
                };
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "ApplyToBecomeSme failed. EmployeeId={EmployeeId}, SkillId={SkillId}, Error={ErrorMessage}",
                    employeeId, request.SkillId, ex.Message
                );

                return new ApiResponse<int>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        #endregion

        #region SME Queries

        /// <summary>Gets paginated available SMEs for a skill with in-progress assignment counts.</summary>
        public async Task<ApiResponse<PaginatedResponse<SmeDto>>> GetAvailableSmes(
            int skillId,
            string searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            Log.Information(
                "GetAvailableSmes started. SkillId={SkillId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                skillId, searchTerm ?? "none", pageNumber, pageSize
            );

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

                Log.Debug(
                    "GetAvailableSmes: Retrieved {ItemCount} SMEs. TotalCount={TotalCount}",
                    items.Count, totalCount
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

                Log.Information(
                    "GetAvailableSmes succeeded. SkillId={SkillId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                    skillId, smeDtos.Count, totalCount
                );

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
                Log.Error(
                    ex,
                    "GetAvailableSmes failed. SkillId={SkillId}, Error={ErrorMessage}",
                    skillId, ex.Message
                );

                return new ApiResponse<PaginatedResponse<SmeDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        /// <summary>Gets paginated list of all active SMEs with department information.</summary>
        public async Task<ApiResponse<PaginatedResponse<SmeDto>>> GetAllActiveSmes(
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            Log.Information(
                "GetAllActiveSmes started. SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                searchTerm ?? "none", pageNumber, pageSize
            );

            try
            {
                var (items, totalCount) = await _smeRepository.GetAllActiveSmesAsync(
                    searchTerm,
                    pageNumber,
                    pageSize
                );

                Log.Debug(
                    "GetAllActiveSmes: Retrieved {ItemCount} SMEs. TotalCount={TotalCount}",
                    items.Count, totalCount
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

                Log.Information(
                    "GetAllActiveSmes succeeded. ReturnedCount={Count}, TotalCount={TotalCount}",
                    smeDtos.Count, totalCount
                );

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
                Log.Error(
                    ex,
                    "GetAllActiveSmes failed. SearchTerm={SearchTerm}, Error={ErrorMessage}",
                    searchTerm, ex.Message
                );

                return new ApiResponse<PaginatedResponse<SmeDto>>
                {
                    Success = false,
                    Message = $"Error retrieving SMEs: {ex.Message}",
                };
            }
        }

        #endregion

        #region Export

        /// <summary>Exports all active SMEs to Excel with employee, skill, and department details.</summary>
        public async Task<ApiResponse<byte[]>> ExportAllActiveSmesToExcel(string? searchTerm)
        {
            Log.Information(
                "ExportAllActiveSmesToExcel started. SearchTerm={SearchTerm}",
                searchTerm ?? "none"
            );

            try
            {
                var allSmes = await _smeRepository.GetAllActiveSmesForExportAsync(searchTerm);

                Log.Debug(
                    "ExportAllActiveSmesToExcel: Retrieved {Count} SMEs for export",
                    allSmes.Count
                );

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
                            $"{sme.Employee?.Userprofile?.FirstName ?? ""} {sme.Employee?.Userprofile?.LastName ?? ""}".Trim();
                        var skillName = sme.Skill?.SkillName ?? "N/A";
                        var departmentName =
                            sme.Employee?.Employeedetailsmasters.FirstOrDefault()?.Department?.DepartmentName
                            ?? "N/A";

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
                        var fileBytes = stream.ToArray();

                        Log.Information(
                            "ExportAllActiveSmesToExcel succeeded. SmeCount={Count}, FileSize={FileSize} bytes",
                            allSmes.Count, fileBytes.Length
                        );

                        return new ApiResponse<byte[]> { Success = true, Data = fileBytes };
                    }
                }
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "ExportAllActiveSmesToExcel failed. SearchTerm={SearchTerm}, Error={ErrorMessage}",
                    searchTerm, ex.Message
                );

                return new ApiResponse<byte[]>
                {
                    Success = false,
                    Message = $"Error exporting SMEs: {ex.Message}",
                };
            }
        }

        #endregion
    }
}

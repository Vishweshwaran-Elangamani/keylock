using ClosedXML.Excel;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Serilog;
using MapsterMapper;

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
        private readonly IMapper _mapper;

        public LnDSmeService(
            ILnDSmeRepository smeRepository,
            ILnDEmployeeSkillRepository skillRepository,
            ILnDApprovalRepository approvalRepository,
            IFileStorageService fileStorage,
            ILnDBaseRepository baseRepository,
            IMapper mapper
        )
        {
            _smeRepository = smeRepository;
            _skillRepository = skillRepository;
            _approvalRepository = approvalRepository;
            _fileStorage = fileStorage;
            _baseRepository = baseRepository;
            _mapper = mapper;
        }

        #endregion

        #region SME Status

        /// <summary>
        /// Checks if an employee has active SME status for any skill
        /// </summary>
        public async Task<ApiResponse<bool>> CheckIfEmployeeIsSme(int employeeId)
        {
            Log.Information("CheckIfEmployeeIsSme started. EmployeeId={EmployeeId}", employeeId);

            var isSme = await _smeRepository.IsEmployeeSme(employeeId);

            Log.Information(
                "CheckIfEmployeeIsSme succeeded. EmployeeId={EmployeeId}, IsSme={IsSme}",
                employeeId,
                isSme
            );

            return new ApiResponse<bool> { Success = true, Data = isSme };
        }

        #endregion

        #region SME Application

        /// <summary>
        /// Submits an SME registration application with proof document for manager approval
        /// </summary>
        public async Task<ApiResponse<int>> ApplyToBecomeSme(
            int employeeId,
            BecomeSmeRequestModel request
        )
        {
            Log.Information(
                "ApplyToBecomeSme started. EmployeeId={EmployeeId}, SkillId={SkillId}, FileName={FileName}",
                employeeId,
                request.SkillId,
                request.ProofDocument?.FileName
            );

            var skillMapping = await _skillRepository.GetEmployeeSkillMapping(
                employeeId,
                request.SkillId
            );

            if (skillMapping == null || skillMapping.Rating < LnDConstants.MIN_SME_RATING)
            {
                Log.Warning(
                    "ApplyToBecomeSme: Skill rating validation failed. EmployeeId={EmployeeId}, SkillId={SkillId}, Rating={Rating}",
                    employeeId,
                    request.SkillId,
                    skillMapping?.Rating
                );

                return new ApiResponse<int>
                {
                    Success = false,
                    Message = string.Format(
                        LnDConstants.RESPONSE_MESSAGES.SME_MIN_RATING_REQUIRED,
                        LnDConstants.MIN_SME_RATING
                    ),
                };
            }

            var existingSme = await _smeRepository.GetActiveSme(employeeId, request.SkillId);

            if (existingSme != null)
            {
                Log.Warning(
                    "ApplyToBecomeSme: Employee already an active SME. EmployeeId={EmployeeId}, SkillId={SkillId}, SmeId={SmeId}",
                    employeeId,
                    request.SkillId,
                    existingSme.SmeId
                );

                return new ApiResponse<int>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.ALREADY_ACTIVE_SME,
                };
            }

            var pendingApproval = await _approvalRepository.GetPendingSmeRegistration(
                employeeId,
                request.SkillId
            );

            if (pendingApproval != null)
            {
                Log.Warning(
                    "ApplyToBecomeSme: Pending approval exists. EmployeeId={EmployeeId}, SkillId={SkillId}, ApprovalId={ApprovalId}",
                    employeeId,
                    request.SkillId,
                    pendingApproval.ApprovalId
                );

                return new ApiResponse<int>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.SME_REGISTRATION_ALREADY_PENDING,
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

            await _approvalRepository.AddAttachment(attachment);
            await _baseRepository.SaveChanges();

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

            await _approvalRepository.AddApproval(approval);
            await _baseRepository.SaveChanges();

            Log.Information(
                "ApplyToBecomeSme succeeded. EmployeeId={EmployeeId}, SkillId={SkillId}, ApprovalId={ApprovalId}, ApproverId={ApproverId}",
                employeeId,
                request.SkillId,
                approval.ApprovalId,
                skillMapping.Employee.ReportingManagerEmployeeId
            );

            return new ApiResponse<int>
            {
                Success = true,
                Message = LnDConstants.RESPONSE_MESSAGES.SME_REGISTRATION_REQUEST_SUCCESS,

                Data = approval.ApprovalId,
            };
        }

        #endregion

        #region SME Queries

        /// <summary>
        /// Gets paginated available SMEs for a skill with in-progress assignment counts
        /// </summary>
        public async Task<ApiResponse<PaginatedResponse<SmeResponseModel>>> GetAvailableSmes(
            AvailableSmesRequestModel request
        )
        {
            Log.Information(
                "GetAvailableSmes started. SkillId={SkillId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                request.SkillId,
                request.SearchTerm ?? "none",
                request.PageNumber,
                request.PageSize
            );

            var (items, totalCount) = await _smeRepository.GetAvailableSmesWithAssignmentCounts(
                request,
                LnDConstants.MAX_SME_ASSIGNMENTS
            );

            Log.Debug(
                "GetAvailableSmes: Retrieved {ItemCount} SMEs. TotalCount={TotalCount}",
                items.Count,
                totalCount
            );

            // Use Mapster to map Lndsme entities to SmeResponseModel
            var smeModels = _mapper.Map<List<SmeResponseModel>>(items);

            foreach (var smeModel in smeModels)
            {
                var inProgressCount = await _smeRepository.GetSmeInProgressAssignmentCount(
                    smeModel.SmeId
                );
                smeModel.InProgressAssignments = inProgressCount;
            }

            Log.Information(
                "GetAvailableSmes succeeded. SkillId={SkillId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                request.SkillId,
                smeModels.Count,
                totalCount
            );  

            return new ApiResponse<PaginatedResponse<SmeResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<SmeResponseModel>
                {
                    Items = smeModels,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                },
            };
        }

        /// <summary>
        /// Gets paginated list of all active SMEs with department information
        /// </summary>
        public async Task<ApiResponse<PaginatedResponse<SmeResponseModel>>> GetAllActiveSmes(
            ActiveSmesRequestModel request
        )
        {
            Log.Information(
                "GetAllActiveSmes started. SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                request.SearchTerm ?? "none",
                request.PageNumber,
                request.PageSize
            );

            var (items, totalCount) = await _smeRepository.GetAllActiveSmes(request);

            return new ApiResponse<PaginatedResponse<SmeResponseModel>>
            {
                Success = true,
                Message = string.Format(
                    LnDConstants.RESPONSE_MESSAGES.ACTIVE_SMES_FOUND,
                    totalCount
                ),
                Data = new PaginatedResponse<SmeResponseModel>
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

        /// <summary>
        /// Exports all active SMEs to Excel with employee, skill, and department details
        /// </summary>
        public async Task<ApiResponse<byte[]>> GetAllActiveSmesForExport(
            ExportActiveSmesRequestModel request
        )
        {
            Log.Information(
                "GetAllActiveSmesForExport started. SearchTerm={SearchTerm}",
                request.SearchTerm ?? "none"
            );

            var allSmes = await _smeRepository.GetAllActiveSmesForExport(request);

            Log.Debug(
                "GetAllActiveSmesForExport: Retrieved {Count} SMEs for export",
                allSmes.Count
            );

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add(LnDConstants.ACTIVE_SMES_EXPORT.TITLE);

                worksheet.Cell(1, 1).Value = LnDConstants.ACTIVE_SMES_EXPORT.EMPLOYEE_NAME;
                worksheet.Cell(1, 2).Value = LnDConstants.ACTIVE_SMES_EXPORT.SKILL_NAME;
                worksheet.Cell(1, 3).Value = LnDConstants.ACTIVE_SMES_EXPORT.DEPARTMENT;
                worksheet.Cell(1, 4).Value = LnDConstants.ACTIVE_SMES_EXPORT.APPROVED_DATE;

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
                        "GetAllActiveSmesForExport succeeded. SmeCount={Count}, FileSize={FileSize} bytes",
                        allSmes.Count,
                        fileBytes.Length
                    );

                    return new ApiResponse<byte[]> { Success = true, Data = fileBytes };
                }
            }
        }

        #endregion
    }
} 
      
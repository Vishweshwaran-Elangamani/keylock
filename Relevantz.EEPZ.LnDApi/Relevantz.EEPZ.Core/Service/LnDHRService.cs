using ClosedXML.Excel;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Serilog;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class LnDHRService : ILnDHRService
    {
        #region Dependencies

        private readonly ILnDHRRepository _hrRepository;
        private readonly ILnDBaseRepository _baseRepository;

        public LnDHRService(ILnDHRRepository hrRepository, ILnDBaseRepository baseRepsitory)
        {
            _hrRepository = hrRepository;
            _baseRepository = baseRepsitory;
        }

        #endregion

        #region Employee Management

        /// <summary>Gets paginated list of all organization employees with department information.</summary>
        public async Task<
            ApiResponse<PaginatedResponse<SubordinateEmployeeResponseModel>>
        > GetAllOrganizationEmployees(OrganizationEmployeesRequestModel request)
        {
            Log.Information(
                "GetAllOrganizationEmployees started. SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                request.SearchTerm ?? "none", request.PageNumber, request.PageSize
            );

            var (items, totalCount) = await _hrRepository.GetAllOrganizationEmployeesAsync(request);

            Log.Debug(
                "GetAllOrganizationEmployees: Retrieved {ItemCount} employees from database. TotalCount={TotalCount}",
                items.Count, totalCount
            );

            var employeeDtos = items
                .Select(e => new SubordinateEmployeeResponseModel
                {
                    EmployeeId = e.EmployeeId,
                    EmployeeName = $"{e.Userprofile?.FirstName} {e.Userprofile?.LastName}",
                    Email = e.Userauthentication?.Email,
                    DepartmentName = e
                        .Employeedetailsmasters.FirstOrDefault()
                        ?.Department?.DepartmentName,
                })
                .ToList();

            var paginatedResponse = new PaginatedResponse<SubordinateEmployeeResponseModel>
            {
                Items = employeeDtos,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
            };

            Log.Information(
                "GetAllOrganizationEmployees succeeded. ReturnedCount={Count}, TotalCount={TotalCount}",
                employeeDtos.Count, totalCount
            );

            return new ApiResponse<PaginatedResponse<SubordinateEmployeeResponseModel>>
            {
                Success = true,
                Message = $"Found {totalCount} employee(s)",
                Data = paginatedResponse,
            };
        }

        /// <summary>Gets paginated skills for a specific employee with SME eligibility calculation.</summary>
        public async Task<ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>> GetEmployeeSkillsById(
            int employeeId,
            EmployeeSkillsByIdRequestModel request
        )
        {
            Log.Information(
                "GetEmployeeSkillsById started. EmployeeId={EmployeeId}, Page={PageNumber}, SearchTerm={SearchTerm}, SortBy={SortBy}",
                employeeId, request.PageNumber, request.SearchTerm ?? "none", request.SortBy ?? "default"
            );

            var pageSize = 10;

            var (items, totalCount) = await _hrRepository.GetEmployeeSkillsByIdAsync(
                employeeId,
                request
            );

            Log.Debug(
                "GetEmployeeSkillsById: Retrieved {ItemCount} skills for EmployeeId={EmployeeId}. TotalCount={TotalCount}",
                items.Count, employeeId, totalCount
            );

            var skillDtos = items
                .Select(m => new EmployeeSkillResponseModel
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

            Log.Information(
                "GetEmployeeSkillsById succeeded. EmployeeId={EmployeeId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                employeeId, skillDtos.Count, totalCount
            );

            return new ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<EmployeeSkillResponseModel>
                {
                    Items = skillDtos,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = pageSize,
                },
            };
        }

        #endregion

        #region Assignment Management

        /// <summary>Gets paginated organization-wide assignments with filtering and search.</summary>
        public async Task<
            ApiResponse<PaginatedResponse<AssignmentResponseModel>>
        > GetAllOrganizationAssignments(OrganizationAssignmentsRequestModel request)
        {
            Log.Information(
                "GetAllOrganizationAssignments started. StatusFilter={StatusFilter}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                request.StatusFilter ?? "all", request.SearchTerm ?? "none", request.PageNumber, request.PageSize
            );

            var (items, totalCount) = await _hrRepository.GetAllOrganizationAssignmentsAsync(request);

            Log.Debug(
                "GetAllOrganizationAssignments: Retrieved {ItemCount} assignments. TotalCount={TotalCount}",
                items.Count, totalCount
            );

            var today = DateTime.Now.Date;

            var assignmentResponseModels = items
                .Select(a =>
                {
                    var deadlineDate = a.Deadline?.Date;
                    var isCompleted = a.Status == LnDConstants.ASSIGNMENT_STATUS.COMPLETED;

                    var isOverdue = deadlineDate.HasValue
                        && deadlineDate.Value < today
                        && !isCompleted;

                    var daysOverdue = isOverdue && deadlineDate.HasValue
                        ? (int)(today - deadlineDate.Value).TotalDays
                        : (int?)null;

                    return new AssignmentResponseModel
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
                        IsOverdue = isOverdue,
                        DaysOverdue = daysOverdue,
                    };
                })
                .ToList();

            var paginatedResponse = new PaginatedResponse<AssignmentResponseModel>
            {
                Items = assignmentResponseModels,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
            };

            Log.Information(
                "GetAllOrganizationAssignments succeeded. ReturnedCount={Count}, TotalCount={TotalCount}",
                assignmentResponseModels.Count, totalCount
            );

            return new ApiResponse<PaginatedResponse<AssignmentResponseModel>>
            {
                Success = true,
                Message = $"Found {totalCount} assignment(s)",
                Data = paginatedResponse,
            };
        }

        #endregion

        #region Export

        /// <summary>Exports all organization assignments to Excel with department and employee details.</summary>
        public async Task<ApiResponse<byte[]>> ExportOrganizationAssignmentsToExcel(
            ExportOrganizationAssignmentsRequestModel request
        )
        {
            Log.Information(
                "ExportOrganizationAssignmentsToExcel started. StatusFilter={StatusFilter}, SearchTerm={SearchTerm}",
                request.StatusFilter ?? "all", request.SearchTerm ?? "none"
            );

            var allAssignments =
                await _hrRepository.GetAllOrganizationAssignmentsForExportAsync(request);

            Log.Debug(
                "ExportOrganizationAssignmentsToExcel: Retrieved {Count} assignments for export",
                allAssignments.Count
            );

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Organization Assignments");

                worksheet.Cell(1, 1).Value = "Employee Name";
                worksheet.Cell(1, 2).Value = "Department";
                worksheet.Cell(1, 3).Value = "Skill Name";
                worksheet.Cell(1, 4).Value = "SME Assigned";
                worksheet.Cell(1, 5).Value = "Assignment Status";
                worksheet.Cell(1, 6).Value = "Start Date";
                worksheet.Cell(1, 7).Value = "Due Date";
                worksheet.Cell(1, 8).Value = "Score";
                worksheet.Cell(1, 9).Value = "Comments";

                var headerRange = worksheet.Range(1, 1, 1, 9);
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
                    var department =
                        assignment
                            .MenteeEmployee?.Employeedetailsmasters.FirstOrDefault()
                            ?.Department?.DepartmentName ?? "N/A";
                    var skillName = assignment.Skill?.SkillName ?? "N/A";
                    var smeName =
                        $"{assignment.Sme?.Employee?.Userprofile?.FirstName ?? ""} {assignment.Sme?.Employee?.Userprofile?.LastName ?? ""}".Trim();

                    worksheet.Cell(row, 1).Value = menteeName;
                    worksheet.Cell(row, 2).Value = department;
                    worksheet.Cell(row, 3).Value = skillName;
                    worksheet.Cell(row, 4).Value = smeName;
                    worksheet.Cell(row, 5).Value = assignment.Status ?? "N/A";
                    worksheet.Cell(row, 6).Value =
                        assignment.CreatedOn?.ToString("MM/dd/yyyy") ?? "";
                    worksheet.Cell(row, 7).Value =
                        assignment.Deadline?.ToString("MM/dd/yyyy") ?? "";
                    worksheet.Cell(row, 8).Value =
                        assignment.CompletionRating?.ToString() ?? "N/A";
                    worksheet.Cell(row, 9).Value = assignment.CompletionNotes ?? "";

                    row++;
                }

                worksheet.Columns().AdjustToContents();

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    var fileBytes = stream.ToArray();

                    Log.Information(
                        "ExportOrganizationAssignmentsToExcel succeeded. AssignmentCount={Count}, FileSize={FileSize} bytes",
                        allAssignments.Count, fileBytes.Length
                    );

                    return new ApiResponse<byte[]> { Success = true, Data = fileBytes };
                }
            }
        }

        #endregion
    }
}

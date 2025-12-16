using ClosedXML.Excel;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class LnDHRService : ILnDHRService
    {
        private readonly ILnDHRRepository _hrRepository;

        public LnDHRService(ILnDHRRepository hrRepository)
        {
            _hrRepository = hrRepository;
        }

        public async Task<ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>> GetAllOrganizationEmployees(
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            try
            {
                var (items, totalCount) = await _hrRepository.GetAllOrganizationEmployeesAsync(
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
                var (items, totalCount) = await _hrRepository.GetAllOrganizationAssignmentsAsync(
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
        public async Task<ApiResponse<byte[]>> ExportOrganizationAssignmentsToExcel(
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder
        )
        {
            try
            {
                var allAssignments = await _hrRepository.GetAllOrganizationAssignmentsForExportAsync(
                    statusFilter,
                    searchTerm,
                    sortField,
                    sortOrder
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
                            $"{assignment.MenteeEmployee?.Userprofile?.FirstName ?? ""} {assignment.MenteeEmployee?.Userprofile?.LastName ?? ""}"
                                .Trim();
                        var department =
                            assignment.MenteeEmployee?.Employeedetailsmasters.FirstOrDefault()
                                ?.Department?.DepartmentName ?? "N/A";
                        var skillName = assignment.Skill?.SkillName ?? "N/A";
                        var smeName =
                            $"{assignment.Sme?.Employee?.Userprofile?.FirstName ?? ""} {assignment.Sme?.Employee?.Userprofile?.LastName ?? ""}"
                                .Trim();

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

        public async Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetEmployeeSkillsById(
            int employeeId,
            int pageNumber,
            string? searchTerm,
            string? sortBy
        )
        {
            try
            {
                var pageSize = 10;

                var (items, totalCount) = await _hrRepository.GetEmployeeSkillsByIdAsync(
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
    }
}

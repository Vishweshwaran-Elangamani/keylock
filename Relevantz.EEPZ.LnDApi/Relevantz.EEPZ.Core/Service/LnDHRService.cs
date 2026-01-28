using ClosedXML.Excel;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
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

        /// <summary>
        /// Gets paginated list of all organization employees with department information
        /// </summary>
        public async Task<
            ApiResponse<PaginatedResponse<SubordinateEmployeeResponseModel>>
        > GetAllOrganizationEmployees(OrganizationEmployeesRequestModel request)
        {
            Log.Information(
                "GetAllOrganizationEmployees started. SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                request.SearchTerm ?? "none",
                request.PageNumber,
                request.PageSize
            );

            var (items, totalCount) = await _hrRepository.GetAllOrganizationEmployees(request);

            Log.Debug(
                "GetAllOrganizationEmployees: Retrieved {ItemCount} employees from database. TotalCount={TotalCount}",
                items.Count,
                totalCount
            ); 

            var paginatedResponse = new PaginatedResponse<SubordinateEmployeeResponseModel>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
            };      

            Log.Information(
                "GetAllOrganizationEmployees succeeded. ReturnedCount={Count}, TotalCount={TotalCount}",
                items.Count,
                totalCount
            );

            return new ApiResponse<PaginatedResponse<SubordinateEmployeeResponseModel>>
            {
                Success = true,
                Message = string.Format(LnDConstants.RESPONSE_MESSAGES.EMPLOYEES_FOUND, totalCount),
                Data = paginatedResponse,
            };
        }

        /// <summary>
        /// Gets paginated skills for a specific employee with SME eligibility calculation
        /// </summary>
        public async Task<
            ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>
        > GetEmployeeSkillsById(int employeeId, EmployeeSkillsByIdRequestModel request)
        {
            Log.Information(
                "GetEmployeeSkillsById started. EmployeeId={EmployeeId}, Page={PageNumber}, SearchTerm={SearchTerm}, SortBy={SortBy}",
                employeeId,
                request.PageNumber,
                request.SearchTerm ?? "none",
                request.SortBy ?? "default"
            );

            var pageSize = 10;

            var (items, totalCount) = await _hrRepository.GetEmployeeSkillsById(
                employeeId,
                request
            );
            var sortedItems = ApplySkillSorting(items.AsQueryable(), request.SortBy).ToList();

            var responseItems = sortedItems
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

            return new ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<EmployeeSkillResponseModel>
                {
                    Items = responseItems,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = pageSize,
                },
            };
        }

        #endregion

        #region Assignment Management

        /// <summary>
        /// Gets paginated organization-wide assignments with filtering and search
        /// </summary>
        public async Task<
            ApiResponse<PaginatedResponse<AssignmentResponseModel>>
        > GetAllOrganizationAssignments(OrganizationAssignmentsRequestModel request)
        {
            Log.Information(
                "GetAllOrganizationAssignments started. StatusFilter={StatusFilter}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                request.StatusFilter ?? "all",
                request.SearchTerm ?? "none",
                request.PageNumber,
                request.PageSize
            );

            var (items, totalCount) = await _hrRepository.GetAllOrganizationAssignments(request);

            var sortedItems = ApplySorting(
                    items.AsQueryable(),
                    request.SortField,
                    request.SortOrder
                )
                .ToList();

            var today = DateTime.Now.Date;

            var assignmentResponseModels = sortedItems
                .Select(a =>
                {
                    var deadlineDate = a.Deadline?.Date;
                    var isCompleted = a.Status == LnDConstants.ASSIGNMENT_STATUS.COMPLETED;

                    var isOverdue =
                        deadlineDate.HasValue && deadlineDate.Value < today && !isCompleted;

                    var daysOverdue =
                        isOverdue && deadlineDate.HasValue
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
                assignmentResponseModels.Count,
                totalCount
            );

            return new ApiResponse<PaginatedResponse<AssignmentResponseModel>>
            {
                Success = true,
                Message = string.Format(
                    LnDConstants.RESPONSE_MESSAGES.ASSIGNMENTS_FOUND,
                    totalCount
                ),
                Data = paginatedResponse,
            };
        }

        #endregion

        #region Export

        /// <summary>
        /// Exports all organization assignments to Excel with department and employee details
        /// </summary>
        public async Task<ApiResponse<byte[]>> GetOrganizationAssignmentsForExport(
            ExportOrganizationAssignmentsRequestModel request
        )
        {
            Log.Information(
                "ExportOrganizationAssignmentsToExcel started. StatusFilter={StatusFilter}, SearchTerm={SearchTerm}",
                request.StatusFilter ?? "all",
                request.SearchTerm ?? "none"
            );

            var assignments = await _hrRepository.GetAllOrganizationAssignmentsForExport(request);

            var sortedAssignments = ApplyAssignmentSorting(
                    assignments.AsQueryable(),
                    request.SortField,
                    request.SortOrder
                )
                .ToList();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add(LnDConstants.ORG_EXPORT.TITLE);

            worksheet.Cell(1, 1).Value = LnDConstants.ORG_EXPORT.EMPLOYEE_NAME;
            worksheet.Cell(1, 2).Value = LnDConstants.ORG_EXPORT.DEPARTMENT;
            worksheet.Cell(1, 3).Value = LnDConstants.ORG_EXPORT.SKILL_NAME;
            worksheet.Cell(1, 4).Value = LnDConstants.ORG_EXPORT.SME_ASSIGNED;
            worksheet.Cell(1, 5).Value = LnDConstants.ORG_EXPORT.ASSIGNMENT_STATUS;
            worksheet.Cell(1, 6).Value = LnDConstants.ORG_EXPORT.START_DATE;
            worksheet.Cell(1, 7).Value = LnDConstants.ORG_EXPORT.DUE_DATE;
            worksheet.Cell(1, 8).Value = LnDConstants.ORG_EXPORT.SCORE;
            worksheet.Cell(1, 9).Value = LnDConstants.ORG_EXPORT.COMMENTS;

            int row = 2; 

            foreach (var assignment in sortedAssignments)
            {
                worksheet.Cell(row, 1).Value =
                    $"{assignment.MenteeEmployee?.Userprofile?.FirstName} {assignment.MenteeEmployee?.Userprofile?.LastName}";

                worksheet.Cell(row, 2).Value =
                    assignment
                        .MenteeEmployee?.Employeedetailsmasters.FirstOrDefault()
                        ?.Department?.DepartmentName
                    ?? "N/A";

                worksheet.Cell(row, 3).Value = assignment.Skill?.SkillName ?? "N/A";

                worksheet.Cell(row, 4).Value =
                    $"{assignment.Sme?.Employee?.Userprofile?.FirstName} {assignment.Sme?.Employee?.Userprofile?.LastName}";

                worksheet.Cell(row, 5).Value = assignment.Status ?? "N/A";
                worksheet.Cell(row, 6).Value = assignment.CreatedOn?.ToString("MM/dd/yyyy");
                worksheet.Cell(row, 7).Value = assignment.Deadline?.ToString("MM/dd/yyyy");
                worksheet.Cell(row, 8).Value = assignment.CompletionRating?.ToString() ?? "N/A";
                worksheet.Cell(row, 9).Value = assignment.CompletionNotes ?? "";

                row++;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);

            return new ApiResponse<byte[]> { Success = true, Data = stream.ToArray() };
        }
        #endregion


        private IQueryable<Lndassignment> ApplySorting(
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

        #region privatehelper
        private IQueryable<Lndemployeeskillmapper> ApplySkillSorting(
            IQueryable<Lndemployeeskillmapper> query,
            string? sortBy
        )
        {
            return sortBy?.ToLower() switch
            {
                LnDConstants.SORT_FIELDS.SKILL_NAME => query.OrderBy(m => m.Skill.SkillName),

                LnDConstants.SORT_FIELDS.RATING => query.OrderByDescending(m => m.Rating),

                LnDConstants.SORT_FIELDS.CREATED_ON => query.OrderByDescending(m => m.CreatedOn),

                _ => query.OrderBy(m => m.Skill.SkillName),
            };
        }

        private IQueryable<Lndassignment> ApplyAssignmentSorting(
            IQueryable<Lndassignment> query,
            string? sortField,
            string? sortOrder
        )
        {
            bool asc =
                string.IsNullOrEmpty(sortOrder)
                || sortOrder.Equals(
                    LnDConstants.SORT_ORDER.ASC,
                    StringComparison.OrdinalIgnoreCase
                );

            return sortField?.ToLower() switch
            {
                LnDConstants.SORT_FIELDS.SKILL_NAME => asc
                    ? query.OrderBy(a => a.Skill.SkillName)
                    : query.OrderByDescending(a => a.Skill.SkillName),

                LnDConstants.SORT_FIELDS.SME_NAME => asc
                    ? query
                        .OrderBy(a => a.Sme.Employee.Userprofile.FirstName)
                        .ThenBy(a => a.Sme.Employee.Userprofile.LastName)
                    : query
                        .OrderByDescending(a => a.Sme.Employee.Userprofile.FirstName)
                        .ThenByDescending(a => a.Sme.Employee.Userprofile.LastName),

                LnDConstants.SORT_FIELDS.STATUS => asc
                    ? query.OrderBy(a => a.Status)
                    : query.OrderByDescending(a => a.Status),

                LnDConstants.SORT_FIELDS.CREATED_ON => asc
                    ? query.OrderBy(a => a.CreatedOn)
                    : query.OrderByDescending(a => a.CreatedOn),

                LnDConstants.SORT_FIELDS.DEADLINE => asc
                    ? query.OrderBy(a => a.Deadline)
                    : query.OrderByDescending(a => a.Deadline),

                LnDConstants.SORT_FIELDS.COMPLETION_RATING => asc
                    ? query.OrderBy(a => a.CompletionRating ?? 0)
                    : query.OrderByDescending(a => a.CompletionRating ?? 0),

                _ => query.OrderByDescending(a => a.CreatedOn),
            };
        }
        #endregion
    }
}

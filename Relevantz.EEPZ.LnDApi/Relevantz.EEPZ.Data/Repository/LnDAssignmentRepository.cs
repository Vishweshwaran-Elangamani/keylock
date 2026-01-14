using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Serilog;

namespace Relevantz.EEPZ.Data.Repositories.Implementations
{
    public class LnDAssignmentRepository : ILnDAssignmentRepository
    {
        #region Dependencies

        private readonly EEPZDbContext _context;

        public LnDAssignmentRepository(EEPZDbContext context)
        {
            _context = context;
        }

        #endregion

        #region Overdue Management

        /// <summary>Gets all assignments that are overdue (past deadline and not completed).</summary>
        public async Task<List<Lndassignment>> GetOverdueAssignments()
        {
            var today = DateTime.Now.Date;

            Log.Debug("GetOverdueAssignmentsAsync called. Today={Today}", today);

            var assignments = await _context
                .Lndassignments.Include(a => a.MenteeEmployee)
                .Include(a => a.Sme)
                .Include(a => a.Skill)
                .Where(a =>
                    a.Deadline.HasValue
                    && a.Deadline.Value.Date < today
                    && a.Status != LnDConstants.ASSIGNMENT_STATUS.COMPLETED
                    && a.Status != LnDConstants.ASSIGNMENT_STATUS.OVERDUE
                )
                .ToListAsync();

            Log.Information("GetOverdueAssignmentsAsync completed. OverdueCount={Count}", assignments.Count);

            return assignments;
        }

        /// <summary>Marks assignments as overdue and updates status in database.</summary>
        public async Task<int> MarkAssignmentsAsOverdue()
        {
            Log.Information("MarkAssignmentsAsOverdueAsync started");

            var overdueAssignments = await GetOverdueAssignments();

            if (overdueAssignments.Count == 0)
            {
                Log.Information("MarkAssignmentsAsOverdueAsync: No overdue assignments found");
                return 0;
            }

            foreach (var assignment in overdueAssignments)
            {
                assignment.Status = LnDConstants.ASSIGNMENT_STATUS.OVERDUE;
                assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);
            }

            _context.Lndassignments.UpdateRange(overdueAssignments);
            var count = await _context.SaveChangesAsync();

            Log.Information("MarkAssignmentsAsOverdueAsync completed. MarkedCount={Count}", count);

            return count;
        }

        #endregion

        #region Assignment Retrieval

        /// <summary>Gets a single assignment by ID with all related entities including mentee, SME, and skill.</summary>
        public async Task<Lndassignment?> GetAssignmentById(int assignmentId)
        {
            Log.Debug("GetAssignmentByIdAsync called. AssignmentId={AssignmentId}", assignmentId);

            var assignment = await _context
                .Lndassignments.Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Sme)
                .ThenInclude(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId);

            if (assignment == null)
            {
                Log.Warning("GetAssignmentByIdAsync: Assignment not found. AssignmentId={AssignmentId}", assignmentId);
            }
            else
            {
                Log.Debug("GetAssignmentByIdAsync succeeded. AssignmentId={AssignmentId}, Status={Status}",
                    assignmentId, assignment.Status);
            }

            return assignment;
        }

        /// <summary>Gets paginated assignments for a mentee with filtering and search capabilities.</summary>
        public async Task<(List<AssignmentResponseModel> Items, int TotalCount)> GetMyAssignments(
     int employeeId,
     AssignmentRequestModel request
 )
        {
            Log.Information(
                "GetMyAssignmentsAsync called. EmployeeId={EmployeeId}, StatusFilter={StatusFilter}, Page={PageNumber}",
                employeeId, request.StatusFilter ?? "all", request.PageNumber
            );

            var query = _context
                .Lndassignments.Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Sme)
                .ThenInclude(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Where(a => a.MenteeEmployeeId == employeeId);

            if (!string.IsNullOrEmpty(request.StatusFilter))
            {
                query = query.Where(a => a.Status == request.StatusFilter);
            }

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var lowerSearchTerm = request.SearchTerm.ToLower();
                query = query.Where(a =>
                    a.Skill.SkillName.ToLower().Contains(lowerSearchTerm)
                    || ((a.Sme.Employee.Userprofile.FirstName ?? "") + " " + (a.Sme.Employee.Userprofile.LastName ?? ""))
                        .ToLower().Contains(lowerSearchTerm)
                    || ((a.MenteeEmployee.Userprofile.FirstName ?? "") + " " + (a.MenteeEmployee.Userprofile.LastName ?? ""))
                        .ToLower().Contains(lowerSearchTerm)
                    || a.Status.ToLower().Contains(lowerSearchTerm)
                    || (a.CompletionNotes != null && a.CompletionNotes.ToLower().Contains(lowerSearchTerm))
                );
            }

            var totalCount = await query.CountAsync();

            query = ApplyAssignmentSorting(query, request.SortField, request.SortOrder);

            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(a => new AssignmentResponseModel
                {
                    AssignmentId = a.AssignmentId,
                    MenteeEmployeeId = a.MenteeEmployeeId,
                    MenteeName = a.MenteeEmployee.Userprofile.FirstName + " " + a.MenteeEmployee.Userprofile.LastName,
                    SmeId = a.SmeId,
                    SmeEmployeeId = a.Sme.EmployeeId,
                    SmeName = a.Sme.Employee.Userprofile.FirstName + " " + a.Sme.Employee.Userprofile.LastName,
                    SkillId = a.SkillId,
                    SkillName = a.Skill.SkillName,
                    Deadline = a.Deadline,
                    Status = a.Status,
                    ProofFilePath = a.ProofFilePath,
                    CompletionNotes = a.CompletionNotes,
                    CompletionRating = a.CompletionRating,
                    CreatedOn = a.CreatedOn,
                    UpdatedOn = a.UpdatedOn,
                    IsOverdue = false,
                    DaysOverdue = null
                })
                .ToListAsync();

            Log.Information(
                "GetMyAssignmentsAsync completed. EmployeeId={EmployeeId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                employeeId, items.Count, totalCount
            );

            return (items, totalCount);
        }

        /// <summary>Gets paginated assignments for a manager's team with filtering and search capabilities.</summary>
        public async Task<(List<AssignmentResponseModel> Items, int TotalCount)> GetTeamAssignments(
     int managerId,
     AssignmentRequestModel request
 )
        {
            Log.Information(
                "GetTeamAssignmentsAsync called. ManagerId={ManagerId}, StatusFilter={StatusFilter}, Page={PageNumber}",
                managerId, request.StatusFilter ?? "all", request.PageNumber
            );

            var query = _context
                .Lndassignments
                .Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Sme)
                .ThenInclude(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Lndapprovals)
                .Where(a => a.MenteeEmployee.ReportingManagerEmployeeId == managerId);

            if (!string.IsNullOrEmpty(request.StatusFilter))
            {
                query = query.Where(a => a.Status == request.StatusFilter);
            }

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var lowerSearchTerm = request.SearchTerm.ToLower();
                query = query.Where(a =>
                    a.Skill.SkillName.ToLower().Contains(lowerSearchTerm)
                    || a.MenteeEmployee.Userprofile.FirstName.ToLower().Contains(lowerSearchTerm)
                    || a.MenteeEmployee.Userprofile.LastName.ToLower().Contains(lowerSearchTerm)
                    || ((a.MenteeEmployee.Userprofile.FirstName + " " + a.MenteeEmployee.Userprofile.LastName)
                        .ToLower().Contains(lowerSearchTerm))
                    || a.Sme.Employee.Userprofile.FirstName.ToLower().Contains(lowerSearchTerm)
                    || a.Sme.Employee.Userprofile.LastName.ToLower().Contains(lowerSearchTerm)
                    || ((a.Sme.Employee.Userprofile.FirstName + " " + a.Sme.Employee.Userprofile.LastName)
                        .ToLower().Contains(lowerSearchTerm))
                );
            }

            if (!string.IsNullOrWhiteSpace(request.SortField))
            {
                var isAscending = request.SortOrder?.ToLower() != LnDConstants.SORT_ORDER.DESC;
                query = request.SortField.ToLower() switch
                {
                    LnDConstants.SORT_FIELDS.MENTEE_NAME => isAscending
                        ? query.OrderBy(a => a.MenteeEmployee.Userprofile.FirstName)
                            .ThenBy(a => a.MenteeEmployee.Userprofile.LastName)
                        : query.OrderByDescending(a => a.MenteeEmployee.Userprofile.FirstName)
                            .ThenByDescending(a => a.MenteeEmployee.Userprofile.LastName),

                    LnDConstants.SORT_FIELDS.SKILL_NAME => isAscending
                        ? query.OrderBy(a => a.Skill.SkillName)
                        : query.OrderByDescending(a => a.Skill.SkillName),

                    LnDConstants.SORT_FIELDS.SME_NAME => isAscending
                        ? query.OrderBy(a => a.Sme.Employee.Userprofile.FirstName)
                            .ThenBy(a => a.Sme.Employee.Userprofile.LastName)
                        : query.OrderByDescending(a => a.Sme.Employee.Userprofile.FirstName)
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
            else
            {
                query = query.OrderByDescending(a => a.CreatedOn);
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(a => new AssignmentResponseModel
                {
                    AssignmentId = a.AssignmentId,
                    MenteeEmployeeId = a.MenteeEmployeeId,
                    MenteeName = a.MenteeEmployee.Userprofile.FirstName + " " + a.MenteeEmployee.Userprofile.LastName,
                    SmeId = a.SmeId,
                    SmeEmployeeId = a.Sme.EmployeeId,
                    SmeName = a.Sme.Employee.Userprofile.FirstName + " " + a.Sme.Employee.Userprofile.LastName,
                    SkillId = a.SkillId,
                    SkillName = a.Skill.SkillName,
                    Deadline = a.Deadline,
                    Status = a.Status,
                    ProofFilePath = a.ProofFilePath,
                    CompletionNotes = a.Lndapprovals.OrderByDescending(ap => ap.UpdatedOn).FirstOrDefault(ap => !string.IsNullOrEmpty(ap.Notes)) != null
                        ? a.Lndapprovals.OrderByDescending(ap => ap.UpdatedOn).FirstOrDefault(ap => !string.IsNullOrEmpty(ap.Notes)).Notes
                        : null,
                    CompletionRating = a.CompletionRating,
                    CreatedOn = a.CreatedOn,
                    UpdatedOn = a.UpdatedOn,
                    IsOverdue = false,
                    DaysOverdue = null
                })
                .ToListAsync();

            Log.Information(
                "GetTeamAssignmentsAsync completed. ManagerId={ManagerId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                managerId, items.Count, totalCount
            );

            return (items, totalCount);
        }

        /// <summary>Gets paginated assignments where employee is the assigned SME with filtering and search.</summary>
        public async Task<(List<AssignmentResponseModel> Items, int TotalCount)> GetSmeAssignments(
     int smeEmployeeId,
     AssignmentRequestModel request
 )
        {
            Log.Information(
                "GetSmeAssignmentsAsync called. SmeEmployeeId={SmeEmployeeId}, StatusFilter={StatusFilter}, Page={PageNumber}",
                smeEmployeeId, request.StatusFilter ?? "all", request.PageNumber
            );

            var query = _context
                .Lndassignments.Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Sme)
                .ThenInclude(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Where(a => a.Sme.EmployeeId == smeEmployeeId);

            if (!string.IsNullOrEmpty(request.StatusFilter))
            {
                query = query.Where(a => a.Status == request.StatusFilter);
            }

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var lowerSearchTerm = request.SearchTerm.ToLower();
                query = query.Where(a =>
                    a.Skill.SkillName.ToLower().Contains(lowerSearchTerm)
                    || a.MenteeEmployee.Userprofile.FirstName.ToLower().Contains(lowerSearchTerm)
                    || a.MenteeEmployee.Userprofile.LastName.ToLower().Contains(lowerSearchTerm)
                );
            }

            if (!string.IsNullOrWhiteSpace(request.SortField))
            {
                var isAscending = request.SortOrder?.ToLower() != LnDConstants.SORT_ORDER.DESC;
                query = request.SortField.ToLower() switch
                {
                    LnDConstants.SORT_FIELDS.MENTEE_NAME => isAscending
                        ? query.OrderBy(a => a.MenteeEmployee.Userprofile.FirstName)
                            .ThenBy(a => a.MenteeEmployee.Userprofile.LastName)
                        : query.OrderByDescending(a => a.MenteeEmployee.Userprofile.FirstName)
                            .ThenByDescending(a => a.MenteeEmployee.Userprofile.LastName),

                    LnDConstants.SORT_FIELDS.SKILL_NAME => isAscending
                        ? query.OrderBy(a => a.Skill.SkillName)
                        : query.OrderByDescending(a => a.Skill.SkillName),

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
            else
            {
                query = query.OrderByDescending(a => a.CreatedOn);
            }

            var totalCount = await query.CountAsync();


            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(a => new AssignmentResponseModel
                {
                    AssignmentId = a.AssignmentId,
                    MenteeEmployeeId = a.MenteeEmployeeId,
                    MenteeName = a.MenteeEmployee.Userprofile.FirstName + " " + a.MenteeEmployee.Userprofile.LastName,
                    SmeId = a.SmeId,
                    SmeEmployeeId = a.Sme.EmployeeId,
                    SmeName = a.Sme.Employee.Userprofile.FirstName + " " + a.Sme.Employee.Userprofile.LastName,
                    SkillId = a.SkillId,
                    SkillName = a.Skill.SkillName,
                    Deadline = a.Deadline,
                    Status = a.Status,
                    ProofFilePath = a.ProofFilePath,
                    CompletionNotes = a.CompletionNotes,
                    CompletionRating = a.CompletionRating,
                    CreatedOn = a.CreatedOn,
                    UpdatedOn = a.UpdatedOn,
                    IsOverdue = false,
                    DaysOverdue = null
                })
                .ToListAsync();

            Log.Information(
                "GetSmeAssignmentsAsync completed. SmeEmployeeId={SmeEmployeeId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                smeEmployeeId, items.Count, totalCount
            );

            return (items, totalCount);
        }


        /// <summary>Gets all team assignments for Excel export without pagination.</summary>
        public async Task<List<Lndassignment>> GetAllTeamAssignmentsForExport(
            int managerId,
            ExportAssignmentRequestModel request
        )
        {
            Log.Information(
                "GetAllTeamAssignmentsForExportAsync called. ManagerId={ManagerId}, StatusFilter={StatusFilter}",
                managerId, request.StatusFilter ?? "all"
            );

            var query = _context
                .Lndassignments.Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Employeedetailsmasters)
                .ThenInclude(ed => ed.Department)
                .Include(a => a.Skill)
                .Include(a => a.Sme)
                .ThenInclude(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Where(a => a.MenteeEmployee.ReportingManagerEmployeeId == managerId)
                .AsQueryable();

            if (!string.IsNullOrEmpty(request.StatusFilter))
            {
                query = query.Where(a => a.Status == request.StatusFilter);
            }

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                query = query.Where(a =>
                    (a.Skill.SkillName ?? "").Contains(request.SearchTerm)
                    || (a.MenteeEmployee.Userprofile.FirstName ?? "").Contains(request.SearchTerm)
                    || (a.MenteeEmployee.Userprofile.LastName ?? "").Contains(request.SearchTerm)
                    || (
                        (a.MenteeEmployee.Userprofile.FirstName ?? "")
                        + " "
                        + (a.MenteeEmployee.Userprofile.LastName ?? "")
                    ).Contains(request.SearchTerm)
                    || (a.Sme.Employee.Userprofile.FirstName ?? "").Contains(request.SearchTerm)
                    || (a.Sme.Employee.Userprofile.LastName ?? "").Contains(request.SearchTerm)
                );
            }

            query = ApplyAssignmentSorting(query, request.SortField, request.SortOrder);

            var items = await query.ToListAsync();

            Log.Information(
                "GetAllTeamAssignmentsForExportAsync completed. ManagerId={ManagerId}, TotalCount={Count}",
                managerId, items.Count
            );

            return items;
        }

        #endregion

        #region Assignment Modifications

        /// <summary>Adds a new assignment to the database context (requires SaveChanges).</summary>
        public async Task<Lndassignment> AddAssignment(Lndassignment assignment)
        {
            Log.Information(
                "AddAssignmentAsync called. MenteeId={MenteeId}, SmeId={SmeId}, SkillId={SkillId}",
                assignment.MenteeEmployeeId, assignment.SmeId, assignment.SkillId
            );

            _context.Lndassignments.Add(assignment);

            Log.Debug("AddAssignmentAsync: Assignment added to context. Pending SaveChanges");

            return assignment;
        }

        /// <summary>Updates an existing assignment in the database context (requires SaveChanges).</summary>
        public async Task UpdateAssignment(Lndassignment assignment)
        {
            Log.Information(
                "UpdateAssignmentAsync called. AssignmentId={AssignmentId}, Status={Status}",
                assignment.AssignmentId, assignment.Status
            );

            _context.Lndassignments.Update(assignment);

            Log.Debug("UpdateAssignmentAsync: Assignment updated in context. Pending SaveChanges");
        }

        #endregion

        #region Private Helpers

        /// <summary>Applies sorting logic to assignment queries based on sort field and order.</summary>
        private IQueryable<Lndassignment> ApplyAssignmentSorting(
            IQueryable<Lndassignment> query,
            string? sortField,
            string? sortOrder
        )
        {
            var isAscending =
                string.IsNullOrEmpty(sortOrder)
                || sortOrder.ToLower() == LnDConstants.SORT_ORDER.ASC;

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

        #endregion
    }
}

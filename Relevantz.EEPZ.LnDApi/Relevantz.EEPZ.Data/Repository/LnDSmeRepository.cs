using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Serilog;

namespace Relevantz.EEPZ.Data.Repositories.Implementations
{
    public class LnDSmeRepository : ILnDSmeRepository
    {
        #region Dependencies

        private readonly EEPZDbContext _context;

        public LnDSmeRepository(EEPZDbContext context)
        {
            _context = context;
        }

        #endregion

        #region SME Status Queries

        /// <summary>
        /// Checks if an employee has any active SME status
        /// </summary>
        public async Task<bool> IsEmployeeSme(int employeeId)
        {
            Log.Debug("IsEmployeeSmeAsync called. EmployeeId={EmployeeId}", employeeId);

            var isSme = await _context.Lndsmes.AnyAsync(s =>
                s.EmployeeId == employeeId && s.IsActive == true
            );

            Log.Information(
                "IsEmployeeSmeAsync completed. EmployeeId={EmployeeId}, IsSme={IsSme}",
                employeeId,
                isSme
            );

            return isSme;
        }

        /// <summary>
        /// Gets an active SME record for a specific employee and skill combination
        /// </summary>
        public async Task<Lndsme?> GetActiveSme(int employeeId, int skillId)
        {
            Log.Debug(
                "GetActiveSmeAsync called. EmployeeId={EmployeeId}, SkillId={SkillId}",
                employeeId,
                skillId
            );

            var sme = await _context.Lndsmes.FirstOrDefaultAsync(s =>
                s.EmployeeId == employeeId && s.SkillId == skillId && s.IsActive == true
            );

            if (sme == null)
            {
                Log.Debug(
                    "GetActiveSmeAsync: Active SME not found. EmployeeId={EmployeeId}, SkillId={SkillId}",
                    employeeId,
                    skillId
                );
            }
            else
            {
                Log.Debug(
                    "GetActiveSmeAsync: Active SME found. SmeId={SmeId}, EmployeeId={EmployeeId}, SkillId={SkillId}",
                    sme.SmeId,
                    employeeId,
                    skillId
                );
            }

            return sme;
        }

        /// <summary>
        /// Gets an SME record by employee ID from assignment details dictionary
        /// </summary>
        public async Task<Lndsme?> GetSmeFromEmployeeId(
            Dictionary<string, object> assignmentDetails
        )
        {
            var smeIdElement = (JsonElement)assignmentDetails["SmeId"];
            int SmeEmployeeId = smeIdElement.GetInt32();

            Log.Debug("GetSmeFromEmployeeId called. SmeEmployeeId={SmeEmployeeId}", SmeEmployeeId);

            var sme = await _context.Lndsmes.FirstOrDefaultAsync(s =>
                s.EmployeeId == SmeEmployeeId
            );

            if (sme == null)
            {
                Log.Warning(
                    "GetSmeFromEmployeeId: SME not found. SmeEmployeeId={SmeEmployeeId}",
                    SmeEmployeeId
                );
            }

            return sme;
        }

        #endregion

        #region SME Assignment Queries

        /// <summary>
        /// Gets in-progress assignment count for a specific SME
        /// </summary>
        public async Task<int> GetSmeInProgressAssignmentCount(int smeId)
        {
            Log.Debug("GetSmeInProgressAssignmentCountAsync called. SmeId={SmeId}", smeId);

            var count = await _context.Lndassignments.CountAsync(a =>
                a.SmeId == smeId && a.Status == LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS
            );

            Log.Debug(
                "GetSmeInProgressAssignmentCountAsync completed. SmeId={SmeId}, InProgressCount={Count}",
                smeId,
                count
            );

            return count;
        }

        #endregion

        #region SME Retrieval

        /// <summary>
        /// Gets paginated available SMEs for a skill filtered by max assignment limit
        /// </summary>
        public async Task<(
            List<Lndsme> Items,
            int TotalCount
        )> GetAvailableSmesWithAssignmentCounts(
            AvailableSmesRequestModel request,
            int maxAssignments
        )
        {
            Log.Information(
                "GetAvailableSmesWithAssignmentCountsAsync called. SkillId={SkillId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}, MaxAssignments={MaxAssignments}",
                request.SkillId,
                request.SearchTerm ?? "none",
                request.PageNumber,
                request.PageSize,
                maxAssignments
            );

            var query = _context
                .Lndsmes.Include(s => s.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(s => s.Skill)
                .Where(s => s.SkillId == request.SkillId && s.IsActive == true);

            var smesWithCounts = await query
                .Select(s => new
                {
                    Sme = s,
                    InProgressCount = _context.Lndassignments.Count(a =>
                        a.SmeId == s.SmeId && a.Status == LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS
                    ),
                })
                .ToListAsync();

            Log.Debug(
                "GetAvailableSmesWithAssignmentCountsAsync: Retrieved {Count} SMEs from database",
                smesWithCounts.Count
            );

            var availableSmesWithCounts = smesWithCounts
                .Where(sc => sc.InProgressCount < maxAssignments)
                .ToList();

            Log.Debug(
                "GetAvailableSmesWithAssignmentCountsAsync: Filtered to {Count} available SMEs (below max assignments)",
                availableSmesWithCounts.Count
            ); 

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                availableSmesWithCounts = availableSmesWithCounts
                    .Where(sc =>
                        sc.Sme.Employee.Userprofile.FirstName.Contains(
                            request.SearchTerm,
                            StringComparison.OrdinalIgnoreCase
                        )
                        || sc.Sme.Employee.Userprofile.LastName.Contains(
                            request.SearchTerm,
                            StringComparison.OrdinalIgnoreCase
                        )
                    )
                    .ToList();
            }

            var totalCount = availableSmesWithCounts.Count;
            var items = availableSmesWithCounts
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(sc => sc.Sme)
                .ToList();

            Log.Information(
                "GetAvailableSmesWithAssignmentCountsAsync completed. SkillId={SkillId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                request.SkillId,
                items.Count,
                totalCount
            );

            return (items, totalCount);
        }

        /// <summary>
        /// Gets paginated all active SMEs with employee and department details
        /// </summary>
        public async Task<(List<SmeResponseModel> Items, int TotalCount)> GetAllActiveSmes(
            ActiveSmesRequestModel request
        )
        {
            Log.Information(
                "GetAllActiveSmesAsync started. SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                request.SearchTerm ?? "none",
                request.PageNumber,
                request.PageSize
            );

            var query = _context
                .Lndsmes.Include(s => s.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(s => s.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(ed => ed.Department)
                .Include(s => s.Skill)
                .Where(s => s.IsActive == true);

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var lowerSearchTerm = request.SearchTerm.ToLower();
                query = query.Where(s =>
                    (s.Employee.Userprofile.FirstName + " " + s.Employee.Userprofile.LastName)
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || s.Skill.SkillName.ToLower().Contains(lowerSearchTerm)
                );
            }  

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(s => new SmeResponseModel
                {
                    SmeId = s.SmeId,
                    EmployeeId = s.EmployeeId,
                    EmployeeName =
                        s.Employee.Userprofile.FirstName + " " + s.Employee.Userprofile.LastName,
                    SkillId = s.SkillId,
                    SkillName = s.Skill.SkillName,
                    DepartmentName =
                        s.Employee.Employeedetailsmasters.FirstOrDefault().Department != null
                            ? s
                                .Employee.Employeedetailsmasters.FirstOrDefault()
                                .Department.DepartmentName
                            : null,
                    IsActive = s.IsActive ?? false,
                    ApprovedDate = s.ApprovedOn,
                })                    
                .ToListAsync();

            Log.Debug(
                "GetAllActiveSmesAsync: Retrieved {ItemCount} SMEs. TotalCount={TotalCount}",
                items.Count,
                totalCount
            );

            Log.Information(
                "GetAllActiveSmesAsync succeeded. ReturnedCount={Count}, TotalCount={TotalCount}",
                items.Count,
                totalCount
            );

            return (items, totalCount);
        }

        /// <summary>
        /// Gets all active SMEs for Excel export without pagination
        /// </summary>
        public async Task<List<Lndsme>> GetAllActiveSmesForExport(
            ExportActiveSmesRequestModel request
        )
        {
            Log.Information(
                "GetAllActiveSmesForExportAsync called. SearchTerm={SearchTerm}",
                request.SearchTerm ?? "none"
            );

            var query = _context
                .Lndsmes.Where(s => s.IsActive.Value)
                .Include(s => s.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(s => s.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(ed => ed.Department)
                .Include(s => s.Skill)
                .AsQueryable();

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var lowerSearchTerm = request.SearchTerm.ToLower();

                query = query.Where(s =>
                    (s.Employee.Userprofile.FirstName + " " + s.Employee.Userprofile.LastName)
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || s.Skill.SkillName.ToLower().Contains(lowerSearchTerm)
                    || s.Employee.Employeedetailsmasters.Any(edm =>
                        edm.Department.DepartmentName.ToLower().Contains(lowerSearchTerm)
                    )
                );
            }

            var items = await query
                .OrderBy(s => s.Employee.Userprofile.FirstName)
                .ThenBy(s => s.Employee.Userprofile.LastName)
                .ToListAsync();

            Log.Information(
                "GetAllActiveSmesForExportAsync completed. TotalCount={Count}",
                items.Count
            );

            return items;
        }

        #endregion

        #region SME Modifications

        /// <summary>
        /// Adds a new SME record to the database context (requires SaveChanges)
        /// </summary>
        public async Task<Lndsme> AddSme(Lndsme sme)
        {
            Log.Information(
                "AddSmeAsync called. EmployeeId={EmployeeId}, SkillId={SkillId}",
                sme.EmployeeId,
                sme.SkillId
            );

            _context.Lndsmes.Add(sme);

            Log.Debug("AddSmeAsync: SME added to context. Pending SaveChanges");

            return sme;
        }

        /// <summary>
        /// Updates an existing SME record in the database context (requires SaveChanges)
        /// </summary>
        public async Task UpdateSme(Lndsme sme)
        {
            Log.Information(
                "UpdateSmeAsync called. SmeId={SmeId}, EmployeeId={EmployeeId}, SkillId={SkillId}, IsActive={IsActive}",
                sme.SmeId,
                sme.EmployeeId,
                sme.SkillId,
                sme.IsActive
            );

            _context.Lndsmes.Update(sme);

            Log.Debug("UpdateSmeAsync: SME updated in context. Pending SaveChanges");
        }

        #endregion
    }
}

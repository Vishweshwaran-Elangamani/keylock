using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
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

        /// <summary>Checks if an employee has any active SME status.</summary>
        public async Task<bool> IsEmployeeSmeAsync(int employeeId)
        {
            Log.Debug("IsEmployeeSmeAsync called. EmployeeId={EmployeeId}", employeeId);

            var isSme = await _context.Lndsmes.AnyAsync(s =>
                s.EmployeeId == employeeId && s.IsActive == true
            );

            Log.Information(
                "IsEmployeeSmeAsync completed. EmployeeId={EmployeeId}, IsSme={IsSme}",
                employeeId, isSme
            );

            return isSme;
        }

        /// <summary>Gets an active SME record for a specific employee and skill combination.</summary>
        public async Task<Lndsme?> GetActiveSmeAsync(int employeeId, int skillId)
        {
            Log.Debug(
                "GetActiveSmeAsync called. EmployeeId={EmployeeId}, SkillId={SkillId}",
                employeeId, skillId
            );

            var sme = await _context.Lndsmes.FirstOrDefaultAsync(s =>
                s.EmployeeId == employeeId && s.SkillId == skillId && s.IsActive == true
            );  

            if (sme == null)
            {
                Log.Debug(
                    "GetActiveSmeAsync: Active SME not found. EmployeeId={EmployeeId}, SkillId={SkillId}",
                    employeeId, skillId
                );
            }
            else
            {
                Log.Debug(
                    "GetActiveSmeAsync: Active SME found. SmeId={SmeId}, EmployeeId={EmployeeId}, SkillId={SkillId}",
                    sme.SmeId, employeeId, skillId
                );
            }

            return sme;
        }

        /// <summary>Gets an SME record by employee ID from assignment details dictionary.</summary>
        public async Task<Lndsme?> GetSmeFromEmployeeId(
            Dictionary<string, object> assignmentDetails
        )
        {
            var smeIdElement = (JsonElement)assignmentDetails["SmeId"];
            int SmeEmployeeId = smeIdElement.GetInt32();

            Log.Debug("GetSmeFromEmployeeId called. SmeEmployeeId={SmeEmployeeId}", SmeEmployeeId);

            var sme = await _context.Lndsmes.FirstOrDefaultAsync(s => s.EmployeeId == SmeEmployeeId);

            if (sme == null)
            {
                Log.Warning("GetSmeFromEmployeeId: SME not found. SmeEmployeeId={SmeEmployeeId}", SmeEmployeeId);
            }

            return sme;
        }

        #endregion

        #region SME Assignment Queries   

        /// <summary>Gets in-progress assignment count for a specific SME.</summary>
        public async Task<int> GetSmeInProgressAssignmentCountAsync(int smeId)
        {
            Log.Debug("GetSmeInProgressAssignmentCountAsync called. SmeId={SmeId}", smeId);

            var count = await _context.Lndassignments.CountAsync(a =>
                a.SmeId == smeId && a.Status == LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS
            );

            Log.Debug(
                "GetSmeInProgressAssignmentCountAsync completed. SmeId={SmeId}, InProgressCount={Count}",
                smeId, count
            );

            return count;
        }

        #endregion

        #region SME Retrieval

        /// <summary>Gets paginated available SMEs for a skill filtered by max assignment limit.</summary>
        public async Task<(
            List<Lndsme> Items,
            int TotalCount
        )> GetAvailableSmesWithAssignmentCountsAsync(
            int skillId,
            string? searchTerm,
            int pageNumber,
            int pageSize,
            int maxAssignments
        )
        {
            Log.Information(
                "GetAvailableSmesWithAssignmentCountsAsync called. SkillId={SkillId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}, MaxAssignments={MaxAssignments}",
                skillId, searchTerm ?? "none", pageNumber, pageSize, maxAssignments
            );

            var query = _context
                .Lndsmes.Include(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(s => s.Skill)
                .Where(s => s.SkillId == skillId && s.IsActive == true);

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

            if (!string.IsNullOrEmpty(searchTerm))
            {
                availableSmesWithCounts = availableSmesWithCounts
                    .Where(sc =>
                        sc.Sme.Employee.Userprofile.FirstName.Contains(
                            searchTerm,
                            StringComparison.OrdinalIgnoreCase
                        )
                        || sc.Sme.Employee.Userprofile.LastName.Contains(
                            searchTerm,
                            StringComparison.OrdinalIgnoreCase
                        )
                    )
                    .ToList();
            }

            var totalCount = availableSmesWithCounts.Count;
            var items = availableSmesWithCounts
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(sc => sc.Sme)
                .ToList();

            Log.Information(
                "GetAvailableSmesWithAssignmentCountsAsync completed. SkillId={SkillId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                skillId, items.Count, totalCount
            );

            return (items, totalCount);
        }

        /// <summary>Gets paginated all active SMEs with employee and department details.</summary>
        public async Task<(List<Lndsme> Items, int TotalCount)> GetAllActiveSmesAsync(
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            Log.Information(
                "GetAllActiveSmesAsync called. SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                searchTerm ?? "none", pageNumber, pageSize
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

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();

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

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(s => s.Employee.Userprofile.FirstName)
                .ThenBy(s => s.Employee.Userprofile.LastName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            Log.Information(
                "GetAllActiveSmesAsync completed. ReturnedCount={Count}, TotalCount={TotalCount}",
                items.Count, totalCount
            );

            return (items, totalCount);
        }

        /// <summary>Gets all active SMEs for Excel export without pagination.</summary>
        public async Task<List<Lndsme>> GetAllActiveSmesForExportAsync(string? searchTerm)
        {
            Log.Information(
                "GetAllActiveSmesForExportAsync called. SearchTerm={SearchTerm}",
                searchTerm ?? "none"
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

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();

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

        /// <summary>Adds a new SME record to the database context (requires SaveChanges).</summary>
        public async Task<Lndsme> AddSmeAsync(Lndsme sme)
        {
            Log.Information(
                "AddSmeAsync called. EmployeeId={EmployeeId}, SkillId={SkillId}",
                sme.EmployeeId, sme.SkillId
            );

            _context.Lndsmes.Add(sme);

            Log.Debug("AddSmeAsync: SME added to context. Pending SaveChanges");

            return sme;
        }

        /// <summary>Updates an existing SME record in the database context (requires SaveChanges).</summary>
        public async Task UpdateSmeAsync(Lndsme sme)
        {
            Log.Information(
                "UpdateSmeAsync called. SmeId={SmeId}, EmployeeId={EmployeeId}, SkillId={SkillId}, IsActive={IsActive}",
                sme.SmeId, sme.EmployeeId, sme.SkillId, sme.IsActive
            );

            _context.Lndsmes.Update(sme);

            Log.Debug("UpdateSmeAsync: SME updated in context. Pending SaveChanges");
        }

        #endregion
    }
}
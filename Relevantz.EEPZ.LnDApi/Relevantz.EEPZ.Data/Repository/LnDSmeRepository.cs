using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;

namespace Relevantz.EEPZ.Data.Repositories.Implementations
{
    public class LnDSmeRepository : ILnDSmeRepository
    {
        private readonly EEPZDbContext _context;

        public LnDSmeRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<bool> IsEmployeeSmeAsync(int employeeId)
        {
            return await _context.Lndsmes.AnyAsync(s =>
                s.EmployeeId == employeeId && s.IsActive == true
            );
        }

        public async Task<Lndsme?> GetActiveSmeAsync(int employeeId, int skillId)
        {
            return await _context.Lndsmes.FirstOrDefaultAsync(s =>
                s.EmployeeId == employeeId && s.SkillId == skillId && s.IsActive == true
            );
        }

        public async Task<Lndsme> AddSmeAsync(Lndsme sme)
        {
            _context.Lndsmes.Add(sme);
            return sme;
        }

        public async Task UpdateSmeAsync(Lndsme sme)
        {
            _context.Lndsmes.Update(sme);
        }

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

            var availableSmesWithCounts = smesWithCounts
                .Where(sc => sc.InProgressCount < maxAssignments)
                .ToList();

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

            return (items, totalCount);
        }

        public async Task<int> GetSmeInProgressAssignmentCountAsync(int smeId)
        {
            return await _context.Lndassignments.CountAsync(a =>
                a.SmeId == smeId && a.Status == LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS
            );
        }

        public async Task<(List<Lndsme> Items, int TotalCount)> GetAllActiveSmesAsync(
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
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

            return (items, totalCount);
        }

        public async Task<List<Lndsme>> GetAllActiveSmesForExportAsync(string? searchTerm)
        {
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

            return await query
                .OrderBy(s => s.Employee.Userprofile.FirstName)
                .ThenBy(s => s.Employee.Userprofile.LastName)
                .ToListAsync();
        }    

        public async Task<Lndsme?> GetSmeFromEmployeeId(
            Dictionary<string, object> assignmentDetails
        )
        {
            var smeIdElement = (JsonElement)assignmentDetails["SmeId"];
            int SmeEmployeeId = smeIdElement.GetInt32();

            return await _context.Lndsmes.FirstOrDefaultAsync(s => s.EmployeeId == SmeEmployeeId);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}

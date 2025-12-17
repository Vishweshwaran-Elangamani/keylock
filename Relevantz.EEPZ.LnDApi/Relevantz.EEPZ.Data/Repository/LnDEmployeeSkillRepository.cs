using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;

namespace Relevantz.EEPZ.Data.Repositories.Implementations
{
    public class LnDEmployeeSkillRepository : ILnDEmployeeSkillRepository
    {
        private readonly EEPZDbContext _context;

        public LnDEmployeeSkillRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Employee?> GetEmployeeByIdAsync(int employeeId)
        {
            return await _context
                .Employees.Include(e => e.Userprofile)
                .Include(e => e.Userauthentication)
                .Include(e => e.Employeedetailsmasters)
                .ThenInclude(ed => ed.Department)
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
        }

        public async Task<(List<Employee> Items, int TotalCount)> GetSubordinateEmployeesAsync(
            int managerId,
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            IQueryable<Employee> query = _context
                .Employees.Include(e => e.Userprofile)
                .Include(e => e.Userauthentication)
                .Include(e => e.Employeedetailsmasters)
                .ThenInclude(ed => ed.Department)
                .Where(e =>
                    e.ReportingManagerEmployeeId == managerId
                    && e.EmploymentStatus == LnDConstants.EMPLOYMENT_STATUS.ACTIVE
                );

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();

                query = query.Where(e =>
                    e.Userprofile.FirstName.ToLower().Contains(lowerSearchTerm)
                    || e.Userprofile.LastName.ToLower().Contains(lowerSearchTerm)
                    || (e.Userprofile.FirstName + " " + e.Userprofile.LastName)
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || e.Userauthentication.Email.ToLower().Contains(lowerSearchTerm)
                    || (
                        e.Employeedetailsmasters.Any()
                        && e.Employeedetailsmasters.First()
                            .Department.DepartmentName.ToLower()
                            .Contains(lowerSearchTerm)
                    )
                );
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(e => e.Userprofile.FirstName)
                .ThenBy(e => e.Userprofile.LastName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<List<MasterSkill>> GetAllSkillsAsync()
        {
            return await _context.MasterSkills.OrderBy(s => s.SkillName).ToListAsync();
        }

        public async Task<MasterSkill?> GetSkillByIdAsync(int skillId)
        {
            return await _context.MasterSkills.FirstOrDefaultAsync(s => s.SkillId == skillId);
        }

        public async Task<(
            List<Lndemployeeskillmapper> Items,
            int TotalCount
        )> GetSubordinateSkillsAsync(
            int managerId,
            int? employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize
        )
        {
            var query = _context
                .Lndemployeeskillmappers.Include(m => m.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                .ThenInclude(s => s.Lndsmes)
                .Where(m => m.Employee.ReportingManagerEmployeeId == managerId);

            if (employeeId.HasValue)
                query = query.Where(m => m.EmployeeId == employeeId.Value);

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(m =>
                    m.Skill.SkillName.Contains(searchTerm)
                    || m.Employee.Userprofile.FirstName.Contains(searchTerm)
                    || m.Employee.Userprofile.LastName.Contains(searchTerm)
                );
            }

            query = sortBy?.ToLower() switch
            {
                LnDConstants.SORT_FIELDS.SKILL_NAME => query.OrderBy(m => m.Skill.SkillName),
                LnDConstants.SORT_FIELDS.RATING => query.OrderByDescending(m => m.Rating),
                LnDConstants.SORT_FIELDS.CREATED_ON => query.OrderByDescending(m => m.CreatedOn),
                _ => query.OrderBy(m => m.Employee.Userprofile.FirstName),
            };

            var totalCount = await query.CountAsync();
            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return (items, totalCount);
        }

        public async Task<Lndemployeeskillmapper?> GetEmployeeSkillMappingAsync(
            int employeeId,
            int skillId
        )
        {
            return await _context
                .Lndemployeeskillmappers.Include(m => m.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                .FirstOrDefaultAsync(m => m.EmployeeId == employeeId && m.SkillId == skillId);
        }

        public async Task<Lndemployeeskillmapper?> GetEmployeeSkillMappingByIdAsync(int mapperId)
        {
            return await _context
                .Lndemployeeskillmappers.Include(m => m.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                .FirstOrDefaultAsync(m => m.MapperId == mapperId);
        }

        public async Task<Lndemployeeskillmapper> AddEmployeeSkillAsync(
            Lndemployeeskillmapper mapper
        )
        {
            _context.Lndemployeeskillmappers.Add(mapper);
            await _context.SaveChangesAsync();

            return (await GetEmployeeSkillMappingByIdAsync(mapper.MapperId))!;
        }

        public async Task<List<Lndemployeeskillmapper>> AddEmployeeSkillsAsync(
            List<Lndemployeeskillmapper> mappers
        )
        {
            _context.Lndemployeeskillmappers.AddRange(mappers);
            await _context.SaveChangesAsync();
            return mappers;
        }

        public async Task UpdateEmployeeSkillAsync(Lndemployeeskillmapper mapper)
        {
            _context.Lndemployeeskillmappers.Update(mapper);
        }

        public async Task DeleteEmployeeSkillAsync(Lndemployeeskillmapper mapper)
        {
            _context.Lndemployeeskillmappers.Remove(mapper);
        }

        public async Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetMySkillsAsync(
            int employeeId,
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            var query = _context
                .Lndemployeeskillmappers.Include(m => m.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                .ThenInclude(s => s.Lndsmes)
                .Where(m => m.EmployeeId == employeeId);

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(m => m.Skill.SkillName.Contains(searchTerm));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderBy(m => m.Skill.SkillName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<List<int>> GetExistingSkillMappingsAsync(
            int employeeId,
            List<int> skillIds
        )
        {
            return await _context
                .Lndemployeeskillmappers.Where(m =>
                    m.EmployeeId == employeeId && skillIds.Contains(m.SkillId)
                )
                .Select(m => m.SkillId)
                .ToListAsync();
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}

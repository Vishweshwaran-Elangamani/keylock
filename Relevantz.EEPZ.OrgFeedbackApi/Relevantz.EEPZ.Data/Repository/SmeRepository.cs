using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Data.Repository
{
    public class SmeRepository : ISmeRepository
    {
        private readonly EEPZDbContext _context;

        public SmeRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<List<SmeDto>> GetActiveSmesAsync()
        {
            return await _context.Lndsmes
                .Where(s => s.IsActive == true)
                .Include(s => s.Employee)
                .Include(s => s.Skill)
                .Select(s => new SmeDto
                {
                    SmeId = s.SmeId,
                    EmployeeId = s.EmployeeId,
                    SkillName = s.Skill.SkillName,
                    SkillIdReference = s.SkillId,
                    EmployeeName = s.Employee.EmployeeCompanyId,
                    IsActive = s.IsActive == true,
                    ApprovedOn = s.ApprovedOn.HasValue ?
                        DateTime.SpecifyKind(s.ApprovedOn.Value.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc)
                        : null
                })
                .ToListAsync();
        }
    }
}

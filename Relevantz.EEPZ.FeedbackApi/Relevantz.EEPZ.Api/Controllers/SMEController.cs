using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;

namespace EepzBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SmeController : ControllerBase
    {
        private readonly EEPZDbContext _context;

        public SmeController(EEPZDbContext context)
        {
            _context = context;
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveSmes()
        {
            try
            {
                var smes = await _context.Lndsmes
                    .Where(s => (bool)s.IsActive)
                    .Include(s => s.Employee)
                    .Include(s => s.Skill)
                    .Select(s => new
                    {
                        smeId = s.SmeId,
                        employeeId = s.EmployeeId,
                        skillName = s.Skill.SkillName,
                        skillIdReference = s.SkillId,
                        employeeName = s.Employee.EmployeeCompanyId,
                        isActive = s.IsActive,
                        approvedOn = s.ApprovedOn
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = smes });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}


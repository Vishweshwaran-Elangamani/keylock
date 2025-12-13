using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(EEPZDbContext context, ILogger<EmployeesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("all-managers")]
        public async Task<IActionResult> GetAllManagers()
        {
            try
            {
                var managers = await (
                    from ua in _context.Userauthentications.Include(u => u.Employee)
                    where ua.Status == "Active" && ua.Employee.EmploymentStatus == "Active" && ua.Employee.IsActive == true
                    join up in _context.Userprofiles on ua.EmployeeId equals up.EmployeeId into upj
                    from up in upj.DefaultIfEmpty()
                    join ed in _context.Employeedetailsmasters on ua.EmployeeId equals ed.EmployeeId into edj
                    from ed in edj.DefaultIfEmpty()
                    join r in _context.Roles on ed.RoleId equals r.RoleId into rj
                    from r in rj.DefaultIfEmpty()
                    where r != null && (r.RoleCode == "MGR" || r.RoleCode == "MANAGER") && r.RoleCode != "HR"
                    select new
                    {
                        UserId = ua.UserId,
                        EmployeeId = ua.Employee.EmployeeId,
                        JoiningDate = ua.Employee.JoiningDate.ToDateTime(TimeOnly.MinValue).ToString("yyyy-MM-dd"),
                        FirstName = up != null ? up.FirstName : null,
                        LastName = up != null ? up.LastName : null,
                        Role = r.RoleCode
                    }
                ).ToListAsync();

                return Ok(new { success = true, data = managers });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("user/{userId}/role")]
        public async Task<IActionResult> GetUserRole(int userId)
        {
            try
            {
                var userAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (userAuth == null)
                    return NotFound(new { success = false, message = "User not found" });

                var userDetails = await _context.Employeedetailsmasters
                    .Include(d => d.Role)
                    .FirstOrDefaultAsync(d => d.EmployeeId == userAuth.EmployeeId);

                var roleCode = userDetails?.Role?.RoleCode ?? "UNKNOWN";

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        userId = userId,
                        roleCode = roleCode,
                        isManager = roleCode == "MGR" || roleCode == "MANAGER"
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }
    }
}

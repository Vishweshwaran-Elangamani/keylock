using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using System;
using System.Linq;
using System.Threading.Tasks;
 
namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FormProgressTrackerController : ControllerBase
    {
        private readonly EEPZDbContext _context;
 
        public FormProgressTrackerController(EEPZDbContext context)
        {
            _context = context;
        }
 
        // GET all trackers
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var trackers = await _context.Formprogresstrackers
                    .Include(t => t.Assignment)
                    .ToListAsync();
 
                var employeeUserIds = trackers
                    .Where(t => t.Assignment != null)
                    .Select(t => t.Assignment.EmployeeId)
                    .Distinct()
                    .ToList();
 
                var users = await _context.Userauthentications
                    .Where(u => employeeUserIds.Contains(u.UserId))
                    .Include(u => u.Employee)
                    .ToListAsync();
 
                var employeeIds = users
                    .Where(u => u.Employee != null)
                    .Select(u => u.EmployeeId)
                    .Distinct()
                    .ToList();
 
                var userProfiles = await _context.Userprofiles
                    .Where(up => employeeIds.Contains(up.EmployeeId))
                    .ToListAsync();
 
                var result = trackers.Select(t => {
                    var user = users.FirstOrDefault(u => u.UserId == t.Assignment?.EmployeeId);
                    var employeeId = user?.EmployeeId ?? 0;
                    var userProfile = userProfiles.FirstOrDefault(up => up.EmployeeId == employeeId);
 
                    var primaryProjectEmp = _context.Projectemployees.FirstOrDefault(pe => pe.EmployeeId == employeeId && pe.IsPrimary);
 
                    string l1Name = "N/A";
                    string l2Name = "N/A";
                    if (primaryProjectEmp != null)
                    {
                        var project = _context.Projects.FirstOrDefault(p => p.ProjectId == primaryProjectEmp.ProjectId);
                        if (project != null)
                        {
                            if (project.L1approverEmployeeId != null && project.L1approverEmployeeId != 0)
                            {
                                var l1Profile = _context.Userprofiles.FirstOrDefault(up => up.EmployeeId == project.L1approverEmployeeId);
                                l1Name = l1Profile != null ? $"{l1Profile.FirstName} {l1Profile.LastName}" : "N/A";
                            }
                            else
                            {
                                l1Name = "N/A";
                            }
                            if (project.L2approverEmployeeId != null && project.L2approverEmployeeId != 0)
                            {
                                var l2Profile = _context.Userprofiles.FirstOrDefault(up => up.EmployeeId == project.L2approverEmployeeId);
                                l2Name = l2Profile != null ? $"{l2Profile.FirstName} {l2Profile.LastName}" : "N/A";
                            }
                            else
                            {
                                l2Name = "N/A";
                            }
                        }
                    }
 
                    return new {
                        TrackerId = t.TrackerId,
                        AssignmentId = t.AssignmentId,
                        Initiated = t.Initiated,
                        SentToEmployee = t.SentToEmployee,
                        EmployeeCompleted = t.EmployeeCompleted,
                        SentToManager = t.SentToManager,
                        ManagerCompleted = t.ManagerCompleted,
                        SentToDeptHead = t.SentToDeptHead,
                        SentToLeadership = t.SentToLeadership,
                        LastUpdated = t.LastUpdated,
                        EmployeeId = user != null ? user.UserId : 0,
                        EmployeeName = userProfile != null ? $"{userProfile.FirstName} {userProfile.LastName}" : "N/A",
                        L1Name = l1Name,
                        L2Name = l2Name
                    };
                }).ToList();
 
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }
 
    }
 
    public class FormProgressTrackerUpdateDto
    {
        public int AssignmentId { get; set; }
        public bool? Initiated { get; set; }
        public bool? SentToEmployee { get; set; }
        public bool? EmployeeCompleted { get; set; }
        public bool? SentToManager { get; set; }
        public bool? ManagerCompleted { get; set; }
        public bool? SentToDeptHead { get; set; }
        public bool? SentToLeadership { get; set; }
    }
}
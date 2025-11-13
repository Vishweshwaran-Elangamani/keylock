using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;

using Relevantz.EEPZ.Data.DBContexts;

using Relevantz.EEPZ.Common.DTOs.Request;

using System;

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
 
        // Get unique employee user IDs from assignments

        var employeeUserIds = trackers

            .Where(t => t.Assignment != null)

            .Select(t => t.Assignment.EmployeeId)

            .Distinct()

            .ToList();
 
        // Get Userauthentication and their linked Employee

        var users = await _context.Userauthentications

            .Where(u => employeeUserIds.Contains(u.UserId))

            .Include(u => u.Employee)  // Employee has FK to both Userauthentication and Userprofile

            .ToListAsync();
 
        // Get all employee IDs to fetch Userprofiles

        var employeeIds = users

            .Where(u => u.Employee != null)

            .Select(u => u.EmployeeId)

            .Distinct()

            .ToList();
 
        // Get Userprofiles for these employees

        var userProfiles = await _context.Userprofiles

            .Where(up => employeeIds.Contains(up.EmployeeId))

            .ToListAsync();
 
        // Get L1 (ReportingManagerEmployeeId)

        var l1EmployeeIds = users

            .Where(u => u.Employee != null && u.Employee.ReportingManagerEmployeeId != null)

            .Select(u => u.Employee.ReportingManagerEmployeeId.Value)

            .Distinct()

            .ToList();
 
        var l1Employees = await _context.Employees

            .Where(e => l1EmployeeIds.Contains(e.EmployeeId))

            .ToListAsync();
 
        var l1Profiles = await _context.Userprofiles

            .Where(up => l1EmployeeIds.Contains(up.EmployeeId))

            .ToListAsync();
 
        // Get L2 (L1's ReportingManagerEmployeeId)

        var l2EmployeeIds = l1Employees

            .Where(e => e.ReportingManagerEmployeeId != null)

            .Select(e => e.ReportingManagerEmployeeId.Value)

            .Distinct()

            .ToList();
 
        var l2Profiles = await _context.Userprofiles

            .Where(up => l2EmployeeIds.Contains(up.EmployeeId))

            .ToListAsync();
 
        // Map to DTO

        var result = trackers.Select(t =>

        {

            var user = users.FirstOrDefault(u => u.UserId == t.Assignment.EmployeeId);

            var employee = user?.Employee;

            var userProfile = employee != null 

                ? userProfiles.FirstOrDefault(up => up.EmployeeId == employee.EmployeeId) 

                : null;
 
            // L1 Manager

            var l1EmployeeId = employee?.ReportingManagerEmployeeId;

            var l1Profile = l1EmployeeId != null 

                ? l1Profiles.FirstOrDefault(up => up.EmployeeId == l1EmployeeId) 

                : null;
 
            // L2 (Manager's manager)

            var l1Employee = l1EmployeeId != null 

                ? l1Employees.FirstOrDefault(e => e.EmployeeId == l1EmployeeId) 

                : null;

            var l2EmployeeId = l1Employee?.ReportingManagerEmployeeId;

            var l2Profile = l2EmployeeId != null 

                ? l2Profiles.FirstOrDefault(up => up.EmployeeId == l2EmployeeId) 

                : null;
 
            return new

            {

                t.TrackerId,

                t.AssignmentId,

                t.Initiated,

                t.SentToEmployee,

                t.EmployeeCompleted,

                t.SentToManager,

                t.ManagerCompleted,

                t.SentToDeptHead,

                t.SentToLeadership,

                t.LastUpdated,
 
                // Employee Information

                EmployeeId = user?.UserId,

                EmployeeName = userProfile != null

                    ? $"{userProfile.FirstName} {userProfile.LastName}"

                    : "N/A",
 
                // L1 (Direct Manager) Information

                L1Id = l1EmployeeId,

                L1Name = l1Profile != null

                    ? $"{l1Profile.FirstName} {l1Profile.LastName}"

                    : "N/A",
 
                // L2 (Manager's Manager) Information

                L2Id = l2EmployeeId,

                L2Name = l2Profile != null

                    ? $"{l2Profile.FirstName} {l2Profile.LastName}"

                    : "N/A"

            };

        }).ToList();
 
        return Ok(new { success = true, data = result });

    }

    catch (Exception ex)

    {

        return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });

    }

}

 
 
        // GET by TrackerId

        [HttpGet("{id}")]

        public async Task<IActionResult> GetById(int id)

        {

            var tracker = await _context.Formprogresstrackers

                .Include(t => t.Assignment)

                .FirstOrDefaultAsync(t => t.TrackerId == id);
 
            if (tracker == null)

                return NotFound(new { success = false, message = "Form progress tracker not found." });
 
            return Ok(new { success = true, data = tracker });

        }
 
        // GET by AssignmentId

        [HttpGet("ByAssignment/{assignmentId}")]

        public async Task<IActionResult> GetByAssignment(int assignmentId)

        {

            var tracker = await _context.Formprogresstrackers

                .AsNoTracking()

                .Include(t => t.Assignment)

                .FirstOrDefaultAsync(t => t.AssignmentId == assignmentId);
 
            if (tracker == null)

                return NotFound(new { success = false, message = "Form progress tracker not found for assignment." });
 
            return Ok(new { success = true, data = tracker });

        }
 
        // POST Upsert

        [HttpPost]

        public async Task<IActionResult> Upsert([FromBody] FormProgressTrackerUpdateDto dto)

        {

            if (!ModelState.IsValid)

                return BadRequest(new { success = false, message = "Invalid data.", errors = ModelState });
 
            try

            {

                var tracker = await _context.Formprogresstrackers

                    .FirstOrDefaultAsync(t => t.AssignmentId == dto.AssignmentId);
 
                if (tracker == null)

                {

                    tracker = new Relevantz.EEPZ.Common.Entities.Formprogresstracker

                    {

                        AssignmentId = dto.AssignmentId,

                        Initiated = dto.Initiated ?? false,

                        SentToEmployee = dto.SentToEmployee ?? false,

                        EmployeeCompleted = dto.EmployeeCompleted ?? false,

                        SentToManager = dto.SentToManager ?? false,

                        ManagerCompleted = dto.ManagerCompleted ?? false,

                        SentToDeptHead = dto.SentToDeptHead ?? false,

                        SentToLeadership = dto.SentToLeadership ?? false,

                        LastUpdated = DateTime.UtcNow

                    };
 
                    _context.Formprogresstrackers.Add(tracker);

                }

                else

                {

                    tracker.Initiated = dto.Initiated ?? tracker.Initiated;

                    tracker.SentToEmployee = dto.SentToEmployee ?? tracker.SentToEmployee;

                    tracker.EmployeeCompleted = dto.EmployeeCompleted ?? tracker.EmployeeCompleted;

                    tracker.SentToManager = dto.SentToManager ?? tracker.SentToManager;

                    tracker.ManagerCompleted = dto.ManagerCompleted ?? tracker.ManagerCompleted;

                    tracker.SentToDeptHead = dto.SentToDeptHead ?? tracker.SentToDeptHead;

                    tracker.SentToLeadership = dto.SentToLeadership ?? tracker.SentToLeadership;

                    tracker.LastUpdated = DateTime.UtcNow;
 
                    _context.Formprogresstrackers.Update(tracker);

                }

                await _context.SaveChangesAsync();

                await _context.Entry(tracker).ReloadAsync();
 
                return Ok(new { success = true, message = "Form progress tracker saved successfully.", data = tracker });

            }

            catch (Exception ex)

            {

                // Log exception here as needed

                return StatusCode(500, new { success = false, message = $"Save failed: {ex.Message}" });

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

 
using Relevantz.EEPZ.Common.Entities; 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;

namespace eepzbackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeManagementController : ControllerBase
    {
        private readonly EEPZDbContext _context;

        public EmployeeManagementController(EEPZDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all active employees with their details
        /// Used for Resource Owner dropdown
        /// </summary>
        [HttpGet("all")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllEmployees()
        {
            try
            {
                var employees = await _context.Employeedetailsmasters
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userauthentication)
                    .Include(e => e.Role)
                    .Include(e => e.Department)
                    .Where(e => e.Employee.IsActive == true)
                    .OrderBy(e => e.Employee.Userprofile.FirstName)
                    .Select(e => new
                    {
                        e.EmployeeMasterId,
                        e.EmployeeId,
                        EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                        FirstName = e.Employee.Userprofile.FirstName,
                        LastName = e.Employee.Userprofile.LastName,
                        Email = e.Employee.Userauthentication.Email,
                        RoleName = e.Role.RoleName,
                        DepartmentName = e.Department.DepartmentName
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = employees });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve employees",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get only managers/senior roles for approver dropdowns
        /// Used for L1 and L2 Approver dropdowns
        /// </summary>
        [HttpGet("managers")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetManagers()
        {
            try
            {
                var managerRoles = new[]
                {
                    "Manager",
                    "Project Manager",
                    "Team Lead",
                    "Technical Architect",
                    "HR Manager",
                    "Senior Software Engineer",
                    "Senior Manager",
                    "Director",
                    "Vice President",
                    "CTO",
                    "CEO"
                };

                var managers = await _context.Employeedetailsmasters
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userauthentication)
                    .Include(e => e.Role)
                    .Include(e => e.Department)
                    .Where(e => e.Employee.IsActive == true && 
                               managerRoles.Contains(e.Role.RoleName))
                    .OrderBy(e => e.Employee.Userprofile.FirstName)
                    .Select(e => new
                    {
                        e.EmployeeMasterId,
                        e.EmployeeId,
                        EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                        FirstName = e.Employee.Userprofile.FirstName,
                        LastName = e.Employee.Userprofile.LastName,
                        Email = e.Employee.Userauthentication.Email,
                        RoleName = e.Role.RoleName,
                        DepartmentName = e.Department.DepartmentName
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = managers });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve managers",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get employee by ID with full details
        /// </summary>
        [HttpGet("{employeeMasterId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployeeById(int employeeMasterId)
        {
            try
            {
                var employee = await _context.Employeedetailsmasters
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userauthentication)
                    .Include(e => e.Role)
                    .Include(e => e.Department)
                    .Where(e => e.EmployeeMasterId == employeeMasterId)
                    .Select(e => new
                    {
                        e.EmployeeMasterId,
                        e.EmployeeId,
                        EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                        FirstName = e.Employee.Userprofile.FirstName,
                        LastName = e.Employee.Userprofile.LastName,
                        Email = e.Employee.Userauthentication.Email,
                        RoleName = e.Role.RoleName,
                        DepartmentName = e.Department.DepartmentName,
                        IsActive = e.Employee.IsActive
                    })
                    .FirstOrDefaultAsync();

                if (employee == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Employee not found"
                    });
                }

                return Ok(new { success = true, data = employee });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve employee",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Search employees by name or employee company ID
        /// </summary>
        [HttpGet("search")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> SearchEmployees([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Search query is required"
                    });
                }

                var searchTerm = query.ToLower();

                var employees = await _context.Employeedetailsmasters
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userauthentication)
                    .Include(e => e.Role)
                    .Include(e => e.Department)
                    .Where(e => e.Employee.IsActive == true &&
                               (e.Employee.Userprofile.FirstName.ToLower().Contains(searchTerm) ||
                                e.Employee.Userprofile.LastName.ToLower().Contains(searchTerm) ||
                                e.Employee.EmployeeCompanyId.ToLower().Contains(searchTerm) ||
                                e.Employee.Userauthentication.Email.ToLower().Contains(searchTerm)))
                    .OrderBy(e => e.Employee.Userprofile.FirstName)
                    .Take(50)
                    .Select(e => new
                    {
                        e.EmployeeMasterId,
                        e.EmployeeId,
                        EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                        FirstName = e.Employee.Userprofile.FirstName,
                        LastName = e.Employee.Userprofile.LastName,
                        Email = e.Employee.Userauthentication.Email,
                        RoleName = e.Role.RoleName,
                        DepartmentName = e.Department.DepartmentName
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = employees, count = employees.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to search employees",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get employees by department
        /// </summary>
        [HttpGet("department/{departmentId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployeesByDepartment(int departmentId)
        {
            try
            {
                var employees = await _context.Employeedetailsmasters
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userauthentication)
                    .Include(e => e.Role)
                    .Include(e => e.Department)
                    .Where(e => e.Employee.IsActive == true && e.DepartmentId == departmentId)
                    .OrderBy(e => e.Employee.Userprofile.FirstName)
                    .Select(e => new
                    {
                        e.EmployeeMasterId,
                        e.EmployeeId,
                        EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                        FirstName = e.Employee.Userprofile.FirstName,
                        LastName = e.Employee.Userprofile.LastName,
                        Email = e.Employee.Userauthentication.Email,
                        RoleName = e.Role.RoleName,
                        DepartmentName = e.Department.DepartmentName
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = employees, count = employees.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve employees by department",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get employees by role
        /// </summary>
        [HttpGet("role/{roleId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployeesByRole(int roleId)
        {
            try
            {
                var employees = await _context.Employeedetailsmasters
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userauthentication)
                    .Include(e => e.Role)
                    .Include(e => e.Department)
                    .Where(e => e.Employee.IsActive == true && e.RoleId == roleId)
                    .OrderBy(e => e.Employee.Userprofile.FirstName)
                    .Select(e => new
                    {
                        e.EmployeeMasterId,
                        e.EmployeeId,
                        EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                        FirstName = e.Employee.Userprofile.FirstName,
                        LastName = e.Employee.Userprofile.LastName,
                        Email = e.Employee.Userauthentication.Email,
                        RoleName = e.Role.RoleName,
                        DepartmentName = e.Department.DepartmentName
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = employees, count = employees.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve employees by role",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get all departments
        /// Used for Department dropdown in project forms
        /// </summary>
        [HttpGet("departments")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllDepartments()
        {
            try
            {
                var departments = await _context.Set<Department>()
                    .OrderBy(d => d.DepartmentName)
                    .Select(d => new
                    {
                        d.DepartmentId,
                        d.DepartmentName,
                        d.BudgetAllocated,
                        d.CostCenter
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = departments });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve departments",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get all business units (distinct from existing projects)
        /// Used for Business Unit dropdown in project forms
        /// </summary>
        [HttpGet("business-units")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllBusinessUnits()
        {
            try
            {
                var businessUnits = await _context.Projects
                    .Where(p => !string.IsNullOrEmpty(p.BusinessUnit))
                    .Select(p => p.BusinessUnit!)
                    .Distinct()
                    .OrderBy(bu => bu)
                    .ToListAsync();

                if (!businessUnits.Any())
                {
                    businessUnits = new List<string>
                    {
                        "Information Technology",
                        "Human Resources",
                        "Finance",
                        "Operations",
                        "Sales and Marketing",
                        "Customer Service",
                        "Research and Development"
                    };
                }

                return Ok(new { success = true, data = businessUnits });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve business units",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get department by ID with details
        /// </summary>
        [HttpGet("departments/{departmentId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDepartmentById(int departmentId)
        {
            try
            {
                var department = await _context.Set<Department>()
                    .Where(d => d.DepartmentId == departmentId)
                    .Select(d => new
                    {
                        d.DepartmentId,
                        d.DepartmentName,
                        d.BudgetAllocated,
                        d.CostCenter,
                        d.CreatedAt,
                        d.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (department == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Department not found"
                    });
                }

                return Ok(new { success = true, data = department });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve department",
                    error = ex.Message
                });
            }
        }

/// <summary>
/// Get department heads by department with their reporting manager info
/// Used for SLA Manager escalation to department head
/// </summary>
[HttpGet("department-heads/{departmentId}")]
[ProducesResponseType(StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
[ProducesResponseType(StatusCodes.Status500InternalServerError)]
public async Task<IActionResult> GetDepartmentHeads(int departmentId)
{
    try
    {
        var deptHeadRoles = new[]
        {
            "Department Head",
            "Director",
            "Senior Manager",
            "Vice President"
        };

        var deptHeads = await _context.Employeedetailsmasters
            .Include(e => e.Employee)
                .ThenInclude(e => e.Userprofile)
            .Include(e => e.Employee)
                .ThenInclude(e => e.Userauthentication)
            .Include(e => e.Employee)
                .ThenInclude(e => e.ReportingManagerEmployee)
                    .ThenInclude(rm => rm.Userprofile)
            .Include(e => e.Employee)
                .ThenInclude(e => e.ReportingManagerEmployee)
                    .ThenInclude(rm => rm.Employeedetailsmasters)
                        .ThenInclude(ed => ed.Department)
            .Include(e => e.Role)
            .Include(e => e.Department)
            .Where(e => e.Employee.IsActive == true && 
                       e.DepartmentId == departmentId &&
                       deptHeadRoles.Contains(e.Role.RoleName))
            .OrderBy(e => e.Employee.Userprofile.FirstName)
            .Select(e => new
            {
                EmployeeId = e.EmployeeId,
                EmployeeMasterId = e.EmployeeMasterId,
                EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                FirstName = e.Employee.Userprofile.FirstName,
                LastName = e.Employee.Userprofile.LastName,
                Email = e.Employee.Userauthentication.Email,
                RoleName = e.Role.RoleName,
                DepartmentName = e.Department.DepartmentName,
                DepartmentId = e.DepartmentId,
                ReportingManagerName = e.Employee.ReportingManagerEmployee != null 
                    ? (e.Employee.ReportingManagerEmployee.Userprofile.FirstName + " " + e.Employee.ReportingManagerEmployee.Userprofile.LastName) 
                    : "N/A",
                ReportingManagerDept = e.Employee.ReportingManagerEmployee != null && 
                                      e.Employee.ReportingManagerEmployee.Employeedetailsmasters.Any()
                    ? e.Employee.ReportingManagerEmployee.Employeedetailsmasters.FirstOrDefault().Department.DepartmentName
                    : "N/A"
            })
            .ToListAsync();

        if (!deptHeads.Any())
        {
            return NotFound(new
            {
                success = false,
                message = "No department heads found for this department"
            });
        }

        return Ok(new { success = true, data = deptHeads });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            success = false,
            message = "Failed to retrieve department heads",
            error = ex.Message
        });
    }
}




        
    }
}

// Controllers/EmployeeManagementController.cs
using Relevantz.EEPZ.Data;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.DTOs.Request;  // ✅ ADD THIS

namespace eepzbackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize(Roles ="HR")]
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
                // Define manager/leadership roles
                var managerRoles = new[]
                {
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
                    .Take(50) // Limit results
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
                // Get distinct business units from existing projects
                var businessUnits = await _context.Projects
                    .Where(p => !string.IsNullOrEmpty(p.BusinessUnit))
                    .Select(p => p.BusinessUnit!)
                    .Distinct()
                    .OrderBy(bu => bu)
                    .ToListAsync();

                // If no business units exist in projects, return some default ones
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
        /// Get employees with null reporting manager (Initial Stage Employees)
        /// Excludes employees already mapped to resource pool
        /// </summary>
        [HttpGet("initial-stage")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetInitialStageEmployees()
        {
            try
            {
                // Get resource pool project ID
                var resourcePoolProject = await _context.Projects
                    .FirstOrDefaultAsync(p => p.ProjectName.ToLower() == "org.rz.resourcepool");

                var resourcePoolProjectId = resourcePoolProject?.ProjectId;

                // Get already mapped employee IDs to resource pool (using EmployeeMasterId)
                var mappedEmployeeMasterIds = new List<int>();
                if (resourcePoolProjectId.HasValue)
                {
                    mappedEmployeeMasterIds = await _context.Projectemployees
                        .Where(pe => pe.ProjectId == resourcePoolProjectId.Value)
                        .Select(pe => pe.EmployeeId)  // Assuming pe.EmployeeId == EmployeeMasterId
                        .ToListAsync();
                }

                // Get employees with NULL reporting manager
                // EXCLUDING those already mapped to resource pool (using EmployeeMasterId)
                var employees = await _context.Employeedetailsmasters
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(e => e.Employee)
                        .ThenInclude(e => e.Userauthentication)
                    .Include(e => e.Role)
                    .Include(e => e.Department)
                    .Where(e => e.Employee.IsActive == true && 
                               e.Employee.ReportingManagerEmployeeId == null &&  // ✅ NULL reporting manager
                               !mappedEmployeeMasterIds.Contains(e.EmployeeMasterId))  // ✅ FIXED: Use EmployeeMasterId for exclusion
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
                    message = "Failed to retrieve initial stage employees",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Map initial stage employees to resource pool (org.rz.resourcepool)
        /// </summary>
        [HttpPost("map-to-resource-pool")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MapToResourcePool([FromBody] MapToResourcePoolRequest request)
        {
            try
            {
                if (request.EmployeeMasterIds == null || !request.EmployeeMasterIds.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "No employees provided to map"
                    });
                }

                // Find the resource pool project
                var resourcePoolProject = await _context.Projects
                    .Include(p => p.L2approverEmployee)
                        .ThenInclude(e => e.Employee)
                    .FirstOrDefaultAsync(p => p.ProjectName.ToLower() == "org.rz.resourcepool");

                if (resourcePoolProject == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Resource pool project 'org.rz.resourcepool' not found. Please create it first."
                    });
                }

                // Check if L2 approver is set
                if (!resourcePoolProject.L2approverEmployeeId.HasValue)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Resource pool project does not have L2 Approver assigned"
                    });
                }

                // Get the L2 approver's actual EmployeeId
                var l2ApproverEmployeeId = resourcePoolProject.L2approverEmployee?.EmployeeId;
                if (!l2ApproverEmployeeId.HasValue)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid L2 Approver configuration for resource pool"
                    });
                }

                var mappedCount = 0;
                var errorsList = new List<string>();

                foreach (var empMasterId in request.EmployeeMasterIds)
                {
                    // Get employee details
                    var employeeDetails = await _context.Employeedetailsmasters
                        .Include(e => e.Employee)
                        .FirstOrDefaultAsync(e => e.EmployeeMasterId == empMasterId);

                    if (employeeDetails == null)
                    {
                        errorsList.Add($"Employee with ID {empMasterId} not found");
                        continue;
                    }

                    // Check if already mapped (using EmployeeMasterId)
                    var existingMapping = await _context.Projectemployees
                        .AnyAsync(pe => pe.ProjectId == resourcePoolProject.ProjectId && 
                                      pe.EmployeeId == empMasterId);  // ✅ pe.EmployeeId == EmployeeMasterId

                    if (!existingMapping)
                    {
                        // Create new project-employee mapping
                        var projectEmployee = new Projectemployee
                        {
                            ProjectId = resourcePoolProject.ProjectId,
                            EmployeeId = empMasterId,  // ✅ EmployeeMasterId
                            AssignedAt = DateTime.UtcNow,
                            IsPrimary = true // Mark as primary for resource pool
                        };

                        _context.Projectemployees.Add(projectEmployee);

                        // Update employee's reporting manager
                        var employee = employeeDetails.Employee;
                        if (employee != null)
                        {
                            employee.ReportingManagerEmployeeId = l2ApproverEmployeeId.Value;
                            employee.UpdatedAt = DateTime.UtcNow;
                            _context.Entry(employee).State = EntityState.Modified;
                        }

                        mappedCount++;
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Successfully mapped {mappedCount} employees to resource pool",
                    data = new
                    {
                        mappedCount,
                        totalRequested = request.EmployeeMasterIds.Count,
                        errors = errorsList
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to map employees to resource pool",
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
    }
}

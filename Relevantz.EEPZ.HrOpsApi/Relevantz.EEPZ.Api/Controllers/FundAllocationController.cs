using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;


namespace Relevantz.EEPZ.Api.Controllers
{
   [Route("api/[controller]")]
    [ApiController]
    public class FundAllocationController : ControllerBase
    {
        private readonly IFundAllocationService _fundAllocationService;
        private readonly EEPZDbContext _context;

        public FundAllocationController(
            IFundAllocationService fundAllocationService,
            EEPZDbContext context)
        {
            _fundAllocationService = fundAllocationService;
            _context = context;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateFundAllocation([FromBody] CreateFundAllocationRequestDto request)
        {
            try
            {
                var result = await _fundAllocationService.CreateFundAllocationAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CreateFundAllocation: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while creating fund allocation",
                    data = (object)null
                });
            }
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateFundAllocation([FromBody] UpdateFundAllocationRequestDto request)
        {
            try
            {
                var result = await _fundAllocationService.UpdateFundAllocationAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateFundAllocation: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating fund allocation",
                    data = (object)null
                });
            }
        }

        [HttpDelete("{allocationId}")]
        public async Task<IActionResult> DeleteFundAllocation(int allocationId)
        {
            try
            {
                var result = await _fundAllocationService.DeleteFundAllocationAsync(allocationId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in DeleteFundAllocation: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while deleting fund allocation",
                    data = (object)null
                });
            }
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllFundAllocations()
        {
            try
            {
                var result = await _fundAllocationService.GetAllFundAllocationsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAllFundAllocations: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching fund allocations",
                    data = (object)null
                });
            }
        }

        [HttpGet("{allocationId}")]
        public async Task<IActionResult> GetFundAllocationById(int allocationId)
        {
            try
            {
                var result = await _fundAllocationService.GetFundAllocationByIdAsync(allocationId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetFundAllocationById: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching fund allocation",
                    data = (object)null
                });
            }
        }

        [HttpGet("by-department/{departmentId}")]
        public async Task<IActionResult> GetFundAllocationsByDepartment(int departmentId)
        {
            try
            {
                var result = await _fundAllocationService.GetFundAllocationsByDepartmentAsync(departmentId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetFundAllocationsByDepartment: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching fund allocations by department",
                    data = (object)null
                });
            }
        }

        [HttpGet("by-type/{allocationType}")]
        public async Task<IActionResult> GetFundAllocationsByType(string allocationType)
        {
            try
            {
                var result = await _fundAllocationService.GetFundAllocationsByTypeAsync(allocationType);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetFundAllocationsByType: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching fund allocations by type",
                    data = (object)null
                });
            }
        }

        [HttpGet("department-budgets/all")]
        public async Task<IActionResult> GetAllDepartmentBudgets()
        {
            try
            {
                Console.WriteLine(" Controller: GetAllDepartmentBudgets called");

                var budgets = await _context.Departmentbudgets
                    .AsNoTracking()
                    .OrderBy(b => b.DepartmentId)
                    .ToListAsync();

                Console.WriteLine($" Controller: Found {budgets.Count} department budgets");

                var response = new List<object>();
                foreach (var budget in budgets)
                {
                    string departmentName = "Unknown";
                    try
                    {
                        var dept = await _context.Departments
                            .AsNoTracking()
                            .FirstOrDefaultAsync(d => d.DepartmentId == budget.DepartmentId);

                        if (dept != null && !string.IsNullOrEmpty(dept.DepartmentName))
                        {
                            departmentName = dept.DepartmentName;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($" Error fetching department name: {ex.Message}");
                    }

                    response.Add(new
                    {
                        budget.BudgetId,
                        budget.DepartmentId,
                        DepartmentName = departmentName,
                        budget.FiscalYear,
                        budget.TotalBudget,
                        budget.AllocatedAmount,
                        budget.UtilizedAmount,
                        budget.UtilizationPercentage,
                        budget.Headcount,
                        budget.AvgCostPerEmployee,
                        budget.CreatedAt,
                        budget.UpdatedAt
                    });
                }

                Console.WriteLine($" Controller: Returning {response.Count} department budgets");

                return Ok(new
                {
                    success = true,
                    message = $"Retrieved {response.Count} department budgets",
                    data = response
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Controller Error in GetAllDepartmentBudgets: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");

                return StatusCode(500, new
                {
                    success = false,
                    message = $"An error occurred while fetching department budgets: {ex.Message}",
                    data = (object)null
                });
            }
        }

        [HttpGet("department-budgets/department/{departmentId}")]
        public async Task<IActionResult> GetDepartmentBudget(int departmentId)
        {
            try
            {
                Console.WriteLine($" Controller: GetDepartmentBudget called for department {departmentId}");

                if (departmentId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid department ID",
                        data = (object)null
                    });
                }

                var budget = await _context.Departmentbudgets
                    .AsNoTracking()
                    .FirstOrDefaultAsync(b => b.DepartmentId == departmentId);

                if (budget == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Department budget not found",
                        data = (object)null
                    });
                }

                string departmentName = "Unknown";
                try
                {
                    var dept = await _context.Departments
                        .AsNoTracking()
                        .FirstOrDefaultAsync(d => d.DepartmentId == budget.DepartmentId);

                    if (dept != null && !string.IsNullOrEmpty(dept.DepartmentName))
                    {
                        departmentName = dept.DepartmentName;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($" Error fetching department name: {ex.Message}");
                }

                var response = new
                {
                    budget.BudgetId,
                    budget.DepartmentId,
                    DepartmentName = departmentName,
                    budget.FiscalYear,
                    budget.TotalBudget,
                    budget.AllocatedAmount,
                    budget.UtilizedAmount,
                    budget.UtilizationPercentage,
                    budget.Headcount,
                    budget.AvgCostPerEmployee,
                    budget.CreatedAt,
                    budget.UpdatedAt
                };

                return Ok(new
                {
                    success = true,
                    message = "Department budget retrieved successfully",
                    data = response
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error in GetDepartmentBudget: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching department budget",
                    data = (object)null
                });
            }
        }

        [HttpGet("department-budgets/year/{fiscalYear}")]
        public async Task<IActionResult> GetDepartmentBudgetsByYear(int fiscalYear)
        {
            try
            {
                Console.WriteLine($" Controller: GetDepartmentBudgetsByYear called for year {fiscalYear}");

                if (fiscalYear <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Fiscal year must be greater than zero",
                        data = (object)null
                    });
                }

                var budgets = await _context.Departmentbudgets
                    .AsNoTracking()
                    .Where(b => b.FiscalYear == fiscalYear)
                    .OrderBy(b => b.DepartmentId)
                    .ToListAsync();

                var response = new List<object>();
                foreach (var budget in budgets)
                {
                    string departmentName = "Unknown";
                    try
                    {
                        var dept = await _context.Departments
                            .AsNoTracking()
                            .FirstOrDefaultAsync(d => d.DepartmentId == budget.DepartmentId);

                        if (dept != null && !string.IsNullOrEmpty(dept.DepartmentName))
                        {
                            departmentName = dept.DepartmentName;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($" Error fetching department name: {ex.Message}");
                    }

                    response.Add(new
                    {
                        budget.BudgetId,
                        budget.DepartmentId,
                        DepartmentName = departmentName,
                        budget.FiscalYear,
                        budget.TotalBudget,
                        budget.AllocatedAmount,
                        budget.UtilizedAmount,
                        budget.UtilizationPercentage,
                        budget.Headcount,
                        budget.AvgCostPerEmployee,
                        budget.CreatedAt,
                        budget.UpdatedAt
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = $"Retrieved {response.Count} department budgets for fiscal year {fiscalYear}",
                    data = response
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error in GetDepartmentBudgetsByYear: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching department budgets by year",
                    data = (object)null
                });
            }
        }

        [HttpPost("department-budgets/create")]
        public async Task<IActionResult> CreateDepartmentBudget([FromBody] CreateDepartmentBudgetDto request)
        {
            try
            {
                Console.WriteLine($" Controller: CreateDepartmentBudget called");
                Console.WriteLine($"Request: Department={request.DepartmentId}, Year={request.FiscalYear}, Total={request.TotalBudget}");

                if (request.DepartmentId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid department ID",
                        data = (object)null
                    });
                }

                if (request.FiscalYear <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid fiscal year",
                        data = (object)null
                    });
                }

                if (request.TotalBudget <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Total budget must be greater than zero",
                        data = (object)null
                    });
                }

                var departmentExists = await _context.Departments
                    .AnyAsync(d => d.DepartmentId == request.DepartmentId);

                if (!departmentExists)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Department not found",
                        data = (object)null
                    });
                }

                var existingBudget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.DepartmentId == request.DepartmentId && b.FiscalYear == request.FiscalYear);

                if (existingBudget != null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Budget already exists for this department and fiscal year",
                        data = (object)null
                    });
                }

                var newBudget = new Departmentbudget
                {
                    DepartmentId = request.DepartmentId,
                    FiscalYear = request.FiscalYear,
                    TotalBudget = request.TotalBudget,
                    AllocatedAmount = request.AllocatedAmount ?? request.TotalBudget,
                    UtilizedAmount = 0,
                    UtilizationPercentage = 0,
                    Headcount = 0,
                    AvgCostPerEmployee = 0,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.Departmentbudgets.Add(newBudget);
                await _context.SaveChangesAsync();

                Console.WriteLine($" Budget created with ID: {newBudget.BudgetId}");

                return Ok(new
                {
                    success = true,
                    message = "Department budget created successfully",
                    data = new
                    {
                        newBudget.BudgetId,
                        newBudget.DepartmentId,
                        newBudget.FiscalYear,
                        newBudget.TotalBudget,
                        newBudget.AllocatedAmount,
                        newBudget.CreatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error in CreateDepartmentBudget: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");

                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while creating department budget",
                    data = (object)null
                });
            }
        }

        [HttpPut("department-budgets/update")]
        public async Task<IActionResult> UpdateDepartmentBudget([FromBody] UpdateDepartmentBudgetDto request)
        {
            try
            {
                Console.WriteLine($" Controller: UpdateDepartmentBudget called");

                if (request.BudgetId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid budget ID",
                        data = (object)null
                    });
                }

                var budget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.BudgetId == request.BudgetId);

                if (budget == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Department budget not found",
                        data = (object)null
                    });
                }

                if (request.TotalBudget <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Total budget must be greater than zero",
                        data = (object)null
                    });
                }

                if (request.AllocatedAmount > request.TotalBudget)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Allocated amount cannot exceed total budget",
                        data = (object)null
                    });
                }

                budget.TotalBudget = request.TotalBudget;
                budget.AllocatedAmount = request.AllocatedAmount;
                budget.UpdatedAt = DateTime.Now;

                _context.Departmentbudgets.Update(budget);
                await _context.SaveChangesAsync();

                Console.WriteLine($" Budget updated successfully");

                return Ok(new
                {
                    success = true,
                    message = "Department budget updated successfully",
                    data = new
                    {
                        budget.BudgetId,
                        budget.TotalBudget,
                        budget.AllocatedAmount,
                        budget.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error in UpdateDepartmentBudget: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating department budget",
                    data = (object)null
                });
            }
        }

        [HttpDelete("department-budgets/{budgetId}")]
        public async Task<IActionResult> DeleteDepartmentBudget(int budgetId)
        {
            try
            {
                Console.WriteLine($" Controller: DeleteDepartmentBudget called for budget {budgetId}");

                if (budgetId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid budget ID",
                        data = (object)null
                    });
                }

                var budget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.BudgetId == budgetId);

                if (budget == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Department budget not found",
                        data = (object)null
                    });
                }

                var allocations = await _context.Budgetallocations
                    .Where(a => a.DepartmentId == budget.DepartmentId)
                    .ToListAsync();

                if (allocations.Count > 0)
                {
                    _context.Budgetallocations.RemoveRange(allocations);
                    Console.WriteLine($" Deleted {allocations.Count} associated allocations");
                }

                _context.Departmentbudgets.Remove(budget);
                await _context.SaveChangesAsync();

                Console.WriteLine($" Budget deleted successfully");

                return Ok(new
                {
                    success = true,
                    message = "Department budget deleted successfully",
                    data = new
                    {
                        budget.BudgetId
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error in DeleteDepartmentBudget: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while deleting department budget",
                    data = (object)null
                });
            }
        }

        [HttpPut("department-budgets/update-utilized")]
        public async Task<IActionResult> UpdateUtilizedAmount([FromBody] UpdateUtilizedAmountDto request)
        {
            try
            {
                Console.WriteLine($" Controller: UpdateUtilizedAmount called");

                if (request.BudgetId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid budget ID",
                        data = (object)null
                    });
                }

                var budget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.BudgetId == request.BudgetId);

                if (budget == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Department budget not found",
                        data = (object)null
                    });
                }

                if (request.UtilizedAmount < 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Utilized amount cannot be negative",
                        data = (object)null
                    });
                }

                if (request.UtilizedAmount > (budget.AllocatedAmount ?? 0))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = $"Utilized amount cannot exceed allocated budget (₹{budget.AllocatedAmount})",
                        data = (object)null
                    });
                }

                decimal utilizationPercentage = 0;
                if (budget.AllocatedAmount > 0)
                {
                    utilizationPercentage = (request.UtilizedAmount / budget.AllocatedAmount.Value) * 100;
                }

                budget.UtilizedAmount = request.UtilizedAmount;
                budget.UtilizationPercentage = utilizationPercentage;
                budget.UpdatedAt = DateTime.Now;

                _context.Departmentbudgets.Update(budget);
                await _context.SaveChangesAsync();

                Console.WriteLine($" Utilized amount updated successfully");

                return Ok(new
                {
                    success = true,
                    message = "Utilized amount updated successfully",
                    data = new
                    {
                        budget.BudgetId,
                        budget.AllocatedAmount,
                        budget.UtilizedAmount,
                        budget.UtilizationPercentage,
                        budget.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error in UpdateUtilizedAmount: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating utilized amount",
                    data = (object)null
                });
            }
        }

        [HttpPut("update-utilization")]
        public async Task<IActionResult> UpdateUtilization([FromBody] UpdateUtilizationDto request)
        {
            try
            {
                Console.WriteLine($"Controller: UpdateUtilization called for allocation {request.AllocationId}");

                if (request.AllocationId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid allocation ID",
                        data = (object)null
                    });
                }

                // Get the allocation first
                var allocation = await _context.Budgetallocations
                    .FirstOrDefaultAsync(a => a.AllocationId == request.AllocationId);

                if (allocation == null)
                {
                    Console.WriteLine($"Allocation not found: {request.AllocationId}");
                    
                    // DEBUG: Check what allocations exist
                    var existingAllocations = await _context.Budgetallocations
                        .Select(a => a.AllocationId)
                        .ToListAsync();
                    Console.WriteLine($"Existing AllocationIds: {string.Join(", ", existingAllocations)}");
                    
                    return NotFound(new
                    {
                        success = false,
                        message = $"Budget allocation with ID {request.AllocationId} not found",
                        data = (object)null
                    });
                }

                if (request.UtilizedAmount < 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Utilized amount cannot be negative",
                        data = (object)null
                    });
                }

                if (request.UtilizedAmount > allocation.Amount)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = $"Utilized amount (₹{request.UtilizedAmount}) cannot exceed allocated amount (₹{allocation.Amount})",
                        data = (object)null
                    });
                }

                // Update allocation
                allocation.UtilizedAmount = request.UtilizedAmount;
                allocation.UtilizationPercentage = request.UtilizationPercentage;
                
                if (!string.IsNullOrEmpty(request.Notes))
                    allocation.Notes = request.Notes;
                    
                allocation.UpdatedAt = DateTime.UtcNow;

                _context.Budgetallocations.Update(allocation);
                await _context.SaveChangesAsync();

                Console.WriteLine($"Allocation {allocation.AllocationId} utilization updated successfully");

                await UpdateDepartmentBudgetTotals(allocation.DepartmentId);

                return Ok(new
                {
                    success = true,
                    message = "Utilization updated successfully",
                    data = new
                    {
                        allocation.AllocationId,
                        allocation.Amount,
                        allocation.UtilizedAmount,
                        allocation.UtilizationPercentage,
                        allocation.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Controller Error: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating utilization",
                    data = (object)null
                });
            }
        }

        private async Task UpdateDepartmentBudgetTotals(int departmentId)
        {
            try
            {
                var budget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.DepartmentId == departmentId);

                if (budget != null)
                {
                    var totalUtilized = await _context.Budgetallocations
                        .Where(a => a.DepartmentId == departmentId)
                        .SumAsync(a => a.UtilizedAmount ?? 0);

                    budget.UtilizedAmount = totalUtilized;
                    budget.UtilizationPercentage = budget.AllocatedAmount > 0
                        ? (totalUtilized / budget.AllocatedAmount.Value) * 100
                        : 0;
                    budget.UpdatedAt = DateTime.UtcNow;

                    _context.Departmentbudgets.Update(budget);
                    await _context.SaveChangesAsync();

                    Console.WriteLine($" Department budget totals updated");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error updating department budget totals: {ex.Message}");
            }
        }
        [HttpGet("by-budget/{budgetId}")]
public async Task<IActionResult> GetAllocationsByBudget(int budgetId)
{
    try {
        Console.WriteLine($" Getting allocations for budget: {budgetId}");

        var allocations = await _context.Budgetallocations
            .AsNoTracking()  
            .Where(a => a.BudgetId == budgetId)
            .Select(a => new
            {
                a.AllocationId,
                a.BudgetId,
                a.DepartmentId,
                DepartmentName = a.Department != null ? a.Department.DepartmentName : "Unknown",
                a.EmployeeUserId,
                EmployeeEmail = a.EmployeeUser != null ? a.EmployeeUser.Email : null,
                a.AllocationType,
                a.Amount,
                a.GoalStatus,
                a.Notes,
                a.AllocatedByUserId,
                AllocatedByEmail = a.AllocatedByUser != null ? a.AllocatedByUser.Email : "Unknown",
                a.AllocatedAt,
                a.UtilizedAmount,
                a.UtilizationPercentage,
                a.UpdatedAt,
                a.Period,
                a.PeriodYear  
            })
            .ToListAsync();

        Console.WriteLine($"Found {allocations.Count} allocations for budget {budgetId}");

        return Ok(new
        {
            success = true,
            message = $"Retrieved {allocations.Count} allocations",
            data = allocations
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error getting allocations: {ex.Message}");
        return StatusCode(500, new
        {
            success = false,
            message = "An error occurred while fetching allocations",
            data = (object)null
        });
    }
}


    }
}



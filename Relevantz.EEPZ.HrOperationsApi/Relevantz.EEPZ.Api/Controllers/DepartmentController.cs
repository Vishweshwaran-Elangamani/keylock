using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Api.Controllers
{
   [ApiController]
    [Route("api/[controller]")]
    public class DepartmentController : ControllerBase
    {
        private readonly EEPZDbContext _context;
 
        public DepartmentController(EEPZDbContext context)
        {
            _context = context;
        }
 
        //  GET ALL DEPARTMENTS
        [HttpGet("all")]
        public async Task<IActionResult> GetAllDepartments()
        {
            try
            {
                Console.WriteLine(" Backend: Getting all departments");
               
                var departments = await _context.Departments
                    .AsNoTracking()
                    .OrderBy(d => d.DepartmentName)
                    .Select(d => new
                    {
                        d.DepartmentId,
                        d.DepartmentName
                    })
                    .ToListAsync();
 
                Console.WriteLine($" Backend: Found {departments.Count} departments");
 
                return Ok(new
                {
                    success = true,
                    message = $"Retrieved {departments.Count} departments",
                    data = departments
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Backend Error: {ex.Message}");
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
 
        //  GET DEPARTMENT BY ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDepartmentById(int id)
        {
            try
            {
                var department = await _context.Departments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.DepartmentId == id);
 
                if (department == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Department not found"
                    });
                }
 
                return Ok(new
                {
                    success = true,
                    data = department
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }
 
 
}

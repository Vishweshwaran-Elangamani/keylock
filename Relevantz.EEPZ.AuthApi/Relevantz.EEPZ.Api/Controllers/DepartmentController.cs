using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
 
namespace Relevantz.EEPZ.Api.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;
 
        public DepartmentController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }
 
        [HttpPost("create")]
        public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentRequestDto request)
        {
            var result = await _departmentService.CreateDepartmentAsync(request);
           
            if (!result.Success)
                return BadRequest(result);
 
            return Ok(result);
        }
 
        [HttpPut("update")]
        public async Task<IActionResult> UpdateDepartment([FromBody] UpdateDepartmentRequestDto request)
        {
            var result = await _departmentService.UpdateDepartmentAsync(request);
           
            if (!result.Success)
                return BadRequest(result);
 
            return Ok(result);
        }
 
        [HttpGet("{departmentId}")]
        public async Task<IActionResult> GetDepartmentById(int departmentId)
        {
            var result = await _departmentService.GetDepartmentByIdAsync(departmentId);
           
            if (!result.Success)
                return NotFound(result);
 
            return Ok(result);
        }
 
        [HttpGet("all")]
        public async Task<IActionResult> GetAllDepartments()
        {
            var result = await _departmentService.GetAllDepartmentsAsync();
            return Ok(result);
        }
 
        [HttpDelete("{departmentId}")]
        public async Task<IActionResult> DeleteDepartment(int departmentId)
        {
            var result = await _departmentService.DeleteDepartmentAsync(departmentId);
           
            if (!result.Success)
                return BadRequest(result);
 
            return Ok(result);
        }
    }
}
 
 
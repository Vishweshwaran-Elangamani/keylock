using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Mvc;
 
namespace Relevantz.EEPZ.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PayrollManagementController : ControllerBase
    {
        private readonly IPayrollManagementService _payrollManagementService;
 
        public PayrollManagementController(IPayrollManagementService payrollManagementService)
        {
            _payrollManagementService = payrollManagementService;
        }
 
        [HttpPost("create")]
        public async Task<IActionResult> CreatePayroll([FromBody] CreatePayrollRequestDto request)
        {
            var result = await _payrollManagementService.CreatePayrollAsync(request);
            return Ok(result);
        }
 
        [HttpPut("update")]
        public async Task<IActionResult> UpdatePayroll([FromBody] UpdatePayrollRequestDto request)
        {
            var result = await _payrollManagementService.UpdatePayrollAsync(request);
            return Ok(result);
        }
 
        [HttpPut("approve")]
        public async Task<IActionResult> ApprovePayroll([FromBody] ApprovePayrollRequestDto request)
        {
            var result = await _payrollManagementService.ApprovePayrollAsync(request);
            return Ok(result);
        }
 
        [HttpPut("process/{payrollId}")]
        public async Task<IActionResult> ProcessPayroll(int payrollId)
        {
            var result = await _payrollManagementService.ProcessPayrollAsync(payrollId);
            return Ok(result);
        }
 
        [HttpGet("all")]
        public async Task<IActionResult> GetAllPayrolls()
        {
            var result = await _payrollManagementService.GetAllPayrollsAsync();
            return Ok(result);
        }
 
        [HttpGet("{payrollId}")]
        public async Task<IActionResult> GetPayrollById(int payrollId)
        {
            var result = await _payrollManagementService.GetPayrollByIdAsync(payrollId);
            return Ok(result);
        }
 
        [HttpGet("by-employee/{EmployeeUserId}")]
        public async Task<IActionResult> GetPayrollsByEmployee(int EmployeeUserId)
        {
            var result = await _payrollManagementService.GetPayrollsByEmployeeAsync(EmployeeUserId);
            return Ok(result);
        }
 
        [HttpGet("by-status/{status}")]
        public async Task<IActionResult> GetPayrollsByStatus(string status)
        {
            var result = await _payrollManagementService.GetPayrollsByStatusAsync(status);
            return Ok(result);
        }
    }
 
 
}
 
 
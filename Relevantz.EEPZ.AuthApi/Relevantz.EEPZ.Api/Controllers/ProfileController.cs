using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.IService;

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly ICurrentUserService _currentUser;

    public ProfileController(ICurrentUserService currentUser)
    {
        _currentUser = currentUser;
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var empId = await _currentUser.GetEmployeeIdAsync();
        if (empId == null) 
            return Unauthorized("Employee ID not found");

        var email = _currentUser.Email ?? "unknown";
        var name = _currentUser.Name ?? "unknown";
        var isHr = _currentUser.IsHR;
        var roles = _currentUser.Roles;

        return Ok(new 
        {
            employeeId = empId,
            email = email,
            name = name,
            isHr = isHr,
            roles = roles
        });
    }
}

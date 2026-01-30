using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Exceptions;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
    /// <summary>
    /// Base controller for goal-related APIs, providing common functionality such as user role
    /// and employee master ID retrieval for authorization and identity validation.
    /// </summary>
    [ApiController]
    [Authorize]
    public abstract class BaseGoalController : ControllerBase
    {
        protected readonly IBaseGoalService _service;
        protected readonly ILogger _logger;

        protected BaseGoalController(IBaseGoalService service, ILogger<BaseGoalController> logger)
        {
            _service = service;
            _logger = logger;
        }

        protected string GetUserRole()
        {
            var role = User.FindFirst("role")?.Value ?? User.FindFirst(ClaimTypes.Role)?.Value;
            if (string.IsNullOrEmpty(role))
            {
                throw new UnauthorizedException(
                    ResponseMessages.Codes.Unauthorized,
                    "Role claim not found"
                );
            }
            return role;
        }

        protected int GetEmpMasterId()
        {
            var claim = User.FindFirst(CLAIM_TYPES.EMPLOYEE_MASTER_ID)?.Value;
            if (string.IsNullOrEmpty(claim))
            {
                throw new UnauthorizedException(
                    ResponseMessages.Codes.Unauthorized,
                    "Employee Master ID not found"
                );
            }
            return int.Parse(claim);
        }
    }
}

using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
    [ApiController]
    [Authorize]
    public abstract class BaseGoalController : ControllerBase
    {
        protected readonly IGoalModuleService _service;
        protected readonly ILogger _logger; 

        protected BaseGoalController(IGoalModuleService service, ILogger logger)
        {
            _service = service;
            _logger = logger;
        }   
         
        protected string GetUserRole()
        {
            return User.FindFirst("role")?.Value
                ?? User.FindFirst(ClaimTypes.Role)?.Value
                ?? throw new UnauthorizedAccessException("Role claim not found");
        }

        protected int GetEmpMasterId()
        {
            var claim = User.FindFirst(CLAIM_TYPES.EMPLOYEE_MASTER_ID)?.Value;
            if (string.IsNullOrEmpty(claim))
                throw new UnauthorizedAccessException("Employee Master ID not found");
            return int.Parse(claim);
        }
    }
}

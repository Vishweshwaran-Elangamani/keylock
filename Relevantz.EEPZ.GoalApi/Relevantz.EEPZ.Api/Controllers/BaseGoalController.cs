using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Exceptions;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;
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

            Log.Debug("BaseGoalController initialized.");
        }  

        protected string GetUserRole()
        {
            Log.Information("GetUserRole START | UserId={UserId}", 
                User?.FindFirst(CLAIM_TYPES.EMPLOYEE_MASTER_ID)?.Value);

            var role = User.FindFirst("role")?.Value ?? User.FindFirst(ClaimTypes.Role)?.Value;

            Log.Information("GetUserRole CLAIM CHECK | RoleValue={Role}", role);

            if (string.IsNullOrEmpty(role))
            {
                Log.Warning("GetUserRole FAILED | Reason=Role claim not found");
                throw new UnauthorizedException(
                    ResponseMessages.Codes.Unauthorized,
                    "Role claim not found"
                );
            } 

            Log.Information("GetUserRole END | Role={Role}", role);
            return role;
        }

        protected int GetEmpMasterId()
        {
            Log.Information("GetEmpMasterId START");

            var claim = User.FindFirst(CLAIM_TYPES.EMPLOYEE_MASTER_ID)?.Value;

            Log.Information("GetEmpMasterId CLAIM CHECK | EmployeeMasterId={ClaimValue}", claim);

            if (string.IsNullOrEmpty(claim))
            {
                Log.Warning("GetEmpMasterId FAILED | Reason=Employee Master ID claim missing");
                throw new UnauthorizedException(
                    ResponseMessages.Codes.Unauthorized,
                    "Employee Master ID not found"
                );
            }

            var empId = int.Parse(claim);

            Log.Information("GetEmpMasterId END | EmployeeMasterId={EmployeeId}", empId);
            return empId;
        }
    }
}
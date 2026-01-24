using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Api.Controllers.LnD
{
    /// <summary>
    /// Base controller for LnD module with shared helper methods
    /// </summary>
    public abstract class BaseLnDController : ControllerBase
    {
        protected int GetCurrentEmployeeId()
        {
            var employeeIdClaim = User.FindFirst(LnDConstants.CLAIM_TYPES.EMPLOYEE_ID)?.Value;

            if (string.IsNullOrEmpty(employeeIdClaim))
            {
                throw new UnauthorizedAccessException(
                    LnDConstants.RESPONSE_MESSAGES.EMPLOYEE_ID_NOT_FOUND_TOKEN
                );
            }

            return int.Parse(employeeIdClaim);
        }
    }
}

using System.Security.Claims;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Common.Utils
{
    public static class ClaimsUtility
    {
        public static string GetRole(ClaimsPrincipal user)
        {
            var roleClaim =
                user.FindFirst(AppConstants.ClaimTypes.MsRoleSchema) ??
                user.FindFirst(System.Security.Claims.ClaimTypes.Role) ??
                user.FindFirst(AppConstants.ClaimTypes.Role);

            return roleClaim?.Value ?? AppConstants.Roles.Employee;
        }

        public static int GetUserId(ClaimsPrincipal user)
        {
            var subClaim =
                user.FindFirst(AppConstants.ClaimTypes.Sub) ??
                user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

            if (subClaim == null || !int.TryParse(subClaim.Value, out int userId))
                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UserIdNotFoundInToken);

            return userId;
        }
    }
}

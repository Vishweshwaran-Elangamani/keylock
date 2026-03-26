// FULL FILE — NO FUNCTIONALITY REMOVED — BUILD SAFE

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.DBContexts;
using System.Security.Claims;

namespace Relevantz.EEPZ.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthenticationController : ControllerBase
{
    private readonly IKeycloakAdminService             _keycloak;
    private readonly EEPZDbContext                     _db;
    private readonly ILogger<AuthenticationController> _logger;

    public AuthenticationController(
        IKeycloakAdminService              keycloak,
        EEPZDbContext                      db,
        ILogger<AuthenticationController>  logger)
    {
        _keycloak = keycloak;
        _db       = db;
        _logger   = logger;
    }

    // ── POST /api/authentication/change-password ──────────────────────────
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(
                ApiResponseDto<object>.FailureResponse(
                    "Validation failed.", errors));
        }

        var empIdClaim = User.FindFirst("empId")?.Value
                      ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(empIdClaim) ||
            !int.TryParse(empIdClaim, out int empId))
        {
            _logger.LogWarning("ChangePassword called but empId claim is missing or invalid.");
            return Unauthorized(
                ApiResponseDto<object>.FailureResponse(
                    "Cannot identify employee from token. " +
                    "Ensure Keycloak User Attribute mapper is configured for empId."));
        }

        try
        {
            var userAuth = await _db.Userauthentications
                .AsNoTracking()
                .FirstOrDefaultAsync(ua => ua.EmployeeId == empId);

            if (userAuth is null)
                return NotFound(
                    ApiResponseDto<object>.FailureResponse(
                        MessageConstants.UserNotFound));

            // Reset password in Keycloak — permanent
            await _keycloak.ResetPasswordAsync(
                userAuth.Email,
                request.NewPassword,
                temporary: false);

            // Clear IsFirstLogin in DB
            var auth = await _db.Userauthentications
                .FirstOrDefaultAsync(ua => ua.EmployeeId == empId);
            if (auth is not null)
            {
                auth.IsFirstLogin = false;
                auth.UpdatedAt    = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }

            EEPZBusinessLog.Information(
                $"Password changed via Keycloak. EmpId={empId}");

            return Ok(ApiResponseDto<object>.SuccessResponse(
                null, "Password changed successfully."));
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex,
                "ChangePassword — user not found in Keycloak. EmpId={EmpId}", empId);
            return NotFound(
                ApiResponseDto<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "ChangePassword failed. EmpId={EmpId}", empId);
            return StatusCode(500,
                ApiResponseDto<object>.FailureResponse(
                    $"Password change failed: {ex.Message}"));
        }
    }

    // ── POST /api/authentication/logout ───────────────────────────────────
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var empIdClaim = User.FindFirst("empId")?.Value;

        if (int.TryParse(empIdClaim, out int empId))
        {
            await _db.Userauthentications
                .Where(ua => ua.EmployeeId == empId)
                .ExecuteUpdateAsync(setters =>
                    setters.SetProperty(
                        ua => ua.LastLoginAt,
                        DateTime.UtcNow));

            EEPZBusinessLog.Information(
                $"Logout recorded. EmpId={empId}");
        }

        return Ok(ApiResponseDto<object>.SuccessResponse(
            null,
            "Logged out. Call Keycloak /logout to revoke the refresh token."));
    }
}

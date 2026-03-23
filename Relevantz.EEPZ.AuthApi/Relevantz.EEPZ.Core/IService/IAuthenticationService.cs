// // ────────────────────────────────────────────────────────────────────────────
// // WHAT CHANGED vs the old controller:
// //
// //  DELETED endpoints (Keycloak handles these natively):
// //    POST /api/authentication/login
// //    POST /api/authentication/verify-otp
// //    POST /api/authentication/forgot-password
// //    POST /api/authentication/reset-password
// //    POST /api/authentication/keycloak-exchange
// //    POST /api/authentication/keycloak-login
// //    POST /api/authentication/refresh-token
// //
// //  KEPT endpoints (still need server-side logic):
// //    POST /api/authentication/change-password  → calls Keycloak Admin API
// //    POST /api/authentication/logout           → stateless 200 OK
// //
// //  HOW FRONTEND LOGS IN NOW:
// //    POST http://<keycloak>:9090/realms/eepz-realm/protocol/openid-connect/token
// //    Body: grant_type=password & client_id=eepz-client &
// //          client_secret=<secret> & username=<email> & password=<pass>
// //    Response: { access_token, refresh_token, expires_in, ... }
// //    The access_token already contains: empId, empMasterId, roles
// // ────────────────────────────────────────────────────────────────────────────

// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;
// using Microsoft.EntityFrameworkCore;
// using Relevantz.EEPZ.Common.Constants;
// using Relevantz.EEPZ.Common.DTOs.Request;
// using Relevantz.EEPZ.Common.DTOs.Response;
// using Relevantz.EEPZ.Common.Utils;
// using Relevantz.EEPZ.Core.IService;
// using Relevantz.EEPZ.Data.DBContexts;
// using System.Security.Claims;

// namespace Relevantz.EEPZ.Api.Controllers;

// [ApiController]
// [Route("api/[controller]")]
// public class AuthenticationController : ControllerBase
// {
//     private readonly IKeycloakAdminService            _keycloak;
//     private readonly EEPZDbContext                    _db;
//     private readonly ILogger<AuthenticationController> _logger;

//     public AuthenticationController(
//         IKeycloakAdminService             keycloak,
//         EEPZDbContext                     db,
//         ILogger<AuthenticationController> logger)
//     {
//         _keycloak = keycloak;
//         _db       = db;
//         _logger   = logger;
//     }

//     // ── POST /api/authentication/change-password ──────────────────────────
//     /// <summary>
//     /// Changes the authenticated employee's password inside Keycloak.
//     /// Requires a valid Keycloak JWT in the Authorization header.
//     /// Also clears the IsFirstLogin flag in the DB so the frontend
//     /// knows the password change has been completed.
//     /// </summary>
//     [HttpPost("change-password")]
//     [Authorize]
//     public async Task<IActionResult> ChangePassword(
//         [FromBody] ChangePasswordRequestDto request)
//     {
//         if (!ModelState.IsValid)
//         {
//             var errors = ModelState.Values
//                 .SelectMany(v => v.Errors)
//                 .Select(e => e.ErrorMessage)
//                 .ToList();
//             return BadRequest(
//                 ApiResponseDto<object>.FailureResponse(
//                     MessageConstants.ValidationFailed, errors));
//         }

//         // empId is a custom claim injected by Keycloak via User Attribute mapper
//         var empIdClaim = User.FindFirst("empId")?.Value
//                       ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

//         if (string.IsNullOrEmpty(empIdClaim) || !int.TryParse(empIdClaim, out int empId))
//         {
//             _logger.LogWarning(
//                 "ChangePassword called but empId claim is missing or invalid.");
//             return Unauthorized(
//                 ApiResponseDto<object>.FailureResponse(
//                     "Cannot identify employee from token. " +
//                     "Ensure Keycloak User Attribute mapper is configured for empId."));
//         }

//         try
//         {
//             // Look up email from DB using empId
//             var userAuth = await _db.Userauthentications
//                 .AsNoTracking()
//                 .FirstOrDefaultAsync(ua => ua.EmployeeId == empId);

//             if (userAuth is null)
//                 return NotFound(
//                     ApiResponseDto<object>.FailureResponse(
//                         MessageConstants.UserNotFound));

//             // Reset password in Keycloak — permanent (temporary=false)
//             await _keycloak.ResetPasswordAsync(
//                 userAuth.Email,
//                 request.NewPassword,
//                 temporary: false);

//             // Clear IsFirstLogin flag in the DB
//             var auth = await _db.Userauthentications
//                 .FirstOrDefaultAsync(ua => ua.EmployeeId == empId);
//             if (auth is not null)
//             {
//                 auth.IsFirstLogin = false;
//                 auth.UpdatedAt    = DateTime.UtcNow;
//                 await _db.SaveChangesAsync();
//             }

//             EEPZBusinessLog.Information(
//                 $"Password changed via Keycloak. EmpId={empId}");

//             return Ok(ApiResponseDto<object>.SuccessResponse(
//                 null, "Password changed successfully."));
//         }
//         catch (KeyNotFoundException ex)
//         {
//             _logger.LogWarning(ex,
//                 "ChangePassword — user not found in Keycloak. EmpId={EmpId}", empId);
//             return NotFound(
//                 ApiResponseDto<object>.FailureResponse(ex.Message));
//         }
//         catch (Exception ex)
//         {
//             _logger.LogError(ex,
//                 "ChangePassword failed. EmpId={EmpId}", empId);
//             return StatusCode(500,
//                 ApiResponseDto<object>.FailureResponse(
//                     $"Password change failed: {ex.Message}"));
//         }
//     }

//     // ── POST /api/authentication/logout ───────────────────────────────────
//     /// <summary>
//     /// Stateless logout endpoint.
//     /// The frontend must call Keycloak's own logout endpoint to actually
//     /// invalidate the session and refresh token:
//     ///   POST /realms/eepz-realm/protocol/openid-connect/logout
//     ///        { client_id, client_secret, refresh_token }
//     /// This endpoint exists only so the frontend has a single "logout" call
//     /// that it can also use to update last-login or fire audit events.
//     /// </summary>
//     [HttpPost("logout")]
//     [Authorize]
//     public async Task<IActionResult> Logout()
//     {
//         var empIdClaim = User.FindFirst("empId")?.Value;

//         if (int.TryParse(empIdClaim, out int empId))
//         {
//             // Update last-login timestamp in userauthentication table
//             await _db.Userauthentications
//                 .Where(ua => ua.EmployeeId == empId)
//                 .ExecuteUpdateAsync(setters =>
//                     setters.SetProperty(ua => ua.LastLoginAt, DateTime.UtcNow));

//             EEPZBusinessLog.Information(
//                 $"Logout recorded. EmpId={empId}");
//         }

//         return Ok(ApiResponseDto<object>.SuccessResponse(
//             null,
//             "Logged out. Call Keycloak /logout to revoke the refresh token."));
//     }
// }

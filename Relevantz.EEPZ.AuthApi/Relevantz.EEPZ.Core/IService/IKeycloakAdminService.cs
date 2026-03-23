namespace Relevantz.EEPZ.Core.IService;

public interface IKeycloakAdminService
{
    // ── User creation ─────────────────────────────────────────────────────
    /// <summary>
    /// Creates a user in Keycloak with a temporary password and the
    /// UPDATE_PASSWORD required action. Returns the Keycloak UUID (string).
    /// </summary>
    Task<string> CreateUserAsync(
        string email,
        string firstName,
        string lastName,
        string temporaryPassword,
        string roleName);

    // ── Attribute injection (for JWT claims) ──────────────────────────────
    /// <summary>
    /// Sets custom attributes on a Keycloak user.
    /// Use this to push empId + empMasterId so they appear in the JWT
    /// via a Keycloak User Attribute protocol mapper.
    /// </summary>
    Task SetUserAttributesAsync(
        string keycloakUserId,
        Dictionary<string, string> attributes);

    // ── Role assignment ───────────────────────────────────────────────────
    /// <summary>
    /// Assigns a Keycloak realm role (e.g. "HR", "Admin") to a user.
    /// If the role does not exist in Keycloak the call is silently skipped
    /// and a warning is logged — it will not throw.
    /// </summary>
    Task AssignRoleAsync(string keycloakUserId, string roleName);

    // ── Password management ───────────────────────────────────────────────
    /// <summary>
    /// Resets a user's password in Keycloak via the Admin API.
    /// temporary=true → user is forced to change on next login.
    /// temporary=false → permanent (use for SuperAdmin seed + change-password).
    /// </summary>
    Task ResetPasswordAsync(string email, string newPassword, bool temporary = true);

    // ── Lookup ────────────────────────────────────────────────────────────
    /// <summary>Returns the Keycloak UUID for the given email, or null if not found.</summary>
    Task<string?> GetUserIdByEmailAsync(string email);

    /// <summary>Returns true if a user with the given email exists in Keycloak.</summary>
    Task<bool> UserExistsAsync(string email);

    // ── Enable / Disable ──────────────────────────────────────────────────
    /// <summary>
    /// Disables a Keycloak user — they cannot log in but the account is preserved.
    /// Called when DeactivateUser is triggered from the API.
    /// </summary>
    Task DisableUserAsync(string keycloakUserId);

    /// <summary>
    /// Re-enables a previously disabled Keycloak user.
    /// Called when ActivateUser is triggered from the API.
    /// </summary>
    Task EnableUserAsync(string keycloakUserId);

    // ── Rollback ──────────────────────────────────────────────────────────
    /// <summary>
    /// Permanently deletes a user from Keycloak.
    /// ONLY call this as a rollback when DB save fails after Keycloak create.
    /// Never call this for normal user deactivation — use DisableUserAsync.
    /// </summary>
    Task DeleteUserAsync(string keycloakUserId);
}

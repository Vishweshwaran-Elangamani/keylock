namespace Relevantz.EEPZ.Core.IService
{
    public interface IKeycloakAdminService
    {
        // ── User Creation ────────────────────────────────────────────────────
        Task<string> CreateUserAsync(string userEmail, string firstName, string lastName, string roleName);

        // ── Profile & Attributes ─────────────────────────────────────────────
        // ✅ firstName/lastName/email optional — prevents stale Keycloak data wipe
        Task SetUserAttributesAsync(
            string keycloakUserId,
            Dictionary<string, string> attributes,
            string? firstName = null,
            string? lastName  = null,
            string? email     = null);

        Task UpdateUserProfileAsync(string keycloakUserId, string email, string firstName, string lastName);

        // ── Role Management ──────────────────────────────────────────────────
        Task AssignRoleAsync(string keycloakUserId, string roleName);

        // ── Password Management ──────────────────────────────────────────────
        Task SendSetPasswordEmailAsync(string keycloakUserId);
        Task ResetPasswordAsync(string email, string newPassword, bool temporary = false);
        Task ResetPasswordByIdAsync(string keycloakUserId, string newPassword, bool temporary = false);

        // ── User Lookup ──────────────────────────────────────────────────────
        Task<string?> GetUserIdByEmailAsync(string email);
        Task<bool> UserExistsAsync(string email);

        // ✅ Added — used by SuperAdminSeederService to check if UUID still exists in Keycloak
        Task<bool> UserExistsByIdAsync(string keycloakUserId);

        // ── User State ───────────────────────────────────────────────────────
        Task DeleteUserAsync(string id);
        Task DisableUserAsync(string id);
        Task EnableUserAsync(string id);
    }
}

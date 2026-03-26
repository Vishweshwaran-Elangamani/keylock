// FULL FILE — NO FUNCTIONALITY REMOVED — BUILD SAFE

namespace Relevantz.EEPZ.Core.IService
{
    public interface IKeycloakAdminService
    {
        // ── User creation — NO temporaryPassword param anymore
        Task<string> CreateUserAsync(string userEmail, string firstName, string lastName, string roleName);

        Task SetUserAttributesAsync(string keycloakUserId, Dictionary<string, string> attributes);
        Task UpdateUserProfileAsync(string keycloakUserId, string email, string firstName, string lastName);
        Task AssignRoleAsync(string keycloakUserId, string roleName);

        // ── Keycloak sends the "Set your password" email natively
        Task SendSetPasswordEmailAsync(string keycloakUserId);

        Task ResetPasswordAsync(string email, string newPassword, bool temporary = false);
        Task ResetPasswordByIdAsync(string keycloakUserId, string newPassword, bool temporary = false);
        Task<string?> GetUserIdByEmailAsync(string email);
        Task<bool> UserExistsAsync(string email);
        Task DeleteUserAsync(string id);
        Task DisableUserAsync(string id);
        Task EnableUserAsync(string id);
    }
}

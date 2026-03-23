namespace Relevantz.EEPZ.Core.IService
{
    public interface IKeycloakAdminService
    {
        Task<string> CreateUserAsync(string userEmail, string firstName, string lastName, string temporaryPassword, string roleName);
        Task SetUserAttributesAsync(string keycloakUserId, Dictionary<string, string> attributes);
        Task UpdateUserProfileAsync(string keycloakUserId, string email, string firstName, string lastName); // ✅ NEW
        Task AssignRoleAsync(string keycloakUserId, string roleName);
        Task ResetPasswordAsync(string email, string newPassword, bool temporary = true);
        Task ResetPasswordByIdAsync(string keycloakUserId, string newPassword, bool temporary = false);
        Task<string?> GetUserIdByEmailAsync(string email);
        Task<bool> UserExistsAsync(string email);
        Task DeleteUserAsync(string id);
        Task DisableUserAsync(string id);
        Task EnableUserAsync(string id);
    }
}

namespace Relevantz.EEPZ.Core.IService;

public interface ICurrentUserService
{
    string? KeycloakUserId { get; }
    string? Email { get; }
    string? Name { get; }
    string? Role { get; }
    IEnumerable<string> Roles { get; }
    bool IsAuthenticated { get; }
    Task<int?> GetEmployeeIdAsync();
    Task<int?> GetEmployeeMasterIdAsync();
    bool IsInRole(string role);
    bool IsAdmin { get; }
    bool IsHR { get; }
    bool IsManager { get; }
}
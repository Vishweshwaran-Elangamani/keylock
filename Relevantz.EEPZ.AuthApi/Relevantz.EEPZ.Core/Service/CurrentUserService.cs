using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Core.Service;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly EEPZDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CurrentUserService> _logger;

    public CurrentUserService(
        IHttpContextAccessor httpContextAccessor,
        EEPZDbContext context,
        IMemoryCache cache,
        ILogger<CurrentUserService> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public string? KeycloakUserId => User?.FindFirst("sub")?.Value;

    public string? Email => User?.FindFirst("email")?.Value
        ?? User?.FindFirst("preferred_username")?.Value
        ?? User?.FindFirst(ClaimTypes.Email)?.Value;

    public string? Name => User?.FindFirst("name")?.Value
        ?? User?.FindFirst("preferred_username")?.Value
        ?? User?.FindFirst(ClaimTypes.Name)?.Value;

    public string? Role => Roles.FirstOrDefault();

    // ✅ FIXED: Reads Keycloak realm_access.roles JSON claim
    public IEnumerable<string> Roles
    {
        get
        {
            var roles = new List<string>();

            // 1. Standard ClaimTypes.Role
            roles.AddRange(
                User?.FindAll(ClaimTypes.Role).Select(c => c.Value)
                ?? Enumerable.Empty<string>());

            // 2. Keycloak flat "role" claim (single string)
            var roleClaim = User?.FindFirst("role")?.Value;
            if (!string.IsNullOrEmpty(roleClaim) && !roles.Contains(roleClaim))
                roles.Add(roleClaim);

            // 3. Keycloak realm_access.roles (nested JSON array)
            var realmAccessClaim = User?.FindFirst("realm_access")?.Value;
            if (!string.IsNullOrEmpty(realmAccessClaim))
            {
                try
                {
                    var realmAccess = JsonSerializer.Deserialize<JsonElement>(realmAccessClaim);
                    if (realmAccess.TryGetProperty("roles", out var rolesArray))
                    {
                        foreach (var role in rolesArray.EnumerateArray())
                        {
                            var r = role.GetString();
                            if (!string.IsNullOrEmpty(r) && !roles.Contains(r))
                                roles.Add(r);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Failed to parse realm_access claim: {Error}", ex.Message);
                }
            }

            return roles;
        }
    }

    public bool IsAdmin    => IsInRole("Admin");
    public bool IsHR       => IsInRole("HR");
    public bool IsManager  => IsInRole("Manager");

    public bool IsInRole(string role)
        => Roles.Contains(role, StringComparer.OrdinalIgnoreCase);

    public async Task<int?> GetEmployeeIdAsync()
    {
        var empIdClaim = User?.FindFirst("empId")?.Value
                         ?? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var email = Email;

        _logger.LogInformation("=== DEBUG TOKEN === Email='{Email}' empIdClaim='{EmpId}'", email, empIdClaim);

        if (!string.IsNullOrEmpty(empIdClaim) && int.TryParse(empIdClaim, out int empIdFromClaim))
            return empIdFromClaim;

        if (string.IsNullOrEmpty(email))
        {
            _logger.LogWarning("Email claim is null/empty");
            return null;
        }

        var cacheKey = $"emp_id_{email.ToLower()}";
        if (_cache.TryGetValue(cacheKey, out int cachedId))
            return cachedId;

        try
        {
            var userAuth = await _context.Userauthentications
                .AsNoTracking()
                .FirstOrDefaultAsync(ua => ua.Email.ToLower() == email.ToLower());

            _logger.LogInformation("DB lookup for '{Email}' found userAuth: {Found}", email, userAuth != null);

            if (userAuth != null)
            {
                _cache.Set(cacheKey, userAuth.EmployeeId, TimeSpan.FromMinutes(30));
                return userAuth.EmployeeId;
            }

            _logger.LogWarning("Employee not found for email: {Email}", email);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting EmployeeId for email: {Email}", email);
            return null;
        }
    }

    public async Task<int?> GetEmployeeMasterIdAsync()
    {
        var empMasterIdClaim = User?.FindFirst("empMasterId")?.Value;

        if (!string.IsNullOrEmpty(empMasterIdClaim) && int.TryParse(empMasterIdClaim, out int empMasterIdFromClaim))
            return empMasterIdFromClaim;

        var employeeId = await GetEmployeeIdAsync();
        if (employeeId == null)
            return null;

        var cacheKey = $"emp_master_id_{employeeId}";
        if (_cache.TryGetValue(cacheKey, out int cachedMasterId))
            return cachedMasterId;

        try
        {
            var empMaster = await _context.Employeedetailsmasters
                .AsNoTracking()
                .FirstOrDefaultAsync(em => em.EmployeeId == employeeId.Value);

            if (empMaster != null)
            {
                _cache.Set(cacheKey, empMaster.EmployeeId, TimeSpan.FromMinutes(30));
                return empMaster.EmployeeId;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting EmployeeMasterId for employeeId: {EmployeeId}", employeeId);
            return null;
        }
    }
}

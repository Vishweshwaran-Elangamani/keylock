using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Core.Service;

public class KeycloakAdminService : IKeycloakAdminService
{
    private readonly HttpClient                    _http;
    private readonly ILogger<KeycloakAdminService> _logger;

    private readonly string _baseUrl;
    private readonly string _realm;
    private readonly string _adminUser;
    private readonly string _adminPassword;

    private string?  _adminToken;
    private DateTime _adminTokenExpiry = DateTime.MinValue;

    public KeycloakAdminService(
        HttpClient         http,
        IConfiguration     configuration,
        ILogger<KeycloakAdminService> logger)
    {
        _http          = http;
        _logger        = logger;
        _baseUrl       = configuration["Keycloak:BaseUrl"]
                         ?? throw new InvalidOperationException("Keycloak:BaseUrl is not configured.");
        _realm         = configuration["Keycloak:Realm"]
                         ?? throw new InvalidOperationException("Keycloak:Realm is not configured.");
        _adminUser     = configuration["Keycloak:AdminUser"]     ?? "admin";
        _adminPassword = configuration["Keycloak:AdminPassword"] ?? "admin";
    }

    // ── ADMIN TOKEN ──────────────────────────────────────────────────────────
    private async Task EnsureAdminTokenAsync()
    {
        if (_adminToken != null && DateTime.UtcNow < _adminTokenExpiry.AddSeconds(-60))
            return;

        var url  = $"{_baseUrl}/realms/master/protocol/openid-connect/token";
        var body = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "password",
            ["client_id"]  = "admin-cli",
            ["username"]   = _adminUser,
            ["password"]   = _adminPassword
        });

        var response = await _http.PostAsync(url, body);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogError("Admin token failed: {Error}", err);
            throw new InvalidOperationException("Keycloak admin token failed");
        }

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        _adminToken       = doc.RootElement.GetProperty("access_token").GetString()!;
        var expiresIn     = doc.RootElement.GetProperty("expires_in").GetInt32();
        _adminTokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn);
    }

    // ── CREATE USER ──────────────────────────────────────────────────────────
    // ✅ Sets ALL fields on creation — username, email, firstName, lastName, enabled, emailVerified
    // ✅ Does NOT set requiredActions=UPDATE_PASSWORD for SuperAdmin (only for regular users)
    public async Task<string> CreateUserAsync(
        string userEmail,
        string firstName,
        string lastName,
        string roleName)
    {
        await EnsureAdminTokenAsync();

        if (string.IsNullOrWhiteSpace(userEmail))
            throw new ArgumentException("Email required");

        if (await UserExistsAsync(userEmail))
            throw new InvalidOperationException($"User {userEmail} already exists");

        firstName ??= "";
        lastName  ??= "";

        // ✅ FIX: requiredActions only for non-SuperAdmin users
        // SuperAdmin password is set directly via ResetPasswordByIdAsync — no email link needed
        var requiredActions = roleName == "Admin"
            ? Array.Empty<string>()
            : new[] { "UPDATE_PASSWORD" };

        var payload = new
        {
            username        = userEmail,
            email           = userEmail,
            firstName       = firstName,
            lastName        = lastName,
            enabled         = true,
            emailVerified   = true,
            requiredActions = requiredActions
        };

        var req = BuildRequest(HttpMethod.Post,
            $"{_baseUrl}/admin/realms/{_realm}/users", payload);

        var res = await _http.SendAsync(req);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            throw new InvalidOperationException(err);
        }

        // ✅ Small delay to allow Keycloak to fully persist the new user
        await Task.Delay(300);

        var keycloakId = await GetUserIdByEmailAsync(userEmail)
            ?? throw new Exception("User created but ID not found");

        _logger.LogInformation("Keycloak user created. Id={Id}", keycloakId);
        return keycloakId;
    }

    // ── SEND SET-PASSWORD EMAIL ──────────────────────────────────────────────
   public async Task SendSetPasswordEmailAsync(string keycloakUserId)
{
    await EnsureAdminTokenAsync();

    var redirectUri = Uri.EscapeDataString(
        "https://unprotractive-elmo-estipulate.ngrok-free.dev");

    var url =
        $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}/execute-actions-email" +
        $"?lifespan=86400" +
        $"&client_id=eepz-client-public" +
        $"&redirect_uri={redirectUri}";

    var actions = new[] { "UPDATE_PASSWORD" };

    var req = BuildRequest(HttpMethod.Put, url, actions);
    var res = await _http.SendAsync(req);

    if (res.IsSuccessStatusCode)
    {
        _logger.LogInformation(
            "✅ Set-password email sent via Keycloak SMTP. KeycloakId={Id}", keycloakUserId);
        return;
    }

    var statusCode = (int)res.StatusCode;
    var err = await res.Content.ReadAsStringAsync();

    _logger.LogError(
        "❌ SendSetPasswordEmail failed. KeycloakId={Id} HttpStatus={Status} Error={Error}.",
        keycloakUserId, statusCode, err);

    throw new InvalidOperationException(
        $"Failed to send set-password email via Keycloak. HttpStatus={statusCode}. Raw error: {err}");
}


    // ── UPDATE USER PROFILE ──────────────────────────────────────────────────
    // ✅ PRESERVED but no longer called from seeder/CreateUser flows
    // Still used if explicitly needed elsewhere
    public async Task UpdateUserProfileAsync(
        string keycloakUserId,
        string email,
        string firstName,
        string lastName)
    {
        await EnsureAdminTokenAsync();

        var payload = new
        {
            username      = email,
            email         = email,
            firstName     = firstName,
            lastName      = lastName,
            enabled       = true,
            emailVerified = true
        };

        var req = BuildRequest(HttpMethod.Put,
            $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}", payload);

        var res = await _http.SendAsync(req);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            _logger.LogWarning("UpdateUserProfile failed: {Error}", err);
        }
        else
        {
            _logger.LogInformation("✅ User profile updated. KeycloakId={Id} Email={Email}",
                keycloakUserId, email);
        }
    }

    // ── SET USER ATTRIBUTES ──────────────────────────────────────────────────
    // ✅ FIX: Added firstName/lastName/email optional params
    // When passed, these values are used directly instead of reading stale empty
    // data back from Keycloak — prevents fields being wiped after CreateUserAsync
    public async Task SetUserAttributesAsync(
        string keycloakUserId,
        Dictionary<string, string> attributes,
        string? firstName = null,
        string? lastName  = null,
        string? email     = null)
    {
        await EnsureAdminTokenAsync();

        // 1. Fetch full current user from Keycloak
        var getReq = BuildRequest(HttpMethod.Get,
            $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}");
        var getRes = await _http.SendAsync(getReq);
        var json   = await getRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // 2. Merge existing attributes with new ones
        var merged = new Dictionary<string, string[]>();
        if (doc.RootElement.TryGetProperty("attributes", out var attr))
        {
            foreach (var p in attr.EnumerateObject())
                merged[p.Name] = p.Value.EnumerateArray()
                    .Select(x => x.GetString() ?? "")
                    .ToArray();
        }
        foreach (var kv in attributes)
            merged[kv.Key] = new[] { kv.Value };

        // 3. ✅ Use explicitly passed values first — NEVER trust stale Keycloak data
        // Falls back to Keycloak values only if explicit values not provided
        var resolvedEmail     = email
            ?? (doc.RootElement.TryGetProperty("email",     out var ep) ? ep.GetString() : null);
        var resolvedFirstName = firstName
            ?? (doc.RootElement.TryGetProperty("firstName", out var fp) ? fp.GetString() : null);
        var resolvedLastName  = lastName
            ?? (doc.RootElement.TryGetProperty("lastName",  out var lp) ? lp.GetString() : null);
        var resolvedUsername  = resolvedEmail
            ?? (doc.RootElement.TryGetProperty("username",  out var up) ? up.GetString() : null);

        // 4. PUT all fields + attributes in ONE call — never partial, never wipes profile
        var payload = new
        {
            username      = resolvedUsername,
            email         = resolvedEmail,
            firstName     = resolvedFirstName,
            lastName      = resolvedLastName,
            enabled       = true,
            emailVerified = true,
            attributes    = merged
        };

        var putReq = BuildRequest(HttpMethod.Put,
            $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}", payload);

        var putRes = await _http.SendAsync(putReq);
        if (!putRes.IsSuccessStatusCode)
        {
            var err = await putRes.Content.ReadAsStringAsync();
            _logger.LogWarning("SetUserAttributes failed: {Error}", err);
        }
        else
        {
            _logger.LogInformation(
                "✅ SetUserAttributes OK. KeycloakId={Id} empId={EmpId}",
                keycloakUserId,
                attributes.TryGetValue("empId", out var eid) ? eid : "?");
        }
    }

    // ── ASSIGN ROLE ──────────────────────────────────────────────────────────
    public async Task AssignRoleAsync(string keycloakUserId, string roleName)
    {
        await EnsureAdminTokenAsync();

        var roleReq = BuildRequest(HttpMethod.Get,
            $"{_baseUrl}/admin/realms/{_realm}/roles/{roleName}");

        var roleRes = await _http.SendAsync(roleReq);
        if (!roleRes.IsSuccessStatusCode)
            throw new Exception($"Role {roleName} not found in Keycloak realm.");

        var json = await roleRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var role = new[]
        {
            new
            {
                id   = doc.RootElement.GetProperty("id").GetString(),
                name = doc.RootElement.GetProperty("name").GetString()
            }
        };

        var assignReq = BuildRequest(HttpMethod.Post,
            $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}/role-mappings/realm",
            role);

        var res = await _http.SendAsync(assignReq);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            _logger.LogWarning("AssignRole failed: {Error}", err);
        }
    }

    // ── RESET PASSWORD BY EMAIL ──────────────────────────────────────────────
    public async Task ResetPasswordAsync(string email, string newPassword, bool temporary = false)
    {
        await EnsureAdminTokenAsync();

        var userId = await GetUserIdByEmailAsync(email)
            ?? throw new Exception($"User not found: {email}");

        await ResetPasswordByIdAsync(userId, newPassword, temporary);
    }

    // ── RESET PASSWORD BY UUID ───────────────────────────────────────────────
    public async Task ResetPasswordByIdAsync(
        string keycloakUserId,
        string newPassword,
        bool   temporary = false)
    {
        await EnsureAdminTokenAsync();

        var payload = new
        {
            type      = "password",
            value     = newPassword,
            temporary = temporary
        };

        var req = BuildRequest(HttpMethod.Put,
            $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}/reset-password",
            payload);

        var res = await _http.SendAsync(req);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"ResetPasswordById failed: {err}");
        }

        _logger.LogInformation("Password reset via UUID. KeycloakId={Id}", keycloakUserId);
    }

    // ── GET USER ID BY EMAIL ─────────────────────────────────────────────────
    public async Task<string?> GetUserIdByEmailAsync(string email)
    {
        await EnsureAdminTokenAsync();

        // Try by username first (Keycloak username = email)
        var req = BuildRequest(HttpMethod.Get,
            $"{_baseUrl}/admin/realms/{_realm}/users?username={Uri.EscapeDataString(email)}&exact=true");
        var res  = await _http.SendAsync(req);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        if (doc.RootElement.GetArrayLength() > 0)
            return doc.RootElement[0].GetProperty("id").GetString();

        // Fallback: try by email field
        var req2  = BuildRequest(HttpMethod.Get,
            $"{_baseUrl}/admin/realms/{_realm}/users?email={Uri.EscapeDataString(email)}&exact=true");
        var res2  = await _http.SendAsync(req2);
        var json2 = await res2.Content.ReadAsStringAsync();
        using var doc2 = JsonDocument.Parse(json2);

        return doc2.RootElement.GetArrayLength() == 0
            ? null
            : doc2.RootElement[0].GetProperty("id").GetString();
    }

    // ── USER EXISTS BY EMAIL ─────────────────────────────────────────────────
    public async Task<bool> UserExistsAsync(string email)
        => await GetUserIdByEmailAsync(email) != null;

    // ── USER EXISTS BY UUID ──────────────────────────────────────────────────
    public async Task<bool> UserExistsByIdAsync(string keycloakUserId)
    {
        try
        {
            await EnsureAdminTokenAsync();
            var req = BuildRequest(HttpMethod.Get,
                $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}");
            var res = await _http.SendAsync(req);
            return res.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    // ── DELETE USER ──────────────────────────────────────────────────────────
    public async Task DeleteUserAsync(string id)
    {
        await EnsureAdminTokenAsync();
        var req = BuildRequest(HttpMethod.Delete,
            $"{_baseUrl}/admin/realms/{_realm}/users/{id}");
        await _http.SendAsync(req);
    }

    // ── DISABLE USER ─────────────────────────────────────────────────────────
    public async Task DisableUserAsync(string id)
    {
        await EnsureAdminTokenAsync();
        var req = BuildRequest(HttpMethod.Put,
            $"{_baseUrl}/admin/realms/{_realm}/users/{id}",
            new { enabled = false });
        await _http.SendAsync(req);
    }

    // ── ENABLE USER ──────────────────────────────────────────────────────────
    public async Task EnableUserAsync(string id)
    {
        await EnsureAdminTokenAsync();
        var req = BuildRequest(HttpMethod.Put,
            $"{_baseUrl}/admin/realms/{_realm}/users/{id}",
            new { enabled = true });
        await _http.SendAsync(req);
    }

    // ── BUILD REQUEST HELPER ─────────────────────────────────────────────────
    private HttpRequestMessage BuildRequest(HttpMethod method, string url, object? body = null)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", _adminToken);

        if (body != null)
            request.Content = new StringContent(
                JsonSerializer.Serialize(body),
                Encoding.UTF8,
                "application/json");

        return request;
    }
}

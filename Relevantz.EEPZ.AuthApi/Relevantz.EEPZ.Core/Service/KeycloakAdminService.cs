// FULL FILE — NO FUNCTIONALITY REMOVED — BUILD SAFE

using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Core.Service;

public class KeycloakAdminService : IKeycloakAdminService
{
    private readonly HttpClient _http;
    private readonly ILogger<KeycloakAdminService> _logger;

    private readonly string _baseUrl;
    private readonly string _realm;
    private readonly string _adminUser;
    private readonly string _adminPassword;

    private string? _adminToken;
    private DateTime _adminTokenExpiry = DateTime.MinValue;

    public KeycloakAdminService(
        HttpClient http,
        IConfiguration configuration,
        ILogger<KeycloakAdminService> logger)
    {
        _http = http;
        _logger = logger;

        _baseUrl = configuration["Keycloak:BaseUrl"]
            ?? throw new InvalidOperationException("Keycloak:BaseUrl is not configured.");
        _realm = configuration["Keycloak:Realm"]
            ?? throw new InvalidOperationException("Keycloak:Realm is not configured.");
        _adminUser = configuration["Keycloak:AdminUser"] ?? "admin";
        _adminPassword = configuration["Keycloak:AdminPassword"] ?? "admin";
    }

    // ── Admin token ─────────────────────────────────────────────
    private async Task EnsureAdminTokenAsync()
    {
        if (_adminToken != null && DateTime.UtcNow < _adminTokenExpiry.AddSeconds(-60))
            return;

        var url = $"{_baseUrl}/realms/master/protocol/openid-connect/token";

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

        _adminToken = doc.RootElement.GetProperty("access_token").GetString()!;
        var expiresIn = doc.RootElement.GetProperty("expires_in").GetInt32();

        _adminTokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn);
    }

    // ── CREATE USER ─────────────────────────────────────────────
    public async Task<string> CreateUserAsync(
        string email,
        string firstName,
        string lastName,
        string temporaryPassword,
        string roleName)
    {
        await EnsureAdminTokenAsync();

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email required");

        if (await UserExistsAsync(email))
            throw new InvalidOperationException($"User {email} already exists");

        firstName ??= "";
        lastName ??= "";

        var payload = new
        {
            username = email,
            email = email,
            firstName = firstName,
            lastName = lastName,
            enabled = true,
            emailVerified = true,
            requiredActions = new[] { "UPDATE_PASSWORD" },
            credentials = new[]
            {
                new {
                    type = "password",
                    value = temporaryPassword,
                    temporary = true
                }
            }
        };

        var req = BuildRequest(HttpMethod.Post,
            $"{_baseUrl}/admin/realms/{_realm}/users", payload);

        var res = await _http.SendAsync(req);

        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            throw new InvalidOperationException(err);
        }

        var keycloakId = await GetUserIdByEmailAsync(email)
            ?? throw new Exception("User created but ID not found");

        return keycloakId;
    }

    // ── SET ATTRIBUTES ─────────────────────────────────────────────
    public async Task SetUserAttributesAsync(
        string keycloakUserId,
        Dictionary<string, string> attributes)
    {
        await EnsureAdminTokenAsync();

        var getReq = BuildRequest(HttpMethod.Get,
            $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}");

        var getRes = await _http.SendAsync(getReq);

        var json = await getRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var merged = new Dictionary<string, string[]>();

        if (doc.RootElement.TryGetProperty("attributes", out var attr))
        {
            foreach (var p in attr.EnumerateObject())
            {
                merged[p.Name] = p.Value.EnumerateArray()
                    .Select(x => x.GetString() ?? "")
                    .ToArray();
            }
        }

        foreach (var kv in attributes)
            merged[kv.Key] = new[] { kv.Value };

        var payload = new { attributes = merged };

        var putReq = BuildRequest(HttpMethod.Put,
            $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}",
            payload);

        await _http.SendAsync(putReq);
    }

    // ── ASSIGN ROLE ─────────────────────────────────────────────
    public async Task AssignRoleAsync(string keycloakUserId, string roleName)
    {
        await EnsureAdminTokenAsync();

        var roleReq = BuildRequest(HttpMethod.Get,
            $"{_baseUrl}/admin/realms/{_realm}/roles/{roleName}");

        var roleRes = await _http.SendAsync(roleReq);

        if (!roleRes.IsSuccessStatusCode)
            throw new Exception($"Role {roleName} not found");

        var json = await roleRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var role = new[]
        {
            new {
                id = doc.RootElement.GetProperty("id").GetString(),
                name = doc.RootElement.GetProperty("name").GetString()
            }
        };

        var assignReq = BuildRequest(HttpMethod.Post,
            $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}/role-mappings/realm",
            role);

        var res = await _http.SendAsync(assignReq);

        if (!res.IsSuccessStatusCode)
            throw new Exception("Role assign failed");
    }

    // ── RESET PASSWORD (🔥 REQUIRED FOR BUILD)
    public async Task ResetPasswordAsync(string email, string newPassword, bool temporary = true)
    {
        await EnsureAdminTokenAsync();

        var userId = await GetUserIdByEmailAsync(email);

        if (userId == null)
            throw new Exception($"User not found: {email}");

        var payload = new
        {
            type = "password",
            value = newPassword,
            temporary = temporary
        };

        var req = BuildRequest(HttpMethod.Put,
            $"{_baseUrl}/admin/realms/{_realm}/users/{userId}/reset-password",
            payload);

        var res = await _http.SendAsync(req);

        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            throw new Exception($"Reset password failed: {err}");
        }
    }

    // ── GET USER ID ─────────────────────────────────────────────
    public async Task<string?> GetUserIdByEmailAsync(string email)
    {
        await EnsureAdminTokenAsync();

        var req = BuildRequest(HttpMethod.Get,
            $"{_baseUrl}/admin/realms/{_realm}/users?email={email}&exact=true");

        var res = await _http.SendAsync(req);

        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        return doc.RootElement.GetArrayLength() == 0
            ? null
            : doc.RootElement[0].GetProperty("id").GetString();
    }

    public async Task<bool> UserExistsAsync(string email)
        => await GetUserIdByEmailAsync(email) != null;

    public async Task DeleteUserAsync(string id)
    {
        await EnsureAdminTokenAsync();

        var req = BuildRequest(HttpMethod.Delete,
            $"{_baseUrl}/admin/realms/{_realm}/users/{id}");

        await _http.SendAsync(req);
    }

    public async Task DisableUserAsync(string id)
    {
        await EnsureAdminTokenAsync();

        var req = BuildRequest(HttpMethod.Put,
            $"{_baseUrl}/admin/realms/{_realm}/users/{id}",
            new { enabled = false });

        await _http.SendAsync(req);
    }

    public async Task EnableUserAsync(string id)
    {
        await EnsureAdminTokenAsync();

        var req = BuildRequest(HttpMethod.Put,
            $"{_baseUrl}/admin/realms/{_realm}/users/{id}",
            new { enabled = true });

        await _http.SendAsync(req);
    }

    private HttpRequestMessage BuildRequest(HttpMethod method, string url, object? body = null)
    {
        var request = new HttpRequestMessage(method, url);

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", _adminToken);

        if (body != null)
        {
            request.Content = new StringContent(
                JsonSerializer.Serialize(body),
                Encoding.UTF8,
                "application/json");
        }

        return request;
    }
}
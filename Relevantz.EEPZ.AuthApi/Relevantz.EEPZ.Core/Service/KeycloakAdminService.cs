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
        _http          = http;
        _logger        = logger;
        _baseUrl       = configuration["Keycloak:BaseUrl"]
                         ?? throw new InvalidOperationException("Keycloak:BaseUrl is not configured.");
        _realm         = configuration["Keycloak:Realm"]
                         ?? throw new InvalidOperationException("Keycloak:Realm is not configured.");
        _adminUser     = configuration["Keycloak:AdminUser"]     ?? "admin";
        _adminPassword = configuration["Keycloak:AdminPassword"] ?? "admin";
    }

    // ── Admin token ──────────────────────────────────────────────────────────
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
    // NO temporaryPassword — Keycloak email drives password setup via SendSetPasswordEmailAsync
    public async Task<string> CreateUserAsync(
        string userEmail,
        string firstName,
        string lastName,
        string roleName)           // roleName kept for future attribute use / logging
    {
        await EnsureAdminTokenAsync();

        if (string.IsNullOrWhiteSpace(userEmail))
            throw new ArgumentException("Email required");

        if (await UserExistsAsync(userEmail))
            throw new InvalidOperationException($"User {userEmail} already exists");

        firstName ??= "";
        lastName  ??= "";

        var payload = new
        {
            username        = userEmail,
            email           = userEmail,
            firstName       = firstName,
            lastName        = lastName,
            enabled         = true,
            emailVerified   = true,
            // requiredActions drives Keycloak to demand a password change on first login
            requiredActions = new[] { "UPDATE_PASSWORD" }
            // NO credentials block — Keycloak email link handles password creation
        };

        var req = BuildRequest(HttpMethod.Post,
            $"{_baseUrl}/admin/realms/{_realm}/users", payload);

        var res = await _http.SendAsync(req);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            throw new InvalidOperationException(err);
        }

        var keycloakId = await GetUserIdByEmailAsync(userEmail)
            ?? throw new Exception("User created but ID not found");

        _logger.LogInformation("Keycloak user created. Id={Id}", keycloakId);
        return keycloakId;
    }

    // ── SEND SET-PASSWORD EMAIL ──────────────────────────────────────────────
    // Calls Keycloak PUT /users/{id}/execute-actions-email with ["UPDATE_PASSWORD"].
    // Keycloak emails the new user a secure link to set their own password.
    // ── SEND SET-PASSWORD EMAIL ──────────────────────────────────────────────────
// Calls Keycloak PUT /users/{id}/execute-actions-email with ["UPDATE_PASSWORD"].
// Keycloak uses the configured SMTP (eepz50532@gmail.com) to send the secure link.
// Gmail free limit: ~500 emails/day. If exceeded, logs a clear QUOTA error.
public async Task SendSetPasswordEmailAsync(string keycloakUserId)
{
    await EnsureAdminTokenAsync();

    var url     = $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}/execute-actions-email?lifespan=86400";
    var actions = new[] { "UPDATE_PASSWORD" };

    var req = BuildRequest(HttpMethod.Put, url, actions);
    var res = await _http.SendAsync(req);

    if (res.IsSuccessStatusCode)
    {
        _logger.LogInformation(
            "✅ Set-password email sent via Keycloak SMTP (eepz50532@gmail.com). KeycloakId={Id}",
            keycloakUserId);
        return;
    }

    var statusCode = (int)res.StatusCode;
    var err        = await res.Content.ReadAsStringAsync();

    // ── Detect Gmail daily send limit (500/day for free accounts) ──────────
    // Keycloak returns 500 with "Failed to send" when SMTP rejects the message.
    // Gmail quota error contains "Daily user sending quota exceeded" or "550-5.4.5".
    bool isQuotaError =
        err.Contains("Daily user sending quota exceeded", StringComparison.OrdinalIgnoreCase) ||
        err.Contains("550-5.4.5",  StringComparison.OrdinalIgnoreCase) ||
        err.Contains("550 5.4.5",  StringComparison.OrdinalIgnoreCase) ||
        err.Contains("quota",      StringComparison.OrdinalIgnoreCase) ||
        err.Contains("rate limit", StringComparison.OrdinalIgnoreCase);

    if (isQuotaError)
    {
        // ⚠️ This is a Gmail quota issue — NOT a code bug.
        // Gmail free accounts allow ~500 emails/day.
        // Fix: wait 24h, or upgrade to Google Workspace (2000/day),
        // or switch to SendGrid/AWS SES for higher volume.
        _logger.LogCritical(
            "🚨 GMAIL QUOTA EXCEEDED — NOT A CODE ERROR. " +
            "The SMTP account eepz50532@gmail.com has hit its daily sending limit (~500 emails/day). " +
            "User {Id} did NOT receive the set-password email. " +
            "Resolution: wait 24h for quota reset OR switch to a higher-volume SMTP provider. " +
            "Raw Keycloak error: {Error}",
            keycloakUserId, err);

        throw new InvalidOperationException(
            "Email quota exceeded on SMTP account eepz50532@gmail.com. " +
            "This is a Gmail daily limit issue, not a code error. See logs for details.");
    }

    // ── All other SMTP/Keycloak failures ────────────────────────────────────
    _logger.LogError(
        "❌ SendSetPasswordEmail failed. KeycloakId={Id} HttpStatus={Status} Error={Error}. " +
        "Check Keycloak SMTP config at Realm Settings → Email. " +
        "SMTP account: eepz50532@gmail.com / smtp.gmail.com:587",
        keycloakUserId, statusCode, err);

    throw new InvalidOperationException(
        $"Failed to send set-password email via Keycloak. " +
        $"HttpStatus={statusCode}. Check SMTP configuration. Raw error: {err}");
}


    // ── UPDATE USER PROFILE ──────────────────────────────────────────────────
    // Explicitly patches email + firstName + lastName on Keycloak user record.
    // Required because Keycloak silently ignores these fields on create in some versions.
    public async Task UpdateUserProfileAsync(
        string keycloakUserId,
        string email,
        string firstName,
        string lastName)
    {
        await EnsureAdminTokenAsync();

        var payload = new
        {
            email     = email,
            firstName = firstName,
            lastName  = lastName
        };

        var req = BuildRequest(HttpMethod.Put,
            $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}",
            payload);

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

    // ── SET ATTRIBUTES ───────────────────────────────────────────────────────
    public async Task SetUserAttributesAsync(
        string keycloakUserId,
        Dictionary<string, string> attributes)
    {
        await EnsureAdminTokenAsync();

        var getReq = BuildRequest(HttpMethod.Get,
            $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}");

        var getRes = await _http.SendAsync(getReq);
        var json   = await getRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

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

        var payload = new { attributes = merged };
        var putReq  = BuildRequest(HttpMethod.Put,
            $"{_baseUrl}/admin/realms/{_realm}/users/{keycloakUserId}", payload);

        await _http.SendAsync(putReq);
    }

    // ── ASSIGN ROLE ──────────────────────────────────────────────────────────
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
            throw new Exception("Role assign failed");
    }

    // ── RESET PASSWORD BY EMAIL ──────────────────────────────────────────────
    public async Task ResetPasswordAsync(string email, string newPassword, bool temporary = false)
    {
        await EnsureAdminTokenAsync();

        var userId = await GetUserIdByEmailAsync(email);
        if (userId == null)
            throw new Exception($"User not found: {email}");

        await ResetPasswordByIdAsync(userId, newPassword, temporary);
    }

    // ── RESET PASSWORD BY UUID ───────────────────────────────────────────────
    public async Task ResetPasswordByIdAsync(
        string keycloakUserId,
        string newPassword,
        bool temporary = false)
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
    // ✅ Tries username first (handles blank email field), then email field fallback
    public async Task<string?> GetUserIdByEmailAsync(string email)
    {
        await EnsureAdminTokenAsync();

        var req = BuildRequest(HttpMethod.Get,
            $"{_baseUrl}/admin/realms/{_realm}/users?username={Uri.EscapeDataString(email)}&exact=true");

        var res  = await _http.SendAsync(req);
        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        if (doc.RootElement.GetArrayLength() > 0)
            return doc.RootElement[0].GetProperty("id").GetString();

        var req2 = BuildRequest(HttpMethod.Get,
            $"{_baseUrl}/admin/realms/{_realm}/users?email={Uri.EscapeDataString(email)}&exact=true");

        var res2  = await _http.SendAsync(req2);
        var json2 = await res2.Content.ReadAsStringAsync();
        using var doc2 = JsonDocument.Parse(json2);

        return doc2.RootElement.GetArrayLength() == 0
            ? null
            : doc2.RootElement[0].GetProperty("id").GetString();
    }

    // ── USER EXISTS ──────────────────────────────────────────────────────────
    public async Task<bool> UserExistsAsync(string email)
        => await GetUserIdByEmailAsync(email) != null;

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

    // ── HELPER ───────────────────────────────────────────────────────────────
    private HttpRequestMessage BuildRequest(HttpMethod method, string url, object? body = null)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _adminToken);

        if (body != null)
            request.Content = new StringContent(
                JsonSerializer.Serialize(body),
                Encoding.UTF8,
                "application/json");

        return request;
    }
}

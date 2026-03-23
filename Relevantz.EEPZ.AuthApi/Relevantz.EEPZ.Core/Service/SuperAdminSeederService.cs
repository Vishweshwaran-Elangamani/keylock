using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Core.Service;

public class SuperAdminSeederService : ISuperAdminSeederService
{
    private readonly EEPZDbContext                    _db;
    private readonly IKeycloakAdminService            _keycloak;
    private readonly IConfiguration                   _configuration;
    private readonly ILogger<SuperAdminSeederService> _logger;

    private string SuperAdminEmail     => _configuration["AdminSeedData:Email"]             ?? "emailservice@eepz.com";
    private string SuperAdminPassword  => _configuration["AdminSeedData:Password"]          ?? "rZ26012025Rix";
    private string SuperAdminFirstName => _configuration["AdminSeedData:FirstName"]         ?? "Super";
    private string SuperAdminLastName  => _configuration["AdminSeedData:LastName"]          ?? "Administrator";
    private string SuperAdminCompanyId => _configuration["AdminSeedData:EmployeeCompanyId"] ?? "1000";
    private string SuperAdminMobile    => _configuration["AdminSeedData:MobileNumber"]      ?? "9894076107";
    private const  string SuperAdminRole = "SuperAdmin";

    public SuperAdminSeederService(
        EEPZDbContext                      db,
        IKeycloakAdminService              keycloak,
        IConfiguration                     configuration,
        ILogger<SuperAdminSeederService>   logger)
    {
        _db            = db;
        _keycloak      = keycloak;
        _configuration = configuration;
        _logger        = logger;
    }

    public async Task SeedAsync()
    {
        // ── GUARD 1: already fully seeded ────────────────────────────────
        var existingAuth = await _db.Userauthentications
            .AsNoTracking()
            .FirstOrDefaultAsync(ua => ua.Email == SuperAdminEmail);

        if (existingAuth != null)
        {
            _logger.LogInformation("SuperAdmin already seeded. Skipping.");
            return;
        }

        // ── GUARD 2: orphaned employee from a previous partial run ────────
        var orphanedEmployee = await _db.Employees
            .FirstOrDefaultAsync(e => e.EmployeeCompanyId == SuperAdminCompanyId);

        if (orphanedEmployee != null)
        {
            _logger.LogWarning("Orphaned employee found. Cleaning up before re-seeding.");

            var orphanProfile = await _db.Userprofiles
                .FirstOrDefaultAsync(p => p.EmployeeId == orphanedEmployee.EmployeeId);
            if (orphanProfile != null)
                _db.Userprofiles.Remove(orphanProfile);

            var orphanDetails = await _db.Employeedetailsmasters
                .FirstOrDefaultAsync(d => d.EmployeeId == orphanedEmployee.EmployeeId);
            if (orphanDetails != null)
                _db.Employeedetailsmasters.Remove(orphanDetails);

            _db.Employees.Remove(orphanedEmployee);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Orphaned records cleaned.");
        }

        _logger.LogInformation("Seeding SuperAdmin. Email={Email}", SuperAdminEmail);

        // ── STEP 1: Ensure Role exists ────────────────────────────────────
        var role = await _db.Roles
            .FirstOrDefaultAsync(r => r.RoleName == SuperAdminRole);

        if (role == null)
        {
            role = new Role
            {
                RoleName     = SuperAdminRole,
                RoleCode     = "SUPERADMIN",
                Description  = "Full system access",
                IsSystemRole = true,
                CreatedAt    = DateTime.UtcNow
            };
            _db.Roles.Add(role);
            await _db.SaveChangesAsync();
        }

        // ── STEP 2: Ensure Department exists ─────────────────────────────
        var department = await _db.Departments
            .FirstOrDefaultAsync(d => d.DepartmentCode == "SUPERADMIN");

        if (department == null)
        {
            department = new Department
            {
                DepartmentName = "Super Administration",
                DepartmentCode = "SUPERADMIN",
                Description    = "Super Admin department",
                Status         = "Active",
                CreatedAt      = DateTime.UtcNow
            };
            _db.Departments.Add(department);
            await _db.SaveChangesAsync();
        }

        // ── STEP 3: Create user in Keycloak ───────────────────────────────
        string keycloakUserId;
        try
        {
            keycloakUserId = await _keycloak.CreateUserAsync(
                SuperAdminEmail,
                SuperAdminFirstName,
                SuperAdminLastName,
                SuperAdminPassword,
                SuperAdminRole);

            _logger.LogInformation("Keycloak user created. Id={Id}", keycloakUserId);
        }
        catch (Exception ex) when (ex.Message.Contains("already exists"))
        {
            _logger.LogWarning("Keycloak user already exists. Continuing with DB seed.");
            keycloakUserId = "pending-keycloak-sync";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create Keycloak user.");
            throw;
        }

        // ── STEP 4: Employee ──────────────────────────────────────────────
        // ✅ Only properties confirmed in Employee.cs
        var employee = new Employee
        {
            EmployeeCompanyId = SuperAdminCompanyId,
            EmploymentType    = "Permanent",
            EmploymentStatus  = "Active",
            EmployeeType      = "FullTime",
            JoiningDate       = DateOnly.FromDateTime(DateTime.UtcNow),
            WorkLocation      = "Head Office",
            IsActive          = true,
            CreatedAt         = DateTime.UtcNow,
            CreatedByUserId   = 1,
            KeycloakUserId    = keycloakUserId
        };
        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Employee created. EmployeeId={Id}", employee.EmployeeId);

        // ── STEP 5: Userprofile ───────────────────────────────────────────
        // ✅ Only properties confirmed in Userprofile.cs — NO CreatedAt
        var profile = new Userprofile
        {
            EmployeeId   = employee.EmployeeId,
            FirstName    = SuperAdminFirstName,
            LastName     = SuperAdminLastName,
            MobileNumber = SuperAdminMobile,
            Gender       = "PreferNotToSay"
        };
        _db.Userprofiles.Add(profile);
        await _db.SaveChangesAsync();

        // ── STEP 6: Userauthentication ────────────────────────────────────
        // ✅ Only properties confirmed in Userauthentication.cs
        var userAuth = new Userauthentication
        {
            EmployeeId   = employee.EmployeeId,
            Email        = SuperAdminEmail,
            PasswordHash = PasswordHelper.HashPassword(SuperAdminPassword),
            Status       = "Active",
            IsFirstLogin = false,
            CreatedAt    = DateTime.UtcNow
        };
        _db.Userauthentications.Add(userAuth);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Userauthentication created. UserId={Id}", userAuth.UserId);

        // ── STEP 7: Employeedetailsmaster ─────────────────────────────────
        // ✅ Only properties confirmed in Employeedetailsmaster.cs
        var details = new Employeedetailsmaster
        {
            EmployeeId   = employee.EmployeeId,
            RoleId       = role.RoleId,
            DepartmentId = department.DepartmentId
        };
        _db.Employeedetailsmasters.Add(details);
        await _db.SaveChangesAsync();

        // ── STEP 8: Push attributes to Keycloak ───────────────────────────
        try
        {
            await SetKeycloakAttributesAsync(
                keycloakUserId,
                employee.EmployeeId,
                details.EmployeeMasterId);

            await _keycloak.ResetPasswordAsync(
                SuperAdminEmail,
                SuperAdminPassword,
                temporary: false);

            _logger.LogInformation(
                "Keycloak attributes set. empId={EmpId}, empMasterId={MasterId}",
                employee.EmployeeId, details.EmployeeMasterId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not set Keycloak attributes.");
        }

        _logger.LogInformation(
            "✅ SuperAdmin seeded. Email={Email}, EmployeeId={EmpId}, UserId={UserId}",
            SuperAdminEmail, employee.EmployeeId, userAuth.UserId);
    }

    private async Task SetKeycloakAttributesAsync(
        string keycloakUserId,
        int    empId,
        int    empMasterId)
    {
        if (keycloakUserId == "pending-keycloak-sync")
            return;

        var baseUrl  = _configuration["Keycloak:BaseUrl"]!;
        var realm    = _configuration["Keycloak:Realm"]!;
        var adminId  = _configuration["Keycloak:AdminClientId"]!;
        var adminSec = _configuration["Keycloak:AdminClientSecret"]!;

        using var http = new System.Net.Http.HttpClient();

        var tokenResp = await http.PostAsync(
            $"{baseUrl}/realms/{realm}/protocol/openid-connect/token",
            new System.Net.Http.FormUrlEncodedContent(
                new Dictionary<string, string>
                {
                    ["grant_type"]    = "client_credentials",
                    ["client_id"]     = adminId,
                    ["client_secret"] = adminSec
                }));

        tokenResp.EnsureSuccessStatusCode();

        var tokenJson = System.Text.Json.JsonDocument.Parse(
            await tokenResp.Content.ReadAsStringAsync());
        var token = tokenJson.RootElement
            .GetProperty("access_token").GetString()!;

        var payload = System.Text.Json.JsonSerializer.Serialize(new
        {
            attributes = new Dictionary<string, string[]>
            {
                ["empId"]       = new[] { empId.ToString() },
                ["empMasterId"] = new[] { empMasterId.ToString() }
            }
        });

        var req = new System.Net.Http.HttpRequestMessage(
            System.Net.Http.HttpMethod.Put,
            $"{baseUrl}/admin/realms/{realm}/users/{keycloakUserId}")
        {
            Content = new System.Net.Http.StringContent(
                payload,
                System.Text.Encoding.UTF8,
                "application/json")
        };
        req.Headers.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        (await http.SendAsync(req)).EnsureSuccessStatusCode();
    }
}

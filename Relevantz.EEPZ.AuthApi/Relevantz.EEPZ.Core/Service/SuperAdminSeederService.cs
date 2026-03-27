// FIXED: All seeding scenarios handled correctly

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
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
    private string SuperAdminPassword  => _configuration["AdminSeedData:Password"]          ?? "KeyAdmin@123456";
    private string SuperAdminFirstName => _configuration["AdminSeedData:FirstName"]         ?? "Super";
    private string SuperAdminLastName  => _configuration["AdminSeedData:LastName"]          ?? "Administrator";
    private string SuperAdminCompanyId => _configuration["AdminSeedData:EmployeeCompanyId"] ?? "1000";
    private string SuperAdminMobile    => _configuration["AdminSeedData:MobileNumber"]      ?? "9894076107";

    private const string SuperAdminRole = "SuperAdmin";

    public SuperAdminSeederService(
        EEPZDbContext                    db,
        IKeycloakAdminService            keycloak,
        IConfiguration                   configuration,
        ILogger<SuperAdminSeederService> logger)
    {
        _db            = db;
        _keycloak      = keycloak;
        _configuration = configuration;
        _logger        = logger;
    }

    public async Task SeedAsync()
    {
        var existingAuth = await _db.Userauthentications
            .AsNoTracking()
            .Include(ua => ua.Employee)
            .FirstOrDefaultAsync(ua => ua.Email == SuperAdminEmail);

        if (existingAuth != null)
        {
            string? keycloakUserId = null;
            try { keycloakUserId = await _keycloak.GetUserIdByEmailAsync(SuperAdminEmail); }
            catch { /* Keycloak unreachable — skip re-sync */ }

            // ✅ CASE 1: Both DB + Keycloak exist → skip fully
            if (!string.IsNullOrEmpty(keycloakUserId))
            {
                _logger.LogInformation("✅ SuperAdmin already seeded. Skipping.");
                return;
            }

            // ✅ CASE 2: DB exists but Keycloak wiped → recreate in Keycloak only
            _logger.LogWarning("⚠️ DB exists but Keycloak missing. Recreating Keycloak user...");

            var employee = await _db.Employees
                .FirstAsync(e => e.EmployeeId == existingAuth.EmployeeId);

            var details = await _db.Employeedetailsmasters
                .FirstAsync(d => d.EmployeeId == employee.EmployeeId);

            // ✅ CreateUserAsync already sends firstName+lastName+email+username in payload
            string newKeycloakId;
            try
            {
                newKeycloakId = await _keycloak.CreateUserAsync(
                    SuperAdminEmail, SuperAdminFirstName, SuperAdminLastName, SuperAdminRole);
            }
            catch (Exception ex) when (ex.Message.Contains("already exists"))
            {
                newKeycloakId = await _keycloak.GetUserIdByEmailAsync(SuperAdminEmail)
                    ?? throw new Exception("Keycloak user exists but UUID not found.");
            }

            // Wait for Keycloak to fully persist the user
            await Task.Delay(1000);

            try { await _keycloak.AssignRoleAsync(newKeycloakId, SuperAdminRole); }
            catch (Exception ex) { _logger.LogWarning("Role assign: {Msg}", ex.Message); }

            // ✅ SetUserAttributesAsync only — NO UpdateUserProfileAsync here
            // CreateUserAsync already set all profile fields correctly on creation
            await _keycloak.SetUserAttributesAsync(newKeycloakId, new Dictionary<string, string>
            {
                ["empId"]       = employee.EmployeeId.ToString(),
                ["empMasterId"] = details.EmployeeMasterId.ToString(),
                ["role"]        = SuperAdminRole
            });

            // SuperAdmin gets direct password — NOT email link
            await _keycloak.ResetPasswordByIdAsync(newKeycloakId, SuperAdminPassword, temporary: false);

            // ✅ Update MySQL with new Keycloak UUID
            var trackedEmployee = await _db.Employees
                .FirstAsync(e => e.EmployeeId == existingAuth.EmployeeId);
            trackedEmployee.KeycloakUserId = newKeycloakId;
            trackedEmployee.UpdatedAt      = DateTime.UtcNow;
            _db.Employees.Update(trackedEmployee);
            await _db.SaveChangesAsync();

            _logger.LogInformation("✅ Keycloak user recreated & synced. NewId={Id}", newKeycloakId);
            return;
        }

        // ── GUARD 2: Orphaned employee ──────────────────────────────────────
        var orphanedEmployee = await _db.Employees
            .FirstOrDefaultAsync(e => e.EmployeeCompanyId == SuperAdminCompanyId);

        if (orphanedEmployee != null)
        {
            _logger.LogWarning("Orphaned employee found EmployeeId={Id}.", orphanedEmployee.EmployeeId);
            await CompleteSeedForExistingEmployeeAsync(orphanedEmployee);
            return;
        }

        // ── FRESH SEED ──────────────────────────────────────────────────────
        _logger.LogInformation("Seeding SuperAdmin. Email={Email}", SuperAdminEmail);

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == SuperAdminRole);
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

        var department = await _db.Departments.FirstOrDefaultAsync(d => d.DepartmentCode == "SUPERADMIN");
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

        // ✅ CreateUserAsync sends all fields — firstName, lastName, email, username
        string keycloakId;
        try
        {
            keycloakId = await _keycloak.CreateUserAsync(
                SuperAdminEmail, SuperAdminFirstName, SuperAdminLastName, SuperAdminRole);
            _logger.LogInformation("Keycloak user created. Id={Id}", keycloakId);
        }
        catch (Exception ex) when (ex.Message.Contains("already exists"))
        {
            _logger.LogWarning("Keycloak user already exists. Fetching UUID...");
            keycloakId = await _keycloak.GetUserIdByEmailAsync(SuperAdminEmail)
                ?? throw new Exception($"Keycloak user exists but UUID not found for {SuperAdminEmail}");
        }

        // Wait for Keycloak to fully persist the user
        await Task.Delay(1000);

        try { await _keycloak.AssignRoleAsync(keycloakId, SuperAdminRole); }
        catch (Exception ex) { _logger.LogWarning(ex, "Role assign failed."); }

        var employeeNew = new Employee
        {
            EmployeeCompanyId = SuperAdminCompanyId,
            KeycloakUserId    = keycloakId,
            EmploymentType    = "Permanent",
            EmploymentStatus  = "Active",
            EmployeeType      = "FullTime",
            JoiningDate       = DateOnly.FromDateTime(DateTime.UtcNow),
            ConfirmationDate  = DateOnly.FromDateTime(DateTime.UtcNow),
            WorkLocation      = "Head Office",
            NoticePeriodDays  = 0,
            IsActive          = true,
            CreatedAt         = DateTime.UtcNow,
            CreatedByUserId   = 1
        };
        _db.Employees.Add(employeeNew);
        await _db.SaveChangesAsync();

        _db.Userprofiles.Add(new Userprofile
        {
            EmployeeId   = employeeNew.EmployeeId,
            FirstName    = SuperAdminFirstName,
            LastName     = SuperAdminLastName,
            MobileNumber = SuperAdminMobile,
            Gender       = "PreferNotToSay"
        });
        await _db.SaveChangesAsync();

        var userAuth = new Userauthentication
        {
            EmployeeId   = employeeNew.EmployeeId,
            Email        = SuperAdminEmail,
            PasswordHash = PasswordHelper.HashPassword(SuperAdminPassword),
            Status       = "Active",
            IsFirstLogin = false,
            CreatedAt    = DateTime.UtcNow
        };
        _db.Userauthentications.Add(userAuth);
        await _db.SaveChangesAsync();

        var detailsNew = new Employeedetailsmaster
        {
            EmployeeId   = employeeNew.EmployeeId,
            RoleId       = role.RoleId,
            DepartmentId = department.DepartmentId
        };
        _db.Employeedetailsmasters.Add(detailsNew);
        await _db.SaveChangesAsync();

        try
        {
            // ✅ Only attributes + password — NO UpdateUserProfileAsync
            // CreateUserAsync already set all profile fields correctly
            await _keycloak.SetUserAttributesAsync(keycloakId, new Dictionary<string, string>
            {
                ["empId"]       = employeeNew.EmployeeId.ToString(),
                ["empMasterId"] = detailsNew.EmployeeMasterId.ToString(),
                ["role"]        = SuperAdminRole
            });
            await _keycloak.ResetPasswordByIdAsync(keycloakId, SuperAdminPassword, temporary: false);
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Keycloak post-create sync failed. Non-fatal."); }

        _logger.LogInformation("✅ SuperAdmin seeded. Email={Email} EmployeeId={EmpId}",
            SuperAdminEmail, employeeNew.EmployeeId);
    }

    // ── HELPER: Fix orphaned employee from failed partial seed ────────────────
    private async Task CompleteSeedForExistingEmployeeAsync(Employee employee)
    {
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == SuperAdminRole)
            ?? throw new Exception("SuperAdmin role missing.");

        var department = await _db.Departments.FirstOrDefaultAsync(d => d.DepartmentCode == "SUPERADMIN")
            ?? throw new Exception("SuperAdmin department missing.");

        var existingProfile = await _db.Userprofiles
            .FirstOrDefaultAsync(p => p.EmployeeId == employee.EmployeeId);

        if (existingProfile == null)
        {
            _db.Userprofiles.Add(new Userprofile
            {
                EmployeeId   = employee.EmployeeId,
                FirstName    = SuperAdminFirstName,
                LastName     = SuperAdminLastName,
                MobileNumber = SuperAdminMobile,
                Gender       = "PreferNotToSay"
            });
            await _db.SaveChangesAsync();
        }

        var existingAuth = await _db.Userauthentications
            .FirstOrDefaultAsync(ua => ua.Email == SuperAdminEmail);

        if (existingAuth == null)
        {
            _db.Userauthentications.Add(new Userauthentication
            {
                EmployeeId   = employee.EmployeeId,
                Email        = SuperAdminEmail,
                PasswordHash = PasswordHelper.HashPassword(SuperAdminPassword),
                Status       = "Active",
                IsFirstLogin = false,
                CreatedAt    = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        var existingDetails = await _db.Employeedetailsmasters
            .FirstOrDefaultAsync(d => d.EmployeeId == employee.EmployeeId);

        if (existingDetails == null)
        {
            existingDetails = new Employeedetailsmaster
            {
                EmployeeId   = employee.EmployeeId,
                RoleId       = role.RoleId,
                DepartmentId = department.DepartmentId
            };
            _db.Employeedetailsmasters.Add(existingDetails);
            await _db.SaveChangesAsync();
        }

        if (!string.IsNullOrEmpty(employee.KeycloakUserId))
        {
            try
            {
                await _keycloak.SetUserAttributesAsync(employee.KeycloakUserId,
                    new Dictionary<string, string>
                    {
                        ["empId"]       = employee.EmployeeId.ToString(),
                        ["empMasterId"] = existingDetails.EmployeeMasterId.ToString(),
                        ["role"]        = SuperAdminRole
                    });
                await _keycloak.ResetPasswordByIdAsync(employee.KeycloakUserId, SuperAdminPassword, temporary: false);
                await _keycloak.EnableUserAsync(employee.KeycloakUserId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "CompleteSeed: Keycloak sync failed. Non-fatal.");
            }
        }

        _logger.LogInformation("✅ Partial seed completed for EmployeeId={Id}", employee.EmployeeId);
    }
}

// FIXED: Added missing EF Core usings — AsNoTracking / FirstOrDefaultAsync / SaveChangesAsync

using Microsoft.EntityFrameworkCore;                  // ✅ required for AsNoTracking, FirstOrDefaultAsync, SaveChangesAsync
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
    private string SuperAdminPassword  => _configuration["AdminSeedData:Password"]          ?? "rZ26012025Rix";
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
        // ── GUARD 1: Already seeded ───────────────────────────────────────────
        var existingAuth = await _db.Userauthentications
            .AsNoTracking()                             // ✅ works now — EF Core using present
            .FirstOrDefaultAsync(ua => ua.Email == SuperAdminEmail);

        if (existingAuth != null)
        {
            _logger.LogInformation("SuperAdmin already seeded. Skipping.");
            return;
        }

        // ── GUARD 2: Orphaned employee ────────────────────────────────────────
        var orphanedEmployee = await _db.Employees
            .FirstOrDefaultAsync(e => e.EmployeeCompanyId == SuperAdminCompanyId);

        if (orphanedEmployee != null)
        {
            _logger.LogWarning("Orphaned employee found EmployeeId={Id}. Completing partial seed...",
                orphanedEmployee.EmployeeId);
            await CompleteSeedForExistingEmployeeAsync(orphanedEmployee);
            return;
        }

        _logger.LogInformation("Seeding SuperAdmin. Email={Email}", SuperAdminEmail);

        // ── STEP 1: Ensure Role exists ────────────────────────────────────────
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

        // ── STEP 2: Ensure Department exists ──────────────────────────────────
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

        // ── STEP 3: Create user in Keycloak ───────────────────────────────────
        string keycloakUserId;
        try
        {
            // ✅ 4 args — no temporaryPassword
            keycloakUserId = await _keycloak.CreateUserAsync(
                SuperAdminEmail,
                SuperAdminFirstName,
                SuperAdminLastName,
                SuperAdminRole);

            _logger.LogInformation("Keycloak user created. Id={Id}", keycloakUserId);
        }
        catch (Exception ex) when (ex.Message.Contains("already exists"))
        {
            _logger.LogWarning("Keycloak user already exists. Fetching UUID...");
            var existingId = await _keycloak.GetUserIdByEmailAsync(SuperAdminEmail);
            if (string.IsNullOrEmpty(existingId))
                throw new Exception($"Keycloak user exists but UUID not found for {SuperAdminEmail}");
            keycloakUserId = existingId;
        }

        // ── STEP 4: Assign Keycloak role ──────────────────────────────────────
        try { await _keycloak.AssignRoleAsync(keycloakUserId, SuperAdminRole); }
        catch (Exception ex) { _logger.LogWarning(ex, "Could not assign Keycloak role — may already be assigned."); }

        // ── STEP 5: Create Employee row ───────────────────────────────────────
        var employee = new Employee
        {
            EmployeeCompanyId = SuperAdminCompanyId,
            KeycloakUserId    = keycloakUserId,
            EmploymentType    = "Permanent",
            EmploymentStatus  = "Active",
            EmployeeType      = "FullTime",
            JoiningDate       = DateOnly.FromDateTime(DateTime.UtcNow),
            ConfirmationDate  = DateOnly.FromDateTime(DateTime.UtcNow),  // ✅ DateOnly — not DateTime
            WorkLocation      = "Head Office",
            NoticePeriodDays  = 0,
            IsActive          = true,
            CreatedAt         = DateTime.UtcNow,
            CreatedByUserId   = 1
        };
        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();

        // ── STEP 6: Create UserProfile ────────────────────────────────────────
        _db.Userprofiles.Add(new Userprofile
        {
            EmployeeId   = employee.EmployeeId,
            FirstName    = SuperAdminFirstName,
            LastName     = SuperAdminLastName,
            MobileNumber = SuperAdminMobile,
            Gender       = "PreferNotToSay"
        });
        await _db.SaveChangesAsync();

        // ── STEP 7: Create UserAuthentication ────────────────────────────────
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

        // ── STEP 8: Create EmployeeDetailsMaster ─────────────────────────────
        var details = new Employeedetailsmaster
        {
            EmployeeId   = employee.EmployeeId,
            RoleId       = role.RoleId,
            DepartmentId = department.DepartmentId
        };
        _db.Employeedetailsmasters.Add(details);
        await _db.SaveChangesAsync();

        // ── STEP 9: Push Keycloak attributes + set password directly ─────────
        try
        {
            await _keycloak.SetUserAttributesAsync(keycloakUserId, new Dictionary<string, string>
            {
                ["empId"]       = employee.EmployeeId.ToString(),
                ["empMasterId"] = details.EmployeeMasterId.ToString(),
                ["role"]        = SuperAdminRole
            });

            await _keycloak.UpdateUserProfileAsync(
                keycloakUserId, SuperAdminEmail, SuperAdminFirstName, SuperAdminLastName);

            // SuperAdmin gets password set directly — not via email link
            await _keycloak.ResetPasswordByIdAsync(keycloakUserId, SuperAdminPassword, temporary: false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Keycloak post-create sync failed. Non-fatal.");
        }

        _logger.LogInformation(
            "✅ SuperAdmin seeded. Email={Email} EmployeeId={EmpId} UserId={UserId}",
            SuperAdminEmail, employee.EmployeeId, userAuth.UserId);
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

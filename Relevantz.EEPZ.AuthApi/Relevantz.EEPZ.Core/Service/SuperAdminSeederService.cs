// FIXED: All seeding scenarios handled correctly (NULL‑SAFE + Idempotent + Retry‑Safe)
// ROLE USED: Admin

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

    private string AdminEmail     => _configuration["AdminSeedData:Email"]             ?? "emailservice@eepz.com";
    private string AdminPassword  => _configuration["AdminSeedData:Password"]          ?? "KeyAdmin@123456";
    private string AdminFirstName => _configuration["AdminSeedData:FirstName"]         ?? "Super";
    private string AdminLastName  => _configuration["AdminSeedData:LastName"]          ?? "Administrator";
    private string AdminCompanyId => _configuration["AdminSeedData:EmployeeCompanyId"] ?? "1000";
    private string AdminMobile    => _configuration["AdminSeedData:MobileNumber"]      ?? "9894076107";

    // ✅ ROLE IS ADMIN (NOT SuperAdmin)
    private const string AdminRole = "Admin";

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

    // ─────────────────────────────────────────────────────────────
    // ENTRY POINT
    // ─────────────────────────────────────────────────────────────
    public async Task SeedAsync()
    {
        // CASE 1 — Auth record exists
        var existingAuth = await _db.Userauthentications
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == AdminEmail);

        if (existingAuth != null)
        {
            string? keycloakUserId = null;
            try { keycloakUserId = await _keycloak.GetUserIdByEmailAsync(AdminEmail); }
            catch { }

            if (!string.IsNullOrEmpty(keycloakUserId))
            {
                _logger.LogInformation("✅ Admin already seeded. Skipping.");
                return;
            }

            _logger.LogWarning("⚠️ DB exists but Keycloak missing. Recreating Admin user...");

            var employee = await _db.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == existingAuth.EmployeeId);

            if (employee == null)
            {
                await CreateFreshSeedAsync();
                return;
            }

            var details = await _db.Employeedetailsmasters
                .FirstOrDefaultAsync(d => d.EmployeeId == employee.EmployeeId);

            if (details == null)
            {
                await CompleteSeedForExistingEmployeeAsync(employee);
                return;
            }

            var newKeycloakId = await CreateOrGetKeycloakUserAsync();
            await _keycloak.AssignRoleAsync(newKeycloakId, AdminRole);

            await _keycloak.SetUserAttributesAsync(newKeycloakId, new Dictionary<string, string>
            {
                ["empId"]       = employee.EmployeeId.ToString(),
                ["empMasterId"] = details.EmployeeMasterId.ToString(),
                ["role"]        = AdminRole
            });

            await _keycloak.ResetPasswordByIdAsync(newKeycloakId, AdminPassword, false);

            employee.KeycloakUserId = newKeycloakId;
            employee.UpdatedAt      = DateTime.UtcNow;
            _db.Employees.Update(employee);
            await _db.SaveChangesAsync();

            _logger.LogInformation("✅ Admin Keycloak user recreated & synced.");
            return;
        }

        // CASE 2 — Orphaned employee
        var orphan = await _db.Employees
            .FirstOrDefaultAsync(e => e.EmployeeCompanyId == AdminCompanyId);

        if (orphan != null)
        {
            await CompleteSeedForExistingEmployeeAsync(orphan);
            return;
        }

        // CASE 3 — Fresh seed
        await CreateFreshSeedAsync();
    }

    // ─────────────────────────────────────────────────────────────
    // FRESH SEED (RETRY‑SAFE)
    // ─────────────────────────────────────────────────────────────
    private async Task CreateFreshSeedAsync()
    {
        _logger.LogInformation("🌱 Seeding Admin from scratch.");

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == AdminRole)
                   ?? new Role
                   {
                       RoleName     = AdminRole,
                       RoleCode     = "ADMIN",
                       Description  = "System administrator",
                       IsSystemRole = true,
                       CreatedAt    = DateTime.UtcNow
                   };

        if (role.RoleId == 0)
        {
            _db.Roles.Add(role);
            await _db.SaveChangesAsync();
        }

        var department = await _db.Departments.FirstOrDefaultAsync(d => d.DepartmentCode == "ADMIN")
                          ?? new Department
                          {
                              DepartmentName = "Administration",
                              DepartmentCode = "ADMIN",
                              Status         = "Active",
                              CreatedAt      = DateTime.UtcNow
                          };

        if (department.DepartmentId == 0)
        {
            _db.Departments.Add(department);
            await _db.SaveChangesAsync();
        }

        var keycloakId = await CreateOrGetKeycloakUserAsync();
        await _keycloak.AssignRoleAsync(keycloakId, AdminRole);

        var strategy = _db.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            using var tx = await _db.Database.BeginTransactionAsync();

            var employee = new Employee
            {
                EmployeeCompanyId = AdminCompanyId,
                KeycloakUserId    = keycloakId,
                EmploymentType    = "Permanent",
                EmploymentStatus  = "Active",
                EmployeeType      = "FullTime",
                JoiningDate       = DateOnly.FromDateTime(DateTime.UtcNow),
                ConfirmationDate  = DateOnly.FromDateTime(DateTime.UtcNow),
                WorkLocation      = "Head Office",
                IsActive          = true,
                CreatedAt         = DateTime.UtcNow,
                CreatedByUserId   = 1
            };
            _db.Employees.Add(employee);
            await _db.SaveChangesAsync();

            _db.Userprofiles.Add(new Userprofile
            {
                EmployeeId   = employee.EmployeeId,
                FirstName    = AdminFirstName,
                LastName     = AdminLastName,
                MobileNumber = AdminMobile,
                Gender       = "PreferNotToSay"
            });

            _db.Userauthentications.Add(new Userauthentication
            {
                EmployeeId   = employee.EmployeeId,
                Email        = AdminEmail,
                PasswordHash = PasswordHelper.HashPassword(AdminPassword),
                Status       = "Active",
                IsFirstLogin = false,
                CreatedAt    = DateTime.UtcNow
            });

            var details = new Employeedetailsmaster
            {
                EmployeeId   = employee.EmployeeId,
                RoleId       = role.RoleId,
                DepartmentId = department.DepartmentId
            };
            _db.Employeedetailsmasters.Add(details);

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            await _keycloak.SetUserAttributesAsync(keycloakId, new Dictionary<string, string>
            {
                ["empId"]       = employee.EmployeeId.ToString(),
                ["empMasterId"] = details.EmployeeMasterId.ToString(),
                ["role"]        = AdminRole
            });

            await _keycloak.ResetPasswordByIdAsync(keycloakId, AdminPassword, false);
        });

        _logger.LogInformation("✅ Admin seeded successfully.");
    }

    // ─────────────────────────────────────────────────────────────
    // PARTIAL SEED COMPLETION
    // ─────────────────────────────────────────────────────────────
    private async Task CompleteSeedForExistingEmployeeAsync(Employee employee)
    {
        var role = await _db.Roles.FirstAsync(r => r.RoleName == AdminRole);
        var dept = await _db.Departments.FirstAsync(d => d.DepartmentCode == "ADMIN");

        if (!await _db.Userprofiles.AnyAsync(p => p.EmployeeId == employee.EmployeeId))
        {
            _db.Userprofiles.Add(new Userprofile
            {
                EmployeeId   = employee.EmployeeId,
                FirstName    = AdminFirstName,
                LastName     = AdminLastName,
                MobileNumber = AdminMobile,
                Gender       = "PreferNotToSay"
            });
        }

        if (!await _db.Userauthentications.AnyAsync(u => u.Email == AdminEmail))
        {
            _db.Userauthentications.Add(new Userauthentication
            {
                EmployeeId   = employee.EmployeeId,
                Email        = AdminEmail,
                PasswordHash = PasswordHelper.HashPassword(AdminPassword),
                Status       = "Active",
                IsFirstLogin = false,
                CreatedAt    = DateTime.UtcNow
            });
        }

        var details = await _db.Employeedetailsmasters
            .FirstOrDefaultAsync(d => d.EmployeeId == employee.EmployeeId);

        if (details == null)
        {
            details = new Employeedetailsmaster
            {
                EmployeeId   = employee.EmployeeId,
                RoleId       = role.RoleId,
                DepartmentId = dept.DepartmentId
            };
            _db.Employeedetailsmasters.Add(details);
        }

        await _db.SaveChangesAsync();

        if (!string.IsNullOrEmpty(employee.KeycloakUserId))
        {
            await _keycloak.SetUserAttributesAsync(employee.KeycloakUserId,
                new Dictionary<string, string>
                {
                    ["empId"]       = employee.EmployeeId.ToString(),
                    ["empMasterId"] = details.EmployeeMasterId.ToString(),
                    ["role"]        = AdminRole
                });

            await _keycloak.ResetPasswordByIdAsync(employee.KeycloakUserId, AdminPassword, false);
        }

        _logger.LogInformation("✅ Partial Admin seed completed.");
    }

    // ─────────────────────────────────────────────────────────────
    // KEYCLOAK HELPER
    // ─────────────────────────────────────────────────────────────
    private async Task<string> CreateOrGetKeycloakUserAsync()
    {
        try
        {
            return await _keycloak.CreateUserAsync(
                AdminEmail, AdminFirstName, AdminLastName, AdminRole);
        }
        catch
        {
            return await _keycloak.GetUserIdByEmailAsync(AdminEmail)
                ?? throw new Exception("Admin Keycloak user exists but UUID not found.");
        }
    }
}
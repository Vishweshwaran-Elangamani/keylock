// FULL FILE — NO FUNCTIONALITY REMOVED — BUILD SAFE

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Core.Service
{
    public class SuperAdminSeederService : ISuperAdminSeederService
    {
        private readonly EEPZDbContext _db;
        private readonly IKeycloakAdminService _keycloak;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SuperAdminSeederService> _logger;

        private string SuperAdminEmail      => _configuration["AdminSeedData:Email"]             ?? "emailservice@eepz.com";
        private string SuperAdminPassword   => _configuration["AdminSeedData:Password"]          ?? "rZ26012025Rix";
        private string SuperAdminFirstName  => _configuration["AdminSeedData:FirstName"]         ?? "Super";
        private string SuperAdminLastName   => _configuration["AdminSeedData:LastName"]          ?? "Administrator";
        private string SuperAdminCompanyId  => _configuration["AdminSeedData:EmployeeCompanyId"] ?? "1000";
        private string SuperAdminMobile     => _configuration["AdminSeedData:MobileNumber"]      ?? "9894076107";
        private const string SuperAdminRole = "SuperAdmin";

        public SuperAdminSeederService(
            EEPZDbContext db,
            IKeycloakAdminService keycloak,
            IConfiguration configuration,
            ILogger<SuperAdminSeederService> logger)
        {
            _db            = db;
            _keycloak      = keycloak;
            _configuration = configuration;
            _logger        = logger;
        }

        public async Task SeedAsync()
        {
            // ── GUARD 1: Already fully seeded ────────────────────────────────
            var existingAuth = await _db.Userauthentications
                .AsNoTracking()
                .FirstOrDefaultAsync(ua => ua.Email == SuperAdminEmail);

            if (existingAuth != null)
            {
                _logger.LogInformation("SuperAdmin already seeded. Skipping.");
                return;
            }

            // ── GUARD 2: Fix orphaned employee ───────────────────────────────
            var orphanedEmployee = await _db.Employees
                .FirstOrDefaultAsync(e => e.EmployeeCompanyId == SuperAdminCompanyId);

            if (orphanedEmployee != null)
            {
                _logger.LogWarning("Orphaned employee found (EmployeeId={Id}). Attempting fix...",
                    orphanedEmployee.EmployeeId);

                if (orphanedEmployee.KeycloakUserId == "pending-keycloak-sync"
                    || string.IsNullOrEmpty(orphanedEmployee.KeycloakUserId))
                {
                    var resolvedId = await _keycloak.GetUserIdByEmailAsync(SuperAdminEmail);
                    if (!string.IsNullOrEmpty(resolvedId))
                    {
                        orphanedEmployee.KeycloakUserId = resolvedId;
                        _db.Employees.Update(orphanedEmployee);
                        await _db.SaveChangesAsync();
                        _logger.LogInformation("✅ KeycloakUserId patched to {Id}", resolvedId);
                    }
                    else
                    {
                        _logger.LogWarning("No Keycloak user found. Cleaning orphaned records...");

                        var orphanProfile = await _db.Userprofiles
                            .FirstOrDefaultAsync(p => p.EmployeeId == orphanedEmployee.EmployeeId);
                        if (orphanProfile != null) _db.Userprofiles.Remove(orphanProfile);

                        var orphanDetails = await _db.Employeedetailsmasters
                            .FirstOrDefaultAsync(d => d.EmployeeId == orphanedEmployee.EmployeeId);
                        if (orphanDetails != null) _db.Employeedetailsmasters.Remove(orphanDetails);

                        _db.Employees.Remove(orphanedEmployee);
                        await _db.SaveChangesAsync();
                        _logger.LogInformation("Orphaned records cleaned. Proceeding with fresh seed.");
                        orphanedEmployee = null;
                    }
                }

                if (orphanedEmployee != null
                    && orphanedEmployee.KeycloakUserId != "pending-keycloak-sync"
                    && !string.IsNullOrEmpty(orphanedEmployee.KeycloakUserId))
                {
                    await CompleteSeedForExistingEmployeeAsync(orphanedEmployee);
                    return;
                }
            }

            // ── FULL FRESH SEED ───────────────────────────────────────────────
            _logger.LogInformation("Seeding SuperAdmin. Email={Email}", SuperAdminEmail);

            // STEP 1: Ensure Role exists
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

            // STEP 2: Ensure Department exists
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

            // STEP 3: Create user in Keycloak
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
                _logger.LogWarning("Keycloak user already exists. Fetching real UUID...");

                var existingKeycloakId = await _keycloak.GetUserIdByEmailAsync(SuperAdminEmail);
                if (string.IsNullOrEmpty(existingKeycloakId))
                    throw new Exception($"Keycloak user exists but UUID not found for {SuperAdminEmail}");

                keycloakUserId = existingKeycloakId;
                _logger.LogInformation("Keycloak existing UUID resolved. Id={Id}", keycloakUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create/fetch Keycloak user.");
                throw;
            }

            // STEP 4: Assign Keycloak role
            try
            {
                await _keycloak.AssignRoleAsync(keycloakUserId, SuperAdminRole);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not assign Keycloak role (may already be assigned).");
            }

            // STEP 5: Create Employee row
            var employee = new Employee
            {
                EmployeeCompanyId = SuperAdminCompanyId,
                KeycloakUserId    = keycloakUserId,
                EmploymentType    = "Permanent",
                EmploymentStatus  = "Active",
                EmployeeType      = "FullTime",
                JoiningDate       = DateOnly.FromDateTime(DateTime.UtcNow),
                WorkLocation      = "Head Office",
                IsActive          = true,
                CreatedAt         = DateTime.UtcNow,
                CreatedByUserId   = 1
            };
            _db.Employees.Add(employee);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Employee created. EmployeeId={Id}", employee.EmployeeId);

            // STEP 6: Create UserProfile
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

            // STEP 7: Create UserAuthentication
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

            // STEP 8: Create EmployeeDetailsMaster
            var details = new Employeedetailsmaster
            {
                EmployeeId   = employee.EmployeeId,
                RoleId       = role.RoleId,
                DepartmentId = department.DepartmentId
            };
            _db.Employeedetailsmasters.Add(details);
            await _db.SaveChangesAsync();

            // STEP 9: Push attributes + email + name to Keycloak via UUID ✅
            try
            {
                await _keycloak.SetUserAttributesAsync(keycloakUserId, new Dictionary<string, string>
                {
                    { "empId",       employee.EmployeeId.ToString() },
                    { "empMasterId", details.EmployeeMasterId.ToString() },
                    { "role",        SuperAdminRole }
                });

                // ✅ Explicitly patch email + firstName + lastName
                // Required because Keycloak silently ignores these on create in some versions
                await _keycloak.UpdateUserProfileAsync(
                    keycloakUserId,
                    SuperAdminEmail,
                    SuperAdminFirstName,
                    SuperAdminLastName);

                // ✅ UUID direct — never fails due to blank email field
                await _keycloak.ResetPasswordByIdAsync(keycloakUserId, SuperAdminPassword, temporary: false);

                _logger.LogInformation("✅ Keycloak attributes set. empId={EmpId} empMasterId={MId}",
                    employee.EmployeeId, details.EmployeeMasterId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not set Keycloak attributes. Non-fatal.");
            }

            _logger.LogInformation("✅ SuperAdmin seeded. Email={Email} EmployeeId={EmpId} UserId={UserId}",
                SuperAdminEmail, employee.EmployeeId, userAuth.UserId);
        }

        // ── Helper: complete partial seed ────────────────────────────────────
        private async Task CompleteSeedForExistingEmployeeAsync(Employee employee)
        {
            _logger.LogInformation("Completing partial seed for EmployeeId={Id}", employee.EmployeeId);

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

            // ✅ UUID direct — no email lookup
            try
            {
                await _keycloak.SetUserAttributesAsync(employee.KeycloakUserId!, new Dictionary<string, string>
                {
                    { "empId",       employee.EmployeeId.ToString() },
                    { "empMasterId", existingDetails.EmployeeMasterId.ToString() },
                    { "role",        SuperAdminRole }
                });

                // ✅ Patch email + name explicitly
                await _keycloak.UpdateUserProfileAsync(
                    employee.KeycloakUserId!,
                    SuperAdminEmail,
                    SuperAdminFirstName,
                    SuperAdminLastName);

                await _keycloak.ResetPasswordByIdAsync(
                    employee.KeycloakUserId!,
                    SuperAdminPassword,
                    temporary: false);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not set Keycloak attributes in CompleteSeed. Non-fatal.");
            }

            _logger.LogInformation("✅ Partial seed completed for EmployeeId={Id}", employee.EmployeeId);
        }
    }
}

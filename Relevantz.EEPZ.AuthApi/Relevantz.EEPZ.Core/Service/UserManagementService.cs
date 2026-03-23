// FULL FILE — NO FUNCTIONALITY REMOVED — BUILD SAFE

using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Core.Service;

public class UserManagementService : IUserManagementService
{
    private readonly IUserAuthenticationRepository    _userAuthRepo;
    private readonly IEmployeeRepository              _employeeRepo;
    private readonly IUserProfileRepository           _profileRepo;
    private readonly IEmployeeDetailsMasterRepository _detailsRepo;
    private readonly IRoleRepository                  _roleRepo;
    private readonly IDepartmentRepository            _deptRepo;
    private readonly IKeycloakAdminService            _keycloak;
    private readonly IEmailService                    _email;
    private readonly ILogger<UserManagementService>   _logger;

    public UserManagementService(
        IUserAuthenticationRepository    userAuthRepo,
        IEmployeeRepository              employeeRepo,
        IUserProfileRepository           profileRepo,
        IEmployeeDetailsMasterRepository detailsRepo,
        IRoleRepository                  roleRepo,
        IDepartmentRepository            deptRepo,
        IKeycloakAdminService            keycloak,
        IEmailService                    email,
        ILogger<UserManagementService>   logger)
    {
        _userAuthRepo = userAuthRepo;
        _employeeRepo = employeeRepo;
        _profileRepo  = profileRepo;
        _detailsRepo  = detailsRepo;
        _roleRepo     = roleRepo;
        _deptRepo     = deptRepo;
        _keycloak     = keycloak;
        _email        = email;
        _logger       = logger;
    }

    // ── CREATE USER ───────────────────────────────────────────────────────
    public async Task<UserResponseDto> CreateUserAsync(
        CreateUserRequestDto request,
        int createdByUserId)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required.");

        if (await _userAuthRepo.EmailExistsAsync(request.Email))
            throw new InvalidOperationException("Email already exists.");

        var role = await _roleRepo.GetByIdAsync(request.RoleId)
            ?? throw new KeyNotFoundException("Role not found.");

        var department = await _deptRepo.GetByIdAsync(request.DepartmentId)
            ?? throw new KeyNotFoundException("Department not found.");

        var tempPassword = GenerateTemporaryPassword();
        string? keycloakId = null;

        try
        {
            // STEP 1: Create in Keycloak
            keycloakId = await _keycloak.CreateUserAsync(
                request.Email,
                request.FirstName,
                request.LastName,
                tempPassword,
                role.RoleName);

            await _keycloak.AssignRoleAsync(keycloakId, role.RoleName);

            // STEP 2: Employee
            var employee = new Employee
            {
                EmployeeCompanyId          = request.EmployeeCompanyId,
                EmploymentType             = request.EmploymentType    ?? "Permanent",
                EmploymentStatus           = request.EmploymentStatus  ?? "Active",
                EmployeeType               = request.EmployeeType      ?? "FullTime",
                JoiningDate                = DateOnly.FromDateTime(DateTime.UtcNow),
                WorkLocation               = request.WorkLocation      ?? "Head Office",
                NoticePeriodDays           = request.NoticePeriodDays > 0 ? request.NoticePeriodDays : 30,
                IsActive                   = true,
                CreatedAt                  = DateTime.UtcNow,
                CreatedByUserId            = createdByUserId,
                ReportingManagerEmployeeId = request.ReportingManagerEmployeeId,
                KeycloakUserId             = keycloakId
            };

            await _employeeRepo.CreateAsync(employee);

            // STEP 3: Profile
            await _profileRepo.CreateAsync(new Userprofile
            {
                EmployeeId   = employee.EmployeeId,
                FirstName    = request.FirstName,
                LastName     = request.LastName,
                MobileNumber = request.MobileNumber
            });

            // STEP 4: Auth
            await _userAuthRepo.CreateAsync(new Userauthentication
            {
                EmployeeId   = employee.EmployeeId,
                Email        = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                Status       = "Active",
                IsFirstLogin = true,
                CreatedAt    = DateTime.UtcNow
            });

            // STEP 5: Employee Details
            var details = new Employeedetailsmaster
            {
                EmployeeId   = employee.EmployeeId,
                RoleId       = request.RoleId,
                DepartmentId = request.DepartmentId
            };
            await _detailsRepo.CreateAsync(details);

            // STEP 6: Push attributes to Keycloak via UUID ✅
            await _keycloak.SetUserAttributesAsync(keycloakId, new Dictionary<string, string>
            {
                ["empId"]       = employee.EmployeeId.ToString(),
                ["empMasterId"] = details.EmployeeMasterId.ToString(),
                ["role"]        = role.RoleName
            });

            // ✅ STEP 6b: Explicitly patch email + firstName + lastName
            // Required — Keycloak silently ignores these fields on create in some versions
            await _keycloak.UpdateUserProfileAsync(
                keycloakId,
                request.Email,
                request.FirstName,
                request.LastName);

            // STEP 7: Welcome email
            await _email.SendWelcomeEmailAsync(request.Email, request.FirstName, tempPassword);

            return await GetUserByIdAsync(employee.EmployeeId);
        }
        catch (Exception ex)
        {
            if (!string.IsNullOrEmpty(keycloakId))
                await _keycloak.DeleteUserAsync(keycloakId);

            _logger.LogError(ex, "CreateUser failed — rollback executed for {Email}", request.Email);
            throw;
        }
    }

    // ── UPDATE USER ───────────────────────────────────────────────────────
    public async Task<UserResponseDto> UpdateUserAsync(
        UpdateUserRequestDto request,
        int updatedByUserId)
    {
        var user = await _userAuthRepo.GetByIdAsync(request.UserId)
            ?? throw new KeyNotFoundException("User not found.");

        var employee = await _employeeRepo.GetByIdAsync(user.EmployeeId)
            ?? throw new KeyNotFoundException("Employee not found.");

        employee.WorkLocation    = request.WorkLocation ?? employee.WorkLocation;
        employee.UpdatedAt       = DateTime.UtcNow;
        employee.UpdatedByUserId = updatedByUserId;

        await _employeeRepo.UpdateAsync(employee);

        // ✅ Sync role attribute in Keycloak via UUID
        if (!string.IsNullOrEmpty(employee.KeycloakUserId))
        {
            var details = await _detailsRepo.GetByEmployeeIdAsync(employee.EmployeeId);
            if (details != null)
            {
                var role = await _roleRepo.GetByIdAsync(details.RoleId);
                if (role != null)
                {
                    await _keycloak.SetUserAttributesAsync(employee.KeycloakUserId,
                        new Dictionary<string, string>
                        {
                            ["role"] = role.RoleName
                        });
                }
            }
        }

        return await GetUserByIdAsync(user.UserId);
    }

    // ── ASSIGN ROLE & DEPARTMENT ──────────────────────────────────────────
    public async Task AssignRoleAndDepartmentAsync(AssignRoleDepartmentRequestDto request)
    {
        var details = await _detailsRepo.GetByEmployeeIdAsync(request.EmployeeId);

        if (details != null)
        {
            details.RoleId       = request.RoleId;
            details.DepartmentId = request.DepartmentId;
            await _detailsRepo.UpdateAsync(details);
        }
        else
        {
            await _detailsRepo.CreateAsync(new Employeedetailsmaster
            {
                EmployeeId   = request.EmployeeId,
                RoleId       = request.RoleId,
                DepartmentId = request.DepartmentId
            });
        }

        var employee = await _employeeRepo.GetByIdAsync(request.EmployeeId);
        var role     = await _roleRepo.GetByIdAsync(request.RoleId);

        // ✅ UUID based — always works
        if (employee != null && !string.IsNullOrEmpty(employee.KeycloakUserId) && role != null)
        {
            await _keycloak.SetUserAttributesAsync(employee.KeycloakUserId,
                new Dictionary<string, string>
                {
                    ["role"] = role.RoleName
                });
        }
    }

    // ── DEACTIVATE USER ───────────────────────────────────────────────────
    public async Task DeactivateUserAsync(int userId, int performedByUserId)
    {
        var user = await _userAuthRepo.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var employee = await _employeeRepo.GetByIdAsync(user.EmployeeId)
            ?? throw new KeyNotFoundException("Employee not found.");

        employee.IsActive        = false;
        employee.UpdatedAt       = DateTime.UtcNow;
        employee.UpdatedByUserId = performedByUserId;

        await _employeeRepo.UpdateAsync(employee);

        if (!string.IsNullOrEmpty(employee.KeycloakUserId))
            await _keycloak.DisableUserAsync(employee.KeycloakUserId);
    }

    // ── ACTIVATE USER ─────────────────────────────────────────────────────
    public async Task ActivateUserAsync(int userId, int performedByUserId)
    {
        var user = await _userAuthRepo.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var employee = await _employeeRepo.GetByIdAsync(user.EmployeeId)
            ?? throw new KeyNotFoundException("Employee not found.");

        employee.IsActive        = true;
        employee.UpdatedAt       = DateTime.UtcNow;
        employee.UpdatedByUserId = performedByUserId;

        await _employeeRepo.UpdateAsync(employee);

        if (!string.IsNullOrEmpty(employee.KeycloakUserId))
            await _keycloak.EnableUserAsync(employee.KeycloakUserId);
    }

    // ── GET USER BY ID ────────────────────────────────────────────────────
    public async Task<UserResponseDto> GetUserByIdAsync(int userId)
    {
        var user = await _userAuthRepo.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        return MapToDto(user);
    }

    // ── GET ALL USERS ─────────────────────────────────────────────────────
    public async Task<List<UserResponseDto>> GetAllUsersAsync()
    {
        var users  = await _userAuthRepo.GetAllAsync();
        var result = new List<UserResponseDto>();

        foreach (var user in users)
        {
            var employee = await _employeeRepo.GetByIdAsync(user.EmployeeId);
            var profile  = await _profileRepo.GetByEmployeeIdAsync(user.EmployeeId);
            var details  = await _detailsRepo.GetByEmployeeIdAsync(user.EmployeeId);

            var role = details != null ? await _roleRepo.GetByIdAsync(details.RoleId) : null;
            var dept = details != null ? await _deptRepo.GetByIdAsync(details.DepartmentId) : null;

            result.Add(new UserResponseDto
            {
                UserId            = user.UserId,
                Email             = user.Email,
                FirstName         = profile?.FirstName,
                LastName          = profile?.LastName,
                EmployeeCompanyId = employee?.EmployeeCompanyId,
                RoleName          = role?.RoleName,
                DepartmentName    = dept?.DepartmentName,
                IsActive          = employee?.IsActive ?? false
            });
        }

        return result;
    }

    // ── GET EMPLOYEES BY MANAGER ──────────────────────────────────────────
    public async Task<List<UserResponseDto>> GetEmployeesByManagerAsync(int managerId)
    {
        var employees = await _employeeRepo.GetByManagerIdAsync(managerId);
        var result    = new List<UserResponseDto>();

        foreach (var employee in employees)
        {
            var user    = await _userAuthRepo.GetByEmployeeIdAsync(employee.EmployeeId);
            var profile = await _profileRepo.GetByEmployeeIdAsync(employee.EmployeeId);
            var details = await _detailsRepo.GetByEmployeeIdAsync(employee.EmployeeId);

            var role = details != null ? await _roleRepo.GetByIdAsync(details.RoleId) : null;
            var dept = details != null ? await _deptRepo.GetByIdAsync(details.DepartmentId) : null;

            result.Add(new UserResponseDto
            {
                UserId            = user?.UserId ?? 0,
                Email             = user?.Email,
                FirstName         = profile?.FirstName,
                LastName          = profile?.LastName,
                EmployeeCompanyId = employee.EmployeeCompanyId,
                RoleName          = role?.RoleName,
                DepartmentName    = dept?.DepartmentName,
                IsActive          = employee.IsActive ?? false
            });
        }

        return result;
    }

    // ── GET NEXT EMPLOYEE COMPANY ID ──────────────────────────────────────
    public async Task<string> GetNextEmployeeCompanyIdAsync()
    {
        var employees = await _employeeRepo.GetAllAsync();

        if (!employees.Any())
            return "1";

        var maxId = employees
            .Select(e => int.TryParse(e.EmployeeCompanyId, out var val) ? val : 0)
            .Max();

        return (maxId + 1).ToString();
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────
    private static UserResponseDto MapToDto(Userauthentication user)
    {
        return new UserResponseDto
        {
            UserId   = user.UserId,
            Email    = user.Email,
            RoleName = user.Employee?.Employeedetailsmasters
                           ?.FirstOrDefault()?.Role?.RoleName,
            IsActive = user.Employee?.IsActive ?? false
        };
    }

    private static string GenerateTemporaryPassword()
    {
        var upper   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var lower   = "abcdefghijklmnopqrstuvwxyz";
        var digits  = "0123456789";
        var special = "@#$!";
        var rng     = new Random();

        var password = new[]
        {
            upper[rng.Next(upper.Length)],
            lower[rng.Next(lower.Length)],
            digits[rng.Next(digits.Length)],
            special[rng.Next(special.Length)]
        };

        var all  = upper + lower + digits + special;
        var rest = Enumerable.Range(0, 8)
                             .Select(_ => all[rng.Next(all.Length)]);

        return new string(password.Concat(rest)
                                  .OrderBy(_ => rng.Next())
                                  .ToArray());
    }
}

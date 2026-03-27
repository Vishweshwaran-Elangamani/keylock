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
    private readonly ILogger<UserManagementService>   _logger;

    public UserManagementService(
        IUserAuthenticationRepository    userAuthRepo,
        IEmployeeRepository              employeeRepo,
        IUserProfileRepository           profileRepo,
        IEmployeeDetailsMasterRepository detailsRepo,
        IRoleRepository                  roleRepo,
        IDepartmentRepository            deptRepo,
        IKeycloakAdminService            keycloak,
        ILogger<UserManagementService>   logger)
    {
        _userAuthRepo = userAuthRepo;
        _employeeRepo = employeeRepo;
        _profileRepo  = profileRepo;
        _detailsRepo  = detailsRepo;
        _roleRepo     = roleRepo;
        _deptRepo     = deptRepo;
        _keycloak     = keycloak;
        _logger       = logger;
    }

    // ── CREATE USER ───────────────────────────────────────────────────────────
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

        // ✅ FIX 1: Auto-generate EmployeeCompanyId — never trust client-sent value
        // This prevents "Duplicate entry" on employee.EmployeeCompanyId unique constraint
        var employeeCompanyId = await GetNextEmployeeCompanyIdAsync();

        string? keycloakId = null;

        try
        {
            // STEP 1 — Create user in Keycloak
            // CreateUserAsync already sets username, email, firstName, lastName, enabled=true
            keycloakId = await _keycloak.CreateUserAsync(
                request.Email,
                request.FirstName,
                request.LastName,
                role.RoleName);

            // STEP 2 — Assign Keycloak realm role
            try { await _keycloak.AssignRoleAsync(keycloakId, role.RoleName); }
            catch (Exception ex) { _logger.LogWarning(ex, "Role assign failed — non-fatal."); }

            // STEP 3 — Create Employee row
            var joiningDate = request.JoiningDate == default
                ? DateOnly.FromDateTime(DateTime.UtcNow)
                : request.JoiningDate;

            var confirmationDate = request.ConfirmationDate.HasValue
                ? request.ConfirmationDate.Value
                : DateOnly.FromDateTime(DateTime.UtcNow);

            var employee = new Employee
            {
                EmployeeCompanyId          = employeeCompanyId,   // ✅ auto-generated
                EmploymentType             = request.EmploymentType   ?? "Permanent",
                EmploymentStatus           = request.EmploymentStatus ?? "Active",
                EmployeeType               = request.EmployeeType     ?? "FullTime",
                JoiningDate                = joiningDate,
                ConfirmationDate           = confirmationDate,
                WorkLocation               = request.WorkLocation     ?? "Head Office",
                NoticePeriodDays           = request.NoticePeriodDays > 0 ? request.NoticePeriodDays : 30,
                IsActive                   = true,
                CreatedAt                  = DateTime.UtcNow,
                CreatedByUserId            = createdByUserId,
                ReportingManagerEmployeeId = request.ReportingManagerEmployeeId,
                KeycloakUserId             = keycloakId
            };
            await _employeeRepo.CreateAsync(employee);
            // ✅ employee.EmployeeId is now populated by EF Core after SaveChangesAsync

            // STEP 4 — Create UserProfile
            await _profileRepo.CreateAsync(new Userprofile
            {
                EmployeeId          = employee.EmployeeId,
                FirstName           = request.FirstName,
                LastName            = request.LastName,
                MiddleName          = request.MiddleName,
                CallingName         = request.CallingName,
                Gender              = request.Gender,
                MobileNumber        = request.MobileNumber,
                AlternateNumber     = request.AlternateNumber,
                PersonalEmail       = request.PersonalEmail,
                DateOfBirthOfficial = request.DateOfBirthOfficial,
                DateOfBirthActual   = request.DateOfBirthActual,
                ReferredBy          = request.ReferredBy
            });

            // STEP 5 — Create UserAuthentication (Keycloak owns the credential)
            var userAuth = new Userauthentication
            {
                EmployeeId   = employee.EmployeeId,
                Email        = request.Email,
                PasswordHash = string.Empty,
                Status       = "Active",
                IsFirstLogin = true,
                CreatedAt    = DateTime.UtcNow
            };
            await _userAuthRepo.CreateAsync(userAuth);
            // ✅ userAuth.UserId is now populated after SaveChangesAsync

            // STEP 6 — Create EmployeeDetailsMaster
            var details = new Employeedetailsmaster
            {
                EmployeeId   = employee.EmployeeId,
                RoleId       = request.RoleId,
                DepartmentId = request.DepartmentId
            };
            await _detailsRepo.CreateAsync(details);
            // ✅ details.EmployeeMasterId is now populated after SaveChangesAsync

            // STEP 7 — Push JWT custom claims + profile fields to Keycloak in ONE call
            // ✅ FIX 2: Pass firstName/lastName explicitly so SetUserAttributesAsync
            // never reads stale empty values back from Keycloak and overwrites them
            await _keycloak.SetUserAttributesAsync(
                keycloakId,
                new Dictionary<string, string>
                {
                    ["empId"]       = employee.EmployeeId.ToString(),
                    ["empMasterId"] = details.EmployeeMasterId.ToString(),
                    ["role"]        = role.RoleName
                },
                firstName: request.FirstName,
                lastName:  request.LastName,
                email:     request.Email);

            // ✅ FIX 3: REMOVED UpdateUserProfileAsync — it was racing with/overwriting
            // the correct data already set by CreateUserAsync + SetUserAttributesAsync

            // STEP 8 — Keycloak emails new user a "Set your password" link
            await _keycloak.SendSetPasswordEmailAsync(keycloakId);

            _logger.LogInformation(
                "✅ User created. Set-password email sent. Email={Email} EmployeeId={EId}",
                request.Email, employee.EmployeeId);

            // ✅ FIX 4: Use userAuth.UserId directly — already populated above
            // NEVER call GetUserByIdAsync(employee.EmployeeId) here since GetUserByIdAsync
            // takes a UserId (Userauthentication.UserId), NOT EmployeeId
            return await GetUserByIdAsync(userAuth.UserId);
        }
        catch (Exception ex)
        {
            if (!string.IsNullOrEmpty(keycloakId))
            {
                try { await _keycloak.DeleteUserAsync(keycloakId); }
                catch (Exception rollbackEx)
                {
                    _logger.LogWarning(rollbackEx, "Keycloak rollback also failed for {Email}", request.Email);
                }
            }

            _logger.LogError(ex, "CreateUser failed — Keycloak rollback for {Email}", request.Email);
            throw;
        }
    }

    // ── UPDATE USER ───────────────────────────────────────────────────────────
    public async Task<UserResponseDto> UpdateUserAsync(
        UpdateUserRequestDto request,
        int updatedByUserId)
    {
        var user = await _userAuthRepo.GetByIdAsync(request.UserId)
            ?? throw new KeyNotFoundException("User not found.");

        var employee = await _employeeRepo.GetByIdAsync(user.EmployeeId)
            ?? throw new KeyNotFoundException("Employee not found.");

        if (!string.IsNullOrWhiteSpace(request.WorkLocation))
            employee.WorkLocation = request.WorkLocation;

        if (!string.IsNullOrWhiteSpace(request.EmploymentType))
            employee.EmploymentType = request.EmploymentType;

        if (!string.IsNullOrWhiteSpace(request.EmploymentStatus))
            employee.EmploymentStatus = request.EmploymentStatus;

        if (!string.IsNullOrWhiteSpace(request.EmployeeType))
            employee.EmployeeType = request.EmployeeType;

        if (request.NoticePeriodDays.HasValue)
            employee.NoticePeriodDays = request.NoticePeriodDays.Value;

        if (request.ReportingManagerEmployeeId.HasValue)
            employee.ReportingManagerEmployeeId = request.ReportingManagerEmployeeId.Value;

        if (request.ConfirmationDate.HasValue)
            employee.ConfirmationDate = DateOnly.FromDateTime(request.ConfirmationDate.Value);

        employee.UpdatedAt       = DateTime.UtcNow;
        employee.UpdatedByUserId = updatedByUserId;

        await _employeeRepo.UpdateAsync(employee);

        if (!string.IsNullOrEmpty(employee.KeycloakUserId))
        {
            var details = await _detailsRepo.GetByEmployeeIdAsync(employee.EmployeeId);
            if (details != null)
            {
                var role = await _roleRepo.GetByIdAsync(details.RoleId);
                if (role != null)
                    await _keycloak.SetUserAttributesAsync(
                        employee.KeycloakUserId,
                        new Dictionary<string, string> { ["role"] = role.RoleName });
            }
        }

        return await GetUserByIdAsync(user.UserId);
    }

    // ── ASSIGN ROLE & DEPARTMENT ──────────────────────────────────────────────
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

        if (employee != null && !string.IsNullOrEmpty(employee.KeycloakUserId) && role != null)
            await _keycloak.SetUserAttributesAsync(
                employee.KeycloakUserId,
                new Dictionary<string, string> { ["role"] = role.RoleName });
    }

    // ── DEACTIVATE USER ───────────────────────────────────────────────────────
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

    // ── ACTIVATE USER ─────────────────────────────────────────────────────────
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

    // ── GET USER BY ID ────────────────────────────────────────────────────────
    public async Task<UserResponseDto> GetUserByIdAsync(int userId)
    {
        var user = await _userAuthRepo.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var employee = await _employeeRepo.GetByIdAsync(user.EmployeeId);
        var profile  = await _profileRepo.GetByEmployeeIdAsync(user.EmployeeId);
        var details  = await _detailsRepo.GetByEmployeeIdAsync(user.EmployeeId);
        var role     = details != null ? await _roleRepo.GetByIdAsync(details.RoleId)  : null;
        var dept     = details != null ? await _deptRepo.GetByIdAsync(details.DepartmentId) : null;

        return new UserResponseDto
        {
            UserId            = user.UserId,
            EmployeeId        = user.EmployeeId,
            Email             = user.Email,
            FirstName         = profile?.FirstName,
            LastName          = profile?.LastName,
            EmployeeCompanyId = employee?.EmployeeCompanyId,
            RoleName          = role?.RoleName,
            DepartmentName    = dept?.DepartmentName,
            IsActive          = employee?.IsActive ?? false,
            Status            = user.Status,
            IsFirstLogin      = user.IsFirstLogin ?? true,
            EmploymentType    = employee?.EmploymentType,
            EmploymentStatus  = employee?.EmploymentStatus,
            JoiningDate       = employee?.JoiningDate ?? DateOnly.MinValue,
            WorkLocation      = employee?.WorkLocation,
            EmployeeType      = employee?.EmployeeType,
            NoticePeriodDays  = employee?.NoticePeriodDays ?? 0
        };
    }

    // ── GET ALL USERS ─────────────────────────────────────────────────────────
    public async Task<List<UserResponseDto>> GetAllUsersAsync()
    {
        var users  = await _userAuthRepo.GetAllAsync();
        var result = new List<UserResponseDto>();

        foreach (var user in users)
            result.Add(await GetUserByIdAsync(user.UserId));

        return result;
    }

    // ── GET EMPLOYEES BY MANAGER ──────────────────────────────────────────────
    public async Task<List<UserResponseDto>> GetEmployeesByManagerAsync(int managerId)
    {
        var employees = await _employeeRepo.GetByManagerIdAsync(managerId);
        var result    = new List<UserResponseDto>();

        foreach (var employee in employees)
        {
            var user    = await _userAuthRepo.GetByEmployeeIdAsync(employee.EmployeeId);
            var profile = await _profileRepo.GetByEmployeeIdAsync(employee.EmployeeId);
            var details = await _detailsRepo.GetByEmployeeIdAsync(employee.EmployeeId);
            var role    = details != null ? await _roleRepo.GetByIdAsync(details.RoleId)       : null;
            var dept    = details != null ? await _deptRepo.GetByIdAsync(details.DepartmentId) : null;

            result.Add(new UserResponseDto
            {
                UserId            = user?.UserId ?? 0,
                EmployeeId        = employee.EmployeeId,
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

    // ── GET NEXT EMPLOYEE COMPANY ID ──────────────────────────────────────────
    public async Task<string> GetNextEmployeeCompanyIdAsync()
    {
        var employees = await _employeeRepo.GetAllAsync();

        if (!employees.Any()) return "1001";  // ✅ start from 1001, SuperAdmin owns 1000

        var maxId = employees
            .Select(e => int.TryParse(e.EmployeeCompanyId, out var val) ? val : 0)
            .Max();

        return (maxId + 1).ToString();
    }
}

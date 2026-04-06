using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.DBContexts;
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
    private readonly EEPZDbContext                    _dbContext;
    private readonly ILogger<UserManagementService>   _logger;

    public UserManagementService(
        IUserAuthenticationRepository    userAuthRepo,
        IEmployeeRepository              employeeRepo,
        IUserProfileRepository           profileRepo,
        IEmployeeDetailsMasterRepository detailsRepo,
        IRoleRepository                  roleRepo,
        IDepartmentRepository            deptRepo,
        IKeycloakAdminService            keycloak,
        EEPZDbContext                    dbContext,
        ILogger<UserManagementService>   logger)
    {
        _userAuthRepo = userAuthRepo;
        _employeeRepo = employeeRepo;
        _profileRepo  = profileRepo;
        _detailsRepo  = detailsRepo;
        _roleRepo     = roleRepo;
        _deptRepo     = deptRepo;
        _keycloak     = keycloak;
        _dbContext    = dbContext;
        _logger       = logger;
    }

    // ─────────────────────────────────────────────────────────────
    // CREATE USER
    // ─────────────────────────────────────────────────────────────
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

        var employeeCompanyId = await GetNextEmployeeCompanyIdAsync();
        var strategy = _dbContext.Database.CreateExecutionStrategy();
        string? keycloakId = null;
        Userauthentication? userAuth = null;

        try
        {
            // STEP 1 — Keycloak first
            keycloakId = await _keycloak.CreateUserAsync(
                request.Email,
                request.FirstName,
                request.LastName,
                role.RoleName);

            await _keycloak.AssignRoleAsync(keycloakId, role.RoleName);

            // STEP 2 — DB with retry + transaction
            await strategy.ExecuteAsync(async () =>
            {
                using var tx = await _dbContext.Database.BeginTransactionAsync();

                var employee = new Employee
                {
                    EmployeeCompanyId          = employeeCompanyId,
                    EmploymentType             = request.EmploymentType   ?? "Permanent",
                    EmploymentStatus           = request.EmploymentStatus ?? "Active",
                    EmployeeType               = request.EmployeeType     ?? "FullTime",
                    JoiningDate                = request.JoiningDate,
                    ConfirmationDate           = request.ConfirmationDate ?? request.JoiningDate,
                    WorkLocation               = request.WorkLocation     ?? "Head Office",
                    NoticePeriodDays           = request.NoticePeriodDays > 0 ? request.NoticePeriodDays : 30,
                    IsActive                   = true,
                    CreatedAt                  = DateTime.UtcNow,
                    CreatedByUserId            = createdByUserId,
                    ReportingManagerEmployeeId = request.ReportingManagerEmployeeId,
                    KeycloakUserId             = keycloakId
                };
                await _employeeRepo.CreateAsync(employee);

                await _profileRepo.CreateAsync(new Userprofile
                {
                    EmployeeId  = employee.EmployeeId,
                    FirstName   = request.FirstName,
                    LastName    = request.LastName,
                    Gender      = request.Gender,
                    MobileNumber = request.MobileNumber
                });

                userAuth = new Userauthentication
                {
                    EmployeeId   = employee.EmployeeId,
                    Email        = request.Email,
                    PasswordHash = string.Empty,
                    Status       = "Active",
                    IsFirstLogin = true,
                    CreatedAt    = DateTime.UtcNow
                };
                await _userAuthRepo.CreateAsync(userAuth);

                var details = new Employeedetailsmaster
                {
                    EmployeeId   = employee.EmployeeId,
                    RoleId       = role.RoleId,
                    DepartmentId = department.DepartmentId
                };
                await _detailsRepo.CreateAsync(details);

                await tx.CommitAsync();

                await _keycloak.SetUserAttributesAsync(
                    keycloakId!,
                    new Dictionary<string, string>
                    {
                        ["empId"]       = employee.EmployeeId.ToString(),
                        ["empMasterId"] = details.EmployeeMasterId.ToString(),
                        ["role"]        = role.RoleName
                    },
                    request.FirstName,
                    request.LastName,
                    request.Email);
            });

            await _keycloak.SendSetPasswordEmailAsync(keycloakId);

            return await GetUserByIdAsync(userAuth!.UserId);
        }
        catch
        {
            if (!string.IsNullOrEmpty(keycloakId))
                await _keycloak.DeleteUserAsync(keycloakId);

            throw;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // UPDATE USER
    // ─────────────────────────────────────────────────────────────
    public async Task<UserResponseDto> UpdateUserAsync(UpdateUserRequestDto request, int updatedByUserId)
    {
        var user = await _userAuthRepo.GetByIdAsync(request.UserId)
            ?? throw new KeyNotFoundException("User not found.");

        var employee = await _employeeRepo.GetByIdAsync(user.EmployeeId)
            ?? throw new KeyNotFoundException("Employee not found.");

        employee.WorkLocation = request.WorkLocation ?? employee.WorkLocation;
        employee.EmploymentStatus = request.EmploymentStatus ?? employee.EmploymentStatus;
        employee.UpdatedAt = DateTime.UtcNow;
        employee.UpdatedByUserId = updatedByUserId;

        await _employeeRepo.UpdateAsync(employee);
        return await GetUserByIdAsync(user.UserId);
    }

    // ─────────────────────────────────────────────────────────────
    // ACTIVATE / DEACTIVATE
    // ─────────────────────────────────────────────────────────────
    public async Task DeactivateUserAsync(int userId, int performedByUserId)
    {
        var user = await _userAuthRepo.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var emp = await _employeeRepo.GetByIdAsync(user.EmployeeId);
        emp!.IsActive = false;
        emp.UpdatedAt = DateTime.UtcNow;
        emp.UpdatedByUserId = performedByUserId;

        await _employeeRepo.UpdateAsync(emp);
        await _keycloak.DisableUserAsync(emp.KeycloakUserId);
    }

    public async Task ActivateUserAsync(int userId, int performedByUserId)
    {
        var user = await _userAuthRepo.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var emp = await _employeeRepo.GetByIdAsync(user.EmployeeId);
        emp!.IsActive = true;
        emp.UpdatedAt = DateTime.UtcNow;
        emp.UpdatedByUserId = performedByUserId;

        await _employeeRepo.UpdateAsync(emp);
        await _keycloak.EnableUserAsync(emp.KeycloakUserId);
    }

    // ─────────────────────────────────────────────────────────────
    // ASSIGN ROLE & DEPARTMENT
    // ─────────────────────────────────────────────────────────────
    public async Task AssignRoleAndDepartmentAsync(AssignRoleDepartmentRequestDto request)
    {
        var details = await _detailsRepo.GetByEmployeeIdAsync(request.EmployeeId);
        if (details != null)
        {
            details.RoleId = request.RoleId;
            details.DepartmentId = request.DepartmentId;
            await _detailsRepo.UpdateAsync(details);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // READ OPERATIONS
    // ─────────────────────────────────────────────────────────────
    public async Task<UserResponseDto> GetUserByIdAsync(int userId)
    {
        var user = await _userAuthRepo.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var emp     = await _employeeRepo.GetByIdAsync(user.EmployeeId);
        var profile = await _profileRepo.GetByEmployeeIdAsync(user.EmployeeId);
        var details = await _detailsRepo.GetByEmployeeIdAsync(user.EmployeeId);
        var role    = details != null ? await _roleRepo.GetByIdAsync(details.RoleId) : null;
        var dept    = details != null ? await _deptRepo.GetByIdAsync(details.DepartmentId) : null;

        return new UserResponseDto
        {
            UserId            = user.UserId,
            EmployeeId        = user.EmployeeId,
            Email             = user.Email,
            FirstName         = profile?.FirstName,
            LastName          = profile?.LastName,
            EmployeeCompanyId = emp?.EmployeeCompanyId,
            RoleName          = role?.RoleName,
            DepartmentName    = dept?.DepartmentName,
            IsActive          = emp?.IsActive ?? false,
            Status            = user.Status,
            IsFirstLogin      = user.IsFirstLogin ?? false
        };
    }

    public async Task<List<UserResponseDto>> GetAllUsersAsync()
        => (await _userAuthRepo.GetAllAsync())
            .Select(u => GetUserByIdAsync(u.UserId).Result)
            .ToList();

    public async Task<List<UserResponseDto>> GetEmployeesByManagerAsync(int managerId)
    {
        var emps = await _employeeRepo.GetByManagerIdAsync(managerId);
        var result = new List<UserResponseDto>();
        foreach (var e in emps)
        {
            var u = await _userAuthRepo.GetByEmployeeIdAsync(e.EmployeeId);
            if (u != null) result.Add(await GetUserByIdAsync(u.UserId));
        }
        return result;
    }

    public async Task<string> GetNextEmployeeCompanyIdAsync()
    {
        var all = await _employeeRepo.GetAllAsync();
        if (!all.Any()) return "1001";
        var max = all.Max(e => int.Parse(e.EmployeeCompanyId));
        return (max + 1).ToString();
    }
}
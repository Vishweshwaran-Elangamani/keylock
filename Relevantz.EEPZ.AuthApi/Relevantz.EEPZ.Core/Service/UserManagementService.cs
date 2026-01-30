using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;
using MapsterMapper;

namespace Relevantz.EEPZ.Core.Service
{
    public class UserManagementService : IUserManagementService
    {
        private readonly IUserAuthenticationRepository _userAuthRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IEmployeeDetailsMasterRepository _employeeDetailsRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IPasswordService _passwordService;
        private readonly IEmailService _emailService;
        private readonly IMapper _mapper;

        public UserManagementService(
            IUserAuthenticationRepository userAuthRepository,
            IEmployeeRepository employeeRepository,
            IUserProfileRepository userProfileRepository,
            IEmployeeDetailsMasterRepository employeeDetailsRepository,
            IRoleRepository roleRepository,
            IDepartmentRepository departmentRepository,
            IPasswordService passwordService,
            IEmailService emailService,
            IMapper mapper)
        {
            _userAuthRepository = userAuthRepository;
            _employeeRepository = employeeRepository;
            _userProfileRepository = userProfileRepository;
            _employeeDetailsRepository = employeeDetailsRepository;
            _roleRepository = roleRepository;
            _departmentRepository = departmentRepository;
            _passwordService = passwordService;
            _emailService = emailService;
            _mapper = mapper;
        }

        public async Task<UserResponseDto> CreateUserAsync(CreateUserRequestDto request, int createdByUserId)
        {
            // Validate email uniqueness
            var existingUser = await _userAuthRepository.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new InvalidOperationException(UserManagementConstants.Messages.EmailAlreadyExists);
            }

            // Validate EmployeeCompanyId uniqueness
            var existingEmployee = await _employeeRepository.GetByEmployeeCompanyIdAsync(request.EmployeeCompanyId);
            if (existingEmployee != null)
            {
                throw new InvalidOperationException(UserManagementConstants.Messages.EmployeeCompanyIdExists);
            }

            // Validate Role exists
            var role = await _roleRepository.GetByIdAsync(request.RoleId);
            if (role == null)
            {
                throw new KeyNotFoundException(UserManagementConstants.Messages.RoleNotFound);
            }

            // Validate Department exists
            var department = await _departmentRepository.GetByIdAsync(request.DepartmentId);
            if (department == null)
            {
                throw new KeyNotFoundException(UserManagementConstants.Messages.DepartmentNotFound);
            }

            // Use Mapster to create Employee from Request
            var employee = _mapper.Map<Employee>(request);
            employee.CreatedByUserId = createdByUserId;
            await _employeeRepository.CreateAsync(employee);

            // Create UserProfile using Mapster
            var userProfile = _mapper.Map<Userprofile>(request);
            userProfile.EmployeeId = employee.EmployeeId;
            await _userProfileRepository.CreateAsync(userProfile);

            // Create UserAuthentication
            var temporaryPassword = _passwordService.GenerateTemporaryPassword();
            var userAuth = new Userauthentication
            {
                EmployeeId = employee.EmployeeId,
                Email = request.Email,
                PasswordHash = _passwordService.HashPassword(temporaryPassword),
                Status = Constants.UserStatuses.Active,
                IsFirstLogin = true,
                CreatedAt = DateTime.UtcNow
            };
            await _userAuthRepository.CreateAsync(userAuth);

            // Create EmployeeDetailsMaster
            var employeeDetails = new Employeedetailsmaster
            {
                EmployeeId = employee.EmployeeId,
                RoleId = request.RoleId,
                DepartmentId = request.DepartmentId
            };
            await _employeeDetailsRepository.CreateAsync(employeeDetails);

            // Send welcome email
            await _emailService.SendWelcomeEmailAsync(request.Email, request.FirstName, temporaryPassword);

            EEPZBusinessLog.Information($"User created successfully: {request.Email} (EmployeeCompanyId: {request.EmployeeCompanyId})");

            // Get the complete user data for response using Mapster
            var createdUser = await _userAuthRepository.GetByIdAsync(userAuth.UserId);
            return _mapper.Map<UserResponseDto>(createdUser);
        }

        public async Task<UserResponseDto> UpdateUserAsync(UpdateUserRequestDto request, int updatedByUserId)
        {
            var user = await _userAuthRepository.GetByIdAsync(request.UserId);
            if (user == null)
            {
                throw new KeyNotFoundException(UserManagementConstants.Messages.UserNotFound);
            }

            var employee = await _employeeRepository.GetByIdAsync(user.EmployeeId);
            if (employee == null)
            {
                throw new KeyNotFoundException(UserManagementConstants.Messages.EmployeeNotFound);
            }

            // Update employee fields
            if (!string.IsNullOrWhiteSpace(request.EmploymentType))
                employee.EmploymentType = request.EmploymentType;

            if (!string.IsNullOrWhiteSpace(request.EmploymentStatus))
                employee.EmploymentStatus = request.EmploymentStatus;

            if (request.ConfirmationDate.HasValue)
                employee.ConfirmationDate = DateOnly.FromDateTime(request.ConfirmationDate.Value);

            if (request.ExitDate.HasValue)
                employee.ExitDate = DateOnly.FromDateTime(request.ExitDate.Value);

            if (request.ReportingManagerEmployeeId.HasValue)
                employee.ReportingManagerEmployeeId = request.ReportingManagerEmployeeId.Value;

            if (!string.IsNullOrWhiteSpace(request.WorkLocation))
                employee.WorkLocation = request.WorkLocation;

            if (!string.IsNullOrWhiteSpace(request.EmployeeType))
                employee.EmployeeType = request.EmployeeType;

            if (request.NoticePeriodDays.HasValue)
                employee.NoticePeriodDays = request.NoticePeriodDays.Value;

            if (request.IsActive.HasValue)
                employee.IsActive = request.IsActive.Value;

            employee.UpdatedAt = DateTime.UtcNow;
            employee.UpdatedByUserId = updatedByUserId;
            await _employeeRepository.UpdateAsync(employee);

            // Update user authentication status
            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                user.Status = request.Status;
                user.UpdatedAt = DateTime.UtcNow;
                await _userAuthRepository.UpdateAsync(user);
            }

            EEPZBusinessLog.Information($"User updated successfully: UserId {request.UserId}");

            // Get updated user data using Mapster
            var updatedUser = await _userAuthRepository.GetByIdAsync(request.UserId);
            return _mapper.Map<UserResponseDto>(updatedUser);
        }

        public async Task<UserResponseDto> GetUserByIdAsync(int userId)
        {
            var user = await _userAuthRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException(UserManagementConstants.Messages.UserNotFound);
            }

            // Use Mapster for mapping
            return _mapper.Map<UserResponseDto>(user);
        }

        public async Task<List<UserResponseDto>> GetAllUsersAsync()
        {
            var users = await _userAuthRepository.GetAllAsync();
            // Use Mapster for mapping list
            return _mapper.Map<List<UserResponseDto>>(users);
        }

        public async Task DeactivateUserAsync(int userId)
        {
            var user = await _userAuthRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException(UserManagementConstants.Messages.UserNotFound);
            }

            // Prevent deactivation of protected employee (1000)
            var employeeCompanyId = user.Employee?.EmployeeCompanyId;
            if (!string.IsNullOrEmpty(employeeCompanyId) && employeeCompanyId == "1000")
            {
                throw new InvalidOperationException(UserManagementConstants.Messages.CannotDeactivateProtectedUser);
            }

            user.Status = Constants.UserStatuses.Inactive;
            user.UpdatedAt = DateTime.UtcNow;
            await _userAuthRepository.UpdateAsync(user);

            var employee = await _employeeRepository.GetByIdAsync(user.EmployeeId);
            if (employee != null)
            {
                employee.IsActive = false;
                employee.UpdatedAt = DateTime.UtcNow;
                await _employeeRepository.UpdateAsync(employee);
            }

            EEPZBusinessLog.Information($"User deactivated: UserId {userId}");
        }

        public async Task ActivateUserAsync(int userId)
        {
            var user = await _userAuthRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException(UserManagementConstants.Messages.UserNotFound);
            }

            user.Status = Constants.UserStatuses.Active;
            user.UpdatedAt = DateTime.UtcNow;
            await _userAuthRepository.UpdateAsync(user);

            var employee = await _employeeRepository.GetByIdAsync(user.EmployeeId);
            if (employee != null)
            {
                employee.IsActive = true;
                employee.UpdatedAt = DateTime.UtcNow;
                await _employeeRepository.UpdateAsync(employee);
            }

            EEPZBusinessLog.Information($"User activated: UserId {userId}");
        }

        public async Task AssignRoleAndDepartmentAsync(AssignRoleDepartmentRequestDto request)
        {
            var employee = await _employeeRepository.GetByIdAsync(request.EmployeeId);
            if (employee == null)
            {
                throw new KeyNotFoundException(UserManagementConstants.Messages.EmployeeNotFound);
            }

            var role = await _roleRepository.GetByIdAsync(request.RoleId);
            if (role == null)
            {
                throw new KeyNotFoundException(UserManagementConstants.Messages.RoleNotFound);
            }

            var department = await _departmentRepository.GetByIdAsync(request.DepartmentId);
            if (department == null)
            {
                throw new KeyNotFoundException(UserManagementConstants.Messages.DepartmentNotFound);
            }

            var employeeDetails = await _employeeDetailsRepository.GetByEmployeeIdAsync(request.EmployeeId);

            if (employeeDetails != null)
            {
                employeeDetails.RoleId = request.RoleId;
                employeeDetails.DepartmentId = request.DepartmentId;
                await _employeeDetailsRepository.UpdateAsync(employeeDetails);
            }
            else
            {
                var newDetails = new Employeedetailsmaster
                {
                    EmployeeId = request.EmployeeId,
                    RoleId = request.RoleId,
                    DepartmentId = request.DepartmentId
                };
                await _employeeDetailsRepository.CreateAsync(newDetails);
            }

            EEPZBusinessLog.Information($"Role and Department assigned: EmployeeId {request.EmployeeId}, RoleId {request.RoleId}, DepartmentId {request.DepartmentId}");
        }

        public async Task<List<UserResponseDto>> GetEmployeesByManagerAsync(int managerId)
{
    var employees = await _employeeRepository.GetByReportingManagerAsync(managerId);

    var userIds = employees.Select(e => e.EmployeeId).ToList();
    var users = new List<Userauthentication>();

    foreach (var employeeId in userIds)
    {
        var user = await _userAuthRepository.GetByEmployeeIdWithDetailsAsync(employeeId);
        if (user != null)
        {
            users.Add(user);
        }
    }

    // Use Mapster for mapping list
    return _mapper.Map<List<UserResponseDto>>(users);
}


        public async Task<string> GetNextEmployeeCompanyIdAsync()
        {
            return await _employeeRepository.GetNextEmployeeCompanyIdAsync();
        }
    }
}

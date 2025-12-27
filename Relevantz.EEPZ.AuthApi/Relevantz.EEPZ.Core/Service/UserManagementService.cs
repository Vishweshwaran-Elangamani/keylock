using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;


namespace Relevantz.EEPZ.Core.Service
{
    public class UserManagementService : IUserManagementService
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IUserAuthenticationRepository _userAuthRepository;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IEmployeeDetailsMasterRepository _employeeDetailsRepository;
        private readonly IPasswordService _passwordService;
        private readonly IEmailService _emailService;


        public UserManagementService(
            IEmployeeRepository employeeRepository,
            IUserAuthenticationRepository userAuthRepository,
            IUserProfileRepository userProfileRepository,
            IEmployeeDetailsMasterRepository employeeDetailsRepository,
            IPasswordService passwordService,
            IEmailService emailService)
        {
            _employeeRepository = employeeRepository;
            _userAuthRepository = userAuthRepository;
            _userProfileRepository = userProfileRepository;
            _employeeDetailsRepository = employeeDetailsRepository;
            _passwordService = passwordService;
            _emailService = emailService;
        }


        public async Task<ApiResponseDto<UserResponseDto>> CreateUserAsync(CreateUserRequestDto request, int createdByUserId)
        {
            try
            {
                // Check if email already exists
                if (await _userAuthRepository.EmailExistsAsync(request.Email))
                {
                    return ApiResponseDto<UserResponseDto>.FailureResponse(Constants.Messages.EmailAlreadyExists);
                }


                // Auto-generate Employee Company ID if not provided or empty
                if (string.IsNullOrWhiteSpace(request.EmployeeCompanyId))
                {
                    request.EmployeeCompanyId = await _employeeRepository.GetNextEmployeeCompanyIdAsync();
                    EEPZBusinessLog.Information($"Auto-generated Employee Company ID: {request.EmployeeCompanyId}");
                }
                else
                {
                    // Check if Employee Company ID already exists (if manually provided)
                    if (await _employeeRepository.EmployeeCompanyIdExistsAsync(request.EmployeeCompanyId))
                    {
                        return ApiResponseDto<UserResponseDto>.FailureResponse(Constants.Messages.EmployeeIdAlreadyExists);
                    }
                }


                // Create Employee
                var employee = new Employee
                {
                    EmployeeCompanyId = request.EmployeeCompanyId,
                    EmploymentType = request.EmploymentType,
                    EmploymentStatus = request.EmploymentStatus,
                    JoiningDate = request.JoiningDate,
                    ConfirmationDate = request.ConfirmationDate,
                    ReportingManagerEmployeeId = request.ReportingManagerEmployeeId,
                    WorkLocation = request.WorkLocation,
                    EmployeeType = request.EmployeeType,
                    NoticePeriodDays = request.NoticePeriodDays,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = createdByUserId
                };


                await _employeeRepository.CreateAsync(employee);


                // Generate temporary password
                var temporaryPassword = _passwordService.GenerateTemporaryPassword();
                var hashedPassword = _passwordService.HashPassword(temporaryPassword);
                Console.WriteLine($"Generated Temp Password: {temporaryPassword}");
                Console.WriteLine($"Hashed Password Length: {hashedPassword.Length}");


                // Create User Authentication
                var userAuth = new Userauthentication
                {
                    EmployeeId = employee.EmployeeId,
                    Email = request.Email,
                    PasswordHash = hashedPassword,
                    Status = Constants.UserStatuses.Active,
                    IsFirstLogin = true,
                    CreatedAt = DateTime.UtcNow
                };


                await _userAuthRepository.CreateAsync(userAuth);


                // Create User Profile
                var userProfile = new Userprofile
                {
                    EmployeeId = employee.EmployeeId,
                    FirstName = request.FirstName,
                    MiddleName = request.MiddleName,
                    LastName = request.LastName,
                    CallingName = request.CallingName,
                    ReferredBy = request.ReferredBy,
                    Gender = request.Gender,
                    DateOfBirthOfficial = request.DateOfBirthOfficial,
                    DateOfBirthActual = request.DateOfBirthActual,
                    MobileNumber = request.MobileNumber,
                    AlternateNumber = request.AlternateNumber,
                    PersonalEmail = request.PersonalEmail
                };


                await _userProfileRepository.CreateAsync(userProfile);


                // Assign Role and Department
                var employeeDetails = new Employeedetailsmaster
                {
                    EmployeeId = employee.EmployeeId,
                    RoleId = request.RoleId,
                    DepartmentId = request.DepartmentId
                };


                await _employeeDetailsRepository.CreateAsync(employeeDetails);


                // Send welcome email
                await _emailService.SendWelcomeEmailAsync(request.Email, request.FirstName, temporaryPassword);


                EEPZBusinessLog.Information($"User created successfully: {request.Email} with Employee ID: {request.EmployeeCompanyId}");


                // Fetch complete user data
                var createdUser = await _userAuthRepository.GetByIdAsync(userAuth.UserId);
                var userResponse = MapToUserResponse(createdUser!);


                return ApiResponseDto<UserResponseDto>.SuccessResponse(userResponse, Constants.Messages.UserCreatedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error creating user: {request.Email}", ex);
                return ApiResponseDto<UserResponseDto>.FailureResponse("An error occurred while creating user");
            }
        }


        public async Task<ApiResponseDto<UserResponseDto>> UpdateUserAsync(UpdateUserRequestDto request, int updatedByUserId)
        {
            try
            {
                var user = await _userAuthRepository.GetByIdAsync(request.UserId);
                if (user == null)
                {
                    return ApiResponseDto<UserResponseDto>.FailureResponse(Constants.Messages.UserNotFound);
                }


                var employee = user.Employee;


                // Update Employee fields if provided
                if (request.EmploymentType != null) employee.EmploymentType = request.EmploymentType;
                if (request.EmploymentStatus != null) employee.EmploymentStatus = request.EmploymentStatus;
                if (request.ReportingManagerEmployeeId.HasValue) employee.ReportingManagerEmployeeId = request.ReportingManagerEmployeeId;
                if (request.WorkLocation != null) employee.WorkLocation = request.WorkLocation;
                if (request.EmployeeType != null) employee.EmployeeType = request.EmployeeType;
                if (request.NoticePeriodDays.HasValue) employee.NoticePeriodDays = request.NoticePeriodDays.Value;
                if (request.IsActive.HasValue) employee.IsActive = request.IsActive.Value;


                employee.UpdatedByUserId = updatedByUserId;
                await _employeeRepository.UpdateAsync(employee);


                // Update User Authentication status if provided
                if (request.Status != null)
                {
                    user.Status = request.Status;
                    await _userAuthRepository.UpdateAsync(user);
                }


                EEPZBusinessLog.Information($"User updated successfully: UserId {request.UserId}");


                var updatedUser = await _userAuthRepository.GetByIdAsync(request.UserId);
                var userResponse = MapToUserResponse(updatedUser!);


                return ApiResponseDto<UserResponseDto>.SuccessResponse(userResponse, Constants.Messages.UserUpdatedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error updating user: UserId {request.UserId}", ex);
                return ApiResponseDto<UserResponseDto>.FailureResponse("An error occurred while updating user");
            }
        }


        public async Task<ApiResponseDto<UserResponseDto>> GetUserByIdAsync(int userId)
        {
            try
            {
                var user = await _userAuthRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return ApiResponseDto<UserResponseDto>.FailureResponse(Constants.Messages.UserNotFound);
                }


                var userResponse = MapToUserResponse(user);
                return ApiResponseDto<UserResponseDto>.SuccessResponse(userResponse, "User retrieved successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error retrieving user: UserId {userId}", ex);
                return ApiResponseDto<UserResponseDto>.FailureResponse("An error occurred while retrieving user");
            }
        }


        public async Task<ApiResponseDto<List<UserResponseDto>>> GetAllUsersAsync()
        {
            try
            {
                var users = await _userAuthRepository.GetAllAsync();
                var userResponses = users.Select(MapToUserResponse).ToList();
                return ApiResponseDto<List<UserResponseDto>>.SuccessResponse(userResponses, "Users retrieved successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error retrieving all users", ex);
                return ApiResponseDto<List<UserResponseDto>>.FailureResponse("An error occurred while retrieving users");
            }
        }


        public async Task<ApiResponseDto<string>> DeactivateUserAsync(int userId)
        {
            try
            {
                var user = await _userAuthRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return ApiResponseDto<string>.FailureResponse(Constants.Messages.UserNotFound);
                }


                user.Status = Constants.UserStatuses.Inactive;
                user.Employee.IsActive = false;
                await _userAuthRepository.UpdateAsync(user);


                EEPZBusinessLog.Information($"User deactivated: UserId {userId}");
                return ApiResponseDto<string>.SuccessResponse("User deactivated successfully", "User deactivated successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error deactivating user: UserId {userId}", ex);
                return ApiResponseDto<string>.FailureResponse("An error occurred while deactivating user");
            }
        }


        public async Task<ApiResponseDto<string>> ActivateUserAsync(int userId)
        {
            try
            {
                var user = await _userAuthRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return ApiResponseDto<string>.FailureResponse(Constants.Messages.UserNotFound);
                }


                user.Status = Constants.UserStatuses.Active;
                user.Employee.IsActive = true;
                await _userAuthRepository.UpdateAsync(user);


                EEPZBusinessLog.Information($"User activated: UserId {userId}");
                return ApiResponseDto<string>.SuccessResponse("User activated successfully", "User activated successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error activating user: UserId {userId}", ex);
                return ApiResponseDto<string>.FailureResponse("An error occurred while activating user");
            }
        }


        public async Task<ApiResponseDto<string>> AssignRoleAndDepartmentAsync(AssignRoleDepartmentRequestDto request)
        {
            try
            {
                var existingDetails = await _employeeDetailsRepository.GetByEmployeeIdAsync(request.EmployeeId);


                if (existingDetails != null)
                {
                    existingDetails.RoleId = request.RoleId;
                    existingDetails.DepartmentId = request.DepartmentId;
                    await _employeeDetailsRepository.UpdateAsync(existingDetails);
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


                EEPZBusinessLog.Information($"Role and Department assigned to EmployeeId: {request.EmployeeId}");
                return ApiResponseDto<string>.SuccessResponse("Role and Department assigned successfully", "Role and Department assigned successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error assigning role and department to EmployeeId: {request.EmployeeId}", ex);
                return ApiResponseDto<string>.FailureResponse("An error occurred while assigning role and department");
            }
        }


        public async Task<ApiResponseDto<List<UserResponseDto>>> GetEmployeesByManagerAsync(int managerId)
        {
            try
            {
                // Get the manager's employee record
                var manager = await _employeeRepository.GetByIdAsync(managerId);
                if (manager == null)
                {
                    return ApiResponseDto<List<UserResponseDto>>.FailureResponse("Manager not found");
                }


                // Get all employees where ReportingManagerEmployeeId matches the manager's EmployeeId
                var allEmployees = await _employeeRepository.GetAllAsync();
                var reportingEmployees = allEmployees
                    .Where(e => e.ReportingManagerEmployeeId == manager.EmployeeId && e.IsActive == true)
                    .ToList();


                // Get user authentication data for these employees
                var userResponses = new List<UserResponseDto>();


                foreach (var employee in reportingEmployees)
                {
                    var userAuth = await _userAuthRepository.GetByEmployeeIdAsync(employee.EmployeeId);
                    if (userAuth != null)
                    {
                        userResponses.Add(MapToUserResponse(userAuth));
                    }
                }


                EEPZBusinessLog.Information($"Retrieved {userResponses.Count} employees for manager: {managerId}");
                return ApiResponseDto<List<UserResponseDto>>.SuccessResponse(
                    userResponses,
                    $"Found {userResponses.Count} employees"
                );
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error retrieving employees for manager: {managerId}", ex);
                return ApiResponseDto<List<UserResponseDto>>.FailureResponse(
                    "An error occurred while retrieving employees"
                );
            }
        }


        private UserResponseDto MapToUserResponse(Userauthentication user)
        {
            var profile = user.Employee?.Userprofile;
            var employeeDetails = user.Employee?.Employeedetailsmasters?.FirstOrDefault();


            return new UserResponseDto
            {
                UserId = user.UserId,
                EmployeeId = user.EmployeeId,
                EmployeeCompanyId = user.Employee?.EmployeeCompanyId ?? string.Empty,
                Email = user.Email,
                Status = user.Status,
                IsFirstLogin = user.IsFirstLogin ?? false,
                LastLoginAt = user.LastLoginAt,
                EmploymentType = user.Employee?.EmploymentType ?? string.Empty,
                EmploymentStatus = user.Employee?.EmploymentStatus ?? string.Empty,
                JoiningDate = user.Employee?.JoiningDate ?? DateOnly.MinValue,
                ConfirmationDate = user.Employee?.ConfirmationDate,
                ExitDate = user.Employee?.ExitDate,
                WorkLocation = user.Employee?.WorkLocation,
                EmployeeType = user.Employee?.EmployeeType ?? string.Empty,
                NoticePeriodDays = user.Employee?.NoticePeriodDays ?? 0,
                IsActive = user.Employee?.IsActive ?? false,
                FirstName = profile?.FirstName ?? string.Empty,
                MiddleName = profile?.MiddleName,
                LastName = profile?.LastName ?? string.Empty,
                CallingName = profile?.CallingName,
                Gender = profile?.Gender,
                DateOfBirthOfficial = profile?.DateOfBirthOfficial,
                MobileNumber = profile?.MobileNumber,
                PersonalEmail = profile?.PersonalEmail,
                RoleName = employeeDetails?.Role?.RoleName,
                DepartmentName = employeeDetails?.Department?.DepartmentName
            };
        }
        
        public async Task<string> GetNextEmployeeCompanyIdAsync()
        {
            return await _employeeRepository.GetNextEmployeeCompanyIdAsync();
        }

    }
}

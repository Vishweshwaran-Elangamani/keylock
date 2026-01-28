using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Common.Constants;
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
        public async Task<UserResponseDto> CreateUserAsync(CreateUserRequestDto request, int createdByUserId)
        {
            if (await _userAuthRepository.EmailExistsAsync(request.Email))
            {
                throw new InvalidOperationException(Constants.Messages.EmailAlreadyExists);
            }
            if (string.IsNullOrWhiteSpace(request.EmployeeCompanyId))
            {
                request.EmployeeCompanyId = await _employeeRepository.GetNextEmployeeCompanyIdAsync();
                EEPZBusinessLog.Information($"Auto-generated Employee Company ID: {request.EmployeeCompanyId}");
            }
            else
            {
                if (await _employeeRepository.EmployeeCompanyIdExistsAsync(request.EmployeeCompanyId))
                {
                    throw new InvalidOperationException(Constants.Messages.EmployeeIdAlreadyExists);
                }
            }
            var cleanedMobileNumber = request.MobileNumber;
            if (!string.IsNullOrWhiteSpace(cleanedMobileNumber))
            {
                cleanedMobileNumber = cleanedMobileNumber
                    .Replace(UserManagementConstants.Prefixes.CountryCodeIndiaWithDash, UserManagementConstants.Separators.EmptyString)
                    .Replace(UserManagementConstants.Prefixes.CountryCodeIndia, UserManagementConstants.Separators.EmptyString)
                    .Replace(UserManagementConstants.Separators.Dash, UserManagementConstants.Separators.EmptyString)
                    .Replace(UserManagementConstants.Separators.Space, UserManagementConstants.Separators.EmptyString)
                    .Trim();
            }
            var cleanedAlternateNumber = request.AlternateNumber;
            if (!string.IsNullOrWhiteSpace(cleanedAlternateNumber))
            {
                cleanedAlternateNumber = cleanedAlternateNumber
                    .Replace(UserManagementConstants.Prefixes.CountryCodeIndiaWithDash, UserManagementConstants.Separators.EmptyString)
                    .Replace(UserManagementConstants.Prefixes.CountryCodeIndia, UserManagementConstants.Separators.EmptyString)
                    .Replace(UserManagementConstants.Separators.Dash, UserManagementConstants.Separators.EmptyString)
                    .Replace(UserManagementConstants.Separators.Space, UserManagementConstants.Separators.EmptyString)
                    .Trim();
            }
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
            var temporaryPassword = _passwordService.GenerateTemporaryPassword();
            var hashedPassword = _passwordService.HashPassword(temporaryPassword);
            Console.WriteLine($"Generated Temp Password: {temporaryPassword}");
            Console.WriteLine($"Hashed Password Length: {hashedPassword.Length}");
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
                MobileNumber = cleanedMobileNumber,
                AlternateNumber = cleanedAlternateNumber,
                PersonalEmail = request.PersonalEmail
            };
            await _userProfileRepository.CreateAsync(userProfile);
            var employeeDetails = new Employeedetailsmaster
            {
                EmployeeId = employee.EmployeeId,
                RoleId = request.RoleId,
                DepartmentId = request.DepartmentId
            };
            await _employeeDetailsRepository.CreateAsync(employeeDetails);
            await _emailService.SendWelcomeEmailAsync(request.Email, request.FirstName, temporaryPassword);
            EEPZBusinessLog.Information($"User created successfully: {request.Email} with Employee ID: {request.EmployeeCompanyId}");
            var createdUser = await _userAuthRepository.GetByIdAsync(userAuth.UserId);
            var profile = createdUser!.Employee?.Userprofile;
            var empDetails = createdUser.Employee?.Employeedetailsmasters?.FirstOrDefault();
            var userResponse = new UserResponseDto
            {
                UserId = createdUser.UserId,
                EmployeeId = createdUser.EmployeeId,
                EmployeeCompanyId = createdUser.Employee?.EmployeeCompanyId ?? string.Empty,
                Email = createdUser.Email,
                Status = createdUser.Status,
                IsFirstLogin = createdUser.IsFirstLogin ?? false,
                LastLoginAt = createdUser.LastLoginAt,
                EmploymentType = createdUser.Employee?.EmploymentType ?? string.Empty,
                EmploymentStatus = createdUser.Employee?.EmploymentStatus ?? string.Empty,
                JoiningDate = createdUser.Employee?.JoiningDate ?? DateOnly.MinValue,
                ConfirmationDate = createdUser.Employee?.ConfirmationDate,
                ExitDate = createdUser.Employee?.ExitDate,
                WorkLocation = createdUser.Employee?.WorkLocation,
                EmployeeType = createdUser.Employee?.EmployeeType ?? string.Empty,
                NoticePeriodDays = createdUser.Employee?.NoticePeriodDays ?? 0,
                IsActive = createdUser.Employee?.IsActive ?? false,
                FirstName = profile?.FirstName ?? string.Empty,
                MiddleName = profile?.MiddleName,
                LastName = profile?.LastName ?? string.Empty,
                CallingName = profile?.CallingName,
                Gender = profile?.Gender,
                DateOfBirthOfficial = profile?.DateOfBirthOfficial,
                MobileNumber = profile?.MobileNumber,
                PersonalEmail = profile?.PersonalEmail,
                RoleName = empDetails?.Role?.RoleName,
                DepartmentName = empDetails?.Department?.DepartmentName
            };
            return userResponse;
        }
        public async Task<UserResponseDto> UpdateUserAsync(UpdateUserRequestDto request, int updatedByUserId)
        {
            var user = await _userAuthRepository.GetByIdAsync(request.UserId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {request.UserId} not found");
            }
            var employee = user.Employee;
            if (request.EmploymentType != null) employee.EmploymentType = request.EmploymentType;
            if (request.EmploymentStatus != null) employee.EmploymentStatus = request.EmploymentStatus;
            if (request.ReportingManagerEmployeeId.HasValue) employee.ReportingManagerEmployeeId = request.ReportingManagerEmployeeId;
            if (request.WorkLocation != null) employee.WorkLocation = request.WorkLocation;
            if (request.EmployeeType != null) employee.EmployeeType = request.EmployeeType;
            if (request.NoticePeriodDays.HasValue) employee.NoticePeriodDays = request.NoticePeriodDays.Value;
            if (request.IsActive.HasValue) employee.IsActive = request.IsActive.Value;
            employee.UpdatedByUserId = updatedByUserId;
            await _employeeRepository.UpdateAsync(employee);
            if (request.Status != null)
            {
                user.Status = request.Status;
                await _userAuthRepository.UpdateAsync(user);
            }
            EEPZBusinessLog.Information($"User updated successfully: UserId {request.UserId}");
            var updatedUser = await _userAuthRepository.GetByIdAsync(request.UserId);
            var profile = updatedUser!.Employee?.Userprofile;
            var empDetails = updatedUser.Employee?.Employeedetailsmasters?.FirstOrDefault();
            var userResponse = new UserResponseDto
            {
                UserId = updatedUser.UserId,
                EmployeeId = updatedUser.EmployeeId,
                EmployeeCompanyId = updatedUser.Employee?.EmployeeCompanyId ?? string.Empty,
                Email = updatedUser.Email,
                Status = updatedUser.Status,
                IsFirstLogin = updatedUser.IsFirstLogin ?? false,
                LastLoginAt = updatedUser.LastLoginAt,
                EmploymentType = updatedUser.Employee?.EmploymentType ?? string.Empty,
                EmploymentStatus = updatedUser.Employee?.EmploymentStatus ?? string.Empty,
                JoiningDate = updatedUser.Employee?.JoiningDate ?? DateOnly.MinValue,
                ConfirmationDate = updatedUser.Employee?.ConfirmationDate,
                ExitDate = updatedUser.Employee?.ExitDate,
                WorkLocation = updatedUser.Employee?.WorkLocation,
                EmployeeType = updatedUser.Employee?.EmployeeType ?? string.Empty,
                NoticePeriodDays = updatedUser.Employee?.NoticePeriodDays ?? 0,
                IsActive = updatedUser.Employee?.IsActive ?? false,
                FirstName = profile?.FirstName ?? string.Empty,
                MiddleName = profile?.MiddleName,
                LastName = profile?.LastName ?? string.Empty,
                CallingName = profile?.CallingName,
                Gender = profile?.Gender,
                DateOfBirthOfficial = profile?.DateOfBirthOfficial,
                MobileNumber = profile?.MobileNumber,
                PersonalEmail = profile?.PersonalEmail,
                RoleName = empDetails?.Role?.RoleName,
                DepartmentName = empDetails?.Department?.DepartmentName
            };
            return userResponse;
        }
        public async Task<UserResponseDto> GetUserByIdAsync(int userId)
        {
            var user = await _userAuthRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }
            var profile = user.Employee?.Userprofile;
            var empDetails = user.Employee?.Employeedetailsmasters?.FirstOrDefault();
            var userResponse = new UserResponseDto
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
                RoleName = empDetails?.Role?.RoleName,
                DepartmentName = empDetails?.Department?.DepartmentName
            };
            return userResponse;
        }
        public async Task<List<UserResponseDto>> GetAllUsersAsync()
        {
            var users = await _userAuthRepository.GetAllAsync();
            var userResponses = users.Select(user =>
            {
                var profile = user.Employee?.Userprofile;
                var empDetails = user.Employee?.Employeedetailsmasters?.FirstOrDefault();
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
                    RoleName = empDetails?.Role?.RoleName,
                    DepartmentName = empDetails?.Department?.DepartmentName
                };
            }).ToList();
            return userResponses;
        }
        public async Task DeactivateUserAsync(int userId)
        {
            var user = await _userAuthRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }
            user.Status = Constants.UserStatuses.Inactive;
            user.Employee.IsActive = false;
            await _userAuthRepository.UpdateAsync(user);
            EEPZBusinessLog.Information($"User deactivated: UserId {userId}");
        }
        public async Task ActivateUserAsync(int userId)
        {
            var user = await _userAuthRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }
            user.Status = Constants.UserStatuses.Active;
            user.Employee.IsActive = true;
            await _userAuthRepository.UpdateAsync(user);
            EEPZBusinessLog.Information($"User activated: UserId {userId}");
        }
        public async Task AssignRoleAndDepartmentAsync(AssignRoleDepartmentRequestDto request)
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
        }
        public async Task<List<UserResponseDto>> GetEmployeesByManagerAsync(int managerId)
        {
            var manager = await _employeeRepository.GetByIdAsync(managerId);
            if (manager == null)
            {
                throw new KeyNotFoundException($"Manager with ID {managerId} not found");
            }
            var allEmployees = await _employeeRepository.GetAllAsync();
            var reportingEmployees = allEmployees
                .Where(e => e.ReportingManagerEmployeeId == manager.EmployeeId && e.IsActive == true)
                .ToList();
            var userResponses = new List<UserResponseDto>();
            foreach (var employee in reportingEmployees)
            {
                var userAuth = await _userAuthRepository.GetByEmployeeIdAsync(employee.EmployeeId);
                if (userAuth != null)
                {
                    var profile = userAuth.Employee?.Userprofile;
                    var empDetails = userAuth.Employee?.Employeedetailsmasters?.FirstOrDefault();
                    var userResponse = new UserResponseDto
                    {
                        UserId = userAuth.UserId,
                        EmployeeId = userAuth.EmployeeId,
                        EmployeeCompanyId = userAuth.Employee?.EmployeeCompanyId ?? string.Empty,
                        Email = userAuth.Email,
                        Status = userAuth.Status,
                        IsFirstLogin = userAuth.IsFirstLogin ?? false,
                        LastLoginAt = userAuth.LastLoginAt,
                        EmploymentType = userAuth.Employee?.EmploymentType ?? string.Empty,
                        EmploymentStatus = userAuth.Employee?.EmploymentStatus ?? string.Empty,
                        JoiningDate = userAuth.Employee?.JoiningDate ?? DateOnly.MinValue,
                        ConfirmationDate = userAuth.Employee?.ConfirmationDate,
                        ExitDate = userAuth.Employee?.ExitDate,
                        WorkLocation = userAuth.Employee?.WorkLocation,
                        EmployeeType = userAuth.Employee?.EmployeeType ?? string.Empty,
                        NoticePeriodDays = userAuth.Employee?.NoticePeriodDays ?? 0,
                        IsActive = userAuth.Employee?.IsActive ?? false,
                        FirstName = profile?.FirstName ?? string.Empty,
                        MiddleName = profile?.MiddleName,
                        LastName = profile?.LastName ?? string.Empty,
                        CallingName = profile?.CallingName,
                        Gender = profile?.Gender,
                        DateOfBirthOfficial = profile?.DateOfBirthOfficial,
                        MobileNumber = profile?.MobileNumber,
                        PersonalEmail = profile?.PersonalEmail,
                        RoleName = empDetails?.Role?.RoleName,
                        DepartmentName = empDetails?.Department?.DepartmentName
                    };
                    userResponses.Add(userResponse);
                }
            }
            EEPZBusinessLog.Information($"Retrieved {userResponses.Count} employees for manager: {managerId}");
            return userResponses;
        }
        public async Task<string> GetNextEmployeeCompanyIdAsync()
        {
            return await _employeeRepository.GetNextEmployeeCompanyIdAsync();
        }
    }
}

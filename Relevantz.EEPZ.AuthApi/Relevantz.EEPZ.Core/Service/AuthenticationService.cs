// using Relevantz.EEPZ.Common.Entities;
// using Relevantz.EEPZ.Data.IRepository;
// using Relevantz.EEPZ.Core.IService;
// using Relevantz.EEPZ.Common.Utils;
// using Microsoft.Extensions.Configuration;
// using Relevantz.EEPZ.Common.DTOs.Request;
// using Relevantz.EEPZ.Common.DTOs.Response;
// using Relevantz.EEPZ.Common.Constants;
// using MapsterMapper;

// namespace Relevantz.EEPZ.Core.Service
// {
//     public class AuthenticationService : IAuthenticationService
//     {
//         private readonly IUserAuthenticationRepository _userAuthRepository;
//         private readonly ILoginAttemptRepository _loginAttemptRepository;
//         private readonly IPasswordService _passwordService;
//         private readonly IOtpService _otpService;
//         private readonly ITokenService _tokenService;
//         private readonly IEmailService _emailService;
//         private readonly IConfiguration _configuration;
//         private readonly IMapper _mapper;

//         public AuthenticationService(
//             IUserAuthenticationRepository userAuthRepository,
//             ILoginAttemptRepository loginAttemptRepository,
//             IPasswordService passwordService,
//             IOtpService otpService,
//             ITokenService tokenService,
//             IEmailService emailService,
//             IConfiguration configuration,
//             IMapper mapper)
//         {
//             _userAuthRepository = userAuthRepository;
//             _loginAttemptRepository = loginAttemptRepository;
//             _passwordService = passwordService;
//             _otpService = otpService;
//             _tokenService = tokenService;
//             _emailService = emailService;
//             _configuration = configuration;
//             _mapper = mapper;
//         }

//         public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
//         {
//             var user = await _userAuthRepository.GetByEmailAsync(request.Email);

//             var loginAttempt = new Loginattempt
//             {
//                 Email = request.Email,
//                 AttemptTime = DateTime.UtcNow,
//                 IpAddress = request.IpAddress,
//                 UserAgent = request.UserAgent,
//                 IsSuccessful = false
//             };

//             if (user == null)
//             {
//                 loginAttempt.FailureReason = MessageConstants.InvalidCredentials;
//                 await _loginAttemptRepository.CreateAsync(loginAttempt);
//                 throw new UnauthorizedAccessException(MessageConstants.InvalidCredentials);
//             }

//             if (user.Status == Constants.UserStatuses.Inactive)
//             {
//                 loginAttempt.UserId = user.UserId;
//                 loginAttempt.FailureReason = MessageConstants.AccountInactive;
//                 await _loginAttemptRepository.CreateAsync(loginAttempt);
//                 throw new InvalidOperationException(MessageConstants.AccountInactive);
//             }

//             if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
//             {
//                 loginAttempt.UserId = user.UserId;
//                 loginAttempt.FailureReason = MessageConstants.InvalidCredentials;
//                 await _loginAttemptRepository.CreateAsync(loginAttempt);
//                 await CheckAndLockAccountAsync(user);
//                 throw new UnauthorizedAccessException(MessageConstants.InvalidCredentials);
//             }

//             // ✅ FIXED: Use RoleName instead of Name
//             var roleName = user.Employee?.Employeedetailsmasters?.FirstOrDefault()?.Role?.RoleName
//                 ?? Constants.Roles.User;

//             // First login - requires password reset
//             if (user.IsFirstLogin == true)
//             {
//                 await _otpService.GenerateOtpAsync(user.Email, Constants.OtpTypes.ForgotPassword);
//                 loginAttempt.IsSuccessful = false;
//                 loginAttempt.UserId = user.UserId;
//                 loginAttempt.FailureReason = "First login - Password reset required";
//                 await _loginAttemptRepository.CreateAsync(loginAttempt);

//                 EEPZBusinessLog.Information($"First login detected for {user.Email}");

//                 return new LoginResponseDto
//                 {
//                     RequiresTwoFactor = false,
//                     RequiresPasswordReset = true
//                 };
//             }

//             // Admin requires 2FA
//             if (roleName == Constants.Roles.Admin)
//             {
//                 await _otpService.GenerateOtpAsync(user.Email, Constants.OtpTypes.Login2FA);
//                 loginAttempt.IsSuccessful = true;
//                 loginAttempt.UserId = user.UserId;
//                 await _loginAttemptRepository.CreateAsync(loginAttempt);

//                 return new LoginResponseDto
//                 {
//                     RequiresTwoFactor = true,
//                     RequiresPasswordReset = false
//                 };
//             }

//             // Regular login
//             var accessToken = _tokenService.GenerateAccessToken(user, roleName);
//             var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.UserId, request.IpAddress);

//             await _userAuthRepository.UpdateLastLoginAsync(user.UserId);

//             loginAttempt.IsSuccessful = true;
//             loginAttempt.UserId = user.UserId;
//             await _loginAttemptRepository.CreateAsync(loginAttempt);

//             // ✅ Map to UserResponseDto (matches LoginResponseDto.User type)
//             var userResponse = _mapper.Map<UserResponseDto>(user);
//             var employeeMasterId = user.Employee?.Employeedetailsmasters?.FirstOrDefault()?.EmployeeMasterId;

//             EEPZBusinessLog.Information($"User logged in successfully: {user.Email}");

//             return new LoginResponseDto
//             {
//                 RequiresTwoFactor = false,
//                 RequiresPasswordReset = false,
//                 AccessToken = accessToken,
//                 Token = accessToken, // ✅ Added for backward compatibility
//                 RefreshToken = refreshToken,
//                 TokenExpiration = DateTime.UtcNow.AddMinutes(
//                     _configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes", 60)),
//                 User = userResponse,
//                 EmployeeMasterId = employeeMasterId
//             };
//         }

//         public async Task<LoginResponseDto> VerifyOtpAndLoginAsync(VerifyOtpRequestDto request)
//         {
//             var isValid = await _otpService.VerifyOtpAsync(request.Email, request.OtpCode, request.OtpType);
//             if (!isValid)
//                 throw new UnauthorizedAccessException(MessageConstants.OtpInvalid);

//             var user = await _userAuthRepository.GetByEmailAsync(request.Email);
//             if (user == null)
//                 throw new KeyNotFoundException(MessageConstants.UserNotFound);

//             // ✅ FIXED: Use RoleName
//             var roleName = user.Employee?.Employeedetailsmasters?.FirstOrDefault()?.Role?.RoleName
//                 ?? Constants.Roles.User;

//             var accessToken = _tokenService.GenerateAccessToken(user, roleName);
//             var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.UserId, null);

//             await _userAuthRepository.UpdateLastLoginAsync(user.UserId);

//             var userResponse = _mapper.Map<UserResponseDto>(user);
//             var employeeMasterId = user.Employee?.Employeedetailsmasters?.FirstOrDefault()?.EmployeeMasterId;

//             EEPZBusinessLog.Information($"Admin logged in successfully with 2FA: {user.Email}");

//             return new LoginResponseDto
//             {
//                 RequiresTwoFactor = false,
//                 RequiresPasswordReset = false,
//                 AccessToken = accessToken,
//                 Token = accessToken, // ✅ Added
//                 RefreshToken = refreshToken,
//                 TokenExpiration = DateTime.UtcNow.AddMinutes(
//                     _configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes", 60)),
//                 User = userResponse,
//                 EmployeeMasterId = employeeMasterId
//             };
//         }

//         public async Task ForgotPasswordAsync(ForgotPasswordRequestDto request)
//         {
//             var user = await _userAuthRepository.GetByEmailAsync(request.Email);

//             if (user == null)
//             {
//                 EEPZBusinessLog.Warning($"Password reset attempt for non-existent email: {request.Email}");
//                 throw new KeyNotFoundException(MessageConstants.EmailNotRegistered);
//             }

//             var employeeCompanyId = user.Employee?.EmployeeCompanyId;
//             if (!string.IsNullOrEmpty(employeeCompanyId) && employeeCompanyId == "1000")
//             {
//                 EEPZBusinessLog.Warning($"Password reset blocked for protected employee: {user.Email}");
//                 throw new InvalidOperationException(MessageConstants.PasswordResetBlocked);
//             }

//             await _otpService.GenerateOtpAsync(request.Email, Constants.OtpTypes.ForgotPassword);

//             EEPZBusinessLog.Information($"Password reset OTP sent to: {user.Email}");
//         }

//         public async Task ResetPasswordAsync(ResetPasswordRequestDto request)
//         {
//             var user = await _userAuthRepository.GetByEmailAsync(request.Email);
//             if (user == null)
//                 throw new KeyNotFoundException(MessageConstants.UserNotFound);

//             var employeeCompanyId = user.Employee?.EmployeeCompanyId;
//             if (!string.IsNullOrEmpty(employeeCompanyId) && employeeCompanyId == "1000")
//             {
//                 EEPZBusinessLog.Warning($"Password reset blocked for protected employee: {user.Email}");
//                 throw new InvalidOperationException(MessageConstants.PasswordResetBlocked);
//             }

//             var isOtpValid = await _otpService.VerifyOtpAsync(
//                 request.Email, request.OtpCode, Constants.OtpTypes.ForgotPassword);
//             if (!isOtpValid)
//                 throw new UnauthorizedAccessException(MessageConstants.InvalidOrExpiredOtp);

//             if (!_passwordService.ValidatePasswordStrength(request.NewPassword))
//                 throw new ArgumentException(MessageConstants.WeakPassword);

//             user.PasswordHash = _passwordService.HashPassword(request.NewPassword);
//             user.IsFirstLogin = false;
//             user.UpdatedAt = DateTime.UtcNow;

//             await _userAuthRepository.UpdateAsync(user);

//             var firstName = user.Employee?.Userprofile?.FirstName ?? "User";
//             await _emailService.SendPasswordResetConfirmationAsync(user.Email, firstName);

//             EEPZBusinessLog.Information($"Password reset successful for: {request.Email}");
//         }

//         public async Task ChangePasswordAsync(int userId, ChangePasswordRequestDto request)
//         {
//             var user = await _userAuthRepository.GetByIdAsync(userId);
//             if (user == null)
//                 throw new KeyNotFoundException(MessageConstants.UserNotFound);

//             var employeeCompanyId = user.Employee?.EmployeeCompanyId;
//             if (!string.IsNullOrEmpty(employeeCompanyId) && employeeCompanyId == "1000")
//             {
//                 EEPZBusinessLog.Warning($"Password change blocked for protected employee: UserId {userId}");
//                 throw new InvalidOperationException(MessageConstants.PasswordChangeBlocked);
//             }

//             if (user.IsFirstLogin == false)
//             {
//                 if (!_passwordService.VerifyPassword(request.CurrentPassword, user.PasswordHash))
//                     throw new UnauthorizedAccessException(MessageConstants.InvalidCurrentPassword);
//             }

//             if (!_passwordService.ValidatePasswordStrength(request.NewPassword))
//                 throw new ArgumentException(MessageConstants.WeakPassword);

//             user.PasswordHash = _passwordService.HashPassword(request.NewPassword);
//             user.IsFirstLogin = false;
//             user.UpdatedAt = DateTime.UtcNow;

//             await _userAuthRepository.UpdateAsync(user);

//             EEPZBusinessLog.Information($"Password changed for UserId: {userId}");
//         }

//         public async Task LogoutAsync(int userId)
//         {
//             await _tokenService.RevokeAllUserTokensAsync(userId);
//             EEPZBusinessLog.Information($"User logged out: UserId {userId}");
//         }

//         public async Task<LoginResponseDto> KeycloakLoginAsync(string keycloakToken)
//         {
//             EEPZBusinessLog.Information("Keycloak token exchange initiated");

//             var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();

//             if (!handler.CanReadToken(keycloakToken))
//                 throw new UnauthorizedAccessException("Invalid Keycloak token format");

//             var jwtToken = handler.ReadJwtToken(keycloakToken);

//             var email = jwtToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value;

//             if (string.IsNullOrEmpty(email))
//                 throw new UnauthorizedAccessException("Email claim not found in Keycloak token");

//             var user = await _userAuthRepository.GetByEmailAsync(email);
//             if (user == null)
//                 throw new KeyNotFoundException($"User '{email}' not found in system");

//             // ✅ FIXED: Use RoleName
//             var roleName = user.Employee?.Employeedetailsmasters?.FirstOrDefault()?.Role?.RoleName
//                 ?? Constants.Roles.User;

//             var accessToken = _tokenService.GenerateAccessToken(user, roleName);
//             var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.UserId, null);

//             await _userAuthRepository.UpdateLastLoginAsync(user.UserId);

//             var userResponse = _mapper.Map<UserResponseDto>(user);
//             var employeeMasterId = user.Employee?.Employeedetailsmasters?.FirstOrDefault()?.EmployeeMasterId;

//             EEPZBusinessLog.Information($"Keycloak login successful for: {email}");

//             return new LoginResponseDto
//             {
//                 RequiresTwoFactor = false,
//                 RequiresPasswordReset = false,
//                 AccessToken = accessToken,
//                 Token = accessToken, // ✅ Added
//                 RefreshToken = refreshToken,
//                 TokenExpiration = DateTime.UtcNow.AddMinutes(
//                     _configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes", 60)),
//                 User = userResponse,
//                 EmployeeMasterId = employeeMasterId
//             };
//         }

//         private async Task CheckAndLockAccountAsync(Userauthentication user)
//         {
//             var maxFailedAttempts = _configuration.GetValue<int>("LoginSettings:MaxFailedAttempts", 5);
//             var lockoutDurationMinutes = _configuration.GetValue<int>("LoginSettings:LockoutDurationMinutes", 30);

//             var failedAttempts = await _loginAttemptRepository.GetFailedAttemptsCountAsync(
//                 user.Email,
//                 DateTime.UtcNow.AddMinutes(-lockoutDurationMinutes));

//             if (failedAttempts >= maxFailedAttempts)
//             {
//                 user.Status = Constants.UserStatuses.Locked;
//                 await _userAuthRepository.UpdateAsync(user);
//                 EEPZBusinessLog.Warning($"Account locked: {user.Email}");
//             }
//         }
//     }
// }
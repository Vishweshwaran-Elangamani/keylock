using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.Extensions.Configuration;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Service
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly IUserAuthenticationRepository _userAuthRepository;
        private readonly ILoginAttemptRepository _loginAttemptRepository;
        private readonly IPasswordService _passwordService;
        private readonly IOtpService _otpService;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public AuthenticationService(
            IUserAuthenticationRepository userAuthRepository,
            ILoginAttemptRepository loginAttemptRepository,
            IPasswordService passwordService,
            IOtpService otpService,
            ITokenService tokenService,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _userAuthRepository = userAuthRepository;
            _loginAttemptRepository = loginAttemptRepository;
            _passwordService = passwordService;
            _otpService = otpService;
            _tokenService = tokenService;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<ApiResponseDto<LoginResponseDto>> LoginAsync(LoginRequestDto request)
        {
            try
            {
                var user = await _userAuthRepository.GetByEmailAsync(request.Email);

                var loginAttempt = new Loginattempt
                {
                    Email = request.Email,
                    AttemptTime = DateTime.UtcNow,
                    IpAddress = request.IpAddress,
                    UserAgent = request.UserAgent,
                    IsSuccessful = false
                };

                if (user == null)
                {
                    loginAttempt.FailureReason = Constants.Messages.InvalidCredentials;
                    await _loginAttemptRepository.CreateAsync(loginAttempt);
                    return ApiResponseDto<LoginResponseDto>.FailureResponse(Constants.Messages.InvalidCredentials);
                }

                if (user.Status == Constants.UserStatuses.Inactive)
                {
                    loginAttempt.UserId = user.UserId;
                    loginAttempt.FailureReason = Constants.Messages.AccountInactive;
                    await _loginAttemptRepository.CreateAsync(loginAttempt);
                    return ApiResponseDto<LoginResponseDto>.FailureResponse(Constants.Messages.AccountInactive);
                }

                if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
                {
                    loginAttempt.UserId = user.UserId;
                    loginAttempt.FailureReason = Constants.Messages.InvalidCredentials;
                    await _loginAttemptRepository.CreateAsync(loginAttempt);

                    await CheckAndLockAccountAsync(user);

                    return ApiResponseDto<LoginResponseDto>.FailureResponse(Constants.Messages.InvalidCredentials);
                }

                var roleName = user.Employee?.Employeedetailsmasters?.FirstOrDefault()?.Role?.RoleName ?? Constants.Roles.User;

                if (user.IsFirstLogin == true)
                {
                    await _otpService.GenerateOtpAsync(user.Email, Constants.OtpTypes.ForgotPassword);

                    loginAttempt.IsSuccessful = false;
                    loginAttempt.UserId = user.UserId;
                    loginAttempt.FailureReason = "First login - Password reset required";
                    await _loginAttemptRepository.CreateAsync(loginAttempt);

                    EEPZBusinessLog.Information($"First login detected for {user.Email} - Password reset required");

                    return ApiResponseDto<LoginResponseDto>.SuccessResponse(
                        new LoginResponseDto
                        {
                            RequiresTwoFactor = false,
                            RequiresPasswordReset = true,
                            Message = "First login detected. Please reset your password. An OTP has been sent to your email."
                        },
                        "Password reset required");
                }

                if (roleName == Constants.Roles.Admin)
                {
                    await _otpService.GenerateOtpAsync(user.Email, Constants.OtpTypes.Login2FA);

                    loginAttempt.IsSuccessful = true;
                    loginAttempt.UserId = user.UserId;
                    await _loginAttemptRepository.CreateAsync(loginAttempt);

                    return ApiResponseDto<LoginResponseDto>.SuccessResponse(
                        new LoginResponseDto
                        {
                            RequiresTwoFactor = true,
                            RequiresPasswordReset = false,
                            Message = Constants.Messages.OtpSent
                        },
                        Constants.Messages.OtpSent);
                }

                var accessToken = _tokenService.GenerateAccessToken(user, roleName);
                var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.UserId, request.IpAddress);

                await _userAuthRepository.UpdateLastLoginAsync(user.UserId);

                loginAttempt.IsSuccessful = true;
                loginAttempt.UserId = user.UserId;
                await _loginAttemptRepository.CreateAsync(loginAttempt);

                var userResponse = MapToUserResponse(user);
                var employeeMasterId = user.Employee?.Employeedetailsmasters?.FirstOrDefault()?.EmployeeMasterId;

                EEPZBusinessLog.Information($"User logged in successfully: {user.Email}");

                return ApiResponseDto<LoginResponseDto>.SuccessResponse(
                    new LoginResponseDto
                    {
                        RequiresTwoFactor = false,
                        RequiresPasswordReset = false,
                        AccessToken = accessToken,
                        RefreshToken = refreshToken,
                        TokenExpiration = DateTime.UtcNow.AddMinutes(_configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes", 60)),
                        User = userResponse,
                        EmployeeMasterId = employeeMasterId,
                        Message = "Login successful"
                    },
                    "Login successful");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error during login for {request.Email}", ex);
                return ApiResponseDto<LoginResponseDto>.FailureResponse("An error occurred during login");
            }
        }
        public async Task<ApiResponseDto<LoginResponseDto>> VerifyOtpAndLoginAsync(VerifyOtpRequestDto request)
        {
            try
            {
                var isValid = await _otpService.VerifyOtpAsync(request.Email, request.OtpCode, request.OtpType);

                if (!isValid)
                {
                    return ApiResponseDto<LoginResponseDto>.FailureResponse(Constants.Messages.OtpInvalid);
                }

                var user = await _userAuthRepository.GetByEmailAsync(request.Email);
                if (user == null)
                {
                    return ApiResponseDto<LoginResponseDto>.FailureResponse(Constants.Messages.UserNotFound);
                }

                var roleName = user.Employee?.Employeedetailsmasters?.FirstOrDefault()?.Role?.RoleName ?? Constants.Roles.User;
                var accessToken = _tokenService.GenerateAccessToken(user, roleName);
                var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.UserId, null);

                await _userAuthRepository.UpdateLastLoginAsync(user.UserId);

                var userResponse = MapToUserResponse(user);
                var employeeMasterId = user.Employee?.Employeedetailsmasters?.FirstOrDefault()?.EmployeeMasterId;

                EEPZBusinessLog.Information($"Admin logged in successfully with 2FA: {user.Email}");

                return ApiResponseDto<LoginResponseDto>.SuccessResponse(
                    new LoginResponseDto
                    {
                        RequiresTwoFactor = false,
                        RequiresPasswordReset = false,
                        AccessToken = accessToken,
                        RefreshToken = refreshToken,
                        TokenExpiration = DateTime.UtcNow.AddMinutes(_configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes", 60)),
                        User = userResponse,
                        EmployeeMasterId = employeeMasterId,
                        Message = "Login successful"
                    },
                    "Login successful");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error verifying OTP for {request.Email}", ex);
                return ApiResponseDto<LoginResponseDto>.FailureResponse("An error occurred during OTP verification");
            }
        }


        public async Task<ApiResponseDto<OtpResponseDto>> ForgotPasswordAsync(ForgotPasswordRequestDto request)
        {
            try
            {
                var user = await _userAuthRepository.GetByEmailAsync(request.Email);
                if (user == null)
                {
                    return ApiResponseDto<OtpResponseDto>.SuccessResponse(
                        new OtpResponseDto
                        {
                            Success = true,
                            Message = Constants.Messages.OtpSent
                        },
                        Constants.Messages.OtpSent);
                }

                //  CHECK IF USER IS PROTECTED EMPLOYEE (EmployeeCompanyID = 1000)
                var employeeCompanyId = user.Employee?.EmployeeCompanyId;
                if (!string.IsNullOrEmpty(employeeCompanyId) && employeeCompanyId == "1000")
                {
                    EEPZBusinessLog.Warning($"Password reset attempt blocked for protected employee: {user.Email} (EmployeeCompanyID: {employeeCompanyId})");
                    return ApiResponseDto<OtpResponseDto>.FailureResponse(
                        "Password reset is not allowed for this account. Please contact system administrator for assistance."
                    );
                }

                await _otpService.GenerateOtpAsync(request.Email, Constants.OtpTypes.ForgotPassword);

                EEPZBusinessLog.Information($"Password reset OTP sent to: {user.Email}");

                return ApiResponseDto<OtpResponseDto>.SuccessResponse(
                    new OtpResponseDto
                    {
                        Success = true,
                        Message = Constants.Messages.OtpSent
                    },
                    Constants.Messages.OtpSent);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error in forgot password for {request.Email}", ex);
                return ApiResponseDto<OtpResponseDto>.FailureResponse("An error occurred");
            }
        }


        public async Task<ApiResponseDto<string>> ResetPasswordAsync(ResetPasswordRequestDto request)
        {
            try
            {
                var user = await _userAuthRepository.GetByEmailAsync(request.Email);
                if (user == null)
                {
                    return ApiResponseDto<string>.FailureResponse(Constants.Messages.UserNotFound);
                }

                //  CHECK IF USER IS PROTECTED EMPLOYEE (EmployeeCompanyID = 1000) - DOUBLE SECURITY
                var employeeCompanyId = user.Employee?.EmployeeCompanyId;
                if (!string.IsNullOrEmpty(employeeCompanyId) && employeeCompanyId == "1000")
                {
                    EEPZBusinessLog.Warning($"Password reset attempt blocked at reset stage for protected employee: {user.Email} (EmployeeCompanyID: {employeeCompanyId})");
                    return ApiResponseDto<string>.FailureResponse(
                        "Password reset is not allowed for this account. Please contact system administrator."
                    );
                }

                var isOtpValid = await _otpService.VerifyOtpAsync(request.Email, request.OtpCode, Constants.OtpTypes.ForgotPassword);
                if (!isOtpValid)
                {
                    return ApiResponseDto<string>.FailureResponse(Constants.Messages.InvalidOrExpiredOtp);
                }

                if (!_passwordService.ValidatePasswordStrength(request.NewPassword))
                {
                    return ApiResponseDto<string>.FailureResponse(Constants.Messages.WeakPassword);
                }

                user.PasswordHash = _passwordService.HashPassword(request.NewPassword);
                user.IsFirstLogin = false;
                user.UpdatedAt = DateTime.UtcNow;

                await _userAuthRepository.UpdateAsync(user);

                var firstName = user.Employee?.Userprofile?.FirstName ?? "User";
                await _emailService.SendPasswordResetConfirmationAsync(user.Email, firstName);

                EEPZBusinessLog.Information($"Password reset successful for: {request.Email} - IsFirstLogin set to false");

                return ApiResponseDto<string>.SuccessResponse(
                    "Password has been reset successfully. You can now login with your new password.",
                    Constants.Messages.PasswordResetSuccess
                );
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error resetting password for: {request.Email}", ex);
                return ApiResponseDto<string>.FailureResponse("An error occurred while resetting password");
            }
        }


        public async Task<ApiResponseDto<string>> ChangePasswordAsync(int userId, ChangePasswordRequestDto request)
        {
            try
            {
                var user = await _userAuthRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return ApiResponseDto<string>.FailureResponse(Constants.Messages.UserNotFound);
                }

                //  CHECK IF USER IS PROTECTED EMPLOYEE (EmployeeCompanyID = 1000)
                var employeeCompanyId = user.Employee?.EmployeeCompanyId;
                if (!string.IsNullOrEmpty(employeeCompanyId) && employeeCompanyId == "1000")
                {
                    EEPZBusinessLog.Warning($"Password change attempt blocked for protected employee: UserId {userId} (EmployeeCompanyID: {employeeCompanyId})");
                    return ApiResponseDto<string>.FailureResponse(
                        "Password changes are not allowed for this account. Please contact system administrator."
                    );
                }

                if (user.IsFirstLogin == false)
                {
                    if (!_passwordService.VerifyPassword(request.CurrentPassword, user.PasswordHash))
                    {
                        return ApiResponseDto<string>.FailureResponse(Constants.Messages.InvalidCurrentPassword);
                    }
                }

                if (!_passwordService.ValidatePasswordStrength(request.NewPassword))
                {
                    return ApiResponseDto<string>.FailureResponse(Constants.Messages.WeakPassword);
                }

                user.PasswordHash = _passwordService.HashPassword(request.NewPassword);
                user.IsFirstLogin = false;
                user.UpdatedAt = DateTime.UtcNow;

                await _userAuthRepository.UpdateAsync(user);

                EEPZBusinessLog.Information($"Password changed successfully for UserId: {userId} - IsFirstLogin set to false");

                return ApiResponseDto<string>.SuccessResponse(
                    "Password changed successfully",
                    Constants.Messages.PasswordChangedSuccess
                );
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error changing password for UserId: {userId}", ex);
                return ApiResponseDto<string>.FailureResponse("An error occurred while changing password");
            }
        }


        public async Task<ApiResponseDto<string>> LogoutAsync(int userId)
        {
            try
            {
                await _tokenService.RevokeAllUserTokensAsync(userId);
                EEPZBusinessLog.Information($"User logged out successfully: UserId {userId}");
                return ApiResponseDto<string>.SuccessResponse("Logged out successfully", "Logged out successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error during logout for UserId: {userId}", ex);
                return ApiResponseDto<string>.FailureResponse("An error occurred during logout");
            }
        }

        private async Task CheckAndLockAccountAsync(Userauthentication user)
        {
            var maxFailedAttempts = _configuration.GetValue<int>("LoginSettings:MaxFailedAttempts", 5);
            var lockoutDurationMinutes = _configuration.GetValue<int>("LoginSettings:LockoutDurationMinutes", 30);

            var failedAttempts = await _loginAttemptRepository.GetFailedAttemptsCountAsync(
                user.Email,
                DateTime.UtcNow.AddMinutes(-lockoutDurationMinutes));

            if (failedAttempts >= maxFailedAttempts)
            {
                user.Status = Constants.UserStatuses.Locked;
                await _userAuthRepository.UpdateAsync(user);
                EEPZBusinessLog.Warning($"Account locked due to multiple failed attempts: {user.Email}");
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
    }
}

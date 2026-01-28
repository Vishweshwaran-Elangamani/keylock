using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.Extensions.Configuration;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;
using MapsterMapper;

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
        private readonly IMapper _mapper;

        public AuthenticationService(
            IUserAuthenticationRepository userAuthRepository,
            ILoginAttemptRepository loginAttemptRepository,
            IPasswordService passwordService,
            IOtpService otpService,
            ITokenService tokenService,
            IEmailService emailService,
            IConfiguration configuration,
            IMapper mapper)
        {
            _userAuthRepository = userAuthRepository;
            _loginAttemptRepository = loginAttemptRepository;
            _passwordService = passwordService;
            _otpService = otpService;
            _tokenService = tokenService;
            _emailService = emailService;
            _configuration = configuration;
            _mapper = mapper;
        }

        public async Task<ApiResponseDto<LoginResponseDto>> LoginAsync(LoginRequestDto request)
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
                loginAttempt.FailureReason = MessageConstants.InvalidCredentials;
                await _loginAttemptRepository.CreateAsync(loginAttempt);
                return ApiResponseDto<LoginResponseDto>.FailureResponse(MessageConstants.InvalidCredentials);
            }

            if (user.Status == Constants.UserStatuses.Inactive)
            {
                loginAttempt.UserId = user.UserId;
                loginAttempt.FailureReason = MessageConstants.AccountInactive;
                await _loginAttemptRepository.CreateAsync(loginAttempt);
                return ApiResponseDto<LoginResponseDto>.FailureResponse(MessageConstants.AccountInactive);
            }

            if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
            {
                loginAttempt.UserId = user.UserId;
                loginAttempt.FailureReason = MessageConstants.InvalidCredentials;
                await _loginAttemptRepository.CreateAsync(loginAttempt);
                await CheckAndLockAccountAsync(user);
                return ApiResponseDto<LoginResponseDto>.FailureResponse(MessageConstants.InvalidCredentials);
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
                        Message = MessageConstants.FirstLoginMessage
                    });
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
                        Message = MessageConstants.OtpSent
                    });
            }

            var accessToken = _tokenService.GenerateAccessToken(user, roleName);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.UserId, request.IpAddress);

            await _userAuthRepository.UpdateLastLoginAsync(user.UserId);

            loginAttempt.IsSuccessful = true;
            loginAttempt.UserId = user.UserId;
            await _loginAttemptRepository.CreateAsync(loginAttempt);

            // Use Mapster for mapping
            var userResponse = _mapper.Map<UserResponseDto>(user);
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
                    Message = MessageConstants.LoginSuccess
                });
        }

        public async Task<ApiResponseDto<LoginResponseDto>> VerifyOtpAndLoginAsync(VerifyOtpRequestDto request)
        {
            var isValid = await _otpService.VerifyOtpAsync(request.Email, request.OtpCode, request.OtpType);
            if (!isValid)
            {
                return ApiResponseDto<LoginResponseDto>.FailureResponse(MessageConstants.OtpInvalid);
            }

            var user = await _userAuthRepository.GetByEmailAsync(request.Email);
            if (user == null)
            {
                return ApiResponseDto<LoginResponseDto>.FailureResponse(MessageConstants.UserNotFound);
            }

            var roleName = user.Employee?.Employeedetailsmasters?.FirstOrDefault()?.Role?.RoleName ?? Constants.Roles.User;
            var accessToken = _tokenService.GenerateAccessToken(user, roleName);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.UserId, null);

            await _userAuthRepository.UpdateLastLoginAsync(user.UserId);

            // Use Mapster for mapping
            var userResponse = _mapper.Map<UserResponseDto>(user);
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
                    Message = MessageConstants.LoginSuccess
                });
        }

        public async Task<ApiResponseDto<OtpResponseDto>> ForgotPasswordAsync(ForgotPasswordRequestDto request)
        {
            var user = await _userAuthRepository.GetByEmailAsync(request.Email);

            if (user == null)
            {
                EEPZBusinessLog.Warning($"Password reset attempt for non-existent email: {request.Email}");
                return ApiResponseDto<OtpResponseDto>.FailureResponse(MessageConstants.EmailNotRegistered);
            }

            var employeeCompanyId = user.Employee?.EmployeeCompanyId;
            if (!string.IsNullOrEmpty(employeeCompanyId) && employeeCompanyId == "1000")
            {
                EEPZBusinessLog.Warning($"Password reset attempt blocked for protected employee: {user.Email} (EmployeeCompanyID: {employeeCompanyId})");
                return ApiResponseDto<OtpResponseDto>.FailureResponse(MessageConstants.PasswordResetBlocked);
            }

            await _otpService.GenerateOtpAsync(request.Email, Constants.OtpTypes.ForgotPassword);

            EEPZBusinessLog.Information($"Password reset OTP sent to: {user.Email}");

            return ApiResponseDto<OtpResponseDto>.SuccessResponse(
                new OtpResponseDto
                {
                    Success = true,
                    Message = MessageConstants.OtpSent
                });
        }

        public async Task<ApiResponseDto<string>> ResetPasswordAsync(ResetPasswordRequestDto request)
        {
            var user = await _userAuthRepository.GetByEmailAsync(request.Email);
            if (user == null)
            {
                return ApiResponseDto<string>.FailureResponse(MessageConstants.UserNotFound);
            }

            var employeeCompanyId = user.Employee?.EmployeeCompanyId;
            if (!string.IsNullOrEmpty(employeeCompanyId) && employeeCompanyId == "1000")
            {
                EEPZBusinessLog.Warning($"Password reset attempt blocked at reset stage for protected employee: {user.Email} (EmployeeCompanyID: {employeeCompanyId})");
                return ApiResponseDto<string>.FailureResponse(MessageConstants.PasswordResetBlocked);
            }

            var isOtpValid = await _otpService.VerifyOtpAsync(request.Email, request.OtpCode, Constants.OtpTypes.ForgotPassword);
            if (!isOtpValid)
            {
                return ApiResponseDto<string>.FailureResponse(MessageConstants.InvalidOrExpiredOtp);
            }

            if (!_passwordService.ValidatePasswordStrength(request.NewPassword))
            {
                return ApiResponseDto<string>.FailureResponse(MessageConstants.WeakPassword);
            }

            user.PasswordHash = _passwordService.HashPassword(request.NewPassword);
            user.IsFirstLogin = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _userAuthRepository.UpdateAsync(user);

            var firstName = user.Employee?.Userprofile?.FirstName ?? "User";
            await _emailService.SendPasswordResetConfirmationAsync(user.Email, firstName);

            EEPZBusinessLog.Information($"Password reset successful for: {request.Email} - IsFirstLogin set to false");

            return ApiResponseDto<string>.SuccessResponse(MessageConstants.PasswordResetComplete);
        }

        public async Task<ApiResponseDto<string>> ChangePasswordAsync(int userId, ChangePasswordRequestDto request)
        {
            var user = await _userAuthRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponseDto<string>.FailureResponse(MessageConstants.UserNotFound);
            }

            var employeeCompanyId = user.Employee?.EmployeeCompanyId;
            if (!string.IsNullOrEmpty(employeeCompanyId) && employeeCompanyId == "1000")
            {
                EEPZBusinessLog.Warning($"Password change attempt blocked for protected employee: UserId {userId} (EmployeeCompanyID: {employeeCompanyId})");
                return ApiResponseDto<string>.FailureResponse(MessageConstants.PasswordChangeBlocked);
            }

            if (user.IsFirstLogin == false)
            {
                if (!_passwordService.VerifyPassword(request.CurrentPassword, user.PasswordHash))
                {
                    return ApiResponseDto<string>.FailureResponse(MessageConstants.InvalidCurrentPassword);
                }
            }

            if (!_passwordService.ValidatePasswordStrength(request.NewPassword))
            {
                return ApiResponseDto<string>.FailureResponse(MessageConstants.WeakPassword);
            }

            user.PasswordHash = _passwordService.HashPassword(request.NewPassword);
            user.IsFirstLogin = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _userAuthRepository.UpdateAsync(user);

            EEPZBusinessLog.Information($"Password changed successfully for UserId: {userId} - IsFirstLogin set to false");

            return ApiResponseDto<string>.SuccessResponse(MessageConstants.PasswordChangedComplete);
        }

        public async Task<ApiResponseDto<string>> LogoutAsync(int userId)
        {
            await _tokenService.RevokeAllUserTokensAsync(userId);
            EEPZBusinessLog.Information($"User logged out successfully: UserId {userId}");
            return ApiResponseDto<string>.SuccessResponse(MessageConstants.LogoutSuccess);
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
    }
}

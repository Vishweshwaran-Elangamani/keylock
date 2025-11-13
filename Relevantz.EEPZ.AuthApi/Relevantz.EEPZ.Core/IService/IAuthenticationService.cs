using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IAuthenticationService
    {
        Task<ApiResponseDto<LoginResponseDto>> LoginAsync(LoginRequestDto request);
        Task<ApiResponseDto<LoginResponseDto>> VerifyOtpAndLoginAsync(VerifyOtpRequestDto request);
        Task<ApiResponseDto<OtpResponseDto>> ForgotPasswordAsync(ForgotPasswordRequestDto request);
        Task<ApiResponseDto<string>> ResetPasswordAsync(ResetPasswordRequestDto request);
        Task<ApiResponseDto<string>> ChangePasswordAsync(int userId, ChangePasswordRequestDto request);
        Task<ApiResponseDto<string>> LogoutAsync(int userId);
    }
}

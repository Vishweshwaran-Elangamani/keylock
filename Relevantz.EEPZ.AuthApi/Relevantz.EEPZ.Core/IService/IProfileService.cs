using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IProfileService
    {
        Task<ApiResponseDto<ProfileResponseDto>> GetProfileByUserIdAsync(int userId);
        Task<ApiResponseDto<ProfileResponseDto>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request);
    }
}

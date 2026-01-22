using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IProfileService
    {
        Task<ProfileResponseDto> GetProfileByUserIdAsync(int userId);
        Task<ProfileResponseDto> UpdateProfileAsync(int userId, UpdateProfileRequestDto request);
    }
}

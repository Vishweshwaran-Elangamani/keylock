using Relevantz.EEPZ.Common.DTOs.Response;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IUserProfilesService
    {
        Task<ApiResponse<List<object>>> GetAllUserProfilesAsync();
    }
}

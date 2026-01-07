using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Models;
namespace Relevantz.EEPZ.Core.IService
{
    public interface ISmeService
    {
        Task<ApiResponse<List<SmeDto>>> GetActiveSmesAsync();
    }
}

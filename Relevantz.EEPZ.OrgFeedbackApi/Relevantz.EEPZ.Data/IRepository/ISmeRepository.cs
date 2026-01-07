using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface ISmeRepository
    {
        Task<List<SmeDto>> GetActiveSmesAsync();
    }
}

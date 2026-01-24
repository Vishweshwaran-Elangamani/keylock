using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDBaseRepository
    {
        Task<int> SaveChangesAsync();
    }
}

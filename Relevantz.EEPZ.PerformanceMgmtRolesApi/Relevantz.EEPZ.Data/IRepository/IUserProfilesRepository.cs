using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IUserProfilesRepository
    {
        Task<List<object>> GetAllUserProfilesAsync();
    }
}

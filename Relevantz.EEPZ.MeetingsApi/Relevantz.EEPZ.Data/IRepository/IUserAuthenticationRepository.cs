using System.Threading;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IUserAuthenticationRepository
    {
        Task<int> GetEmployeeIdByUserIdAsync(int userId, CancellationToken cancellationToken);
    }
}

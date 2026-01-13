using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class UserAuthenticationRepository : IUserAuthenticationRepository
    {
        private readonly EEPZDbContext _context;

        public UserAuthenticationRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetEmployeeIdByUserIdAsync(int userId, CancellationToken cancellationToken)
        {
            var employeeId = await _context.Userauthentications
                .AsNoTracking()
                .Where(u => u.UserId == userId)
                .Select(u => u.EmployeeId)
                .FirstOrDefaultAsync(cancellationToken);

            if (employeeId <= 0)
                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.Unauthorized);

            return employeeId;
        }
    }
}

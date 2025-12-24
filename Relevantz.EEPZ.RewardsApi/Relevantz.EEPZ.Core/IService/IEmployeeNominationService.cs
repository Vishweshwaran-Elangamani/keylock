using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IEmployeeNominationService
    {
        Task<EmployeeNotificationSearchResultDto> SearchEmployeeNotificationsAsync(int employeeId);
    }
}

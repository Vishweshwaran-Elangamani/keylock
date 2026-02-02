using System.Threading.Tasks;
using Relevantz.EEPZ.Core.Models;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IDepartmentHeadNominationService
    {
        Task<ApiResponse<object>> GetApprovedNominationsByDeptHeadAsync(int deptHeadEmployeeId);
        Task<ApiResponse<object>> GetNominationDetailsAsync(int nominationId);
        Task<ApiResponse<object>> GetDepartmentStatisticsAsync(int deptHeadEmployeeId);
    }
}
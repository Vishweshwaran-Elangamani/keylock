using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IComplianceService
    {
        Task<ApiResponseDto<ComplianceOverviewDto>> GetComplianceOverviewAsync();
    }
}

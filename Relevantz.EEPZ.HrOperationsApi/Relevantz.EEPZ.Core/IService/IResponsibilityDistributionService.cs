using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
 
namespace Relevantz.EEPZ.Core.IService
{
    public interface IResponsibilityDistributionService
    {
        Task<ApiResponseDto<ResponsibilityDistributionResponseDto>> CreateResponsibilityDistributionAsync(CreateResponsibilityDistributionRequestDto request);
        Task<ApiResponseDto<ResponsibilityDistributionResponseDto>> UpdateResponsibilityDistributionAsync(UpdateResponsibilityDistributionRequestDto request);
        Task<ApiResponseDto<ResponsibilityDistributionResponseDto>> GetResponsibilityDistributionByIdAsync(int workloadId);
        Task<ApiResponseDto<List<ResponsibilityDistributionResponseDto>>> GetAllResponsibilityDistributionsAsync();
        Task<ApiResponseDto<List<ResponsibilityDistributionResponseDto>>> GetResponsibilityDistributionsByDepartmentAsync(int departmentId);
        Task<ApiResponseDto<bool>> DeleteResponsibilityDistributionAsync(int workloadId);
    }
}
 
 
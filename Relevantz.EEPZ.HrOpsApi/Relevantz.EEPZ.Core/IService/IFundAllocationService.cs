using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
 
namespace Relevantz.EEPZ.Core.IService
{
    public interface IFundAllocationService
    {
        Task<ApiResponseDto<FundAllocationResponseDto>> CreateFundAllocationAsync(CreateFundAllocationRequestDto request);
        Task<ApiResponseDto<FundAllocationResponseDto>> UpdateFundAllocationAsync(UpdateFundAllocationRequestDto request);
        Task<ApiResponseDto<bool>> DeleteFundAllocationAsync(int allocationId);
        Task<ApiResponseDto<FundAllocationResponseDto>> GetFundAllocationByIdAsync(int allocationId);
        Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetAllFundAllocationsAsync();
        Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetFundAllocationsByDepartmentAsync(int departmentId);
        Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetFundAllocationsByTypeAsync(string allocationType);
    }
}
 
 
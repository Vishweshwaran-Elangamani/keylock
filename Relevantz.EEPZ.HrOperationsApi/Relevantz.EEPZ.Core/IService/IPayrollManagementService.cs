using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Utils;
 
namespace Relevantz.EEPZ.Core.IService
{
    public interface IPayrollManagementService
    {
        Task<ApiResponseDto<PayrollResponseDto>> CreatePayrollAsync(CreatePayrollRequestDto request);
        Task<ApiResponseDto<PayrollResponseDto>> UpdatePayrollAsync(UpdatePayrollRequestDto request);
        Task<ApiResponseDto<PayrollResponseDto>> ApprovePayrollAsync(ApprovePayrollRequestDto request);
        Task<ApiResponseDto<PayrollResponseDto>> ProcessPayrollAsync(int payrollId);
        Task<ApiResponseDto<PayrollResponseDto>> GetPayrollByIdAsync(int payrollId);
        Task<ApiResponseDto<List<PayrollResponseDto>>> GetAllPayrollsAsync();
        Task<ApiResponseDto<List<PayrollResponseDto>>> GetPayrollsByEmployeeAsync(int EmployeeUserId);
        Task<ApiResponseDto<List<PayrollResponseDto>>> GetPayrollsByStatusAsync(string status);
    }
}
 
 
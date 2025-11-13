using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IDepartmentService
    {
        Task<ApiResponseDto<DepartmentResponseDto>> CreateDepartmentAsync(CreateDepartmentRequestDto request);
        Task<ApiResponseDto<DepartmentResponseDto>> UpdateDepartmentAsync(UpdateDepartmentRequestDto request);
        Task<ApiResponseDto<DepartmentResponseDto>> GetDepartmentByIdAsync(int departmentId);
        Task<ApiResponseDto<List<DepartmentResponseDto>>> GetAllDepartmentsAsync();
        Task<ApiResponseDto<string>> DeleteDepartmentAsync(int departmentId);
    }
}

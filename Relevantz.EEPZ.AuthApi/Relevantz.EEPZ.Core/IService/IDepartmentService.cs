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

        // Hierarchy operations
        Task<ApiResponseDto<DepartmentHierarchyResponseDto>> GetDepartmentHierarchyTreeAsync(int? rootDepartmentId = null);
        Task<ApiResponseDto<List<DepartmentResponseDto>>> GetChildDepartmentsAsync(int parentDepartmentId);
        Task<ApiResponseDto<List<DepartmentResponseDto>>> GetRootDepartmentsAsync();
        Task<ApiResponseDto<List<DepartmentResponseDto>>> GetDepartmentPathAsync(int departmentId);

        // Status operations
        Task<ApiResponseDto<List<DepartmentResponseDto>>> GetActiveDepartmentsAsync();
        Task<ApiResponseDto<List<DepartmentResponseDto>>> GetInactiveDepartmentsAsync();
        Task<ApiResponseDto<string>> UpdateDepartmentStatusAsync(int departmentId, string status);

        // HOD operations
        Task<ApiResponseDto<List<DepartmentResponseDto>>> GetDepartmentsByHodAsync(int hodEmployeeId);
        Task<ApiResponseDto<string>> AssignHodAsync(int departmentId, int hodEmployeeId);
        Task<ApiResponseDto<string>> RemoveHodAsync(int departmentId);

        // Search and filter
        Task<ApiResponseDto<List<DepartmentResponseDto>>> SearchDepartmentsAsync(string searchTerm);
        Task<ApiResponseDto<DepartmentResponseDto>> GetDepartmentByCodeAsync(string departmentCode);

        // Statistics
        Task<ApiResponseDto<int>> GetTotalDepartmentCountAsync();
        Task<ApiResponseDto<int>> GetActiveDepartmentCountAsync();
    }
}

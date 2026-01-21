using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IDepartmentService
    {
        // Basic CRUD Operations
        Task<DepartmentResponseDto> CreateDepartmentAsync(CreateDepartmentRequestDto request);
        Task<DepartmentResponseDto> UpdateDepartmentAsync(UpdateDepartmentRequestDto request);
        Task<DepartmentResponseDto> GetDepartmentByIdAsync(int departmentId);
        Task<List<DepartmentResponseDto>> GetAllDepartmentsAsync();
        Task DeleteDepartmentAsync(int departmentId);

        // Hierarchy Operations
        Task<DepartmentHierarchyResponseDto> GetDepartmentHierarchyTreeAsync(int? rootDepartmentId = null);
        Task<List<DepartmentResponseDto>> GetChildDepartmentsAsync(int parentDepartmentId);
        Task<List<DepartmentResponseDto>> GetRootDepartmentsAsync();
        Task<List<DepartmentResponseDto>> GetDepartmentPathAsync(int departmentId);

        // Status Operations
        Task<List<DepartmentResponseDto>> GetActiveDepartmentsAsync();
        Task<List<DepartmentResponseDto>> GetInactiveDepartmentsAsync();
        Task UpdateDepartmentStatusAsync(int departmentId, string status);

        // HOD Operations
        Task<List<DepartmentResponseDto>> GetDepartmentsByHodAsync(int hodEmployeeId);
        Task AssignHodAsync(int departmentId, int hodEmployeeId);
        Task RemoveHodAsync(int departmentId);

        // Search and Filter
        Task<List<DepartmentResponseDto>> SearchDepartmentsAsync(string searchTerm);
        Task<DepartmentResponseDto> GetDepartmentByCodeAsync(string departmentCode);

        // Statistics
        Task<int> GetTotalDepartmentCountAsync();
        Task<int> GetActiveDepartmentCountAsync();
    }
}

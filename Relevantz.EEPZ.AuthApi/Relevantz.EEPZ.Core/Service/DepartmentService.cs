
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Service
{
    public class DepartmentService : IDepartmentService
    {
        private readonly IDepartmentRepository _departmentRepository;

        public DepartmentService(IDepartmentRepository departmentRepository)
        {
            _departmentRepository = departmentRepository;
        }

        public async Task<ApiResponseDto<DepartmentResponseDto>> CreateDepartmentAsync(CreateDepartmentRequestDto request)
        {
            try
            {
                if (await _departmentRepository.DepartmentNameExistsAsync(request.DepartmentName))
                {
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse("Department name already exists");
                }

                var department = new Department
                {
                    DepartmentName = request.DepartmentName,
                    BudgetAllocated = request.BudgetAllocated,
                    CostCenter = request.CostCenter,
                    CreatedAt = DateTime.UtcNow
                };

                await _departmentRepository.CreateAsync(department);

                var response = MapToDepartmentResponse(department);
                EEPZBusinessLog.Information($"Department created: {request.DepartmentName}");

                return ApiResponseDto<DepartmentResponseDto>.SuccessResponse(response, Constants.Messages.DepartmentCreatedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error creating department: {request.DepartmentName}", ex);
                return ApiResponseDto<DepartmentResponseDto>.FailureResponse("An error occurred while creating department");
            }
        }

        public async Task<ApiResponseDto<DepartmentResponseDto>> UpdateDepartmentAsync(UpdateDepartmentRequestDto request)
        {
            try
            {
                var department = await _departmentRepository.GetByIdAsync(request.DepartmentId);
                if (department == null)
                {
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse(Constants.Messages.DepartmentNotFound);
                }

                if (request.DepartmentName != null) department.DepartmentName = request.DepartmentName;
                if (request.BudgetAllocated.HasValue) department.BudgetAllocated = request.BudgetAllocated;
                if (request.CostCenter != null) department.CostCenter = request.CostCenter;

                await _departmentRepository.UpdateAsync(department);

                var response = MapToDepartmentResponse(department);
                EEPZBusinessLog.Information($"Department updated: DepartmentId {request.DepartmentId}");

                return ApiResponseDto<DepartmentResponseDto>.SuccessResponse(response, Constants.Messages.DepartmentUpdatedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error updating department: DepartmentId {request.DepartmentId}", ex);
                return ApiResponseDto<DepartmentResponseDto>.FailureResponse("An error occurred while updating department");
            }
        }

        public async Task<ApiResponseDto<DepartmentResponseDto>> GetDepartmentByIdAsync(int departmentId)
        {
            try
            {
                var department = await _departmentRepository.GetByIdAsync(departmentId);
                if (department == null)
                {
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse(Constants.Messages.DepartmentNotFound);
                }

                var response = MapToDepartmentResponse(department);
                return ApiResponseDto<DepartmentResponseDto>.SuccessResponse(response, "Department retrieved successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error retrieving department: DepartmentId {departmentId}", ex);
                return ApiResponseDto<DepartmentResponseDto>.FailureResponse("An error occurred while retrieving department");
            }
        }

        public async Task<ApiResponseDto<List<DepartmentResponseDto>>> GetAllDepartmentsAsync()
        {
            try
            {
                var departments = await _departmentRepository.GetAllAsync();
                var responses = departments.Select(MapToDepartmentResponse).ToList();
                return ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(responses, "Departments retrieved successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error retrieving all departments", ex);
                return ApiResponseDto<List<DepartmentResponseDto>>.FailureResponse("An error occurred while retrieving departments");
            }
        }

        public async Task<ApiResponseDto<string>> DeleteDepartmentAsync(int departmentId)
        {
            try
            {
                var department = await _departmentRepository.GetByIdAsync(departmentId);
                if (department == null)
                {
                    return ApiResponseDto<string>.FailureResponse(Constants.Messages.DepartmentNotFound);
                }

                await _departmentRepository.DeleteAsync(departmentId);
                EEPZBusinessLog.Information($"Department deleted: DepartmentId {departmentId}");

                return ApiResponseDto<string>.SuccessResponse("Department deleted successfully", "Department deleted successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error deleting department: DepartmentId {departmentId}", ex);
                return ApiResponseDto<string>.FailureResponse("An error occurred while deleting department");
            }
        }

        private DepartmentResponseDto MapToDepartmentResponse(Department department)
        {
            return new DepartmentResponseDto
            {
                DepartmentId = department.DepartmentId,
                DepartmentName = department.DepartmentName,
                BudgetAllocated = department.BudgetAllocated,
                CostCenter = department.CostCenter,
                CreatedAt = department.CreatedAt,
                UpdatedAt = department.UpdatedAt
            };
        }
    }
}

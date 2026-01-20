using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Core.Service
{
    public class DepartmentService : IDepartmentService
    {
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly ILogger<DepartmentService> _logger;

        public DepartmentService(
            IDepartmentRepository departmentRepository,
            IEmployeeRepository employeeRepository,
            IUserProfileRepository userProfileRepository,
            ILogger<DepartmentService> logger)
        {
            _departmentRepository = departmentRepository;
            _employeeRepository = employeeRepository;
            _userProfileRepository = userProfileRepository;
            _logger = logger;
        }

        #region Basic CRUD Operations

        public async Task<ApiResponseDto<DepartmentResponseDto>> CreateDepartmentAsync(CreateDepartmentRequestDto request)
        {
            _logger.LogInformation("Creating department: {DepartmentName} (Code: {DepartmentCode})", request.DepartmentName, request.DepartmentCode);

            // Validate department name uniqueness
            if (await _departmentRepository.DepartmentNameExistsAsync(request.DepartmentName))
            {
                _logger.LogWarning("Department name already exists: {DepartmentName}", request.DepartmentName);
                return ApiResponseDto<DepartmentResponseDto>.FailureResponse("Department name already exists");
            }

            // Validate department code uniqueness
            if (await _departmentRepository.DepartmentCodeExistsAsync(request.DepartmentCode))
            {
                _logger.LogWarning("Department code already exists: {DepartmentCode}", request.DepartmentCode);
                return ApiResponseDto<DepartmentResponseDto>.FailureResponse("Department code already exists");
            }

            // Validate parent department exists
            if (request.ParentDepartmentId.HasValue)
            {
                var parentDepartment = await _departmentRepository.GetByIdAsync(request.ParentDepartmentId.Value);
                if (parentDepartment == null)
                {
                    _logger.LogWarning("Parent department not found: {ParentDepartmentId}", request.ParentDepartmentId.Value);
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse("Parent department not found");
                }

                if (parentDepartment.Status == "Inactive")
                {
                    _logger.LogWarning("Cannot add child department to inactive parent: {ParentDepartmentId}", request.ParentDepartmentId.Value);
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse("Cannot add child department to an inactive parent");
                }
            }

            // Validate HOD employee exists
            if (request.HodEmployeeId.HasValue)
            {
                var hodEmployee = await _employeeRepository.GetByIdAsync(request.HodEmployeeId.Value);
                if (hodEmployee == null)
                {
                    _logger.LogWarning("HOD employee not found: {HodEmployeeId}", request.HodEmployeeId.Value);
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse("HOD employee not found");
                }

                if (hodEmployee.EmploymentStatus != "Active")
                {
                    _logger.LogWarning("HOD employee must be active: {HodEmployeeId}", request.HodEmployeeId.Value);
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse("HOD employee must be in active status");
                }
            }

            var department = new Department
            {
                DepartmentName = request.DepartmentName,
                DepartmentCode = request.DepartmentCode,
                Description = request.Description,
                Status = request.Status,
                ParentDepartmentId = request.ParentDepartmentId,
                HodEmployeeId = request.HodEmployeeId,
                BudgetAllocated = request.BudgetAllocated,
                CostCenter = request.CostCenter,
                CreatedAt = DateTime.UtcNow
            };

            await _departmentRepository.CreateAsync(department);

            var response = await MapToDepartmentResponseAsync(department);
            _logger.LogInformation("Department created successfully: {DepartmentName} (Code: {DepartmentCode})", request.DepartmentName, request.DepartmentCode);
            EEPZBusinessLog.Information($"Department created: {request.DepartmentName} (Code: {request.DepartmentCode})");

            return ApiResponseDto<DepartmentResponseDto>.SuccessResponse(response, Constants.Messages.DepartmentCreatedSuccess);
        }

        public async Task<ApiResponseDto<DepartmentResponseDto>> UpdateDepartmentAsync(UpdateDepartmentRequestDto request)
        {
            _logger.LogInformation("Updating department: {DepartmentId}", request.DepartmentId);

            var department = await _departmentRepository.GetByIdAsync(request.DepartmentId);
            if (department == null)
            {
                _logger.LogWarning("Department not found: {DepartmentId}", request.DepartmentId);
                return ApiResponseDto<DepartmentResponseDto>.FailureResponse(Constants.Messages.DepartmentNotFound);
            }

            // Validate department name uniqueness (excluding current department)
            if (request.DepartmentName != null && request.DepartmentName != department.DepartmentName)
            {
                if (await _departmentRepository.DepartmentNameExistsAsync(request.DepartmentName, request.DepartmentId))
                {
                    _logger.LogWarning("Department name already exists: {DepartmentName}", request.DepartmentName);
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse("Department name already exists");
                }
            }

            // Validate department code uniqueness (excluding current department)
            if (request.DepartmentCode != null && request.DepartmentCode != department.DepartmentCode)
            {
                if (await _departmentRepository.DepartmentCodeExistsAsync(request.DepartmentCode, request.DepartmentId))
                {
                    _logger.LogWarning("Department code already exists: {DepartmentCode}", request.DepartmentCode);
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse("Department code already exists");
                }
            }

            // Validate parent department and prevent circular reference
            if (request.ParentDepartmentId.HasValue)
            {
                if (request.ParentDepartmentId == request.DepartmentId)
                {
                    _logger.LogWarning("Department cannot be its own parent: {DepartmentId}", request.DepartmentId);
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse("Department cannot be its own parent");
                }

                var parentDepartment = await _departmentRepository.GetByIdAsync(request.ParentDepartmentId.Value);
                if (parentDepartment == null)
                {
                    _logger.LogWarning("Parent department not found: {ParentDepartmentId}", request.ParentDepartmentId.Value);
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse("Parent department not found");
                }

                // Check for circular reference
                if (await _departmentRepository.IsCircularReferenceAsync(request.DepartmentId, request.ParentDepartmentId.Value))
                {
                    _logger.LogWarning("Circular reference detected for department: {DepartmentId}", request.DepartmentId);
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse("Circular reference detected. A department cannot be a parent of its own ancestor.");
                }
            }

            // Validate HOD employee (only if not null)
            if (request.HodEmployeeId.HasValue)
            {
                var hodEmployee = await _employeeRepository.GetByIdAsync(request.HodEmployeeId.Value);
                if (hodEmployee == null)
                {
                    _logger.LogWarning("HOD employee not found: {HodEmployeeId}", request.HodEmployeeId.Value);
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse("HOD employee not found");
                }

                if (hodEmployee.EmploymentStatus != "Active")
                {
                    _logger.LogWarning("HOD employee must be active: {HodEmployeeId}", request.HodEmployeeId.Value);
                    return ApiResponseDto<DepartmentResponseDto>.FailureResponse("HOD employee must be in active status");
                }
            }

            // Validate status change
            if (request.Status != null && request.Status != department.Status)
            {
                if (request.Status == "Inactive")
                {
                    // Check if department has active child departments
                    var childDepartments = await _departmentRepository.GetChildDepartmentsAsync(request.DepartmentId);
                    if (childDepartments.Any(c => c.Status == "Active"))
                    {
                        _logger.LogWarning("Cannot inactivate department with active children: {DepartmentId}", request.DepartmentId);
                        return ApiResponseDto<DepartmentResponseDto>.FailureResponse("Cannot inactivate department with active child departments");
                    }
                }
            }

            if (request.DepartmentName != null) department.DepartmentName = request.DepartmentName;
            if (request.DepartmentCode != null) department.DepartmentCode = request.DepartmentCode;
            if (request.Description != null) department.Description = request.Description;
            if (request.Status != null) department.Status = request.Status;

            department.ParentDepartmentId = request.ParentDepartmentId;
            department.HodEmployeeId = request.HodEmployeeId;

            if (request.BudgetAllocated.HasValue) department.BudgetAllocated = request.BudgetAllocated;
            if (request.CostCenter != null) department.CostCenter = request.CostCenter;

            await _departmentRepository.UpdateAsync(department);

            var response = await MapToDepartmentResponseAsync(department);
            _logger.LogInformation("Department updated successfully: {DepartmentId}", request.DepartmentId);
            EEPZBusinessLog.Information($"Department updated: DepartmentId {request.DepartmentId}");

            return ApiResponseDto<DepartmentResponseDto>.SuccessResponse(response, Constants.Messages.DepartmentUpdatedSuccess);
        }

        public async Task<ApiResponseDto<DepartmentResponseDto>> GetDepartmentByIdAsync(int departmentId)
        {
            _logger.LogInformation("Retrieving department: {DepartmentId}", departmentId);

            var department = await _departmentRepository.GetDepartmentWithDetailsAsync(departmentId);
            if (department == null)
            {
                _logger.LogWarning("Department not found: {DepartmentId}", departmentId);
                return ApiResponseDto<DepartmentResponseDto>.FailureResponse(Constants.Messages.DepartmentNotFound);
            }

            var response = await MapToDepartmentResponseAsync(department);
            return ApiResponseDto<DepartmentResponseDto>.SuccessResponse(response, "Department retrieved successfully");
        }

        public async Task<ApiResponseDto<List<DepartmentResponseDto>>> GetAllDepartmentsAsync()
        {
            _logger.LogInformation("Retrieving all departments");

            var departments = await _departmentRepository.GetAllAsync();
            var responses = new List<DepartmentResponseDto>();

            foreach (var dept in departments)
            {
                responses.Add(await MapToDepartmentResponseAsync(dept));
            }

            return ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(responses, "Departments retrieved successfully");
        }

        public async Task<ApiResponseDto<string>> DeleteDepartmentAsync(int departmentId)
        {
            _logger.LogInformation("Deleting department: {DepartmentId}", departmentId);

            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                _logger.LogWarning("Department not found: {DepartmentId}", departmentId);
                return ApiResponseDto<string>.FailureResponse(Constants.Messages.DepartmentNotFound);
            }

            // Check if department has child departments
            if (await _departmentRepository.HasChildDepartmentsAsync(departmentId))
            {
                _logger.LogWarning("Cannot delete department with children: {DepartmentId}", departmentId);
                return ApiResponseDto<string>.FailureResponse("Cannot delete department with child departments. Please delete or reassign child departments first.");
            }

            // Check if department has employees
            if (await _departmentRepository.HasEmployeesAsync(departmentId))
            {
                _logger.LogWarning("Cannot delete department with employees: {DepartmentId}", departmentId);
                return ApiResponseDto<string>.FailureResponse("Cannot delete department with assigned employees. Please reassign employees first.");
            }

            await _departmentRepository.DeleteAsync(departmentId);
            _logger.LogInformation("Department deleted successfully: {DepartmentId}", departmentId);
            EEPZBusinessLog.Information($"Department deleted: DepartmentId {departmentId}");

            return ApiResponseDto<string>.SuccessResponse("Department deleted successfully", "Department deleted successfully");
        }

        #endregion

        #region Hierarchy Operations

        public async Task<ApiResponseDto<DepartmentHierarchyResponseDto>> GetDepartmentHierarchyTreeAsync(int? rootDepartmentId = null)
        {
            _logger.LogInformation("Retrieving department hierarchy tree. RootDepartmentId: {RootDepartmentId}", rootDepartmentId);

            List<Department> rootDepartments;

            if (rootDepartmentId.HasValue)
            {
                var rootDept = await _departmentRepository.GetDepartmentWithDetailsAsync(rootDepartmentId.Value);
                if (rootDept == null)
                {
                    _logger.LogWarning("Root department not found: {RootDepartmentId}", rootDepartmentId.Value);
                    return ApiResponseDto<DepartmentHierarchyResponseDto>.FailureResponse("Root department not found");
                }
                rootDepartments = new List<Department> { rootDept };
            }
            else
            {
                rootDepartments = await _departmentRepository.GetRootDepartmentsAsync();
            }

            var hierarchyTree = await BuildHierarchyTreeAsync(rootDepartments, 0);

            // If single root requested, return that node; otherwise wrap in virtual root
            var result = rootDepartmentId.HasValue && hierarchyTree.Any()
                ? hierarchyTree.First()
                : new DepartmentHierarchyResponseDto
                {
                    DepartmentId = 0,
                    DepartmentName = "Organization",
                    DepartmentCode = "ROOT",
                    Status = "Active",
                    Level = -1,
                    Children = hierarchyTree
                };

            return ApiResponseDto<DepartmentHierarchyResponseDto>.SuccessResponse(result, "Department hierarchy retrieved successfully");
        }

        public async Task<ApiResponseDto<List<DepartmentResponseDto>>> GetChildDepartmentsAsync(int parentDepartmentId)
        {
            _logger.LogInformation("Retrieving child departments for parent: {ParentDepartmentId}", parentDepartmentId);

            var childDepartments = await _departmentRepository.GetChildDepartmentsAsync(parentDepartmentId);
            var responses = new List<DepartmentResponseDto>();

            foreach (var dept in childDepartments)
            {
                responses.Add(await MapToDepartmentResponseAsync(dept));
            }

            return ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(responses, "Child departments retrieved successfully");
        }

        public async Task<ApiResponseDto<List<DepartmentResponseDto>>> GetRootDepartmentsAsync()
        {
            _logger.LogInformation("Retrieving root departments");

            var rootDepartments = await _departmentRepository.GetRootDepartmentsAsync();
            var responses = new List<DepartmentResponseDto>();

            foreach (var dept in rootDepartments)
            {
                responses.Add(await MapToDepartmentResponseAsync(dept));
            }

            return ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(responses, "Root departments retrieved successfully");
        }

        public async Task<ApiResponseDto<List<DepartmentResponseDto>>> GetDepartmentPathAsync(int departmentId)
        {
            _logger.LogInformation("Retrieving department path for: {DepartmentId}", departmentId);

            var hierarchy = await _departmentRepository.GetDepartmentHierarchyAsync(departmentId);
            if (!hierarchy.Any())
            {
                _logger.LogWarning("Department not found: {DepartmentId}", departmentId);
                return ApiResponseDto<List<DepartmentResponseDto>>.FailureResponse("Department not found");
            }

            var responses = new List<DepartmentResponseDto>();
            foreach (var dept in hierarchy)
            {
                responses.Add(await MapToDepartmentResponseAsync(dept));
            }

            return ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(responses, "Department path retrieved successfully");
        }

        #endregion

        #region Status Operations

        public async Task<ApiResponseDto<List<DepartmentResponseDto>>> GetActiveDepartmentsAsync()
        {
            _logger.LogInformation("Retrieving active departments");

            var departments = await _departmentRepository.GetActiveDepartmentsAsync();
            var responses = new List<DepartmentResponseDto>();

            foreach (var dept in departments)
            {
                responses.Add(await MapToDepartmentResponseAsync(dept));
            }

            return ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(responses, "Active departments retrieved successfully");
        }

        public async Task<ApiResponseDto<List<DepartmentResponseDto>>> GetInactiveDepartmentsAsync()
        {
            _logger.LogInformation("Retrieving inactive departments");

            var departments = await _departmentRepository.GetInactiveDepartmentsAsync();
            var responses = new List<DepartmentResponseDto>();

            foreach (var dept in departments)
            {
                responses.Add(await MapToDepartmentResponseAsync(dept));
            }

            return ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(responses, "Inactive departments retrieved successfully");
        }

        public async Task<ApiResponseDto<string>> UpdateDepartmentStatusAsync(int departmentId, string status)
        {
            _logger.LogInformation("Updating department status: {DepartmentId} to {Status}", departmentId, status);

            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                _logger.LogWarning("Department not found: {DepartmentId}", departmentId);
                return ApiResponseDto<string>.FailureResponse(Constants.Messages.DepartmentNotFound);
            }

            if (status != "Active" && status != "Inactive")
            {
                _logger.LogWarning("Invalid status: {Status}", status);
                return ApiResponseDto<string>.FailureResponse("Invalid status. Must be 'Active' or 'Inactive'");
            }

            if (status == "Inactive")
            {
                var childDepartments = await _departmentRepository.GetChildDepartmentsAsync(departmentId);
                if (childDepartments.Any(c => c.Status == "Active"))
                {
                    _logger.LogWarning("Cannot inactivate department with active children: {DepartmentId}", departmentId);
                    return ApiResponseDto<string>.FailureResponse("Cannot inactivate department with active child departments");
                }
            }

            department.Status = status;
            await _departmentRepository.UpdateAsync(department);

            _logger.LogInformation("Department status updated: {DepartmentId} to {Status}", departmentId, status);
            EEPZBusinessLog.Information($"Department status updated: DepartmentId {departmentId} to {status}");
            return ApiResponseDto<string>.SuccessResponse("Status updated successfully", $"Department status updated to {status}");
        }

        #endregion

        #region HOD Operations

        public async Task<ApiResponseDto<List<DepartmentResponseDto>>> GetDepartmentsByHodAsync(int hodEmployeeId)
        {
            _logger.LogInformation("Retrieving departments for HOD: {HodEmployeeId}", hodEmployeeId);

            var departments = await _departmentRepository.GetDepartmentsByHodAsync(hodEmployeeId);
            var responses = new List<DepartmentResponseDto>();

            foreach (var dept in departments)
            {
                responses.Add(await MapToDepartmentResponseAsync(dept));
            }

            return ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(responses, "HOD departments retrieved successfully");
        }

        public async Task<ApiResponseDto<string>> AssignHodAsync(int departmentId, int hodEmployeeId)
        {
            _logger.LogInformation("Assigning HOD: {HodEmployeeId} to department: {DepartmentId}", hodEmployeeId, departmentId);

            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                _logger.LogWarning("Department not found: {DepartmentId}", departmentId);
                return ApiResponseDto<string>.FailureResponse(Constants.Messages.DepartmentNotFound);
            }

            var employee = await _employeeRepository.GetByIdAsync(hodEmployeeId);
            if (employee == null)
            {
                _logger.LogWarning("Employee not found: {HodEmployeeId}", hodEmployeeId);
                return ApiResponseDto<string>.FailureResponse("Employee not found");
            }

            if (employee.EmploymentStatus != "Active")
            {
                _logger.LogWarning("Employee must be active to be HOD: {HodEmployeeId}", hodEmployeeId);
                return ApiResponseDto<string>.FailureResponse("Employee must be in active status to be assigned as HOD");
            }

            department.HodEmployeeId = hodEmployeeId;
            await _departmentRepository.UpdateAsync(department);

            _logger.LogInformation("HOD assigned successfully: {HodEmployeeId} to {DepartmentId}", hodEmployeeId, departmentId);
            EEPZBusinessLog.Information($"HOD assigned: EmployeeId {hodEmployeeId} to DepartmentId {departmentId}");
            return ApiResponseDto<string>.SuccessResponse("HOD assigned successfully", "Head of Department assigned successfully");
        }

        public async Task<ApiResponseDto<string>> RemoveHodAsync(int departmentId)
        {
            _logger.LogInformation("Removing HOD from department: {DepartmentId}", departmentId);

            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                _logger.LogWarning("Department not found: {DepartmentId}", departmentId);
                return ApiResponseDto<string>.FailureResponse(Constants.Messages.DepartmentNotFound);
            }

            if (department.HodEmployeeId == null)
            {
                _logger.LogWarning("Department does not have HOD: {DepartmentId}", departmentId);
                return ApiResponseDto<string>.FailureResponse("Department does not have an assigned HOD");
            }

            department.HodEmployeeId = null;
            await _departmentRepository.UpdateAsync(department);

            _logger.LogInformation("HOD removed successfully from department: {DepartmentId}", departmentId);
            EEPZBusinessLog.Information($"HOD removed from DepartmentId {departmentId}");
            return ApiResponseDto<string>.SuccessResponse("HOD removed successfully", "Head of Department removed successfully");
        }

        #endregion

        #region Search and Filter

        public async Task<ApiResponseDto<List<DepartmentResponseDto>>> SearchDepartmentsAsync(string searchTerm)
        {
            _logger.LogInformation("Searching departments with term: {SearchTerm}", searchTerm);

            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return await GetAllDepartmentsAsync();
            }

            var departments = await _departmentRepository.SearchDepartmentsAsync(searchTerm);
            var responses = new List<DepartmentResponseDto>();

            foreach (var dept in departments)
            {
                responses.Add(await MapToDepartmentResponseAsync(dept));
            }

            return ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(responses, $"Found {responses.Count} departments matching '{searchTerm}'");
        }

        public async Task<ApiResponseDto<DepartmentResponseDto>> GetDepartmentByCodeAsync(string departmentCode)
        {
            _logger.LogInformation("Retrieving department by code: {DepartmentCode}", departmentCode);

            var department = await _departmentRepository.GetByCodeAsync(departmentCode);
            if (department == null)
            {
                _logger.LogWarning("Department not found with code: {DepartmentCode}", departmentCode);
                return ApiResponseDto<DepartmentResponseDto>.FailureResponse("Department not found with the specified code");
            }

            var response = await MapToDepartmentResponseAsync(department);
            return ApiResponseDto<DepartmentResponseDto>.SuccessResponse(response, "Department retrieved successfully");
        }

        #endregion

        #region Statistics

        public async Task<ApiResponseDto<int>> GetTotalDepartmentCountAsync()
        {
            _logger.LogInformation("Retrieving total department count");

            var count = await _departmentRepository.GetTotalDepartmentCountAsync();
            return ApiResponseDto<int>.SuccessResponse(count, $"Total departments: {count}");
        }

        public async Task<ApiResponseDto<int>> GetActiveDepartmentCountAsync()
        {
            _logger.LogInformation("Retrieving active department count");

            var departments = await _departmentRepository.GetActiveDepartmentsAsync();
            var count = departments.Count;
            return ApiResponseDto<int>.SuccessResponse(count, $"Active departments: {count}");
        }

        #endregion

        #region Helper Methods

        private async Task<DepartmentResponseDto> MapToDepartmentResponseAsync(Department department)
        {
            var childCount = await _departmentRepository.GetChildCountAsync(department.DepartmentId);

            // Get HOD employee name from UserProfile repository
            string? hodEmployeeName = null;
            if (department.HodEmployeeId.HasValue)
            {
                hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(department.HodEmployeeId.Value);
            }

            return new DepartmentResponseDto
            {
                DepartmentId = department.DepartmentId,
                DepartmentName = department.DepartmentName,
                DepartmentCode = department.DepartmentCode,
                Description = department.Description,
                Status = department.Status,
                ParentDepartmentId = department.ParentDepartmentId,
                ParentDepartmentName = department.ParentDepartment?.DepartmentName,
                HodEmployeeId = department.HodEmployeeId,
                HodEmployeeName = hodEmployeeName,
                HodEmployeeCompanyId = department.HodEmployee?.EmployeeCompanyId,
                BudgetAllocated = department.BudgetAllocated,
                CostCenter = department.CostCenter,
                CreatedAt = department.CreatedAt,
                UpdatedAt = department.UpdatedAt,
                ChildDepartmentCount = childCount,
                HasChildren = childCount > 0
            };
        }

        private async Task<List<DepartmentHierarchyResponseDto>> BuildHierarchyTreeAsync(List<Department> departments, int level)
        {
            var result = new List<DepartmentHierarchyResponseDto>();

            foreach (var dept in departments)
            {
                var childDepartments = await _departmentRepository.GetChildDepartmentsAsync(dept.DepartmentId);
                var children = await BuildHierarchyTreeAsync(childDepartments, level + 1);

                // Get HOD employee name from UserProfile repository
                string? hodEmployeeName = null;
                if (dept.HodEmployeeId.HasValue)
                {
                    hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(dept.HodEmployeeId.Value);
                }

                var hierarchyDto = new DepartmentHierarchyResponseDto
                {
                    DepartmentId = dept.DepartmentId,
                    DepartmentName = dept.DepartmentName,
                    DepartmentCode = dept.DepartmentCode,
                    Description = dept.Description,
                    Status = dept.Status,
                    ParentDepartmentId = dept.ParentDepartmentId,
                    HodEmployeeId = dept.HodEmployeeId,
                    HodEmployeeName = hodEmployeeName,
                    Level = level,
                    HierarchyPath = await BuildHierarchyPathAsync(dept.DepartmentId),
                    Children = children,
                    TotalChildCount = await CountAllDescendantsAsync(dept.DepartmentId),
                    CreatedAt = dept.CreatedAt,
                    UpdatedAt = dept.UpdatedAt
                };

                result.Add(hierarchyDto);
            }

            return result;
        }

        private async Task<string> BuildHierarchyPathAsync(int departmentId)
        {
            var hierarchy = await _departmentRepository.GetDepartmentHierarchyAsync(departmentId);
            return string.Join(" > ", hierarchy.Select(d => d.DepartmentName));
        }

        private async Task<int> CountAllDescendantsAsync(int departmentId)
        {
            var allChildren = await _departmentRepository.GetAllChildDepartmentsRecursiveAsync(departmentId);
            return allChildren.Count;
        }

        #endregion
    }
}

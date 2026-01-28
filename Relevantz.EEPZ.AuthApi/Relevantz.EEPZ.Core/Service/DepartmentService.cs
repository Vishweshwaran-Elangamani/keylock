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
        public async Task<DepartmentResponseDto> CreateDepartmentAsync(CreateDepartmentRequestDto request)
        {
            _logger.LogInformation("Creating department: {DepartmentName} (Code: {DepartmentCode})", request.DepartmentName, request.DepartmentCode);
            if (await _departmentRepository.DepartmentNameExistsAsync(request.DepartmentName))
            {
                _logger.LogWarning("Department name already exists: {DepartmentName}", request.DepartmentName);
                throw new InvalidOperationException(DepartmentMessages.DepartmentNameAlreadyExists);
            }
            if (await _departmentRepository.DepartmentCodeExistsAsync(request.DepartmentCode))
            {
                _logger.LogWarning("Department code already exists: {DepartmentCode}", request.DepartmentCode);
                throw new InvalidOperationException(DepartmentMessages.DepartmentCodeAlreadyExists);
            }
            if (request.ParentDepartmentId.HasValue)
            {
                var parentDepartment = await _departmentRepository.GetByIdAsync(request.ParentDepartmentId.Value);
                if (parentDepartment == null)
                {
                    _logger.LogWarning("Parent department not found: {ParentDepartmentId}", request.ParentDepartmentId.Value);
                    throw new KeyNotFoundException(DepartmentMessages.ParentDepartmentNotFound);
                }
                if (parentDepartment.Status == DepartmentConstants.DepartmentStatus.Inactive)
                {
                    _logger.LogWarning("Cannot add child department to inactive parent: {ParentDepartmentId}", request.ParentDepartmentId.Value);
                    throw new InvalidOperationException(DepartmentMessages.CannotAddChildToInactiveParent);
                }
            }
            if (request.HodEmployeeId.HasValue)
            {
                var hodEmployee = await _employeeRepository.GetByIdAsync(request.HodEmployeeId.Value);
                if (hodEmployee == null)
                {
                    _logger.LogWarning("HOD employee not found: {HodEmployeeId}", request.HodEmployeeId.Value);
                    throw new KeyNotFoundException(DepartmentMessages.HodEmployeeNotFound);
                }
                if (hodEmployee.EmploymentStatus != EmployeeConstants.EmploymentStatus.Active)
                {
                    _logger.LogWarning("HOD employee must be active: {HodEmployeeId}", request.HodEmployeeId.Value);
                    throw new InvalidOperationException(DepartmentMessages.HodEmployeeMustBeActive);
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
            // Ad-hoc mapping
            var childCount = await _departmentRepository.GetChildCountAsync(department.DepartmentId);
            string? hodEmployeeName = null;
            if (department.HodEmployeeId.HasValue)
            {
                hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(department.HodEmployeeId.Value);
            }
            var response = new DepartmentResponseDto
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
            _logger.LogInformation("Department created successfully: {DepartmentName} (Code: {DepartmentCode})", request.DepartmentName, request.DepartmentCode);
            EEPZBusinessLog.Information($"Department created: {request.DepartmentName} (Code: {request.DepartmentCode})");
            return response;
        }
        public async Task<DepartmentResponseDto> UpdateDepartmentAsync(UpdateDepartmentRequestDto request)
        {
            _logger.LogInformation("Updating department: {DepartmentId}", request.DepartmentId);
            var department = await _departmentRepository.GetByIdAsync(request.DepartmentId);
            if (department == null)
            {
                _logger.LogWarning("Department not found: {DepartmentId}", request.DepartmentId);
                throw new KeyNotFoundException(Constants.Messages.DepartmentNotFound);
            }
            if (request.DepartmentName != null && request.DepartmentName != department.DepartmentName)
            {
                if (await _departmentRepository.DepartmentNameExistsAsync(request.DepartmentName, request.DepartmentId))
                {
                    _logger.LogWarning("Department name already exists: {DepartmentName}", request.DepartmentName);
                    throw new InvalidOperationException(DepartmentMessages.DepartmentNameAlreadyExists);
                }
            }
            if (request.DepartmentCode != null && request.DepartmentCode != department.DepartmentCode)
            {
                if (await _departmentRepository.DepartmentCodeExistsAsync(request.DepartmentCode, request.DepartmentId))
                {
                    _logger.LogWarning("Department code already exists: {DepartmentCode}", request.DepartmentCode);
                    throw new InvalidOperationException(DepartmentMessages.DepartmentCodeAlreadyExists);
                }
            }
            if (request.ParentDepartmentId.HasValue)
            {
                if (request.ParentDepartmentId == request.DepartmentId)
                {
                    _logger.LogWarning("Department cannot be its own parent: {DepartmentId}", request.DepartmentId);
                    throw new InvalidOperationException(DepartmentMessages.DepartmentCannotBeItsOwnParent);
                }
                var parentDepartment = await _departmentRepository.GetByIdAsync(request.ParentDepartmentId.Value);
                if (parentDepartment == null)
                {
                    _logger.LogWarning("Parent department not found: {ParentDepartmentId}", request.ParentDepartmentId.Value);
                    throw new KeyNotFoundException(DepartmentMessages.ParentDepartmentNotFound);
                }
                if (await _departmentRepository.IsCircularReferenceAsync(request.DepartmentId, request.ParentDepartmentId.Value))
                {
                    _logger.LogWarning("Circular reference detected for department: {DepartmentId}", request.DepartmentId);
                    throw new InvalidOperationException(DepartmentMessages.CircularReferenceDetected);
                }
            }
            if (request.HodEmployeeId.HasValue)
            {
                var hodEmployee = await _employeeRepository.GetByIdAsync(request.HodEmployeeId.Value);
                if (hodEmployee == null)
                {
                    _logger.LogWarning("HOD employee not found: {HodEmployeeId}", request.HodEmployeeId.Value);
                    throw new KeyNotFoundException(DepartmentMessages.HodEmployeeNotFound);
                }
                if (hodEmployee.EmploymentStatus != EmployeeConstants.EmploymentStatus.Active)
                {
                    _logger.LogWarning("HOD employee must be active: {HodEmployeeId}", request.HodEmployeeId.Value);
                    throw new InvalidOperationException(DepartmentMessages.HodEmployeeMustBeActive);
                }
            }
            if (request.Status != null && request.Status != department.Status)
            {
                if (request.Status == DepartmentConstants.DepartmentStatus.Inactive)
                {
                    var childDepartments = await _departmentRepository.GetChildDepartmentsAsync(request.DepartmentId);
                    if (childDepartments.Any(c => c.Status == DepartmentConstants.DepartmentStatus.Active))
                    {
                        _logger.LogWarning("Cannot inactivate department with active children: {DepartmentId}", request.DepartmentId);
                        throw new InvalidOperationException(DepartmentMessages.CannotInactivateDepartmentWithActiveChildren);
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
            // Ad-hoc mapping
            var childCount = await _departmentRepository.GetChildCountAsync(department.DepartmentId);
            string? hodEmployeeName = null;
            if (department.HodEmployeeId.HasValue)
            {
                hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(department.HodEmployeeId.Value);
            }
            var response = new DepartmentResponseDto
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
            _logger.LogInformation("Department updated successfully: {DepartmentId}", request.DepartmentId);
            EEPZBusinessLog.Information($"Department updated: DepartmentId {request.DepartmentId}");
            return response;
        }
        public async Task<DepartmentResponseDto> GetDepartmentByIdAsync(int departmentId)
        {
            _logger.LogInformation("Retrieving department: {DepartmentId}", departmentId);
            var department = await _departmentRepository.GetDepartmentWithDetailsAsync(departmentId);
            if (department == null)
            {
                _logger.LogWarning("Department not found: {DepartmentId}", departmentId);
                throw new KeyNotFoundException(Constants.Messages.DepartmentNotFound);
            }
            // Ad-hoc mapping
            var childCount = await _departmentRepository.GetChildCountAsync(department.DepartmentId);
            string? hodEmployeeName = null;
            if (department.HodEmployeeId.HasValue)
            {
                hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(department.HodEmployeeId.Value);
            }
            var response = new DepartmentResponseDto
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
            return response;
        }
        public async Task<List<DepartmentResponseDto>> GetAllDepartmentsAsync()
        {
            _logger.LogInformation("Retrieving all departments");
            var departments = await _departmentRepository.GetAllAsync();
            var responses = new List<DepartmentResponseDto>();
            foreach (var dept in departments)
            {
                // Ad-hoc mapping
                var childCount = await _departmentRepository.GetChildCountAsync(dept.DepartmentId);
                string? hodEmployeeName = null;
                if (dept.HodEmployeeId.HasValue)
                {
                    hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(dept.HodEmployeeId.Value);
                }
                responses.Add(new DepartmentResponseDto
                {
                    DepartmentId = dept.DepartmentId,
                    DepartmentName = dept.DepartmentName,
                    DepartmentCode = dept.DepartmentCode,
                    Description = dept.Description,
                    Status = dept.Status,
                    ParentDepartmentId = dept.ParentDepartmentId,
                    ParentDepartmentName = dept.ParentDepartment?.DepartmentName,
                    HodEmployeeId = dept.HodEmployeeId,
                    HodEmployeeName = hodEmployeeName,
                    HodEmployeeCompanyId = dept.HodEmployee?.EmployeeCompanyId,
                    BudgetAllocated = dept.BudgetAllocated,
                    CostCenter = dept.CostCenter,
                    CreatedAt = dept.CreatedAt,
                    UpdatedAt = dept.UpdatedAt,
                    ChildDepartmentCount = childCount,
                    HasChildren = childCount > 0
                });
            }
            return responses;
        }
        public async Task DeleteDepartmentAsync(int departmentId)
        {
            _logger.LogInformation("Deleting department: {DepartmentId}", departmentId);
            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                _logger.LogWarning("Department not found: {DepartmentId}", departmentId);
                throw new KeyNotFoundException(Constants.Messages.DepartmentNotFound);
            }
            if (await _departmentRepository.HasChildDepartmentsAsync(departmentId))
            {
                _logger.LogWarning("Cannot delete department with children: {DepartmentId}", departmentId);
                throw new InvalidOperationException(DepartmentMessages.CannotDeleteDepartmentWithChildren);
            }
            if (await _departmentRepository.HasEmployeesAsync(departmentId))
            {
                _logger.LogWarning("Cannot delete department with employees: {DepartmentId}", departmentId);
                throw new InvalidOperationException(DepartmentMessages.CannotDeleteDepartmentWithEmployees);
            }
            await _departmentRepository.DeleteAsync(departmentId);
            _logger.LogInformation("Department deleted successfully: {DepartmentId}", departmentId);
            EEPZBusinessLog.Information($"Department deleted: DepartmentId {departmentId}");
        }
        public async Task<DepartmentHierarchyResponseDto> GetDepartmentHierarchyTreeAsync(int? rootDepartmentId = null)
        {
            _logger.LogInformation("Retrieving department hierarchy tree. RootDepartmentId: {RootDepartmentId}", rootDepartmentId);
            List<Department> rootDepartments;
            if (rootDepartmentId.HasValue)
            {
                var rootDept = await _departmentRepository.GetDepartmentWithDetailsAsync(rootDepartmentId.Value);
                if (rootDept == null)
                {
                    _logger.LogWarning("Root department not found: {RootDepartmentId}", rootDepartmentId.Value);
                    throw new KeyNotFoundException(DepartmentMessages.RootDepartmentNotFound);
                }
                rootDepartments = new List<Department> { rootDept };
            }
            else
            {
                rootDepartments = await _departmentRepository.GetRootDepartmentsAsync();
            }
            var hierarchyTree = await BuildHierarchyTreeAsync(rootDepartments, 0);
            var result = rootDepartmentId.HasValue && hierarchyTree.Any()
                ? hierarchyTree.First()
                : new DepartmentHierarchyResponseDto
                {
                    DepartmentId = 0,
                    DepartmentName = "Organization",
                    DepartmentCode = "ROOT",
                    Status = DepartmentConstants.DepartmentStatus.Active,
                    Level = -1,
                    Children = hierarchyTree
                };
            return result;
        }
        public async Task<List<DepartmentResponseDto>> GetChildDepartmentsAsync(int parentDepartmentId)
        {
            _logger.LogInformation("Retrieving child departments for parent: {ParentDepartmentId}", parentDepartmentId);
            var childDepartments = await _departmentRepository.GetChildDepartmentsAsync(parentDepartmentId);
            var responses = new List<DepartmentResponseDto>();
            foreach (var dept in childDepartments)
            {
                // Ad-hoc mapping
                var childCount = await _departmentRepository.GetChildCountAsync(dept.DepartmentId);
                string? hodEmployeeName = null;
                if (dept.HodEmployeeId.HasValue)
                {
                    hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(dept.HodEmployeeId.Value);
                }
                responses.Add(new DepartmentResponseDto
                {
                    DepartmentId = dept.DepartmentId,
                    DepartmentName = dept.DepartmentName,
                    DepartmentCode = dept.DepartmentCode,
                    Description = dept.Description,
                    Status = dept.Status,
                    ParentDepartmentId = dept.ParentDepartmentId,
                    ParentDepartmentName = dept.ParentDepartment?.DepartmentName,
                    HodEmployeeId = dept.HodEmployeeId,
                    HodEmployeeName = hodEmployeeName,
                    HodEmployeeCompanyId = dept.HodEmployee?.EmployeeCompanyId,
                    BudgetAllocated = dept.BudgetAllocated,
                    CostCenter = dept.CostCenter,
                    CreatedAt = dept.CreatedAt,
                    UpdatedAt = dept.UpdatedAt,
                    ChildDepartmentCount = childCount,
                    HasChildren = childCount > 0
                });
            }
            return responses;
        }
        public async Task<List<DepartmentResponseDto>> GetRootDepartmentsAsync()
        {
            _logger.LogInformation("Retrieving root departments");
            var rootDepartments = await _departmentRepository.GetRootDepartmentsAsync();
            var responses = new List<DepartmentResponseDto>();
            foreach (var dept in rootDepartments)
            {
                // Ad-hoc mapping
                var childCount = await _departmentRepository.GetChildCountAsync(dept.DepartmentId);
                string? hodEmployeeName = null;
                if (dept.HodEmployeeId.HasValue)
                {
                    hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(dept.HodEmployeeId.Value);
                }
                responses.Add(new DepartmentResponseDto
                {
                    DepartmentId = dept.DepartmentId,
                    DepartmentName = dept.DepartmentName,
                    DepartmentCode = dept.DepartmentCode,
                    Description = dept.Description,
                    Status = dept.Status,
                    ParentDepartmentId = dept.ParentDepartmentId,
                    ParentDepartmentName = dept.ParentDepartment?.DepartmentName,
                    HodEmployeeId = dept.HodEmployeeId,
                    HodEmployeeName = hodEmployeeName,
                    HodEmployeeCompanyId = dept.HodEmployee?.EmployeeCompanyId,
                    BudgetAllocated = dept.BudgetAllocated,
                    CostCenter = dept.CostCenter,
                    CreatedAt = dept.CreatedAt,
                    UpdatedAt = dept.UpdatedAt,
                    ChildDepartmentCount = childCount,
                    HasChildren = childCount > 0
                });
            }
            return responses;
        }
        public async Task<List<DepartmentResponseDto>> GetDepartmentPathAsync(int departmentId)
        {
            _logger.LogInformation("Retrieving department path for: {DepartmentId}", departmentId);
            var hierarchy = await _departmentRepository.GetDepartmentHierarchyAsync(departmentId);
            if (!hierarchy.Any())
            {
                _logger.LogWarning("Department not found: {DepartmentId}", departmentId);
                throw new KeyNotFoundException(Constants.Messages.DepartmentNotFound);
            }
            var responses = new List<DepartmentResponseDto>();
            foreach (var dept in hierarchy)
            {
                // Ad-hoc mapping
                var childCount = await _departmentRepository.GetChildCountAsync(dept.DepartmentId);
                string? hodEmployeeName = null;
                if (dept.HodEmployeeId.HasValue)
                {
                    hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(dept.HodEmployeeId.Value);
                }
                responses.Add(new DepartmentResponseDto
                {
                    DepartmentId = dept.DepartmentId,
                    DepartmentName = dept.DepartmentName,
                    DepartmentCode = dept.DepartmentCode,
                    Description = dept.Description,
                    Status = dept.Status,
                    ParentDepartmentId = dept.ParentDepartmentId,
                    ParentDepartmentName = dept.ParentDepartment?.DepartmentName,
                    HodEmployeeId = dept.HodEmployeeId,
                    HodEmployeeName = hodEmployeeName,
                    HodEmployeeCompanyId = dept.HodEmployee?.EmployeeCompanyId,
                    BudgetAllocated = dept.BudgetAllocated,
                    CostCenter = dept.CostCenter,
                    CreatedAt = dept.CreatedAt,
                    UpdatedAt = dept.UpdatedAt,
                    ChildDepartmentCount = childCount,
                    HasChildren = childCount > 0
                });
            }
            return responses;
        }
        public async Task<List<DepartmentResponseDto>> GetActiveDepartmentsAsync()
        {
            _logger.LogInformation("Retrieving active departments");
            var departments = await _departmentRepository.GetActiveDepartmentsAsync();
            var responses = new List<DepartmentResponseDto>();
            foreach (var dept in departments)
            {
                // Ad-hoc mapping
                var childCount = await _departmentRepository.GetChildCountAsync(dept.DepartmentId);
                string? hodEmployeeName = null;
                if (dept.HodEmployeeId.HasValue)
                {
                    hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(dept.HodEmployeeId.Value);
                }
                responses.Add(new DepartmentResponseDto
                {
                    DepartmentId = dept.DepartmentId,
                    DepartmentName = dept.DepartmentName,
                    DepartmentCode = dept.DepartmentCode,
                    Description = dept.Description,
                    Status = dept.Status,
                    ParentDepartmentId = dept.ParentDepartmentId,
                    ParentDepartmentName = dept.ParentDepartment?.DepartmentName,
                    HodEmployeeId = dept.HodEmployeeId,
                    HodEmployeeName = hodEmployeeName,
                    HodEmployeeCompanyId = dept.HodEmployee?.EmployeeCompanyId,
                    BudgetAllocated = dept.BudgetAllocated,
                    CostCenter = dept.CostCenter,
                    CreatedAt = dept.CreatedAt,
                    UpdatedAt = dept.UpdatedAt,
                    ChildDepartmentCount = childCount,
                    HasChildren = childCount > 0
                });
            }
            return responses;
        }
        public async Task<List<DepartmentResponseDto>> GetInactiveDepartmentsAsync()
        {
            _logger.LogInformation("Retrieving inactive departments");
            var departments = await _departmentRepository.GetInactiveDepartmentsAsync();
            var responses = new List<DepartmentResponseDto>();
            foreach (var dept in departments)
            {
                // Ad-hoc mapping
                var childCount = await _departmentRepository.GetChildCountAsync(dept.DepartmentId);
                string? hodEmployeeName = null;
                if (dept.HodEmployeeId.HasValue)
                {
                    hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(dept.HodEmployeeId.Value);
                }
                responses.Add(new DepartmentResponseDto
                {
                    DepartmentId = dept.DepartmentId,
                    DepartmentName = dept.DepartmentName,
                    DepartmentCode = dept.DepartmentCode,
                    Description = dept.Description,
                    Status = dept.Status,
                    ParentDepartmentId = dept.ParentDepartmentId,
                    ParentDepartmentName = dept.ParentDepartment?.DepartmentName,
                    HodEmployeeId = dept.HodEmployeeId,
                    HodEmployeeName = hodEmployeeName,
                    HodEmployeeCompanyId = dept.HodEmployee?.EmployeeCompanyId,
                    BudgetAllocated = dept.BudgetAllocated,
                    CostCenter = dept.CostCenter,
                    CreatedAt = dept.CreatedAt,
                    UpdatedAt = dept.UpdatedAt,
                    ChildDepartmentCount = childCount,
                    HasChildren = childCount > 0
                });
            }
            return responses;
        }
        public async Task UpdateDepartmentStatusAsync(int departmentId, string status)
        {
            _logger.LogInformation("Updating department status: {DepartmentId} to {Status}", departmentId, status);
            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                _logger.LogWarning("Department not found: {DepartmentId}", departmentId);
                throw new KeyNotFoundException(Constants.Messages.DepartmentNotFound);
            }
            if (status != DepartmentConstants.DepartmentStatus.Active && status != DepartmentConstants.DepartmentStatus.Inactive)
            {
                _logger.LogWarning("Invalid status: {Status}", status);
                throw new ArgumentException(DepartmentMessages.InvalidStatus);
            }
            if (status == DepartmentConstants.DepartmentStatus.Inactive)
            {
                var childDepartments = await _departmentRepository.GetChildDepartmentsAsync(departmentId);
                if (childDepartments.Any(c => c.Status == DepartmentConstants.DepartmentStatus.Active))
                {
                    _logger.LogWarning("Cannot inactivate department with active children: {DepartmentId}", departmentId);
                    throw new InvalidOperationException(DepartmentMessages.CannotInactivateDepartmentWithActiveChildren);
                }
            }
            department.Status = status;
            await _departmentRepository.UpdateAsync(department);
            _logger.LogInformation("Department status updated: {DepartmentId} to {Status}", departmentId, status);
            EEPZBusinessLog.Information($"Department status updated: DepartmentId {departmentId} to {status}");
        }
        public async Task<List<DepartmentResponseDto>> GetDepartmentsByHodAsync(int hodEmployeeId)
        {
            _logger.LogInformation("Retrieving departments for HOD: {HodEmployeeId}", hodEmployeeId);
            var departments = await _departmentRepository.GetDepartmentsByHodAsync(hodEmployeeId);
            var responses = new List<DepartmentResponseDto>();
            foreach (var dept in departments)
            {
                // Ad-hoc mapping
                var childCount = await _departmentRepository.GetChildCountAsync(dept.DepartmentId);
                string? hodEmployeeName = null;
                if (dept.HodEmployeeId.HasValue)
                {
                    hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(dept.HodEmployeeId.Value);
                }
                responses.Add(new DepartmentResponseDto
                {
                    DepartmentId = dept.DepartmentId,
                    DepartmentName = dept.DepartmentName,
                    DepartmentCode = dept.DepartmentCode,
                    Description = dept.Description,
                    Status = dept.Status,
                    ParentDepartmentId = dept.ParentDepartmentId,
                    ParentDepartmentName = dept.ParentDepartment?.DepartmentName,
                    HodEmployeeId = dept.HodEmployeeId,
                    HodEmployeeName = hodEmployeeName,
                    HodEmployeeCompanyId = dept.HodEmployee?.EmployeeCompanyId,
                    BudgetAllocated = dept.BudgetAllocated,
                    CostCenter = dept.CostCenter,
                    CreatedAt = dept.CreatedAt,
                    UpdatedAt = dept.UpdatedAt,
                    ChildDepartmentCount = childCount,
                    HasChildren = childCount > 0
                });
            }
            return responses;
        }
        public async Task AssignHodAsync(int departmentId, int hodEmployeeId)
        {
            _logger.LogInformation("Assigning HOD: {HodEmployeeId} to department: {DepartmentId}", hodEmployeeId, departmentId);
            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                _logger.LogWarning("Department not found: {DepartmentId}", departmentId);
                throw new KeyNotFoundException(Constants.Messages.DepartmentNotFound);
            }
            var employee = await _employeeRepository.GetByIdAsync(hodEmployeeId);
            if (employee == null)
            {
                _logger.LogWarning("Employee not found: {HodEmployeeId}", hodEmployeeId);
                throw new KeyNotFoundException(DepartmentMessages.EmployeeNotFound);
            }
            if (employee.EmploymentStatus != EmployeeConstants.EmploymentStatus.Active)
            {
                _logger.LogWarning("Employee must be active to be HOD: {HodEmployeeId}", hodEmployeeId);
                throw new InvalidOperationException(DepartmentMessages.EmployeeMustBeActiveForHod);
            }
            department.HodEmployeeId = hodEmployeeId;
            await _departmentRepository.UpdateAsync(department);
            _logger.LogInformation("HOD assigned successfully: {HodEmployeeId} to {DepartmentId}", hodEmployeeId, departmentId);
            EEPZBusinessLog.Information($"HOD assigned: EmployeeId {hodEmployeeId} to DepartmentId {departmentId}");
        }
        public async Task RemoveHodAsync(int departmentId)
        {
            _logger.LogInformation("Removing HOD from department: {DepartmentId}", departmentId);
            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                _logger.LogWarning("Department not found: {DepartmentId}", departmentId);
                throw new KeyNotFoundException(Constants.Messages.DepartmentNotFound);
            }
            if (department.HodEmployeeId == null)
            {
                _logger.LogWarning("Department does not have HOD: {DepartmentId}", departmentId);
                throw new InvalidOperationException(DepartmentMessages.DepartmentDoesNotHaveHod);
            }
            department.HodEmployeeId = null;
            await _departmentRepository.UpdateAsync(department);
            _logger.LogInformation("HOD removed successfully from department: {DepartmentId}", departmentId);
            EEPZBusinessLog.Information($"HOD removed from DepartmentId {departmentId}");
        }
        public async Task<List<DepartmentResponseDto>> SearchDepartmentsAsync(string searchTerm)
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
                // Ad-hoc mapping
                var childCount = await _departmentRepository.GetChildCountAsync(dept.DepartmentId);
                string? hodEmployeeName = null;
                if (dept.HodEmployeeId.HasValue)
                {
                    hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(dept.HodEmployeeId.Value);
                }
                responses.Add(new DepartmentResponseDto
                {
                    DepartmentId = dept.DepartmentId,
                    DepartmentName = dept.DepartmentName,
                    DepartmentCode = dept.DepartmentCode,
                    Description = dept.Description,
                    Status = dept.Status,
                    ParentDepartmentId = dept.ParentDepartmentId,
                    ParentDepartmentName = dept.ParentDepartment?.DepartmentName,
                    HodEmployeeId = dept.HodEmployeeId,
                    HodEmployeeName = hodEmployeeName,
                    HodEmployeeCompanyId = dept.HodEmployee?.EmployeeCompanyId,
                    BudgetAllocated = dept.BudgetAllocated,
                    CostCenter = dept.CostCenter,
                    CreatedAt = dept.CreatedAt,
                    UpdatedAt = dept.UpdatedAt,
                    ChildDepartmentCount = childCount,
                    HasChildren = childCount > 0
                });
            }
            return responses;
        }
        public async Task<DepartmentResponseDto> GetDepartmentByCodeAsync(string departmentCode)
        {
            _logger.LogInformation("Retrieving department by code: {DepartmentCode}", departmentCode);
            var department = await _departmentRepository.GetByCodeAsync(departmentCode);
            if (department == null)
            {
                _logger.LogWarning("Department not found with code: {DepartmentCode}", departmentCode);
                throw new KeyNotFoundException(DepartmentMessages.DepartmentNotFoundWithCode);
            }
            // Ad-hoc mapping
            var childCount = await _departmentRepository.GetChildCountAsync(department.DepartmentId);
            string? hodEmployeeName = null;
            if (department.HodEmployeeId.HasValue)
            {
                hodEmployeeName = await _userProfileRepository.GetFullNameByEmployeeIdAsync(department.HodEmployeeId.Value);
            }
            var response = new DepartmentResponseDto
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
            return response;
        }
        public async Task<int> GetTotalDepartmentCountAsync()
        {
            _logger.LogInformation("Retrieving total department count");
            var count = await _departmentRepository.GetTotalDepartmentCountAsync();
            return count;
        }
        public async Task<int> GetActiveDepartmentCountAsync()
        {
            _logger.LogInformation("Retrieving active department count");
            var departments = await _departmentRepository.GetActiveDepartmentsAsync();
            return departments.Count;
        }
        private async Task<List<DepartmentHierarchyResponseDto>> BuildHierarchyTreeAsync(List<Department> departments, int level)
        {
            var result = new List<DepartmentHierarchyResponseDto>();
            foreach (var dept in departments)
            {
                var childDepartments = await _departmentRepository.GetChildDepartmentsAsync(dept.DepartmentId);
                var children = await BuildHierarchyTreeAsync(childDepartments, level + 1);
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
    }
}

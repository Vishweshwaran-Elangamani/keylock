using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;
using MapsterMapper;

namespace Relevantz.EEPZ.Core.Service
{
    public class DepartmentService : IDepartmentService
    {
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IMapper _mapper;

        public DepartmentService(
            IDepartmentRepository departmentRepository,
            IEmployeeRepository employeeRepository,
            IMapper mapper)
        {
            _departmentRepository = departmentRepository;
            _employeeRepository = employeeRepository;
            _mapper = mapper;
        }

        public async Task<DepartmentResponseDto> CreateDepartmentAsync(CreateDepartmentRequestDto request)
        {
            // Validate department code uniqueness
            var existingDept = await _departmentRepository.GetByCodeAsync(request.DepartmentCode);
            if (existingDept != null)
            {
                throw new InvalidOperationException(DepartmentMessages.DepartmentCodeExists);
            }

            // Validate parent department if specified
            if (request.ParentDepartmentId.HasValue)
            {
                var parentDept = await _departmentRepository.GetByIdAsync(request.ParentDepartmentId.Value);
                if (parentDept == null)
                {
                    throw new KeyNotFoundException(DepartmentMessages.ParentDepartmentNotFound);
                }
            }

            // Validate HOD employee if specified
            if (request.HodEmployeeId.HasValue)
            {
                var hodEmployee = await _employeeRepository.GetByIdAsync(request.HodEmployeeId.Value);
                if (hodEmployee == null)
                {
                    throw new KeyNotFoundException(DepartmentMessages.HodEmployeeNotFound);
                }
            }

            var department = _mapper.Map<Department>(request);
            await _departmentRepository.CreateAsync(department);

            EEPZBusinessLog.Information($"Department created: {department.DepartmentName} (ID: {department.DepartmentId})");

            return _mapper.Map<DepartmentResponseDto>(department);
        }

        public async Task<DepartmentResponseDto> UpdateDepartmentAsync(UpdateDepartmentRequestDto request)
        {
            var department = await _departmentRepository.GetByIdAsync(request.DepartmentId);
            if (department == null)
            {
                throw new KeyNotFoundException(DepartmentMessages.DepartmentNotFound);
            }

            // Validate department code uniqueness if changed
            if (!string.IsNullOrWhiteSpace(request.DepartmentCode) && request.DepartmentCode != department.DepartmentCode)
            {
                var existingDept = await _departmentRepository.GetByCodeAsync(request.DepartmentCode);
                if (existingDept != null)
                {
                    throw new InvalidOperationException(DepartmentMessages.DepartmentCodeExists);
                }
                department.DepartmentCode = request.DepartmentCode;
            }

            // FIXED: Handle parent department update (including setting to null)
            if (request.ParentDepartmentId.HasValue)
            {
                if (request.ParentDepartmentId.Value == department.DepartmentId)
                {
                    throw new InvalidOperationException(DepartmentMessages.CannotBeOwnParent);
                }

                var parentDept = await _departmentRepository.GetByIdAsync(request.ParentDepartmentId.Value);
                if (parentDept == null)
                {
                    throw new KeyNotFoundException(DepartmentMessages.ParentDepartmentNotFound);
                }

                department.ParentDepartmentId = request.ParentDepartmentId.Value;
            }
            else if (request.ParentDepartmentId == null)
            {
                // Explicitly set to null to remove parent (make it a root department)
                department.ParentDepartmentId = null;
            }

            // FIXED: Handle HOD employee update (including setting to null)
            if (request.HodEmployeeId.HasValue)
            {
                // Validate the HOD employee exists
                var hodEmployee = await _employeeRepository.GetByIdAsync(request.HodEmployeeId.Value);
                if (hodEmployee == null)
                {
                    throw new KeyNotFoundException(DepartmentMessages.HodEmployeeNotFound);
                }
                department.HodEmployeeId = request.HodEmployeeId.Value;
                EEPZBusinessLog.Information($"HOD assigned: Employee ID {request.HodEmployeeId.Value} to Department {department.DepartmentName}");
            }
            else if (request.HodEmployeeId == null)
            {
                // Explicitly set to null to remove HOD
                department.HodEmployeeId = null;
                EEPZBusinessLog.Information($"HOD removed from Department {department.DepartmentName}");
            }

            // Update other fields
            if (!string.IsNullOrWhiteSpace(request.DepartmentName))
            {
                department.DepartmentName = request.DepartmentName;
            }

            if (request.Description != null)
            {
                department.Description = request.Description;
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                department.Status = request.Status;
            }

            if (request.BudgetAllocated.HasValue)
            {
                department.BudgetAllocated = request.BudgetAllocated.Value;
            }

            if (!string.IsNullOrWhiteSpace(request.CostCenter))
            {
                department.CostCenter = request.CostCenter;
            }

            department.UpdatedAt = DateTime.UtcNow;
            await _departmentRepository.UpdateAsync(department);

            EEPZBusinessLog.Information($"Department updated: {department.DepartmentName} (ID: {department.DepartmentId})");

            // Reload department with navigation properties for proper mapping
            var updatedDepartment = await _departmentRepository.GetByIdAsync(department.DepartmentId);
            return _mapper.Map<DepartmentResponseDto>(updatedDepartment);
        }

        public async Task<DepartmentResponseDto> GetDepartmentByIdAsync(int departmentId)
        {
            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                throw new KeyNotFoundException(DepartmentMessages.DepartmentNotFound);
            }

            return _mapper.Map<DepartmentResponseDto>(department);
        }

        public async Task<List<DepartmentResponseDto>> GetAllDepartmentsAsync()
        {
            var departments = await _departmentRepository.GetAllAsync();
            return _mapper.Map<List<DepartmentResponseDto>>(departments);
        }

        public async Task DeleteDepartmentAsync(int departmentId)
        {
            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                throw new KeyNotFoundException(DepartmentMessages.DepartmentNotFound);
            }

            // Check if department has child departments
            var childDepartments = await _departmentRepository.GetChildDepartmentsAsync(departmentId);
            if (childDepartments.Any())
            {
                throw new InvalidOperationException(DepartmentMessages.CannotDeleteWithChildren);
            }

            // Check if department has employees
            var hasEmployees = await _departmentRepository.HasEmployeesAsync(departmentId);
            if (hasEmployees)
            {
                throw new InvalidOperationException(DepartmentMessages.CannotDeleteWithEmployees);
            }

            await _departmentRepository.DeleteAsync(departmentId);
            EEPZBusinessLog.Information($"Department deleted: {department.DepartmentName} (ID: {departmentId})");
        }

        public async Task<DepartmentHierarchyResponseDto> GetDepartmentHierarchyTreeAsync(int? rootDepartmentId = null)
        {
            var allDepartments = await _departmentRepository.GetAllAsync();

            var hierarchy = new DepartmentHierarchyResponseDto
            {
                Departments = BuildHierarchyTree(allDepartments, rootDepartmentId)
            };

            return hierarchy;
        }

        private List<DepartmentHierarchyNodeDto> BuildHierarchyTree(
            List<Department> allDepartments,
            int? parentId)
        {
            return allDepartments
                .Where(d => d.ParentDepartmentId == parentId)
                .Select(d => new DepartmentHierarchyNodeDto
                {
                    DepartmentId = d.DepartmentId,
                    DepartmentName = d.DepartmentName,
                    DepartmentCode = d.DepartmentCode,
                    Status = d.Status,
                    ParentDepartmentId = d.ParentDepartmentId,
                    HodEmployeeId = d.HodEmployeeId,
                    HodEmployeeName = GetHodEmployeeName(d),
                    BudgetAllocated = d.BudgetAllocated,
                    Children = BuildHierarchyTree(allDepartments, d.DepartmentId)
                })
                .ToList();
        }

        private string? GetHodEmployeeName(Department department)
        {
            if (department.HodEmployee?.Userprofile != null)
            {
                var profile = department.HodEmployee.Userprofile;
                var firstName = profile.FirstName ?? string.Empty;
                var lastName = profile.LastName ?? string.Empty;
                return $"{firstName} {lastName}".Trim();
            }
            return null;
        }

        public async Task<List<DepartmentResponseDto>> GetChildDepartmentsAsync(int parentDepartmentId)
        {
            var departments = await _departmentRepository.GetChildDepartmentsAsync(parentDepartmentId);
            return _mapper.Map<List<DepartmentResponseDto>>(departments);
        }

        public async Task<List<DepartmentResponseDto>> GetRootDepartmentsAsync()
        {
            var departments = await _departmentRepository.GetRootDepartmentsAsync();
            return _mapper.Map<List<DepartmentResponseDto>>(departments);
        }

        public async Task<List<DepartmentResponseDto>> GetDepartmentPathAsync(int departmentId)
        {
            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                throw new KeyNotFoundException(DepartmentMessages.DepartmentNotFound);
            }

            var path = new List<DepartmentResponseDto>();
            var currentDept = department;

            while (currentDept != null)
            {
                path.Insert(0, _mapper.Map<DepartmentResponseDto>(currentDept));

                if (currentDept.ParentDepartmentId.HasValue)
                {
                    currentDept = await _departmentRepository.GetByIdAsync(currentDept.ParentDepartmentId.Value);
                }
                else
                {
                    break;
                }
            }

            return path;
        }

        public async Task<List<DepartmentResponseDto>> GetActiveDepartmentsAsync()
        {
            var departments = await _departmentRepository.GetActiveDepartmentsAsync();
            return _mapper.Map<List<DepartmentResponseDto>>(departments);
        }

        public async Task<List<DepartmentResponseDto>> GetInactiveDepartmentsAsync()
        {
            var departments = await _departmentRepository.GetInactiveDepartmentsAsync();
            return _mapper.Map<List<DepartmentResponseDto>>(departments);
        }

        public async Task UpdateDepartmentStatusAsync(int departmentId, string status)
        {
            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                throw new KeyNotFoundException(DepartmentMessages.DepartmentNotFound);
            }

            department.Status = status;
            department.UpdatedAt = DateTime.UtcNow;
            await _departmentRepository.UpdateAsync(department);

            EEPZBusinessLog.Information($"Department status updated: {department.DepartmentName} (ID: {departmentId}) - Status: {status}");
        }

        public async Task<List<DepartmentResponseDto>> GetDepartmentsByHodAsync(int hodEmployeeId)
        {
            var departments = await _departmentRepository.GetDepartmentsByHodAsync(hodEmployeeId);
            return _mapper.Map<List<DepartmentResponseDto>>(departments);
        }

        public async Task AssignHodAsync(int departmentId, int hodEmployeeId)
        {
            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                throw new KeyNotFoundException(DepartmentMessages.DepartmentNotFound);
            }

            var employee = await _employeeRepository.GetByIdAsync(hodEmployeeId);
            if (employee == null)
            {
                throw new KeyNotFoundException(DepartmentMessages.HodEmployeeNotFound);
            }

            department.HodEmployeeId = hodEmployeeId;
            department.UpdatedAt = DateTime.UtcNow;
            await _departmentRepository.UpdateAsync(department);

            EEPZBusinessLog.Information($"HOD assigned to department: {department.DepartmentName} (ID: {departmentId}) - HOD Employee ID: {hodEmployeeId}");
        }

        public async Task RemoveHodAsync(int departmentId)
        {
            var department = await _departmentRepository.GetByIdAsync(departmentId);
            if (department == null)
            {
                throw new KeyNotFoundException(DepartmentMessages.DepartmentNotFound);
            }

            department.HodEmployeeId = null;
            department.UpdatedAt = DateTime.UtcNow;
            await _departmentRepository.UpdateAsync(department);

            EEPZBusinessLog.Information($"HOD removed from department: {department.DepartmentName} (ID: {departmentId})");
        }

        public async Task<List<DepartmentResponseDto>> SearchDepartmentsAsync(string searchTerm)
        {
            var departments = await _departmentRepository.SearchDepartmentsAsync(searchTerm);
            return _mapper.Map<List<DepartmentResponseDto>>(departments);
        }

        public async Task<DepartmentResponseDto> GetDepartmentByCodeAsync(string departmentCode)
        {
            var department = await _departmentRepository.GetByCodeAsync(departmentCode);
            if (department == null)
            {
                throw new KeyNotFoundException(DepartmentMessages.DepartmentNotFound);
            }

            return _mapper.Map<DepartmentResponseDto>(department);
        }

        public async Task<int> GetTotalDepartmentCountAsync()
        {
            return await _departmentRepository.GetTotalDepartmentCountAsync();
        }

        public async Task<int> GetActiveDepartmentCountAsync()
        {
            var activeDepts = await _departmentRepository.GetActiveDepartmentsAsync();
            return activeDepts.Count;
        }
    }
}

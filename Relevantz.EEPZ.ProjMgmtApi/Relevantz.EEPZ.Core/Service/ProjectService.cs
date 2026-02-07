using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class ProjectService : IProjectService
    {
        private readonly IProjectRepository _projectRepository;
        private readonly ILogger<ProjectService> _logger;

        public ProjectService(IProjectRepository projectRepository, ILogger<ProjectService> logger)
        {
            _projectRepository = projectRepository;
            _logger = logger;
        }

        public async Task<ApiResponse<ProjectResponse>> CreateProjectAsync(CreateProjectRequest request)
        {
            _logger.LogInformation("Creating project: {ProjectName}", request.ProjectName);

            if (await _projectRepository.ProjectNameExistsAsync(request.ProjectName))
                return ApiResponse<ProjectResponse>.ErrorResponse("Project name already exists.");

            var validationErrors = new List<string>();
            await ValidateEmployeeExistenceAsync(validationErrors, request.ResourceOwnerEmployeeId, "Resource Owner employee does not exist.");
            await ValidateEmployeeExistenceAsync(validationErrors, request.L1ApproverEmployeeId, "L1 Approver employee does not exist.");
            await ValidateEmployeeExistenceAsync(validationErrors, request.L2ApproverEmployeeId, "L2 Approver employee does not exist.");

            if (validationErrors.Any())
                return ApiResponse<ProjectResponse>.ErrorResponse("Validation failed.", validationErrors);

            var project = new Project
            {
                ProjectName = request.ProjectName,
                ClientName = request.ClientName,
                Description = request.Description,
                BusinessUnit = request.BusinessUnit,
                Department = request.Department,
                EngagementModel = request.EngagementModel,
                Status = request.Status,
                StartDate = DateOnly.FromDateTime(request.StartDate),
                EndDate = request.EndDate.HasValue ? DateOnly.FromDateTime(request.EndDate.Value) : null,
                ResourceOwnerEmployeeId = request.ResourceOwnerEmployeeId,
                L1approverEmployeeId = request.L1ApproverEmployeeId,
                L2approverEmployeeId = request.L2ApproverEmployeeId,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
            };

            var created = await _projectRepository.CreateProjectAsync(project);
            var retrieved = await _projectRepository.GetProjectByIdAsync(created.ProjectId);
            var response = MapToProjectResponse(retrieved!);

            _logger.LogInformation("Project {ProjectId} created successfully.", created.ProjectId);
            return ApiResponse<ProjectResponse>.SuccessResponse(response, "Project created successfully.");
        }

        public async Task<ApiResponse<ProjectResponse>> UpdateProjectAsync(UpdateProjectRequest request)
        {
            _logger.LogInformation("Updating project: {ProjectId}", request.ProjectId);

            var project = await _projectRepository.GetProjectByIdAsync(request.ProjectId);
            if (project == null)
                return ApiResponse<ProjectResponse>.ErrorResponse("Project not found.");

            if (await _projectRepository.ProjectNameExistsAsync(request.ProjectName, request.ProjectId))
                return ApiResponse<ProjectResponse>.ErrorResponse("Project name already exists.");

            project.ProjectName = request.ProjectName;
            project.Description = request.Description;
            project.BusinessUnit = request.BusinessUnit;
            project.Department = request.Department;
            project.EngagementModel = request.EngagementModel;
            project.Status = request.Status;
            project.StartDate = DateOnly.FromDateTime(request.StartDate);
            project.EndDate = request.EndDate.HasValue ? DateOnly.FromDateTime(request.EndDate.Value) : null;
            project.UpdatedAt = DateTime.Now;

            await _projectRepository.UpdateProjectAsync(project);
            var updated = await _projectRepository.GetProjectByIdAsync(project.ProjectId);
            var response = MapToProjectResponse(updated!);

            _logger.LogInformation("Project {ProjectId} updated successfully.", project.ProjectId);
            return ApiResponse<ProjectResponse>.SuccessResponse(response, "Project updated successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteProjectAsync(int projectId)
        {
            _logger.LogInformation("Deleting project: {ProjectId}", projectId);

            if (!await _projectRepository.ProjectExistsAsync(projectId))
                return ApiResponse<bool>.ErrorResponse("Project not found.");

            var result = await _projectRepository.DeleteProjectAsync(projectId);
            return result
                ? ApiResponse<bool>.SuccessResponse(true, "Project deleted successfully.")
                : ApiResponse<bool>.ErrorResponse("Cannot delete project while employees are still mapped. Please unmap all employees first.");
        }

        public async Task<ApiResponse<ProjectDetailResponse>> GetProjectByIdAsync(int projectId)
        {
            var project = await _projectRepository.GetProjectByIdAsync(projectId);
            if (project == null)
                return ApiResponse<ProjectDetailResponse>.ErrorResponse("Project not found.");

            var employees = await _projectRepository.GetProjectEmployeesAsync(projectId);
            var response = MapToProjectDetailResponse(project, employees);
            return ApiResponse<ProjectDetailResponse>.SuccessResponse(response, "Project retrieved successfully.");
        }

        public async Task<ApiResponse<List<ProjectResponse>>> GetAllProjectsAsync()
        {
            var list = await _projectRepository.GetAllProjectsAsync();
            var response = list.Select(MapToProjectResponse).ToList();
            return ApiResponse<List<ProjectResponse>>.SuccessResponse(response, "Projects retrieved successfully.");
        }

        public async Task<ApiResponse<bool>> UpdateReportingManagersAsync(UpdateReportingManagersRequest request)
        {
            _logger.LogInformation("Updating reporting managers for project: {ProjectId}", request.ProjectId);

            if (!await _projectRepository.ProjectExistsAsync(request.ProjectId))
                return ApiResponse<bool>.ErrorResponse("Project not found.");

            var validationErrors = new List<string>();
            await ValidateEmployeeExistenceAsync(validationErrors, request.ResourceOwnerEmployeeId, "Resource Owner employee does not exist.");
            await ValidateEmployeeExistenceAsync(validationErrors, request.L1ApproverEmployeeId, "L1 Approver employee does not exist.");
            await ValidateEmployeeExistenceAsync(validationErrors, request.L2ApproverEmployeeId, "L2 Approver employee does not exist.");

            if (validationErrors.Any())
                return ApiResponse<bool>.ErrorResponse("Validation failed.", validationErrors);

            var result = await _projectRepository.UpdateReportingManagersAsync(
                request.ProjectId,
                request.ResourceOwnerEmployeeId,
                request.L1ApproverEmployeeId,
                request.L2ApproverEmployeeId);

            return result
                ? ApiResponse<bool>.SuccessResponse(true, "Reporting managers updated successfully.")
                : ApiResponse<bool>.ErrorResponse("Failed to update reporting managers.");
        }

        public async Task<ApiResponse<bool>> MapEmployeesToProjectAsync(MapEmployeesToProjectRequest request)
        {
            _logger.LogInformation("Mapping employees to project {ProjectId}", request.ProjectId);

            if (!await _projectRepository.ProjectExistsAsync(request.ProjectId))
                return ApiResponse<bool>.ErrorResponse("Project not found.");

            if (request.Employees == null || !request.Employees.Any())
                return ApiResponse<bool>.ErrorResponse("No employees provided to map.");

            var invalids = new List<string>();
            foreach (var e in request.Employees)
            {
                if (!await _projectRepository.EmployeeMasterExistsAsync(e.EmployeeId))
                    invalids.Add($"Employee master id {e.EmployeeId} does not exist.");
            }
            if (invalids.Any())
                return ApiResponse<bool>.ErrorResponse("Validation failed.", invalids);

            var resolved = new Dictionary<int, int>();

            foreach (var e in request.Employees.Select(x => x.EmployeeId).Distinct())
            {
                var eid = await _projectRepository.GetEmployeeIdByMasterIdAsync(e);
                if (!eid.HasValue || eid.Value <= 0)
                    invalids.Add($"Employee master id {e} could not be resolved to EmployeeId.");
                else
                    resolved[e] = eid.Value;
            }
            if (invalids.Any())
                return ApiResponse<bool>.ErrorResponse("Validation failed.", invalids);

            var actualEmployeeIds = resolved.Values.Distinct().ToList();

            var resourcePoolProject = await _projectRepository.GetResourcePoolProjectAsync();
            if (resourcePoolProject != null && request.ProjectId != resourcePoolProject.ProjectId)
            {
                var poolMappings = await _projectRepository.GetResourcePoolMappingsAsync(resourcePoolProject.ProjectId, actualEmployeeIds);
                if (poolMappings.Any())
                    await _projectRepository.RemoveProjectEmployeeMappingsAsync(poolMappings);
            }
            if (resourcePoolProject != null && request.ProjectId == resourcePoolProject.ProjectId)
            {
                var otherMappings = await _projectRepository.GetOtherProjectMappingsAsync(resourcePoolProject.ProjectId, actualEmployeeIds);
                if (otherMappings.Any())
                    await _projectRepository.RemoveProjectEmployeeMappingsAsync(otherMappings);
            }

            var project = await _projectRepository.GetProjectByIdAsync(request.ProjectId);
            if (project == null)
                return ApiResponse<bool>.ErrorResponse("Project not found.");

            int? managerMasterId = project.L1approverEmployeeId ?? project.L2approverEmployeeId ?? project.ResourceOwnerEmployeeId;
            int? managerEmployeeId = managerMasterId.HasValue
                ? await _projectRepository.GetEmployeeIdByMasterIdAsync(managerMasterId.Value)
                : null;

            var mappingUpdates = new List<Projectemployee>();
            var employeesToUpdate = new List<Employee>();

            foreach (var emp in request.Employees.Where(e => e.IsPrimary))
            {
                var actualId = resolved[emp.EmployeeId];

                var existing = await _projectRepository.GetProjectEmployeesByEmployeeIdAsync(actualId);
                foreach (var map in existing.Where(m => m.IsPrimary && m.ProjectId != request.ProjectId))
                {
                    map.IsPrimary = false;
                    mappingUpdates.Add(map);
                }

                if (managerEmployeeId.HasValue)
                {
                    var empEntity = await _projectRepository.GetEmployeeByIdAsync(actualId);
                    if (empEntity != null && empEntity.ReportingManagerEmployeeId != managerEmployeeId.Value)
                    {
                        empEntity.ReportingManagerEmployeeId = managerEmployeeId.Value;
                        employeesToUpdate.Add(empEntity);
                    }
                }
            }

            if (mappingUpdates.Any())
            {
                var updatedFlags = await _projectRepository.UpdateProjectEmployeePrimaryFlagsAsync(mappingUpdates);
                if (!updatedFlags)
                    return ApiResponse<bool>.ErrorResponse("Failed to update primary flags.");
            }

            foreach (var e in employeesToUpdate)
            {
                if (!await _projectRepository.UpdateEmployeeAsync(e))
                    return ApiResponse<bool>.ErrorResponse($"Failed to update employee {e.EmployeeId} reporting manager.");
            }

            var projectEmployees = request.Employees.Select(e => new Projectemployee
            {
                ProjectId = request.ProjectId,
                EmployeeId = resolved[e.EmployeeId],
                AssignedAt = DateTime.UtcNow,
                IsPrimary = e.IsPrimary
            }).ToList();

            var mapped = await _projectRepository.MapEmployeesToProjectAsync(request.ProjectId, projectEmployees);

            var msg = managerEmployeeId.HasValue
                ? "Employees mapped. Reporting managers updated, resource pool enforced."
                : "Employees mapped. No reporting manager assigned, resource pool enforced.";

            return mapped
                ? ApiResponse<bool>.SuccessResponse(true, msg)
                : ApiResponse<bool>.ErrorResponse("Failed to map employees to project.");
        }

        public async Task<ApiResponse<bool>> UnmapEmployeesFromProjectAsync(UnmapEmployeesFromProjectRequest request)
        {
            _logger.LogInformation("Unmapping employees from project {ProjectId}", request.ProjectId);

            if (!await _projectRepository.ProjectExistsAsync(request.ProjectId))
                return ApiResponse<bool>.ErrorResponse("Project not found.");

            if (request.EmployeeIds == null || !request.EmployeeIds.Any())
                return ApiResponse<bool>.ErrorResponse("No employees provided to unmap.");

            var unmapped = await _projectRepository.UnmapEmployeesFromProjectAsync(request.ProjectId, request.EmployeeIds);
            if (!unmapped)
                return ApiResponse<bool>.ErrorResponse("Failed to unmap employees from project.");

            var moved = await _projectRepository.MoveUnmappedEmployeesToResourcePoolAsync(request.EmployeeIds);
            var msg = moved > 0
                ? $"Employees unmapped successfully. {moved} moved to resource pool."
                : "Employees unmapped successfully.";

            return ApiResponse<bool>.SuccessResponse(true, msg);
        }

        public async Task<ApiResponse<List<EmployeeBasicInfo>>> GetAvailableEmployeesAsync()
        {
            return ApiResponse<List<EmployeeBasicInfo>>.SuccessResponse(new List<EmployeeBasicInfo>(), "Employees retrieved successfully.");
        }

        public async Task<ApiResponse<Dictionary<int, EmployeePrimaryProjectInfo?>>> GetAllEmployeesWithPrimaryProjectAsync()
        {
            var dict = await _projectRepository.GetAllEmployeesWithPrimaryProjectAsync();
            var mapped = dict.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.HasValue
                    ? new EmployeePrimaryProjectInfo
                    { ProjectId = kvp.Value.Value.ProjectId, ProjectName = kvp.Value.Value.ProjectName }
                    : null);

            return ApiResponse<Dictionary<int, EmployeePrimaryProjectInfo?>>.SuccessResponse(mapped, "Primary project info retrieved successfully.");
        }

        private async Task ValidateEmployeeExistenceAsync(List<string> errors, int? id, string message)
        {
            if (id.HasValue && id.Value > 0)
            {
                var exists = await _projectRepository.EmployeeMasterExistsAsync(id.Value);
                if (!exists)
                {
                    errors.Add(message);
                }
            }
        }

        private static ProjectResponse MapToProjectResponse(Project project)
        {
            return new ProjectResponse
            {
                ProjectId = project.ProjectId,
                ProjectName = project.ProjectName,
                ClientName = project.ClientName,
                Description = project.Description,
                BusinessUnit = project.BusinessUnit,
                Department = project.Department,
                EngagementModel = project.EngagementModel,
                Status = project.Status,
                StartDate = project.StartDate.ToDateTime(TimeOnly.MinValue),
                EndDate = project.EndDate?.ToDateTime(TimeOnly.MinValue),
                ResourceOwner = project.ResourceOwnerEmployee != null ? MapToEmployeeBasicInfo(project.ResourceOwnerEmployee) : null,
                L1Approver = project.L1approverEmployee != null ? MapToEmployeeBasicInfo(project.L1approverEmployee) : null,
                L2Approver = project.L2approverEmployee != null ? MapToEmployeeBasicInfo(project.L2approverEmployee) : null,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt
            };
        }

        private static ProjectDetailResponse MapToProjectDetailResponse(Project project, List<Projectemployee> projectEmployees)
        {
            return new ProjectDetailResponse
            {
                ProjectId = project.ProjectId,
                ProjectName = project.ProjectName,
                ClientName = project.ClientName,
                Description = project.Description,
                BusinessUnit = project.BusinessUnit,
                Department = project.Department,
                EngagementModel = project.EngagementModel,
                Status = project.Status,
                StartDate = project.StartDate.ToDateTime(TimeOnly.MinValue),
                EndDate = project.EndDate?.ToDateTime(TimeOnly.MinValue),

                ResourceOwner = project.ResourceOwnerEmployee != null ? MapToEmployeeBasicInfo(project.ResourceOwnerEmployee) : null,
                L1Approver = project.L1approverEmployee != null ? MapToEmployeeBasicInfo(project.L1approverEmployee) : null,
                L2Approver = project.L2approverEmployee != null ? MapToEmployeeBasicInfo(project.L2approverEmployee) : null,

                MappedEmployees = projectEmployees.Select(pe =>
                {
                    var info = MapToEmployeeBasicInfo(pe.Employee);
                    info.IsPrimary = pe.IsPrimary;
                    return info;
                }).ToList(),

                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt
            };
        }

        private static EmployeeBasicInfo MapToEmployeeBasicInfo(Employeedetailsmaster e) =>
            new()
            {
                EmployeeMasterId = e.EmployeeMasterId,
                EmployeeId = e.EmployeeId,
                EmployeeCompanyId = e.Employee?.EmployeeCompanyId ?? string.Empty,
                FirstName = e.Employee?.Userprofile?.FirstName,
                LastName = e.Employee?.Userprofile?.LastName,
                Email = e.Employee?.Userauthentication?.Email,
                RoleName = e.Role?.RoleName,
                DepartmentName = e.Department?.DepartmentName
            };
    }
}

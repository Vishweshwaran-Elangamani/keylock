using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class ProjectService : IProjectService
    {
        private readonly IProjectRepository _projectRepository;

        public ProjectService(IProjectRepository projectRepository)
        {
            _projectRepository = projectRepository;
        }

        public async Task<ApiResponse<ProjectResponse>> CreateProjectAsync(CreateProjectRequest request)
        {
            try
            {
                if (await _projectRepository.ProjectNameExistsAsync(request.ProjectName))
                {
                    return ApiResponse<ProjectResponse>.ErrorResponse("Project name already exists.");
                }

                var validationErrors = new List<string>();
                
                if (request.ResourceOwnerEmployeeId.HasValue)
                {
                    if (!await _projectRepository.EmployeeMasterExistsAsync(request.ResourceOwnerEmployeeId.Value))
                        validationErrors.Add("Resource Owner employee does not exist.");
                }

                if (request.L1ApproverEmployeeId.HasValue)
                {
                    if (!await _projectRepository.EmployeeMasterExistsAsync(request.L1ApproverEmployeeId.Value))
                        validationErrors.Add("L1 Approver employee does not exist.");
                }

                if (request.L2ApproverEmployeeId.HasValue)
                {
                    if (!await _projectRepository.EmployeeMasterExistsAsync(request.L2ApproverEmployeeId.Value))
                        validationErrors.Add("L2 Approver employee does not exist.");
                }

                if (validationErrors.Any())
                {
                    return ApiResponse<ProjectResponse>.ErrorResponse("Validation failed.", validationErrors);
                }

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

                var createdProject = await _projectRepository.CreateProjectAsync(project);

                var fullProject = await _projectRepository.GetProjectByIdAsync(createdProject.ProjectId);
                
                var response = MapToProjectResponse(fullProject!);

                return ApiResponse<ProjectResponse>.SuccessResponse(response, "Project created successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<ProjectResponse>.ErrorResponse($"An error occurred while creating the project: {ex.Message}");
            }
        }

        public async Task<ApiResponse<ProjectResponse>> UpdateProjectAsync(UpdateProjectRequest request)
        {
            try
            {
                var existingProject = await _projectRepository.GetProjectByIdAsync(request.ProjectId);
                
                if (existingProject == null)
                {
                    return ApiResponse<ProjectResponse>.ErrorResponse("Project not found.");
                }

                if (await _projectRepository.ProjectNameExistsAsync(request.ProjectName, request.ProjectId))
                {
                    return ApiResponse<ProjectResponse>.ErrorResponse("Project name already exists.");
                }

                existingProject.ProjectName = request.ProjectName;
                existingProject.Description = request.Description;
                existingProject.BusinessUnit = request.BusinessUnit;
                existingProject.Department = request.Department;
                existingProject.EngagementModel = request.EngagementModel;
                existingProject.Status = request.Status;
                existingProject.StartDate = DateOnly.FromDateTime(request.StartDate);
                existingProject.EndDate = request.EndDate.HasValue ? DateOnly.FromDateTime(request.EndDate.Value) : null;
                existingProject.UpdatedAt = DateTime.Now;

                await _projectRepository.UpdateProjectAsync(existingProject);
                
                var updatedProject = await _projectRepository.GetProjectByIdAsync(request.ProjectId);
                var response = MapToProjectResponse(updatedProject!);

                return ApiResponse<ProjectResponse>.SuccessResponse(response, "Project updated successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<ProjectResponse>.ErrorResponse($"An error occurred while updating the project: {ex.Message}");
            }
        }
        public async Task<ApiResponse<bool>> DeleteProjectAsync(int projectId)
{
    try
    {
        if (!await _projectRepository.ProjectExistsAsync(projectId))
        {
            return ApiResponse<bool>.ErrorResponse("Project not found.");
        }

        var result = await _projectRepository.DeleteProjectAsync(projectId);

        if (result)
        {
            return ApiResponse<bool>.SuccessResponse(true, "Project deleted successfully.");
        }

        return ApiResponse<bool>.ErrorResponse("Cannot delete project while employees are still mapped. Please unmap all employees first.");
    }
    catch (Exception ex)
    {
        return ApiResponse<bool>.ErrorResponse($"An error occurred while deleting the project: {ex.Message}");
    }
}


        public async Task<ApiResponse<ProjectDetailResponse>> GetProjectByIdAsync(int projectId)
        {
            try
            {
                var project = await _projectRepository.GetProjectByIdAsync(projectId);
                
                if (project == null)
                {
                    return ApiResponse<ProjectDetailResponse>.ErrorResponse("Project not found.");
                }

                var projectEmployees = await _projectRepository.GetProjectEmployeesAsync(projectId);
                
                var response = MapToProjectDetailResponse(project, projectEmployees);

                return ApiResponse<ProjectDetailResponse>.SuccessResponse(response, "Project retrieved successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<ProjectDetailResponse>.ErrorResponse($"An error occurred while retrieving the project: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<ProjectResponse>>> GetAllProjectsAsync()
        {
            try
            {
                var projects = await _projectRepository.GetAllProjectsAsync();
                
                var response = projects.Select(MapToProjectResponse).ToList();

                return ApiResponse<List<ProjectResponse>>.SuccessResponse(response, "Projects retrieved successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<List<ProjectResponse>>.ErrorResponse($"An error occurred while retrieving projects: {ex.Message}");
            }
        }

        public async Task<ApiResponse<bool>> UpdateReportingManagersAsync(UpdateReportingManagersRequest request)
        {
            try
            {
                if (!await _projectRepository.ProjectExistsAsync(request.ProjectId))
                {
                    return ApiResponse<bool>.ErrorResponse("Project not found.");
                }

                var validationErrors = new List<string>();
                
                if (request.ResourceOwnerEmployeeId.HasValue)
                {
                    if (!await _projectRepository.EmployeeMasterExistsAsync(request.ResourceOwnerEmployeeId.Value))
                        validationErrors.Add("Resource Owner employee does not exist.");
                }

                if (request.L1ApproverEmployeeId.HasValue)
                {
                    if (!await _projectRepository.EmployeeMasterExistsAsync(request.L1ApproverEmployeeId.Value))
                        validationErrors.Add("L1 Approver employee does not exist.");
                }

                if (request.L2ApproverEmployeeId.HasValue)
                {
                    if (!await _projectRepository.EmployeeMasterExistsAsync(request.L2ApproverEmployeeId.Value))
                        validationErrors.Add("L2 Approver employee does not exist.");
                }

                if (validationErrors.Any())
                {
                    return ApiResponse<bool>.ErrorResponse("Validation failed.", validationErrors);
                }

                var result = await _projectRepository.UpdateReportingManagersAsync(
                    request.ProjectId,
                    request.ResourceOwnerEmployeeId,
                    request.L1ApproverEmployeeId,
                    request.L2ApproverEmployeeId
                );

                if (result)
                {
                    return ApiResponse<bool>.SuccessResponse(true, "Reporting managers updated successfully.");
                }

                return ApiResponse<bool>.ErrorResponse("Failed to update reporting managers.");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"An error occurred while updating reporting managers: {ex.Message}");
            }
        }

        
        public async Task<ApiResponse<bool>> MapEmployeesToProjectAsync(MapEmployeesToProjectRequest request)
        {
            try
            {
                if (!await _projectRepository.ProjectExistsAsync(request.ProjectId))
                {
                    return ApiResponse<bool>.ErrorResponse("Project not found.");
                }
                if (request.Employees == null || !request.Employees.Any())
                {
                    return ApiResponse<bool>.ErrorResponse("No employees provided to map.");
                }
                var validationErrors = new List<string>();
                foreach (var emp in request.Employees)
                {
                    if (!await _projectRepository.EmployeeMasterExistsAsync(emp.EmployeeId))
                    {
                        validationErrors.Add($"Employee with ID {emp.EmployeeId} does not exist.");
                    }
                }

                if (validationErrors.Any())
                {
                    return ApiResponse<bool>.ErrorResponse("Validation failed.", validationErrors);
                }

                var project = await _projectRepository.GetProjectByIdAsync(request.ProjectId);
                if (project == null)
                {
                    return ApiResponse<bool>.ErrorResponse("Project not found.");
                }
                int? reportingManagerMasterId = project.L1approverEmployeeId ?? project.L2approverEmployeeId;
                int? reportingManagerEmployeeId = null;

                if (reportingManagerMasterId.HasValue)
                {
                    reportingManagerEmployeeId = await _projectRepository.GetEmployeeIdByMasterIdAsync(reportingManagerMasterId.Value);
                    
                    if (!reportingManagerEmployeeId.HasValue)
                    {
                        return ApiResponse<bool>.ErrorResponse("Invalid reporting manager configuration for this project.");
                    }
                }

                var employeesToUpdate = new List<Employee>();
                var existingMappingsToUpdate = new List<Projectemployee>();

                foreach (var emp in request.Employees.Where(e => e.IsPrimary))
                {
                    var existingMappings = await _projectRepository.GetProjectEmployeesByEmployeeIdAsync(emp.EmployeeId);

                    foreach (var mapping in existingMappings.Where(m => m.IsPrimary && m.ProjectId != request.ProjectId))
                    {
                        mapping.IsPrimary = false;
                        existingMappingsToUpdate.Add(mapping);
                    }

                    if (reportingManagerEmployeeId.HasValue)
                    {
                        var actualEmployeeId = await _projectRepository.GetEmployeeIdByMasterIdAsync(emp.EmployeeId);
                        
                        if (actualEmployeeId.HasValue)
                        {
                            var employee = await _projectRepository.GetEmployeeByIdAsync(actualEmployeeId.Value);
                            
                            if (employee != null)
                            {
                                employee.ReportingManagerEmployeeId = reportingManagerEmployeeId.Value;
                                employeesToUpdate.Add(employee);
                            }
                        }
                    }
                }

                if (existingMappingsToUpdate.Any())
                {
                    var updateFlagsResult = await _projectRepository.UpdateProjectEmployeePrimaryFlagsAsync(existingMappingsToUpdate);
                    if (!updateFlagsResult)
                    {
                        return ApiResponse<bool>.ErrorResponse("Failed to update existing employee primary flags.");
                    }
                }

                foreach (var employee in employeesToUpdate)
                {
                    var updateEmployeeResult = await _projectRepository.UpdateEmployeeAsync(employee);
                    if (!updateEmployeeResult)
                    {
                        return ApiResponse<bool>.ErrorResponse($"Failed to update reporting manager for employee {employee.EmployeeId}.");
                    }
                }

                var projectEmployees = request.Employees.Select(emp => new Projectemployee
                {
                    ProjectId = request.ProjectId,
                    EmployeeId = emp.EmployeeId,
                    AssignedAt = DateTime.UtcNow,
                    IsPrimary = emp.IsPrimary
                }).ToList();

                var result = await _projectRepository.MapEmployeesToProjectAsync(request.ProjectId, projectEmployees);

                if (result)
                {
                    var successMessage = reportingManagerEmployeeId.HasValue
                        ? "Employees mapped to project successfully and reporting managers updated."
                        : "Employees mapped to project successfully. No reporting manager assigned (L1/L2 approvers not set).";
                    
                    return ApiResponse<bool>.SuccessResponse(true, successMessage);
                }

                return ApiResponse<bool>.ErrorResponse("Failed to map employees to project.");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"An error occurred while mapping employees: {ex.Message}");
            }
        }


public async Task<ApiResponse<bool>> UnmapEmployeesFromProjectAsync(UnmapEmployeesFromProjectRequest request)
{
    try
    {
        if (!await _projectRepository.ProjectExistsAsync(request.ProjectId))
        {
            return ApiResponse<bool>.ErrorResponse("Project not found.");
        }

        if (request.EmployeeIds == null || !request.EmployeeIds.Any())
        {
            return ApiResponse<bool>.ErrorResponse("No employees provided to unmap.");
        }

        var result = await _projectRepository.UnmapEmployeesFromProjectAsync(request.ProjectId, request.EmployeeIds);

        if (!result)
        {
            return ApiResponse<bool>.ErrorResponse("Failed to unmap employees from project.");
        }


        var movedToResourcePool = await _projectRepository.MoveUnmappedEmployeesToResourcePoolAsync(request.EmployeeIds);

        var message = movedToResourcePool > 0
            ? $"Employees unmapped from project successfully. {movedToResourcePool} employee(s) moved to resource pool."
            : "Employees unmapped from project successfully.";

        return ApiResponse<bool>.SuccessResponse(true, message);
    }
    catch (Exception ex)
    {
        return ApiResponse<bool>.ErrorResponse($"An error occurred while unmapping employees: {ex.Message}");
    }
}


        public async Task<ApiResponse<List<EmployeeBasicInfo>>> GetAvailableEmployeesAsync()
        {
            try
            {
                return ApiResponse<List<EmployeeBasicInfo>>.SuccessResponse(
                    new List<EmployeeBasicInfo>(), 
                    "Employees retrieved successfully."
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<List<EmployeeBasicInfo>>.ErrorResponse($"An error occurred while retrieving employees: {ex.Message}");
            }
        }

public async Task<ApiResponse<Dictionary<int, EmployeePrimaryProjectInfo?>>> GetAllEmployeesWithPrimaryProjectAsync()
{
    try
    {
        var primaryProjectsDict = await _projectRepository.GetAllEmployeesWithPrimaryProjectAsync();

        var result = primaryProjectsDict.ToDictionary(
            kvp => kvp.Key,
            kvp => kvp.Value.HasValue
                ? new EmployeePrimaryProjectInfo
                {
                    ProjectId = kvp.Value.Value.ProjectId,
                    ProjectName = kvp.Value.Value.ProjectName
                }
                : null
        );

        return ApiResponse<Dictionary<int, EmployeePrimaryProjectInfo?>>.SuccessResponse(
            result,
            "Employee primary project information retrieved successfully."
        );
    }
    catch (Exception ex)
    {
        return ApiResponse<Dictionary<int, EmployeePrimaryProjectInfo?>>.ErrorResponse(
            $"An error occurred while retrieving employee primary projects: {ex.Message}"
        );
    }
}


        private ProjectResponse MapToProjectResponse(Project project)
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

        private ProjectDetailResponse MapToProjectDetailResponse(Project project, List<Projectemployee> projectEmployees)
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
                MappedEmployees = projectEmployees.Select(pe => MapToEmployeeBasicInfo(pe.Employee)).ToList(),
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt
            };
        }

        private EmployeeBasicInfo MapToEmployeeBasicInfo(Employeedetailsmaster employee)
        {
            return new EmployeeBasicInfo
            {
                EmployeeMasterId = employee.EmployeeMasterId,
                EmployeeId = employee.EmployeeId,
                EmployeeCompanyId = employee.Employee?.EmployeeCompanyId ?? string.Empty,
                FirstName = employee.Employee?.Userprofile?.FirstName,
                LastName = employee.Employee?.Userprofile?.LastName,
                Email = employee.Employee?.Userauthentication?.Email,
                RoleName = employee.Role?.RoleName,
                DepartmentName = employee.Department?.DepartmentName
            };
        }


        

        
    }
}

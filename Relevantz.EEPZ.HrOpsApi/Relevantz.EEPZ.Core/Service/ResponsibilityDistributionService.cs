using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Core.Service
{
    public class ResponsibilityDistributionService : IResponsibilityDistributionService
    {
        private readonly IResponsibilityDistributionRepository _responsibilityDistributionRepository;

        public ResponsibilityDistributionService(
            IResponsibilityDistributionRepository responsibilityDistributionRepository)
        {
            _responsibilityDistributionRepository = responsibilityDistributionRepository;
        }

        public async Task<ApiResponseDto<ResponsibilityDistributionResponseDto>> CreateResponsibilityDistributionAsync(CreateResponsibilityDistributionRequestDto request)
        {
            try
            {

                if (request.TeamId <= 0)
                {
                    Console.WriteLine($"[CREATE] Invalid TeamId: {request.TeamId}");
                    return ApiResponseDto<ResponsibilityDistributionResponseDto>.FailureResponse("TeamId must be greater than 0");
                }

                if (request.ManagerUserId <= 0)
                {
                    Console.WriteLine($"[CREATE] Invalid ManagerUserId: {request.ManagerUserId}");
                    return ApiResponseDto<ResponsibilityDistributionResponseDto>.FailureResponse("ManagerUserId must be greater than 0");
                }

                if (request.MemberCount <= 0)
                {
                    Console.WriteLine($"[CREATE] Invalid MemberCount: {request.MemberCount}");
                    return ApiResponseDto<ResponsibilityDistributionResponseDto>.FailureResponse("MemberCount must be greater than 0");
                }

                if (request.TasksDistributed < 0)
                {
                    Console.WriteLine($"[CREATE] Invalid TasksDistributed: {request.TasksDistributed}");
                    return ApiResponseDto<ResponsibilityDistributionResponseDto>.FailureResponse("TasksDistributed cannot be negative");
                }

                decimal avgWorkload = request.MemberCount > 0
                    ? (decimal)request.TasksDistributed / request.MemberCount
                    : 0;

                Console.WriteLine($"[CREATE] Calculated AvgWorkload: {avgWorkload}");

                decimal workloadVariance = CalculateWorkloadVariance(avgWorkload);
                Console.WriteLine($"[CREATE] Calculated WorkloadVariance: {workloadVariance}");

                var workload = new Teamworkload
                {
                    TeamId = request.TeamId,
                    ManagerUserId = request.ManagerUserId,
                    MemberCount = request.MemberCount,
                    AvgWorkload = avgWorkload,
                    WorkloadVariance = workloadVariance,
                    TasksDistributed = request.TasksDistributed,
                    Status = request.Status ?? "Active",
                    EvaluationDate = request.EvaluationDate.HasValue
                        ? DateOnly.FromDateTime(request.EvaluationDate.Value)
                        : DateOnly.FromDateTime(DateTime.UtcNow),
                    CreatedAt = DateTime.UtcNow
                };

                Console.WriteLine("[CREATE] Workload object created, calling repository...");

                var createdWorkload = await _responsibilityDistributionRepository.CreateAsync(workload);

                if (createdWorkload == null)
                {
                    Console.WriteLine("[CREATE] Repository returned null");
                    return ApiResponseDto<ResponsibilityDistributionResponseDto>.FailureResponse("Failed to create workload - repository returned null");
                }

                Console.WriteLine($"[CREATE] Workload saved successfully with ID: {createdWorkload.WorkloadId}");

                var response = MapToResponsibilityDistributionResponse(createdWorkload);

                return ApiResponseDto<ResponsibilityDistributionResponseDto>.SuccessResponse(
                    response,
                    "Responsibility distribution created successfully"
                );
            }
            catch (DbUpdateException dbEx)
            {
                Console.WriteLine($"[CREATE] Database Error: {dbEx.Message}");
                Console.WriteLine($"[CREATE] Inner Exception: {dbEx.InnerException?.Message}");
                return ApiResponseDto<ResponsibilityDistributionResponseDto>.FailureResponse(
                    $"Database error: {dbEx.InnerException?.Message ?? dbEx.Message}"
                );
            }
            catch (ArgumentException argEx)
            {
                Console.WriteLine($"[CREATE] Argument Error: {argEx.Message}");
                return ApiResponseDto<ResponsibilityDistributionResponseDto>.FailureResponse(
                    $"Validation error: {argEx.Message}"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CREATE] Unexpected Error: {ex.GetType().Name}");
                Console.WriteLine($"[CREATE] Message: {ex.Message}");
                Console.WriteLine($"[CREATE] Stack Trace: {ex.StackTrace}");

                return ApiResponseDto<ResponsibilityDistributionResponseDto>.FailureResponse(
                    $"An error occurred: {ex.Message}"
                );
            }
        }

        public async Task<ApiResponseDto<ResponsibilityDistributionResponseDto>> UpdateResponsibilityDistributionAsync(UpdateResponsibilityDistributionRequestDto request)
        {
            try
            {
                Console.WriteLine($"[UPDATE] Updating workload ID: {request.WorkloadId}");

                var existingWorkload = await _responsibilityDistributionRepository.GetByIdAsync(request.WorkloadId);
                if (existingWorkload == null)
                {
                    Console.WriteLine($"[UPDATE] Workload not found: {request.WorkloadId}");
                    return ApiResponseDto<ResponsibilityDistributionResponseDto>.FailureResponse("Responsibility distribution not found");
                }

                if (request.MemberCount.HasValue)
                    existingWorkload.MemberCount = request.MemberCount.Value;

                if (request.TasksDistributed.HasValue)
                    existingWorkload.TasksDistributed = request.TasksDistributed.Value;

                if (request.Status != null)
                    existingWorkload.Status = request.Status;

                if (request.EvaluationDate.HasValue)
                    existingWorkload.EvaluationDate = DateOnly.FromDateTime(request.EvaluationDate.Value);

                if (existingWorkload.MemberCount > 0)
                {
                    int tasksDistributed = existingWorkload.TasksDistributed;
                    existingWorkload.AvgWorkload = (decimal)tasksDistributed / existingWorkload.MemberCount;
                    existingWorkload.WorkloadVariance = CalculateWorkloadVariance(existingWorkload.AvgWorkload);
                }

                var updatedWorkload = await _responsibilityDistributionRepository.UpdateAsync(existingWorkload);
                var response = MapToResponsibilityDistributionResponse(updatedWorkload);

                Console.WriteLine($"[UPDATE] Workload updated successfully: {request.WorkloadId}");
                return ApiResponseDto<ResponsibilityDistributionResponseDto>.SuccessResponse(response, "Responsibility distribution updated successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UPDATE] Error: {ex.Message}");
                return ApiResponseDto<ResponsibilityDistributionResponseDto>.FailureResponse($"An error occurred: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<ResponsibilityDistributionResponseDto>> GetResponsibilityDistributionByIdAsync(int workloadId)
        {
            try
            {
                Console.WriteLine($"[GET] Fetching workload ID: {workloadId}");

                var workload = await _responsibilityDistributionRepository.GetByIdAsync(workloadId);
                if (workload == null)
                {
                    Console.WriteLine($"[GET] Workload not found: {workloadId}");
                    return ApiResponseDto<ResponsibilityDistributionResponseDto>.FailureResponse("Responsibility distribution not found");
                }

                var response = MapToResponsibilityDistributionResponse(workload);
                return ApiResponseDto<ResponsibilityDistributionResponseDto>.SuccessResponse(response, "Responsibility distribution retrieved successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GET] Error: {ex.Message}");
                return ApiResponseDto<ResponsibilityDistributionResponseDto>.FailureResponse($"An error occurred: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<List<ResponsibilityDistributionResponseDto>>> GetAllResponsibilityDistributionsAsync()
        {
            try
            {
                Console.WriteLine("[GET ALL] Fetching all responsibility distributions");

                var workloads = await _responsibilityDistributionRepository.GetAllAsync();

                if (workloads == null || workloads.Count == 0)
                {
                    Console.WriteLine("[GET ALL] No workloads found");
                    return ApiResponseDto<List<ResponsibilityDistributionResponseDto>>.SuccessResponse(
                        new List<ResponsibilityDistributionResponseDto>(),
                        "No responsibility distributions found"
                    );
                }

                var response = workloads.Select(MapToResponsibilityDistributionResponse).ToList();

                Console.WriteLine($"[GET ALL] Retrieved {response.Count} responsibility distributions");
                return ApiResponseDto<List<ResponsibilityDistributionResponseDto>>.SuccessResponse(response, $"Retrieved {response.Count} responsibility distributions");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GET ALL] Error: {ex.Message}");
                return ApiResponseDto<List<ResponsibilityDistributionResponseDto>>.FailureResponse($"An error occurred: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<List<ResponsibilityDistributionResponseDto>>> GetResponsibilityDistributionsByDepartmentAsync(int departmentId)
        {
            try
            {
                Console.WriteLine($"[GET DEPT] Fetching workloads for team ID: {departmentId}");

                var workloads = await _responsibilityDistributionRepository.GetByDepartmentIdAsync(departmentId);

                if (workloads == null || workloads.Count == 0)
                {
                    Console.WriteLine($"[GET DEPT] No workloads found for team {departmentId}");
                    return ApiResponseDto<List<ResponsibilityDistributionResponseDto>>.SuccessResponse(
                        new List<ResponsibilityDistributionResponseDto>(),
                        "No responsibility distributions found for this team"
                    );
                }

                var response = workloads.Select(MapToResponsibilityDistributionResponse).ToList();

                Console.WriteLine($"[GET DEPT] Retrieved {response.Count} workloads for team {departmentId}");
                return ApiResponseDto<List<ResponsibilityDistributionResponseDto>>.SuccessResponse(response, $"Retrieved {response.Count} responsibility distributions for team");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GET DEPT] Error: {ex.Message}");
                return ApiResponseDto<List<ResponsibilityDistributionResponseDto>>.FailureResponse($"An error occurred: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<bool>> DeleteResponsibilityDistributionAsync(int workloadId)
        {
            try
            {
                Console.WriteLine($"[DELETE] Deleting workload ID: {workloadId}");

                var workload = await _responsibilityDistributionRepository.GetByIdAsync(workloadId);
                if (workload == null)
                {
                    Console.WriteLine($"[DELETE] Workload not found: {workloadId}");
                    return ApiResponseDto<bool>.FailureResponse("Responsibility distribution not found");
                }

                var result = await _responsibilityDistributionRepository.DeleteAsync(workloadId);

                if (result)
                {
                    Console.WriteLine($"[DELETE] Workload deleted successfully: {workloadId}");
                    return ApiResponseDto<bool>.SuccessResponse(true, "Responsibility distribution deleted successfully");
                }

                Console.WriteLine($"[DELETE] Failed to delete workload: {workloadId}");
                return ApiResponseDto<bool>.FailureResponse("Failed to delete responsibility distribution");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DELETE] Error: {ex.Message}");
                return ApiResponseDto<bool>.FailureResponse($"An error occurred: {ex.Message}");
            }
        }

        private decimal CalculateWorkloadVariance(decimal avgWorkload)
        {
            return avgWorkload * 0.2m;
        }

        private ResponsibilityDistributionResponseDto MapToResponsibilityDistributionResponse(Teamworkload workload)
        {
            return new ResponsibilityDistributionResponseDto
            {
                WorkloadId = workload.WorkloadId,
                TeamId = workload.TeamId,
                TeamName = $"Team {workload.TeamId}",
                ManagerUserId = workload.ManagerUserId,
                ManagerName = $"Manager {workload.ManagerUserId}",
                MemberCount = workload.MemberCount,
                AvgWorkload = workload.AvgWorkload,
                WorkloadVariance = workload.WorkloadVariance,
                TasksDistributed = workload.TasksDistributed,
                Status = workload.Status ?? "Unknown",
                EvaluationDate = workload.EvaluationDate.ToDateTime(TimeOnly.MinValue),
                CreatedAt = workload.CreatedAt
            };
        }
    }


}


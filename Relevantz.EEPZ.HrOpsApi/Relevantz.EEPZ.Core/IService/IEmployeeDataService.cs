using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IEmployeeDataService
    {
        Task<ComplianceOverviewDto> GetComplianceOverviewAsync();

        Task<(List<EmployeeWithoutGoalsDto> Employees, string Message)> GetEmployeesWithoutGoalsAsync(int? currentUserId);

        Task<GoalSuggestionsResponseDto> SuggestGoalsAsync(int userId);

        Task<GoalRemindersResponseDto> SendGoalRemindersAsync(SendGoalReminderRequestDto request);

        Task<GoalAdoptionRateDto> GetGoalAdoptionRateAsync();

        Task<GoalStatisticsDto> GetGoalStatisticsAsync();

        Task<(List<DepartmentSimpleDto> Departments, string Message)> GetAllDepartmentsAsync();

        Task<DepartmentSimpleDto?> GetDepartmentByIdAsync(int id);

        Task<List<PolicyResponseDto>> GetPublishedPoliciesAsync(int userId, string userRole);

        Task<PolicyResponseDto> GetPolicyByIdAsync(int policyId, int userId, string userRole);
    }
}

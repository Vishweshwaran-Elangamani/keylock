using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IEmployeeDataRepository
    {
        Task<List<EmployeeWithoutGoalsDto>> GetEmployeesWithoutGoalsAsync(int? currentUserId);
        Task<GoalAdoptionRateDto> GetGoalAdoptionRateAsync();
        Task<GoalStatisticsDto> GetGoalStatisticsAsync();
        Task<List<DepartmentSimpleDto>> GetAllDepartmentsAsync();
        Task<DepartmentSimpleDto?> GetDepartmentByIdAsync(int id);
        Task<UserForGoalDto?> GetUserWithEmployeeAsync(int userId);
        Task<List<string>> GetExistingGoalTypesForEmployeeAsync(int employeeId);
        Task<List<UserForGoalDto>> GetUsersByIdsAsync(List<int> userIds);
        Task<List<UserForGoalDto>> GetUsersWithoutGoalsAsync(int? filterByDays = null);
    }
}

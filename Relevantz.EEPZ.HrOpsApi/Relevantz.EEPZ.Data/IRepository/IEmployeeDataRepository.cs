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
    }
}

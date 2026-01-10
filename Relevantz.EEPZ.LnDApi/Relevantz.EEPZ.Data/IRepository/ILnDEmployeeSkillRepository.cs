using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDEmployeeSkillRepository
    {
        Task<Employee?> GetEmployeeByIdAsync(int employeeId);
        Task<(List<Employee> Items, int TotalCount)> GetSubordinateEmployeesAsync(
            int managerId,
            SubordinateEmployeesRequestModel request
        );
        Task<List<MasterSkill>> GetAllSkillsAsync();
        Task<MasterSkill?> GetSkillByIdAsync(int skillId);
        Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetSubordinateSkillsAsync(
            int managerId,
            SubordinateSkillsRequestModel request
        );
        Task<Lndemployeeskillmapper?> GetEmployeeSkillMappingAsync(int employeeId, int skillId);
        Task<Lndemployeeskillmapper?> GetEmployeeSkillMappingByIdAsync(int mapperId);
        Task<Lndemployeeskillmapper> AddEmployeeSkillAsync(Lndemployeeskillmapper mapper);
        Task<List<Lndemployeeskillmapper>> AddEmployeeSkillsAsync(
            List<Lndemployeeskillmapper> mappers
        );
        Task UpdateEmployeeSkillAsync(Lndemployeeskillmapper mapper);
        Task DeleteEmployeeSkillAsync(Lndemployeeskillmapper mapper);
        Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetMySkillsAsync(
            int employeeId,
            MySkillsRequestModel request
        );
        Task<List<int>> GetExistingSkillMappingsAsync(int employeeId, List<int> skillIds);

        Task<List<Lndapproval>> GetPendingSkillApprovalsAsync(int employeeId, int skillId);
        Task<List<Lndassignment>> GetActiveAssignmentsForSkillAsync(int employeeId, int skillId);
        Task<List<Lndapproval>> GetPendingAssignmentApprovalsAsync(List<int> assignmentIds);
        Task DeleteApprovalsAsync(List<Lndapproval> approvals);
        Task DeleteAssignmentsAsync(List<Lndassignment> assignments);
    }
}

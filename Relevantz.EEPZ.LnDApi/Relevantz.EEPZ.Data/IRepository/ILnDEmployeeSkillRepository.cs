using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDEmployeeSkillRepository
    {
        Task<Employee?> GetEmployeeById(int employeeId);
        Task<(List<Employee> Items, int TotalCount)> GetSubordinateEmployees(
            int managerId,
            SubordinateEmployeesRequestModel request
        );
        Task<List<MasterSkill>> GetAllSkills();
        Task<MasterSkill?> GetSkillById(int skillId);
        Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetSubordinateSkills(
            int managerId,
            SubordinateSkillsRequestModel request
        );
        Task<Lndemployeeskillmapper?> GetEmployeeSkillMapping(int employeeId, int skillId);
        Task<Lndemployeeskillmapper?> GetEmployeeSkillMappingById(int skillMapperId);
        Task<Lndemployeeskillmapper> AddEmployeeSkill(Lndemployeeskillmapper mapper);
        Task<List<Lndemployeeskillmapper>> AddEmployeeSkills(
            List<Lndemployeeskillmapper> mappers
        );
        Task UpdateEmployeeSkill(Lndemployeeskillmapper mapper);
        Task DeleteEmployeeSkill(Lndemployeeskillmapper mapper);
        Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetMySkills(
            int employeeId,
            MySkillsRequestModel request
        );
        Task<List<int>> GetExistingSkillMappings(int employeeId, List<int> skillIds);

        Task<List<Lndapproval>> GetPendingSkillApprovals(int employeeId, int skillId);
        Task<List<Lndassignment>> GetActiveAssignmentsForSkill(int employeeId, int skillId);
        Task<List<Lndapproval>> GetPendingAssignmentApprovals(List<int> assignmentIds);
        Task DeleteApprovals(List<Lndapproval> approvals);
        Task DeleteAssignments(List<Lndassignment> assignments);
    }
}

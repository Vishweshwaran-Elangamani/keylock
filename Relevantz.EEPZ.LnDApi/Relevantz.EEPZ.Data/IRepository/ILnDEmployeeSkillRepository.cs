using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDEmployeeSkillRepository
    {
        Task<Employee?> GetEmployeeByIdAsync(int employeeId);
        Task<(List<Employee> Items, int TotalCount)> GetSubordinateEmployeesAsync(
            int managerId,
            string? searchTerm,
            int pageNumber,
            int pageSize
        );
        Task<List<MasterSkill>> GetAllSkillsAsync();
        Task<MasterSkill?> GetSkillByIdAsync(int skillId);
        Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetSubordinateSkillsAsync(
            int managerId,
            int? employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize
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
            string? searchTerm,
            int pageNumber,
            int pageSize
        );
        Task<List<int>> GetExistingSkillMappingsAsync(int employeeId, List<int> skillIds);
        Task<int> SaveChangesAsync();
    }
}

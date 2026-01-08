using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IResponsibilityDistributionRepository
    {
        Task<Teamworkload?> GetByIdAsync(int workloadId);
        Task<List<Teamworkload>> GetAllAsync();
        Task<List<Teamworkload>> GetByDepartmentIdAsync(int departmentId);
        Task<Teamworkload?> GetByDepartmentAsync(int departmentId);
        Task<Teamworkload> CreateAsync(Teamworkload workload);
        Task<Teamworkload> UpdateAsync(Teamworkload workload);
        Task<bool> DeleteAsync(int workloadId);
    }
}
 ;
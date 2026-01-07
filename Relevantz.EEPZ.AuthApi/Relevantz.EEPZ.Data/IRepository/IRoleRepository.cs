using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IRoleRepository
    {
        Task<Role?> GetByIdAsync(int roleId);
        Task<Role?> GetByRoleCodeAsync(string roleCode);
        Task<Role?> GetByRoleNameAsync(string roleName);
        Task<List<Role>> GetAllAsync();
        Task<Role> CreateAsync(Role role);
        Task<Role> UpdateAsync(Role role);
        Task<bool> DeleteAsync(int roleId);
        Task<bool> RoleNameExistsAsync(string roleName);
        Task<bool> RoleCodeExistsAsync(string roleCode);
    }
}

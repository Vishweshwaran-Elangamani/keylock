using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;
namespace Relevantz.EEPZ.Data.Repository
{
    public class RoleRepository : IRoleRepository
    {
        private readonly EEPZDbContext _context;
        public RoleRepository(EEPZDbContext context)
        {
            _context = context;
        }
        public async Task<Role?> GetByIdAsync(int roleId)
        {
            return await _context.Roles.FindAsync(roleId);
        }
        public async Task<Role?> GetByRoleCodeAsync(string roleCode)
        {
            return await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleCode == roleCode);
        }
        public async Task<Role?> GetByRoleNameAsync(string roleName)
        {
            return await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleName == roleName);
        }
        public async Task<List<Role>> GetAllAsync()
        {
            return await _context.Roles.ToListAsync();
        }
        public async Task<Role> CreateAsync(Role role)
        {
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
            return role;
        }
        public async Task<Role> UpdateAsync(Role role)
        {
            role.UpdatedAt = DateTime.UtcNow;
            _context.Roles.Update(role);
            await _context.SaveChangesAsync();
            return role;
        }
        public async Task<bool> DeleteAsync(int roleId)
        {
            var role = await _context.Roles.FindAsync(roleId);
            if (role == null || role.IsSystemRole == true)
                return false;
            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> RoleNameExistsAsync(string roleName)
        {
            return await _context.Roles
                .AnyAsync(r => r.RoleName == roleName);
        }
        public async Task<bool> RoleCodeExistsAsync(string roleCode)
        {
            return await _context.Roles
                .AnyAsync(r => r.RoleCode == roleCode);
        }
    }
}

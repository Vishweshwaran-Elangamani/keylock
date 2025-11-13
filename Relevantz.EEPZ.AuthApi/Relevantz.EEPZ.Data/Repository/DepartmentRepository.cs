using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Data.Repository
{
    public class DepartmentRepository : IDepartmentRepository
    {
        private readonly EEPZDbContext _context;

        public DepartmentRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Department?> GetByIdAsync(int departmentId)
        {
            return await _context.Departments.FindAsync(departmentId);
        }

        public async Task<Department?> GetByNameAsync(string departmentName)
        {
            return await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentName == departmentName);
        }

        public async Task<List<Department>> GetAllAsync()
        {
            return await _context.Departments.ToListAsync();
        }

        public async Task<Department> CreateAsync(Department department)
        {
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
            return department;
        }

        public async Task<Department> UpdateAsync(Department department)
        {
            department.UpdatedAt = DateTime.UtcNow;
            _context.Departments.Update(department);
            await _context.SaveChangesAsync();
            return department;
        }

        public async Task<bool> DeleteAsync(int departmentId)
        {
            var department = await _context.Departments.FindAsync(departmentId);
            if (department == null)
                return false;

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DepartmentNameExistsAsync(string departmentName)
        {
            return await _context.Departments
                .AnyAsync(d => d.DepartmentName == departmentName);
        }
    }
}

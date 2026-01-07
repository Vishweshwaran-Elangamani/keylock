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
        public async Task<Department?> GetByCodeAsync(string departmentCode)
        {
            return await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentCode == departmentCode);
        }
        public async Task<List<Department>> GetAllAsync()
        {
            return await _context.Departments
                .Include(d => d.ParentDepartment)
                .Include(d => d.HodEmployee)
                .OrderBy(d => d.DepartmentName)
                .ToListAsync();
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
        public async Task<bool> DepartmentNameExistsAsync(string departmentName, int? excludeDepartmentId = null)
        {
            return await _context.Departments
                .AnyAsync(d => d.DepartmentName == departmentName &&
                              (excludeDepartmentId == null || d.DepartmentId != excludeDepartmentId));
        }
        public async Task<bool> DepartmentCodeExistsAsync(string departmentCode, int? excludeDepartmentId = null)
        {
            return await _context.Departments
                .AnyAsync(d => d.DepartmentCode == departmentCode &&
                              (excludeDepartmentId == null || d.DepartmentId != excludeDepartmentId));
        }
        public async Task<bool> HasChildDepartmentsAsync(int departmentId)
        {
            return await _context.Departments
                .AnyAsync(d => d.ParentDepartmentId == departmentId);
        }
        public async Task<bool> HasEmployeesAsync(int departmentId)
        {
            return await _context.Employeedetailsmasters
                .AnyAsync(e => e.DepartmentId == departmentId);
        }
        public async Task<List<Department>> GetChildDepartmentsAsync(int parentDepartmentId)
        {
            return await _context.Departments
                .Include(d => d.HodEmployee)
                .Where(d => d.ParentDepartmentId == parentDepartmentId)
                .OrderBy(d => d.DepartmentName)
                .ToListAsync();
        }
        public async Task<List<Department>> GetAllChildDepartmentsRecursiveAsync(int parentDepartmentId)
        {
            var allChildren = new List<Department>();
            var directChildren = await GetChildDepartmentsAsync(parentDepartmentId);
            allChildren.AddRange(directChildren);
            foreach (var child in directChildren)
            {
                var subChildren = await GetAllChildDepartmentsRecursiveAsync(child.DepartmentId);
                allChildren.AddRange(subChildren);
            }
            return allChildren;
        }
        public async Task<Department?> GetParentDepartmentAsync(int departmentId)
        {
            var department = await _context.Departments
                .Include(d => d.ParentDepartment)
                .FirstOrDefaultAsync(d => d.DepartmentId == departmentId);
            return department?.ParentDepartment;
        }
        public async Task<List<Department>> GetRootDepartmentsAsync()
        {
            return await _context.Departments
                .Include(d => d.HodEmployee)
                .Where(d => d.ParentDepartmentId == null)
                .OrderBy(d => d.DepartmentName)
                .ToListAsync();
        }
        public async Task<List<Department>> GetDepartmentHierarchyAsync(int departmentId)
        {
            var hierarchy = new List<Department>();
            var currentDepartment = await _context.Departments
                .Include(d => d.ParentDepartment)
                .FirstOrDefaultAsync(d => d.DepartmentId == departmentId);
            while (currentDepartment != null)
            {
                hierarchy.Insert(0, currentDepartment);
                if (currentDepartment.ParentDepartmentId == null)
                    break;
                currentDepartment = await _context.Departments
                    .Include(d => d.ParentDepartment)
                    .FirstOrDefaultAsync(d => d.DepartmentId == currentDepartment.ParentDepartmentId);
            }
            return hierarchy;
        }
        public async Task<bool> IsCircularReferenceAsync(int departmentId, int? newParentDepartmentId)
        {
            if (newParentDepartmentId == null || newParentDepartmentId == departmentId)
                return newParentDepartmentId == departmentId;
            var allDescendants = await GetAllChildDepartmentsRecursiveAsync(departmentId);
            return allDescendants.Any(d => d.DepartmentId == newParentDepartmentId);
        }
        public async Task<int> GetDepartmentLevelAsync(int departmentId)
        {
            int level = 0;
            var currentDepartment = await _context.Departments.FindAsync(departmentId);
            while (currentDepartment?.ParentDepartmentId != null)
            {
                level++;
                currentDepartment = await _context.Departments.FindAsync(currentDepartment.ParentDepartmentId);
            }
            return level;
        }
        public async Task<List<Department>> GetDepartmentsByHodAsync(int hodEmployeeId)
        {
            return await _context.Departments
                .Include(d => d.ParentDepartment)
                .Include(d => d.HodEmployee)
                .Where(d => d.HodEmployeeId == hodEmployeeId)
                .OrderBy(d => d.DepartmentName)
                .ToListAsync();
        }
        public async Task<bool> IsEmployeeHodOfAnyDepartmentAsync(int employeeId)
        {
            return await _context.Departments
                .AnyAsync(d => d.HodEmployeeId == employeeId);
        }
        public async Task<List<Department>> GetActiveDepartmentsAsync()
        {
            return await _context.Departments
                .Include(d => d.ParentDepartment)
                .Include(d => d.HodEmployee)
                .Where(d => d.Status == "Active")
                .OrderBy(d => d.DepartmentName)
                .ToListAsync();
        }
        public async Task<List<Department>> GetInactiveDepartmentsAsync()
        {
            return await _context.Departments
                .Include(d => d.ParentDepartment)
                .Include(d => d.HodEmployee)
                .Where(d => d.Status == "Inactive")
                .OrderBy(d => d.DepartmentName)
                .ToListAsync();
        }
        public async Task<List<Department>> GetDepartmentsByStatusAsync(string status)
        {
            return await _context.Departments
                .Include(d => d.ParentDepartment)
                .Include(d => d.HodEmployee)
                .Where(d => d.Status == status)
                .OrderBy(d => d.DepartmentName)
                .ToListAsync();
        }
        public async Task<Department?> GetDepartmentWithDetailsAsync(int departmentId)
        {
            return await _context.Departments
                .Include(d => d.ParentDepartment)
                .Include(d => d.HodEmployee)
                .Include(d => d.InverseParentDepartment)
                .ThenInclude(child => child.HodEmployee)
                .FirstOrDefaultAsync(d => d.DepartmentId == departmentId);
        }
        public async Task<List<Department>> SearchDepartmentsAsync(string searchTerm)
        {
            return await _context.Departments
                .Include(d => d.ParentDepartment)
                .Include(d => d.HodEmployee)
                .Where(d => d.DepartmentName.Contains(searchTerm) ||
                           d.DepartmentCode.Contains(searchTerm) ||
                           (d.Description != null && d.Description.Contains(searchTerm)))
                .OrderBy(d => d.DepartmentName)
                .ToListAsync();
        }
        public async Task<int> GetTotalDepartmentCountAsync()
        {
            return await _context.Departments.CountAsync();
        }
        public async Task<int> GetChildCountAsync(int departmentId)
        {
            return await _context.Departments
                .CountAsync(d => d.ParentDepartmentId == departmentId);
        }
    }
}

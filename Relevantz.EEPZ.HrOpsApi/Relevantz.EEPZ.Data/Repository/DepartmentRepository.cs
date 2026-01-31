using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Data.Repository
{
    public class DepartmentRepository : IDepartmentRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<DepartmentRepository> _logger;

        public DepartmentRepository(EEPZDbContext context, ILogger<DepartmentRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Department?> GetByIdAsync(int departmentId)
        {
            try
            {
                if (departmentId <= 0)
                    return null;

                return await _context.Departments.FindAsync(departmentId);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching department {DepartmentId}", ex, departmentId);
                throw;
            }
        }

        public async Task<Department?> GetByNameAsync(string departmentName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(departmentName))
                    return null;

                return await _context.Departments
                    .FirstOrDefaultAsync(d => d.DepartmentName == departmentName);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching department by name {DepartmentName}", ex, departmentName);
                throw;
            }
        }

        public async Task<List<Department>> GetAllAsync()
        {
            try
            {
                return await _context.Departments.ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching all departments", ex);
                throw;
            }
        }

        public async Task<Department> CreateAsync(Department department)
        {
            try
            {
                _context.Departments.Add(department);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.DepartmentCreated, department.DepartmentId);

                return department;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error creating department", ex);
                throw;
            }
        }

        public async Task<Department> UpdateAsync(Department department)
        {
            try
            {
                var existingDepartment = await _context.Departments.FindAsync(department.DepartmentId);
                if (existingDepartment == null)
                {
                    EEPZBusinessLog.LogRepositoryWarning(RepositoryMessages.DepartmentNotFound, department.DepartmentId);
                    throw new InvalidOperationException($"Department with ID {department.DepartmentId} not found");
                }

                department.UpdatedAt = DateTime.UtcNow;
                _context.Departments.Update(department);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.DepartmentUpdated, department.DepartmentId);

                return department;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error updating department {DepartmentId}", ex, department.DepartmentId);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int departmentId)
        {
            try
            {
                if (departmentId <= 0)
                    return false;

                var department = await _context.Departments.FindAsync(departmentId);
                if (department == null)
                    return false;

                _context.Departments.Remove(department);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.DepartmentDeleted, departmentId);

                return true;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error deleting department {DepartmentId}", ex, departmentId);
                throw;
            }
        }

        public async Task<bool> DepartmentNameExistsAsync(string departmentName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(departmentName))
                    return false;

                return await _context.Departments
                    .AnyAsync(d => d.DepartmentName == departmentName);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error checking department name existence {DepartmentName}", ex, departmentName);
                throw;
            }
        }
    }
}

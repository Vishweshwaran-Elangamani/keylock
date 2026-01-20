using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingDepartment, departmentId);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingDepartmentByName, departmentName);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingAllDepartments);
                throw;
            }
        }

        public async Task<Department> CreateAsync(Department department)
        {
            try
            {
                _context.Departments.Add(department);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.DepartmentCreated, department.DepartmentId);
                
                return department;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingDepartment);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingDepartment);
                throw;
            }
        }

        public async Task<Department> UpdateAsync(Department department)
        {
            try
            {
                // Check if entity exists before updating
                var existingDepartment = await _context.Departments.FindAsync(department.DepartmentId);
                if (existingDepartment == null)
                {
                    _logger.LogWarning(RepositoryMessages.DepartmentNotFound, department.DepartmentId);
                    throw new InvalidOperationException($"Department with ID {department.DepartmentId} not found");
                }

                department.UpdatedAt = DateTime.UtcNow;
                _context.Departments.Update(department);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.DepartmentUpdated, department.DepartmentId);
                
                return department;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingDepartment, department.DepartmentId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingDepartment, department.DepartmentId);
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
                
                _logger.LogInformation(RepositoryMessages.DepartmentDeleted, departmentId);
                
                return true;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingDepartment, departmentId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingDepartment, departmentId);
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
                _logger.LogError(ex, RepositoryMessages.ErrorCheckingDepartmentNameExists, departmentName);
                throw;
            }
        }
    }
}

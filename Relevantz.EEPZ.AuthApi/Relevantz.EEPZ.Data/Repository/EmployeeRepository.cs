using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Data.Repository
{
    public class EmployeeRepository : IEmployeeRepository
    {
        private readonly EEPZDbContext _context;

        public EmployeeRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Employee?> GetByIdAsync(int employeeId)
        {
            return await _context.Employees
                .Include(e => e.ReportingManagerEmployee)
                .Include(e => e.Userauthentication)
                .Include(e => e.Userprofile)
                .Include(e => e.Employeedetailsmasters)
                    .ThenInclude(edm => edm.Role)
                .Include(e => e.Employeedetailsmasters)
                    .ThenInclude(edm => edm.Department)
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
        }

        public async Task<Employee?> GetByEmployeeCompanyIdAsync(string employeeCompanyId)
        {
            return await _context.Employees
                .Include(e => e.Userauthentication)
                .Include(e => e.Userprofile)
                .Include(e => e.Employeedetailsmasters)
                    .ThenInclude(edm => edm.Role)
                .Include(e => e.Employeedetailsmasters)
                    .ThenInclude(edm => edm.Department)
                .FirstOrDefaultAsync(e => e.EmployeeCompanyId == employeeCompanyId);
        }

        public async Task<List<Employee>> GetAllAsync()
        {
            return await _context.Employees
                .Include(e => e.Userauthentication)
                .Include(e => e.Userprofile)
                .Include(e => e.Employeedetailsmasters)
                    .ThenInclude(edm => edm.Role)
                .Include(e => e.Employeedetailsmasters)
                    .ThenInclude(edm => edm.Department)
                .ToListAsync();
        }

        public async Task<List<Employee>> GetActiveEmployeesAsync()
        {
            return await _context.Employees
                .Include(e => e.Userauthentication)
                .Include(e => e.Userprofile)
                .Where(e => e.IsActive == true)
                .ToListAsync();
        }

        public async Task<Employee> CreateAsync(Employee employee)
        {
            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();
            return employee;
        }

        public async Task<Employee> UpdateAsync(Employee employee)
        {
            employee.UpdatedAt = DateTime.UtcNow;
            _context.Employees.Update(employee);
            await _context.SaveChangesAsync();
            return employee;
        }

        public async Task<bool> DeleteAsync(int employeeId)
        {
            var employee = await _context.Employees.FindAsync(employeeId);
            if (employee == null)
                return false;

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> EmployeeCompanyIdExistsAsync(string employeeCompanyId)
        {
            return await _context.Employees
                .AnyAsync(e => e.EmployeeCompanyId == employeeCompanyId);
        }

        public async Task<List<Employee>> GetByReportingManagerAsync(int reportingManagerEmployeeId)
        {
            return await _context.Employees
                .Where(e => e.ReportingManagerEmployeeId == reportingManagerEmployeeId)
                .ToListAsync();
        }

        public async Task<string> GetNextEmployeeCompanyIdAsync()
        {
            // Get all Employee Company IDs from database
            var employeeIds = await _context.Employees
                .Where(e => !string.IsNullOrEmpty(e.EmployeeCompanyId))
                .Select(e => e.EmployeeCompanyId)
                .ToListAsync();

            // If no employees exist, start from 1000
            if (employeeIds == null || !employeeIds.Any())
            {
                EEPZBusinessLog.Information("No existing employees. Starting Employee ID from 1000");
                return "1000";
            }

            // Convert to integers and find the maximum
            var numericIds = employeeIds
                .Where(id => int.TryParse(id, out _))
                .Select(id => int.Parse(id))
                .ToList();

            // If no valid numeric IDs found, start from 1000
            if (!numericIds.Any())
            {
                EEPZBusinessLog.Information("No valid numeric Employee IDs found. Starting from 1000");
                return "1000";
            }

            var maxId = numericIds.Max();
            var nextId = maxId + 1;

            EEPZBusinessLog.Information($"Last Employee ID: {maxId}, Next Employee ID: {nextId}");

            return nextId.ToString();
        }
    }
}

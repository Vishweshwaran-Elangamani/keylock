using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;
namespace Relevantz.EEPZ.Data.Repository
{
    public class EmployeeDetailsMasterRepository : IEmployeeDetailsMasterRepository
    {
        private readonly EEPZDbContext _context;
        public EmployeeDetailsMasterRepository(EEPZDbContext context)
        {
            _context = context;
        }
        public async Task<Employeedetailsmaster?> GetByIdAsync(int employeeMasterId)
        {
            return await _context.Employeedetailsmasters
                .Include(edm => edm.Employee)
                .Include(edm => edm.Role)
                .Include(edm => edm.Department)
                .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == employeeMasterId);
        }
        public async Task<Employeedetailsmaster?> GetByEmployeeIdAsync(int employeeId)
        {
            return await _context.Employeedetailsmasters
                .Include(edm => edm.Role)
                .Include(edm => edm.Department)
                .FirstOrDefaultAsync(edm => edm.EmployeeId == employeeId);
        }
        public async Task<List<Employeedetailsmaster>> GetByRoleIdAsync(int roleId)
        {
            return await _context.Employeedetailsmasters
                .Include(edm => edm.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Where(edm => edm.RoleId == roleId)
                .ToListAsync();
        }
        public async Task<List<Employeedetailsmaster>> GetByDepartmentIdAsync(int departmentId)
        {
            return await _context.Employeedetailsmasters
                .Include(edm => edm.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Where(edm => edm.DepartmentId == departmentId)
                .ToListAsync();
        }
        public async Task<List<Employeedetailsmaster>> GetAllAsync()
        {
            return await _context.Employeedetailsmasters
                .Include(edm => edm.Employee)
                .Include(edm => edm.Role)
                .Include(edm => edm.Department)
                .ToListAsync();
        }
        public async Task<Employeedetailsmaster> CreateAsync(Employeedetailsmaster employeeDetails)
        {
            _context.Employeedetailsmasters.Add(employeeDetails);
            await _context.SaveChangesAsync();
            return employeeDetails;
        }
        public async Task<Employeedetailsmaster> UpdateAsync(Employeedetailsmaster employeeDetails)
        {
            _context.Employeedetailsmasters.Update(employeeDetails);
            await _context.SaveChangesAsync();
            return employeeDetails;
        }
        public async Task<bool> DeleteAsync(int employeeMasterId)
        {
            var employeeDetails = await _context.Employeedetailsmasters.FindAsync(employeeMasterId);
            if (employeeDetails == null)
                return false;
            _context.Employeedetailsmasters.Remove(employeeDetails);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> DeleteByEmployeeIdAsync(int employeeId)
        {
            var employeeDetails = await _context.Employeedetailsmasters
                .FirstOrDefaultAsync(edm => edm.EmployeeId == employeeId);
            if (employeeDetails == null)
                return false;
            _context.Employeedetailsmasters.Remove(employeeDetails);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}

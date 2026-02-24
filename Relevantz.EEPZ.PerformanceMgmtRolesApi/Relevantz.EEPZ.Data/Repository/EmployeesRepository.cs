using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    /// <summary>
    /// EmployeesRepository provides data access methods related to employees.
    /// It focuses on retrieving managers and user role information.
    /// </summary>
    public class EmployeesRepository : IEmployeesRepository
    {
        private readonly EEPZDbContext _context;

        public EmployeesRepository(EEPZDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves all active managers from the system.
        /// Filters employees by active status and role codes ("MGR" or "MANAGER").
        /// Excludes HR roles.
        /// Returns basic employee and role information.
        /// </summary>
        public async Task<List<object>> GetAllManagersAsync()
        {
            return await (
                from ua in _context.Userauthentications.Include(u => u.Employee)
                where ua.Status == "Active" && ua.Employee.EmploymentStatus == "Active" && ua.Employee.IsActive == true
                join up in _context.Userprofiles on ua.EmployeeId equals up.EmployeeId into upj
                from up in upj.DefaultIfEmpty()
                join ed in _context.Employeedetailsmasters on ua.EmployeeId equals ed.EmployeeId into edj
                from ed in edj.DefaultIfEmpty()
                join r in _context.Roles on ed.RoleId equals r.RoleId into rj
                from r in rj.DefaultIfEmpty()
                where r != null && (r.RoleCode == "MGR" || r.RoleCode == "MANAGER") && r.RoleCode != "HR"
                select new
                {
                    UserId = ua.UserId,
                    EmployeeId = ua.Employee.EmployeeId,
                    JoiningDate = ua.Employee.JoiningDate.ToDateTime(System.TimeOnly.MinValue).ToString("yyyy-MM-dd"),
                    FirstName = up != null ? up.FirstName : null,
                    LastName = up != null ? up.LastName : null,
                    Role = r.RoleCode
                }
            ).ToListAsync<object>();
        }

        /// <summary>
        /// Retrieves the role information for a given user.
        /// Returns role code and whether the user is a manager.
        /// If no role is found, defaults to "UNKNOWN".
        /// </summary>
        public async Task<object> GetUserRoleAsync(int userId)
        {
            var userAuth = await _context.Userauthentications.FirstOrDefaultAsync(u => u.UserId == userId);
            if (userAuth == null) return null;

            var userDetails = await _context.Employeedetailsmasters
                .Include(d => d.Role)
                .FirstOrDefaultAsync(d => d.EmployeeId == userAuth.EmployeeId);

            var roleCode = userDetails?.Role?.RoleCode ?? "UNKNOWN";
            return new
            {
                UserId = userId,
                RoleCode = roleCode,
                IsManager = roleCode == "MGR" || roleCode == "MANAGER"
            };
        }
    }
}

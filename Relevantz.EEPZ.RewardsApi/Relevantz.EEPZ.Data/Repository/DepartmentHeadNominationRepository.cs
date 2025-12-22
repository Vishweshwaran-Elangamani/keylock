using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository
{
    public class DepartmentHeadNominationRepository : IDepartmentHeadNominationRepository
    {
        private readonly EEPZDbContext _context;

        public DepartmentHeadNominationRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Employeedetailsmaster?> GetDepartmentHeadDetailsAsync(int deptHeadEmployeeId)
        {
            return await _context.Employeedetailsmasters
                .Where(edm => edm.EmployeeId == deptHeadEmployeeId)
                .Include(edm => edm.Department)
                .FirstOrDefaultAsync();
        }

        public async Task<List<Recognitionstatus>> GetApprovedManagerNominationsAsync()
        {
            return await _context.Recognitionstatuses
                .Where(n => n.NominationType == "ManagerNomination" && n.Status == "Approved")
                .Include(n => n.NomineeEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(n => n.ReviewedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .ToListAsync();
        }

        public async Task<Recognitionstatus?> GetNominationByIdAsync(int nominationId)
        {
            return await _context.Recognitionstatuses
                .Where(n => n.NominationId == nominationId && n.Status == "Approved")
                .Include(n => n.NomineeEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(n => n.ReviewedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync();
        }

        public async Task<Recognitiondetail?> GetOpportunityByIdAsync(int opportunityId)
        {
            return await _context.Recognitiondetails
                .Where(o => o.OpportunityId == opportunityId)
                .Include(o => o.RewardType)
                .FirstOrDefaultAsync();
        }

        public async Task<Employeedetailsmaster?> GetEmployeeDepartmentDetailsAsync(int employeeId)
        {
            return await _context.Employeedetailsmasters
                .Where(edm => edm.EmployeeId == employeeId)
                .Include(edm => edm.Department)
                .FirstOrDefaultAsync();
        }

        public async Task<List<object>> GetNominationParameterValuesAsync(int nominationId)
        {
            return await _context.Nominationparametervalues
                .Where(pv => pv.NominationId == nominationId)
                .Include(pv => pv.Parameter)
                .Select(pv => new
                {
                    pv.ParameterId,
                    ParameterName = pv.Parameter.ParameterName,
                    ParameterType = pv.Parameter.ParameterType,
                    pv.ParameterValue,
                    IsRequired = pv.Parameter.IsRequired,
                    PlaceholderText = pv.Parameter.PlaceholderText
                })
                .Cast<object>()
                .ToListAsync();
        }

        public async Task<List<Recognitionstatus>> GetApprovedNominationsAsync()
        {
            return await _context.Recognitionstatuses
                .Where(n => n.Status == "Approved")
                .ToListAsync();
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository
{
    public class HRNominationRepository : IHRNominationRepository
    {
        private readonly EEPZDbContext _context;

        public HRNominationRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<List<Recognitionstatus>> GetPendingVisibleManagerNominationsAsync()
        {
            return await _context.Recognitionstatuses
                .Where(n => n.NominationType == "ManagerNomination" 
                         && n.Status == "Pending"
                         && n.Opportunity.RewardType.IsVisibleForManagerNomination == true)
                .Include(n => n.NomineeEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(n => n.NominatedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(n => n.Opportunity)
                    .ThenInclude(o => o.RewardType)
                .ToListAsync();
        }

      public async Task<List<Recognitionstatus>> GetNominationsByIdsAsync(List<int> nominationIds)
{
    return await _context.Recognitionstatuses
        .Where(n => nominationIds.Contains(n.NominationId))
        .Include(n => n.NomineeEmployee)                    
            .ThenInclude(e => e.Userprofile)              
        .Include(n => n.NominatedByEmployee)            
            .ThenInclude(e => e.Userprofile)               
        .Include(n => n.Opportunity)                        
            .ThenInclude(o => o.RewardType)                
        .ToListAsync();
}

public async Task<Recognitionstatus?> GetNominationByIdAsync(int nominationId)
{
    return await _context.Recognitionstatuses
        .Where(n => n.NominationId == nominationId)
        .Include(n => n.NomineeEmployee)
            .ThenInclude(e => e.Userprofile)               
        .Include(n => n.NominatedByEmployee)               
            .ThenInclude(e => e.Userprofile)               
        .Include(n => n.Opportunity)                        
            .ThenInclude(o => o.RewardType)                
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
                    IsRequired = pv.Parameter.IsRequired
                })
                .Cast<object>()
                .ToListAsync();
        }

        public async Task<List<object>> GetNominationParameterValuesWithDetailsAsync(int nominationId)
        {
            return await _context.Nominationparametervalues
                .Where(pv => pv.NominationId == nominationId)
                .Include(pv => pv.Parameter)
                .Select(pv => new
                {
                    pv.Parameter.ParameterName,
                    pv.Parameter.ParameterType,
                    pv.ParameterValue
                })
                .Cast<object>()
                .ToListAsync();
        }

        public async Task AddNominationTrackingAsync(Nominationvisibilitytracking tracking)
        {
            _context.Nominationvisibilitytrackings.Add(tracking);
            await Task.CompletedTask;
        }

       

        public async Task<List<Recognitionstatus>> GetApprovedNominationsAsync()
        {
            return await _context.Recognitionstatuses
                .Where(n => n.Status == "Approved")
                .Include(n => n.NomineeEmployee)
                    .ThenInclude(e => e.Userprofile)
                .ToListAsync();
        }

        public async Task<List<Recognitionstatus>> GetRejectedNominationsAsync()
        {
            return await _context.Recognitionstatuses
                .Where(n => n.Status == "Rejected")
                .Include(n => n.NomineeEmployee)
                    .ThenInclude(e => e.Userprofile)
                .ToListAsync();
        }

        public async Task<List<Rewardtype>> GetRewardTypesAsync(bool activeOnly)
        {
            return await _context.Rewardtypes
                .Where(activeOnly ? rt => rt.IsActive == true : rt => true)
                .OrderBy(rt => rt.RewardCategory)
                .ThenBy(rt => rt.RewardName)
                .ToListAsync();
        }

       public async Task<Rewardtype?> GetRewardTypeByIdAsync(int rewardTypeId)
{
    return await _context.Rewardtypes
        .FirstOrDefaultAsync(rt => rt.RewardTypeId == rewardTypeId);
}


        public async Task AddRewardTypeAsync(Rewardtype rewardType)
        {
            _context.Rewardtypes.Add(rewardType);
            await Task.CompletedTask;
        }

        public async Task<List<Nominationparameter>> GetParametersByRewardTypeAsync(int rewardTypeId)
        {
            return await _context.Nominationparameters
                .Where(p => p.RewardTypeId == rewardTypeId)
                .OrderBy(p => p.SortOrder)
                .ToListAsync();
        }

        public async Task AddParameterAsync(Nominationparameter parameter)
        {
            _context.Nominationparameters.Add(parameter);
            await Task.CompletedTask;
        }

        public async Task<Nominationparameter?> GetParameterByIdAsync(int parameterId)
        {
            return await _context.Nominationparameters.FindAsync(parameterId);
        }

        public async Task DeleteParameterAsync(Nominationparameter parameter)
        {
            _context.Nominationparameters.Remove(parameter);
            await Task.CompletedTask;
        }

        public async Task<int> GetTotalNominationsCountAsync()
        {
            return await _context.Recognitionstatuses.CountAsync();
        }

        public async Task<int> GetPendingNominationsCountAsync()
        {
            return await _context.Recognitionstatuses.CountAsync(n => n.Status == "Pending");
        }

        public async Task<int> GetApprovedNominationsCountAsync()
        {
            return await _context.Recognitionstatuses.CountAsync(n => n.Status == "Approved");
        }

        public async Task<int> GetRejectedNominationsCountAsync()
        {
            return await _context.Recognitionstatuses.CountAsync(n => n.Status == "Rejected");
        }

        public async Task<int> GetActiveOpportunitiesCountAsync()
        {
            return await _context.Recognitiondetails.CountAsync(o => o.Status == "Active");
        }

        public async Task<List<Recognitionstatus>> GetAllNominationsWithOpportunitiesAsync()
        {
            return await _context.Recognitionstatuses
                .Include(n => n.Opportunity)
                    .ThenInclude(o => o.RewardType)
                .ToListAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}

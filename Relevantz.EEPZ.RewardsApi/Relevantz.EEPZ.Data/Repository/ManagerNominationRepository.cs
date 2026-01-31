using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository
{
    public class ManagerNominationRepository : IManagerNominationRepository
    {
        private readonly EEPZDbContext _context;

        public ManagerNominationRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<List<Rewardtype>> GetVisibleRewardTypesAsync()
        {
            return await _context.Rewardtypes
                .Where(rt => rt.IsActive == true && rt.IsVisibleForManagerNomination == true)
                .ToListAsync();
        }

        public async Task<List<Recognitiondetail>> GetActiveOpportunitiesAsync()
        {
            return await _context.Recognitiondetails
                .Where(o => o.Status == "Active" && o.Deadline >= DateOnly.FromDateTime(DateTime.Today))
                .ToListAsync();
        }

        public async Task<Rewardtype?> GetRewardTypeByIdAsync(int rewardTypeId)
        {
            return await _context.Rewardtypes
                .FirstOrDefaultAsync(rt => rt.RewardTypeId == rewardTypeId);
        }

        public async Task<Recognitiondetail?> GetOpportunityByIdAsync(int opportunityId)
        {
            return await _context.Recognitiondetails
                .Include(o => o.RewardType)
                .FirstOrDefaultAsync(o => o.OpportunityId == opportunityId);
        }

        public async Task<Rewardtype?> GetVisibleRewardTypeByIdAsync(int rewardTypeId)
        {
            return await _context.Rewardtypes
                .FirstOrDefaultAsync(rt => rt.RewardTypeId == rewardTypeId
                                        && rt.IsActive == true
                                        && rt.IsVisibleForManagerNomination == true);
        }

        public async Task<Department?> GetDepartmentByIdAsync(int departmentId)
        {
            return await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentId == departmentId);
        }

        public async Task<List<Recognitiondetail>> GetActiveOpportunitiesByRewardTypeAsync(int rewardTypeId)
        {
            return await _context.Recognitiondetails
                .Where(o => o.Status == "Active"
                         && o.Deadline >= DateOnly.FromDateTime(DateTime.Today)
                         && o.RewardTypeId == rewardTypeId)
                .ToListAsync();
        }

        public async Task<List<Nominationparameter>> GetParametersByRewardTypeAsync(int rewardTypeId)
        {
            return await _context.Nominationparameters
                .Where(p => p.RewardTypeId == rewardTypeId)
                .OrderBy(p => p.SortOrder)
                .ToListAsync();
        }

        public async Task<List<int>> GetManagerL1ProjectIdsAsync(int managerId)
        {
            return await _context.Projects
                .Where(p => p.ResourceOwnerEmployeeId == managerId || p.L1approverEmployeeId == managerId)
                .Select(p => p.ProjectId)
                .ToListAsync();
        }

        public async Task<List<int>> GetAllManagerEmployeeIdsAsync()
        {
            var resourceOwnerIds = await _context.Projects
                .Where(p => p.ResourceOwnerEmployeeId != null)
                .Select(p => p.ResourceOwnerEmployeeId.Value)
                .Distinct()
                .ToListAsync();

            var l1ApproverIds = await _context.Projects
                .Where(p => p.L1approverEmployeeId != null)
                .Select(p => p.L1approverEmployeeId.Value)
                .Distinct()
                .ToListAsync();

            var l2ApproverIds = await _context.Projects
                .Where(p => p.L2approverEmployeeId != null)
                .Select(p => p.L2approverEmployeeId.Value)
                .Distinct()
                .ToListAsync();

            var allManagerIds = new HashSet<int>();
            allManagerIds.UnionWith(resourceOwnerIds);
            allManagerIds.UnionWith(l1ApproverIds);
            allManagerIds.UnionWith(l2ApproverIds);

            return allManagerIds.ToList();
        }

        public async Task<List<object>> GetTeamMembersByProjectIdsAsync(List<int> projectIds, List<int> managerIds)
        {
            return await _context.Projectemployees
                .Where(pe => projectIds.Contains(pe.ProjectId))
                .Include(pe => pe.Employee)
                    .ThenInclude(edm => edm.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(pe => pe.Employee)
                    .ThenInclude(edm => edm.Department)
                .Where(pe => pe.Employee.Employee.EmploymentStatus == "Active")
                .Where(pe => !managerIds.Contains(pe.Employee.EmployeeId))
                .Select(pe => new
                {
                    pe.Employee.Employee.EmployeeId,
                    FirstName = pe.Employee.Employee.Userprofile.FirstName,
                    LastName = pe.Employee.Employee.Userprofile.LastName,
                    Email = pe.Employee.Employee.Userprofile.PersonalEmail,
                    Department = new
                    {
                        pe.Employee.Department.DepartmentId,
                        pe.Employee.Department.DepartmentName
                    }
                })
                .Cast<object>()
                .Distinct()
                .ToListAsync();
        }

        public async Task<bool> IsL1ManagerAsync(int employeeId)
        {
            return await _context.Projects
                .AnyAsync(p => p.ResourceOwnerEmployeeId == employeeId
                            || p.L1approverEmployeeId == employeeId);
        }

        public async Task<bool> IsNomineeInManagerProjectsAsync(int nomineeId, List<int> projectIds)
        {
            return await _context.Projectemployees
                .AnyAsync(pe => projectIds.Contains(pe.ProjectId)
                             && pe.Employee.EmployeeId == nomineeId);
        }

        public async Task<Recognitionstatus?> GetExistingNominationAsync(int nomineeId, int rewardTypeId)
        {
            return await _context.Recognitionstatuses
                .Include(n => n.Opportunity)
                .FirstOrDefaultAsync(n => n.NomineeEmployeeId == nomineeId
                                       && n.Opportunity.RewardTypeId == rewardTypeId
                                       && n.NominationType == "ManagerNomination");
        }

        public async Task<Recognitiondetail?> GetDefaultOpportunityAsync(int rewardTypeId)
        {
            return await _context.Recognitiondetails
                .FirstOrDefaultAsync(o => o.RewardTypeId == rewardTypeId
                    && o.OpportunityName.Contains("Manager"));
        }

        public async Task<Recognitiondetail> CreateDefaultOpportunityAsync(int rewardTypeId, string rewardName)
        {
            var opportunity = new Recognitiondetail
            {
                RewardTypeId = rewardTypeId,
                OpportunityName = $"Manager Direct Nomination - {rewardName}",
                Description = "Direct nomination by manager for this reward type",
                DepartmentId = 1,
                Deadline = DateOnly.FromDateTime(DateTime.Now.AddYears(10)),
                Status = "Active",
                PostedByUserId = 1,
                CreatedAt = DateTime.UtcNow,
                Requirements = "Nominated by direct manager",
                EligibilityCriteria = "Active employees"
            };

            _context.Recognitiondetails.Add(opportunity);
            await _context.SaveChangesAsync(); // keep old behavior
            return opportunity;
        }

        public async Task AddRecognitionStatusAsync(Recognitionstatus status)
        {
            _context.Recognitionstatuses.Add(status);
            await Task.CompletedTask;
        }

        public async Task<bool> ParameterExistsAsync(int parameterId, int rewardTypeId)
        {
            return await _context.Nominationparameters
                .AnyAsync(np => np.ParameterId == parameterId
                    && np.RewardTypeId == rewardTypeId);
        }

        public async Task<Nominationparametervalue?> GetExistingParameterValueAsync(int nominationId, int parameterId)
        {
            return await _context.Nominationparametervalues
                .FirstOrDefaultAsync(npv => npv.NominationId == nominationId
                                          && npv.ParameterId == parameterId);
        }

        public async Task AddParameterValueAsync(Nominationparametervalue paramValue)
        {
            _context.Nominationparametervalues.Add(paramValue);
            await Task.CompletedTask;
        }

        public async Task UpdateParameterValueAsync(Nominationparametervalue paramValue)
        {
            _context.Nominationparametervalues.Update(paramValue);
            await Task.CompletedTask;
        }

        public async Task AddNominationTrackingAsync(Nominationvisibilitytracking tracking)
        {
            _context.Nominationvisibilitytrackings.Add(tracking);
            await Task.CompletedTask;
        }

        public async Task<List<Recognitionstatus>> GetNominationsByEmployeeIdAsync(int employeeId)
        {
            return await _context.Recognitionstatuses
                .Include(n => n.Opportunity)
                    .ThenInclude(o => o.RewardType)
                .Where(n => n.NomineeEmployeeId == employeeId
                         && n.NominationType == "ManagerNomination")
                .ToListAsync();
        }

        public async Task<List<Recognitionstatus>> GetNominationsByManagerIdAsync(int managerId)
        {
            return await _context.Recognitionstatuses
                .Where(n => n.NominatedByEmployeeId == managerId)
                .ToListAsync();
        }

        public async Task<Recognitionstatus?> GetNominationByIdAsync(int nominationId)
        {
            return await _context.Recognitionstatuses
                .FirstOrDefaultAsync(n => n.NominationId == nominationId);
        }

        public async Task<List<Nominationparametervalue>> GetParameterValuesByNominationIdAsync(int nominationId)
        {
            return await _context.Nominationparametervalues
                .Where(pv => pv.NominationId == nominationId)
                .ToListAsync();
        }

        public async Task<Nominationparameter?> GetParameterByIdAsync(int parameterId)
        {
            return await _context.Nominationparameters
                .FirstOrDefaultAsync(p => p.ParameterId == parameterId);
        }

        public async Task<Employee?> GetEmployeeByIdAsync(int employeeId)
        {
            return await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
        }

        public async Task<Userprofile?> GetUserProfileByEmployeeIdAsync(int employeeId)
        {
            return await _context.Userprofiles
                .FirstOrDefaultAsync(up => up.EmployeeId == employeeId);
        }

        public async Task<Employeedetailsmaster?> GetEmployeeDetailsAsync(int employeeId)
        {
            return await _context.Employeedetailsmasters
                .Include(edm => edm.Department)
                .FirstOrDefaultAsync(edm => edm.EmployeeId == employeeId);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
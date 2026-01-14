using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.Repository
{
    public class OrgwideObjectivesRepository : IOrgwideObjectivesRepository
    {
        private readonly EEPZDbContext _context;
        private const string ORG_GOAL_TYPE = "org";

        public OrgwideObjectivesRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<List<OrgObjectiveDto>> GetAllOrgObjectivesAsync()
        {
            return await _context.Goals
                .Where(g => g.GoalType == ORG_GOAL_TYPE &&
                           (g.Goalstatus == "open" || g.Goalstatus == "inprogress"))
                .OrderBy(g => g.GoalTitle)
                .Select(g => new OrgObjectiveDto
                {
                    ObjectiveId = g.GoalId,
                    Title = g.GoalTitle,
                    Description = g.GoalDescription,
                    GoalStatus = g.Goalstatus,
                    CreatedAt = g.Goalcreatedat,
                    EndDate = g.Goalendat
                })
                .ToListAsync();
        }

        public async Task<List<OrgObjectiveDto>> GetAllOrgObjectivesForDropdownAsync()
        {
            return await _context.Goals
                .Where(g => g.GoalType == ORG_GOAL_TYPE)
                .OrderByDescending(g => g.Goalcreatedat)
                .Select(g => new OrgObjectiveDto
                {
                    ObjectiveId = g.GoalId,
                    Title = g.GoalTitle,
                    Description = g.GoalDescription,
                    GoalStatus = g.Goalstatus,
                    CreatedAt = g.Goalcreatedat,
                    EndDate = g.Goalendat
                })
                .ToListAsync();
        }

        public async Task<OrgObjectiveDto> GetOrgObjectiveByIdAsync(int objectiveId)
        {
            return await _context.Goals
                .Where(g => g.GoalId == objectiveId && g.GoalType == ORG_GOAL_TYPE)
                .Select(g => new OrgObjectiveDto
                {
                    ObjectiveId = g.GoalId,
                    Title = g.GoalTitle,
                    Description = g.GoalDescription,
                    GoalStatus = g.Goalstatus,
                    CreatedAt = g.Goalcreatedat,
                    EndDate = g.Goalendat
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<OrgObjectiveDto>> GetActiveOrgObjectivesAsync()
        {
            return await _context.Goals
                .Where(g => g.GoalType == ORG_GOAL_TYPE &&
                           (g.Goalstatus == "open" || g.Goalstatus == "inprogress"))
                .OrderBy(g => g.GoalTitle)
                .Select(g => new OrgObjectiveDto
                {
                    ObjectiveId = g.GoalId,
                    Title = g.GoalTitle,
                    Description = g.GoalDescription,
                    GoalStatus = g.Goalstatus
                })
                .ToListAsync();
        }

        public async Task<List<OrgObjectiveDto>> GetOrgObjectivesByStatusAsync(string status)
        {
            return await _context.Goals
                .Where(g => g.GoalType == ORG_GOAL_TYPE && g.Goalstatus == status)
                .OrderBy(g => g.GoalTitle)
                .Select(g => new OrgObjectiveDto
                {
                    ObjectiveId = g.GoalId,
                    Title = g.GoalTitle,
                    Description = g.GoalDescription,
                    GoalStatus = g.Goalstatus,
                    CreatedAt = g.Goalcreatedat,
                    EndDate = g.Goalendat
                })
                .ToListAsync();
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Data.Repository
{
    public class OrgwideObjectivesRepository : IOrgwideObjectivesRepository
    {
        private readonly EEPZDbContext _context;

        public OrgwideObjectivesRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<List<OrgObjectiveResponseDto>> GetAllOrgObjectivesAsync()
        {
            return await _context.Goals
                .AsNoTracking()
                .Where(g =>
                    g.GoalType == GoalTypeConstants.Organization &&
                    (g.Goalstatus == "open" || g.Goalstatus == "inprogress"))
                .OrderBy(g => g.GoalTitle)
                .Select(g => new OrgObjectiveResponseDto
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

        public async Task<List<OrgObjectiveResponseDto>> GetAllOrgObjectivesForDropdownAsync()
        {
            return await _context.Goals
                .AsNoTracking()
                .Where(g => g.GoalType == GoalTypeConstants.Organization)
                .OrderByDescending(g => g.Goalcreatedat)
                .Select(g => new OrgObjectiveResponseDto
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

        public async Task<OrgObjectiveResponseDto?> GetOrgObjectiveByIdAsync(int objectiveId)
        {
            return await _context.Goals
                .AsNoTracking()
                .Where(g =>
                    g.GoalId == objectiveId &&
                    g.GoalType == GoalTypeConstants.Organization)
                .Select(g => new OrgObjectiveResponseDto
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

        public async Task<List<OrgObjectiveResponseDto>> GetActiveOrgObjectivesAsync()
        {
            return await _context.Goals
                .AsNoTracking()
                .Where(g =>
                    g.GoalType == GoalTypeConstants.Organization &&
                    (g.Goalstatus == "open" || g.Goalstatus == "inprogress"))
                .OrderBy(g => g.GoalTitle)
                .Select(g => new OrgObjectiveResponseDto
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

        public async Task<List<OrgObjectiveResponseDto>> GetOrgObjectivesByStatusAsync(string status)
        {
            return await _context.Goals
                .AsNoTracking()
                .Where(g =>
                    g.GoalType == GoalTypeConstants.Organization &&
                    g.Goalstatus == status)
                .OrderBy(g => g.GoalTitle)
                .Select(g => new OrgObjectiveResponseDto
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

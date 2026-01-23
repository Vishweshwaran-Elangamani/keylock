using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class MomRepository : IMomRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<MomRepository> _logger;

        // Compiled queries for hot paths (frequently executed queries)
        private static readonly Func<EEPZDbContext, int, CancellationToken, Task<Mom?>> _compiledGetMomById =
            EF.CompileAsyncQuery((EEPZDbContext context, int momId, CancellationToken ct) =>
                context.Moms
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(m => m.Momdiscussionpoints)
                    .Include(m => m.Momactionitems)
                        .ThenInclude(ai => ai.AssignedToEmployee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(m => m.SubmittedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .FirstOrDefault(m => m.Momid == momId));

        private static readonly Func<EEPZDbContext, int, CancellationToken, Task<List<Mom>>> _compiledGetMomsByEmployeeId =
            EF.CompileAsyncQuery((EEPZDbContext context, int employeeId, CancellationToken ct) =>
                context.Moms
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(m => m.Momdiscussionpoints)
                    .Include(m => m.Momactionitems)
                    .Include(m => m.SubmittedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Where(m => m.SubmittedByEmployeeId == employeeId)
                    .OrderByDescending(m => m.CreatedAt)
                    .ToList());

        private static readonly Func<EEPZDbContext, int, CancellationToken, Task<List<Momactionitem>>> _compiledGetActionItemsByEmployeeId =
            EF.CompileAsyncQuery((EEPZDbContext context, int employeeId, CancellationToken ct) =>
                context.Momactionitems
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(ai => ai.Mom)
                        .ThenInclude(m => m.SubmittedByEmployee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(ai => ai.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Where(ai => ai.AssignedToEmployeeId == employeeId)
                    .OrderBy(ai => ai.DueDate)
                    .ToList());

        public MomRepository(EEPZDbContext context, ILogger<MomRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Mom> CreateMomAsync(Mom mom, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Creating new MOM with title: {MeetingTitle}", mom.MeetingTitle);
            _context.Moms.Add(mom);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully created MOM with ID: {MomId}", mom.Momid);
            return mom;
        }

        public async Task<Mom?> GetMomByIdAsync(int momId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Fetching MOM by ID: {MomId}", momId);
            
            // Use compiled query for better performance
            var mom = await _compiledGetMomById(_context, momId, cancellationToken);

            if (mom == null)
            {
                _logger.LogWarning("MOM with ID {MomId} not found", momId);
            }

            return mom;
        }

        public async Task<List<Mom>> GetMomsByEmployeeIdAsync(int employeeId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Fetching MOMs by employee ID: {EmployeeId}", employeeId);
            
            // Use compiled query for better performance
            var moms = await _compiledGetMomsByEmployeeId(_context, employeeId, cancellationToken);

            _logger.LogDebug("Found {Count} MOMs for employee ID: {EmployeeId}", moms.Count, employeeId);
            return moms;
        }

        public async Task<List<Mom>> GetMomsSubmittedByEmployeeAsync(int employeeId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Fetching MOMs submitted by employee ID: {EmployeeId}", employeeId);
            
            var moms = await _context.Moms
                .AsNoTracking()
                .AsSplitQuery() // Prevents cartesian explosion with multiple includes
                .Include(m => m.Momdiscussionpoints)
                .Include(m => m.Momactionitems)
                    .ThenInclude(ai => ai.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Where(m => m.SubmittedByEmployeeId == employeeId)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync(cancellationToken);

            _logger.LogDebug("Found {Count} MOMs submitted by employee ID: {EmployeeId}", moms.Count, employeeId);
            return moms;
        }

        public async Task<List<Mom>> GetMomsSharedWithEmployeeAsync(int employeeId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Fetching MOMs shared with employee ID: {EmployeeId}", employeeId);
            
            var sharedMomIds = await _context.Momsharings
                .AsNoTracking()
                .Where(ms => ms.SharedWithEmployeeId == employeeId)
                .Select(ms => ms.Momid)
                .ToListAsync(cancellationToken);

            _logger.LogDebug("Found {Count} shared MOM IDs for employee ID: {EmployeeId}", sharedMomIds.Count, employeeId);

            if (!sharedMomIds.Any())
            {
                return new List<Mom>();
            }

            var moms = await _context.Moms
                .AsNoTracking()
                .AsSplitQuery()
                .Include(m => m.Momdiscussionpoints)
                .Include(m => m.Momactionitems)
                    .ThenInclude(ai => ai.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Where(m => sharedMomIds.Contains(m.Momid))
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync(cancellationToken);

            return moms;
        }

        public async Task<Mom> UpdateMomAsync(Mom mom, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Updating MOM with ID: {MomId}", mom.Momid);
            _context.Moms.Update(mom);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully updated MOM with ID: {MomId}", mom.Momid);
            return mom;
        }

        public async Task<bool> DeleteMomAsync(int momId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Attempting to delete MOM with ID: {MomId}", momId);
            var mom = await _context.Moms.FindAsync(new object[] { momId }, cancellationToken);
            if (mom == null)
            {
                _logger.LogWarning("Cannot delete - MOM with ID {MomId} not found", momId);
                return false;
            }

            _context.Moms.Remove(mom);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully deleted MOM with ID: {MomId}", momId);
            return true;
        }

        public async Task<int> GetAllMomsCountAsync(
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Getting count of all MOMs with filters - SearchTerm: {SearchTerm}, MeetingType: {MeetingType}", searchTerm, meetingType);
            
            var query = _context.Moms
                .AsNoTracking()
                .AsQueryable();

            query = ApplyMomFilters(query, searchTerm, meetingType, departmentId, startDate, endDate);
            var count = await query.CountAsync(cancellationToken);
            _logger.LogDebug("Total MOMs count: {Count}", count);
            return count;
        }

        public async Task<List<Mom>> GetAllMomsAsync(
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Fetching MOMs - Page: {PageNumber}, PageSize: {PageSize}", pageNumber, pageSize);
            
            var query = _context.Moms
                .AsNoTracking()
                .AsSplitQuery()
                .Include(m => m.Momdiscussionpoints)
                .Include(m => m.Momactionitems)
                    .ThenInclude(ai => ai.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .AsQueryable();

            query = ApplyMomFilters(query, searchTerm, meetingType, departmentId, startDate, endDate);

            var moms = await query
                .OrderByDescending(m => m.MeetingDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            _logger.LogDebug("Retrieved {Count} MOMs for page {PageNumber}", moms.Count, pageNumber);
            return moms;
        }

        private IQueryable<Mom> ApplyMomFilters(
            IQueryable<Mom> query,
            string? searchTerm,
            string? meetingType,
            int? departmentId,
            DateTime? startDate,
            DateTime? endDate)
        {
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(m =>
                    m.MeetingTitle.Contains(searchTerm) ||
                    m.Attendees.Contains(searchTerm));
            }

            if (!string.IsNullOrWhiteSpace(meetingType))
            {
                query = query.Where(m => m.MeetingType == meetingType);
            }

            if (startDate.HasValue)
            {
                query = query.Where(m => m.MeetingDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(m => m.MeetingDate <= endDate.Value);
            }

            return query;
        }

        public async Task<List<Momdiscussionpoint>> AddDiscussionPointsAsync(List<Momdiscussionpoint> points, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Adding {Count} discussion points", points.Count);
            _context.Momdiscussionpoints.AddRange(points);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully added {Count} discussion points", points.Count);
            return points;
        }

        public async Task<bool> DeleteDiscussionPointsByMomIdAsync(int momId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Deleting discussion points for MOM ID: {MomId}", momId);
            
            var points = await _context.Momdiscussionpoints
                .Where(dp => dp.Momid == momId)
                .ToListAsync(cancellationToken);

            if (points.Any())
            {
                _context.Momdiscussionpoints.RemoveRange(points);
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Deleted {Count} discussion points for MOM ID: {MomId}", points.Count, momId);
            }

            return true;
        }

        public async Task<List<Momactionitem>> AddActionItemsAsync(List<Momactionitem> actionItems, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Adding {Count} action items", actionItems.Count);
            _context.Momactionitems.AddRange(actionItems);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully added {Count} action items", actionItems.Count);
            return actionItems;
        }

        public async Task<bool> DeleteActionItemsByMomIdAsync(int momId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Deleting action items for MOM ID: {MomId}", momId);
            
            var actionItems = await _context.Momactionitems
                .Where(ai => ai.Momid == momId)
                .ToListAsync(cancellationToken);

            if (actionItems.Any())
            {
                _context.Momactionitems.RemoveRange(actionItems);
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Deleted {Count} action items for MOM ID: {MomId}", actionItems.Count, momId);
            }

            return true;
        }

        public async Task<Momactionitem?> GetActionItemByIdAsync(int actionItemId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Fetching action item by ID: {ActionItemId}", actionItemId);
            
            var actionItem = await _context.Momactionitems
                .AsNoTracking()
                .Include(ai => ai.AssignedToEmployee)
                    .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(ai => ai.ActionItemId == actionItemId, cancellationToken);

            if (actionItem == null)
            {
                _logger.LogWarning("Action item with ID {ActionItemId} not found", actionItemId);
            }

            return actionItem;
        }

        public async Task<Momactionitem?> UpdateActionItemStatusAsync(int actionItemId, string status, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Updating action item ID: {ActionItemId} to status: {Status}", actionItemId, status);
            var actionItem = await _context.Momactionitems.FindAsync(new object[] { actionItemId }, cancellationToken);
            if (actionItem == null)
            {
                _logger.LogWarning("Action item with ID {ActionItemId} not found", actionItemId);
                return null;
            }

            actionItem.Status = status;
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully updated action item ID: {ActionItemId} to status: {Status}", actionItemId, status);
            return actionItem;
        }

        public async Task<List<Momactionitem>> GetActionItemsByEmployeeIdAsync(int employeeId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Fetching action items assigned to employee ID: {EmployeeId}", employeeId);

            // Use compiled query for hot path
            var actionItems = await _compiledGetActionItemsByEmployeeId(_context, employeeId, cancellationToken);

            _logger.LogDebug("Found {Count} action items for employee ID: {EmployeeId}", actionItems.Count, employeeId);
            return actionItems;
        }

        public async Task<List<Momactionitem>> GetActionItemsAssignedByEmployeeAsync(int employeeId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Fetching action items assigned by employee ID: {EmployeeId}", employeeId);

            var actionItems = await _context.Momactionitems
                .AsNoTracking()
                .AsSplitQuery()
                .Include(ai => ai.Mom)
                    .ThenInclude(m => m.SubmittedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(ai => ai.AssignedToEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Where(ai => ai.Mom.SubmittedByEmployeeId == employeeId)
                .OrderBy(ai => ai.DueDate)
                .ToListAsync(cancellationToken);

            _logger.LogDebug("Found {Count} action items assigned by employee ID: {EmployeeId}", actionItems.Count, employeeId);
            return actionItems;
        }

        public async Task<List<Momsharing>> ShareMomAsync(List<Momsharing> sharings, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Sharing MOM with {Count} employees", sharings.Count);
            _context.Momsharings.AddRange(sharings);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully shared MOM with {Count} employees", sharings.Count);
            return sharings;
        }

        public async Task<List<Momsharing>> GetMomSharingsByEmployeeIdAsync(int employeeId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Fetching MOM sharings by employee ID: {EmployeeId}", employeeId);
            
            var sharings = await _context.Momsharings
                .AsNoTracking()
                .AsSplitQuery()
                .Include(ms => ms.Mom)
                .Include(ms => ms.SharedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(ms => ms.SharedWithEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Where(ms => ms.SharedByEmployeeId == employeeId)
                .OrderByDescending(ms => ms.SharedAt)
                .ToListAsync(cancellationToken);

            _logger.LogDebug("Found {Count} MOM sharings for employee ID: {EmployeeId}", sharings.Count, employeeId);
            return sharings;
        }
    }
}

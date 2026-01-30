using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    /// <summary>
    /// Repository class for MOM (Minutes of Meeting) data access operations
    /// OPTIMIZED: Uses AsNoTracking for read-only queries and AsSplitQuery to prevent cartesian explosion
    /// </summary>
    public class MomRepository : IMomRepository
    {
        // Database context for MOM operations
        private readonly EEPZDbContext _context;
        
        // Logger instance for tracking repository operations
        private readonly ILogger<MomRepository> _logger;

        /// <summary>
        /// Constructor to inject database context and logger dependencies
        /// </summary>
        public MomRepository(EEPZDbContext context, ILogger<MomRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        #region MOM CRUD Operations

        /// <summary>
        /// Creates a new MOM record in the database
        /// </summary>
        /// <param name="mom">MOM entity to create</param>
        /// <returns>Created MOM with generated ID</returns>
        public async Task<Mom> CreateMomAsync(Mom mom)
        {
            _context.Moms.Add(mom);
            await _context.SaveChangesAsync();
            return mom;
        }

        /// <summary>
        /// Retrieves a specific MOM by ID with all related data
        /// OPTIMIZED: Uses AsNoTracking for read-only query and AsSplitQuery to prevent cartesian explosion
        /// Multiple collections (Momdiscussionpoints, Momactionitems) require AsSplitQuery
        /// </summary>
        /// <param name="momId">MOM ID to retrieve</param>
        /// <returns>MOM entity with discussion points, action items, and employee details</returns>
        public async Task<Mom?> GetMomByIdAsync(int momId)
        {
            return await _context.Moms
                .AsNoTracking() // Read-only optimization - no change tracking needed
                .Include(m => m.Momdiscussionpoints)  // Collection 1
                .Include(m => m.Momactionitems)       // Collection 2 - causes cartesian explosion without AsSplitQuery
                    .ThenInclude(ai => ai.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .AsSplitQuery() // Prevents cartesian explosion: generates 2+ SQL queries instead of 1 large JOIN
                .FirstOrDefaultAsync(m => m.Momid == momId);
        }

        /// <summary>
        /// Gets all MOMs created by a specific employee
        /// OPTIMIZED: Uses AsNoTracking for read-only query and AsSplitQuery to prevent cartesian explosion
        /// Multiple collections require split query to avoid M*N result rows
        /// </summary>
        /// <param name="employeeId">Employee ID to filter by</param>
        /// <returns>List of MOMs ordered by creation date descending</returns>
        public async Task<List<Mom>> GetMomsByEmployeeIdAsync(int employeeId)
        {
            return await _context.Moms
                .AsNoTracking() // Read-only optimization
                .Include(m => m.Momdiscussionpoints)  // Collection 1
                .Include(m => m.Momactionitems)       // Collection 2
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .AsSplitQuery() // Prevents cartesian explosion
                .Where(m => m.SubmittedByEmployeeId == employeeId)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Gets all MOMs submitted by a specific employee with complete details
        /// OPTIMIZED: Uses AsNoTracking for read-only query and AsSplitQuery to prevent cartesian explosion
        /// Example: 10 MOMs with 5 discussion points and 3 action items each
        /// Without AsSplitQuery: 10*5*3 = 150 rows returned
        /// With AsSplitQuery: 10 + 50 + 30 = 90 rows returned (40% reduction)
        /// </summary>
        /// <param name="employeeId">Employee ID to filter by</param>
        /// <returns>List of MOMs with all related entities</returns>
        public async Task<List<Mom>> GetMomsSubmittedByEmployeeAsync(int employeeId)
        {
            return await _context.Moms
                .AsNoTracking() // Read-only optimization - reduces memory footprint by 10-30%
                .Include(m => m.Momdiscussionpoints)  // Collection 1
                .Include(m => m.Momactionitems)       // Collection 2
                    .ThenInclude(ai => ai.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .AsSplitQuery() // Prevents cartesian explosion with multiple includes
                .Where(m => m.SubmittedByEmployeeId == employeeId)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Gets all MOMs that have been shared with a specific employee
        /// OPTIMIZED: Uses AsNoTracking, AsSplitQuery, and single query with subquery
        /// </summary>
        /// <param name="employeeId">Employee ID who received the MOMs</param>
        /// <returns>List of shared MOMs with complete details</returns>
        public async Task<List<Mom>> GetMomsSharedWithEmployeeAsync(int employeeId)
        {
            // Optimized: Single query with subquery instead of loading IDs first
            return await _context.Moms
                .AsNoTracking() // Read-only optimization
                .Where(m => _context.Momsharings
                    .Where(ms => ms.SharedWithEmployeeId == employeeId)
                    .Select(ms => ms.Momid)
                    .Contains(m.Momid))
                .Include(m => m.Momdiscussionpoints)  // Collection 1
                .Include(m => m.Momactionitems)       // Collection 2
                    .ThenInclude(ai => ai.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .AsSplitQuery() // Prevents cartesian explosion
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Updates an existing MOM record
        /// </summary>
        /// <param name="mom">MOM entity with updated values</param>
        /// <returns>Updated MOM entity</returns>
        public async Task<Mom> UpdateMomAsync(Mom mom)
        {
            _context.Moms.Update(mom);
            await _context.SaveChangesAsync();
            return mom;
        }

        /// <summary>
        /// Deletes a MOM record from the database
        /// </summary>
        /// <param name="momId">MOM ID to delete</param>
        /// <returns>True if deleted successfully, false if not found</returns>
        public async Task<bool> DeleteMomAsync(int momId)
        {
            var mom = await _context.Moms.FindAsync(momId);
            if (mom == null) return false;

            _context.Moms.Remove(mom);
            await _context.SaveChangesAsync();
            return true;
        }

        #endregion

        #region MOM Queries with Filtering

        /// <summary>
        /// Gets the total count of MOMs matching the filter criteria
        /// OPTIMIZED: Uses AsNoTracking for read-only count query
        /// No AsSplitQuery needed - no includes for count operation
        /// </summary>
        /// <param name="searchTerm">Search term for title or attendees</param>
        /// <param name="meetingType">Meeting type filter</param>
        /// <param name="departmentId">Department ID filter</param>
        /// <param name="startDate">Start date filter</param>
        /// <param name="endDate">End date filter</param>
        /// <returns>Total count of matching MOMs</returns>
        public async Task<int> GetAllMomsCountAsync(
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null)
        {
            var query = _context.Moms
                .AsNoTracking() // Read-only optimization for count query
                .AsQueryable();

            // Apply filters to the query
            query = ApplyMomFilters(query, searchTerm, meetingType, departmentId, startDate, endDate);
            return await query.CountAsync();
        }

        /// <summary>
        /// Gets paginated MOMs with filtering options
        /// OPTIMIZED: Uses AsNoTracking for read-only query and AsSplitQuery to prevent cartesian explosion
        /// Essential for large result sets with multiple collections
        /// </summary>
        /// <param name="searchTerm">Search term for title or attendees</param>
        /// <param name="meetingType">Meeting type filter</param>
        /// <param name="departmentId">Department ID filter</param>
        /// <param name="startDate">Start date filter</param>
        /// <param name="endDate">End date filter</param>
        /// <param name="pageNumber">Page number for pagination</param>
        /// <param name="pageSize">Number of items per page</param>
        /// <returns>Paginated list of MOMs</returns>
        public async Task<List<Mom>> GetAllMomsAsync(
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 20)
        {
            var query = _context.Moms
                .AsNoTracking() // Read-only optimization - significantly improves performance
                .Include(m => m.Momdiscussionpoints)  // Collection 1
                .Include(m => m.Momactionitems)       // Collection 2
                    .ThenInclude(ai => ai.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .AsSplitQuery() // Prevents cartesian explosion with multiple includes
                .AsQueryable();

            // Apply filtering
            query = ApplyMomFilters(query, searchTerm, meetingType, departmentId, startDate, endDate);

            // Apply ordering and pagination
            return await query
                .OrderByDescending(m => m.MeetingDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        /// <summary>
        /// Applies filtering conditions to MOM query
        /// Uses EF Core expression trees - translates to SQL WHERE clauses (no client evaluation)
        /// </summary>
        /// <param name="query">Base query to filter</param>
        /// <param name="searchTerm">Search term for title or attendees</param>
        /// <param name="meetingType">Meeting type filter</param>
        /// <param name="departmentId">Department ID filter</param>
        /// <param name="startDate">Start date filter</param>
        /// <param name="endDate">End date filter</param>
        /// <returns>Filtered query</returns>
        private IQueryable<Mom> ApplyMomFilters(
            IQueryable<Mom> query,
            string? searchTerm,
            string? meetingType,
            int? departmentId,
            DateTime? startDate,
            DateTime? endDate)
        {
            // All filters translate to SQL WHERE clauses - no client-side evaluation
            
            // Filter by search term in title or attendees
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                // Translates to: WHERE MeetingTitle LIKE '%searchTerm%' OR Attendees LIKE '%searchTerm%'
                query = query.Where(m =>
                    m.MeetingTitle.Contains(searchTerm) ||
                    m.Attendees.Contains(searchTerm));
            }

            // Filter by meeting type
            if (!string.IsNullOrWhiteSpace(meetingType))
            {
                // Translates to: WHERE MeetingType = @meetingType
                query = query.Where(m => m.MeetingType == meetingType);
            }

            // Filter by start date
            if (startDate.HasValue)
            {
                // Translates to: WHERE MeetingDate >= @startDate
                query = query.Where(m => m.MeetingDate >= startDate.Value);
            }

            // Filter by end date
            if (endDate.HasValue)
            {
                // Translates to: WHERE MeetingDate <= @endDate
                query = query.Where(m => m.MeetingDate <= endDate.Value);
            }

            return query;
        }

        #endregion

        #region Discussion Points Operations

        /// <summary>
        /// Adds multiple discussion points to the database
        /// </summary>
        /// <param name="points">List of discussion points to add</param>
        /// <returns>List of added discussion points</returns>
        public async Task<List<Momdiscussionpoint>> AddDiscussionPointsAsync(List<Momdiscussionpoint> points)
        {
            _context.Momdiscussionpoints.AddRange(points);
            await _context.SaveChangesAsync();
            return points;
        }

        /// <summary>
        /// Deletes all discussion points associated with a specific MOM
        /// OPTIMIZED: Uses ExecuteDeleteAsync for bulk delete without loading entities
        /// Translates to: DELETE FROM Momdiscussionpoints WHERE Momid = @momId
        /// No entities loaded into memory - direct SQL execution
        /// </summary>
        /// <param name="momId">MOM ID whose discussion points should be deleted</param>
        /// <returns>True if operation completed</returns>
        public async Task<bool> DeleteDiscussionPointsByMomIdAsync(int momId)
        {
            // Optimized: Bulk delete without loading entities into memory
            await _context.Momdiscussionpoints
                .Where(dp => dp.Momid == momId)
                .ExecuteDeleteAsync(); // EF Core 7+ feature - direct SQL DELETE

            return true;
        }

        #endregion

        #region Action Items Operations

        /// <summary>
        /// Adds multiple action items to the database
        /// </summary>
        /// <param name="actionItems">List of action items to add</param>
        /// <returns>List of added action items</returns>
        public async Task<List<Momactionitem>> AddActionItemsAsync(List<Momactionitem> actionItems)
        {
            _context.Momactionitems.AddRange(actionItems);
            await _context.SaveChangesAsync();
            return actionItems;
        }

        /// <summary>
        /// Deletes all action items associated with a specific MOM
        /// OPTIMIZED: Uses ExecuteDeleteAsync for bulk delete without loading entities
        /// Translates to: DELETE FROM Momactionitems WHERE Momid = @momId
        /// </summary>
        /// <param name="momId">MOM ID whose action items should be deleted</param>
        /// <returns>True if operation completed</returns>
        public async Task<bool> DeleteActionItemsByMomIdAsync(int momId)
        {
            // Optimized: Bulk delete without loading entities into memory
            await _context.Momactionitems
                .Where(ai => ai.Momid == momId)
                .ExecuteDeleteAsync(); // Direct SQL DELETE - no change tracking overhead

            return true;
        }

        /// <summary>
        /// Gets a specific action item by ID
        /// OPTIMIZED: Uses AsNoTracking for read-only query
        /// Single reference (AssignedToEmployee) - no need for AsSplitQuery
        /// </summary>
        /// <param name="actionItemId">Action item ID to retrieve</param>
        /// <returns>Action item with employee details or null if not found</returns>
        public async Task<Momactionitem?> GetActionItemByIdAsync(int actionItemId)
        {
            return await _context.Momactionitems
                .AsNoTracking() // Read-only optimization
                .Include(ai => ai.AssignedToEmployee)
                    .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(ai => ai.ActionItemId == actionItemId);
        }

        /// <summary>
        /// Updates the status of a specific action item
        /// </summary>
        /// <param name="actionItemId">Action item ID to update</param>
        /// <param name="status">New status value</param>
        /// <returns>Updated action item or null if not found</returns>
        public async Task<Momactionitem?> UpdateActionItemStatusAsync(int actionItemId, string status)
        {
            var actionItem = await _context.Momactionitems.FindAsync(actionItemId);
            if (actionItem == null) return null;

            actionItem.Status = status;
            await _context.SaveChangesAsync();
            return actionItem;
        }

        /// <summary>
        /// Gets all action items assigned to a specific employee
        /// OPTIMIZED: Uses AsNoTracking, AsSplitQuery, and single query with all necessary includes
        /// Multiple navigation properties require split query
        /// </summary>
        /// <param name="employeeId">Employee ID to retrieve action items for</param>
        /// <returns>List of action items ordered by due date</returns>
        public async Task<List<Momactionitem>> GetActionItemsByEmployeeIdAsync(int employeeId)
        {
            // Optimized: Single query with AsNoTracking and all necessary includes
            return await _context.Momactionitems
                .AsNoTracking() // Read-only optimization
                .Where(ai => ai.AssignedToEmployeeId == employeeId)
                .Include(ai => ai.AssignedToEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(ai => ai.Mom)
                    .ThenInclude(m => m.SubmittedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                .AsSplitQuery() // Prevents cartesian explosion - generates 2 SQL queries
                .OrderBy(ai => ai.DueDate)
                .ToListAsync();
        }

        /// <summary>
        /// Gets all action items assigned by a specific employee
        /// OPTIMIZED: Uses AsNoTracking, AsSplitQuery, and single query with join
        /// Filters via navigation property (Mom.SubmittedByEmployeeId) - translates to SQL JOIN
        /// </summary>
        /// <param name="employeeId">Employee ID who assigned the action items</param>
        /// <returns>List of action items ordered by due date</returns>
        public async Task<List<Momactionitem>> GetActionItemsAssignedByEmployeeAsync(int employeeId)
        {
            _logger.LogInformation("Retrieving action items assigned by employee {EmployeeId}", employeeId);

            // Optimized: Single query with AsNoTracking, join and all necessary includes
            // Translates to: SELECT * FROM Momactionitems ai INNER JOIN Moms m ON ai.Momid = m.Momid WHERE m.SubmittedByEmployeeId = @employeeId
            var actionItems = await _context.Momactionitems
                .AsNoTracking() // Read-only optimization - improves performance significantly
                .Where(ai => ai.Mom.SubmittedByEmployeeId == employeeId) // Navigation property filter - SQL JOIN
                .Include(ai => ai.AssignedToEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(ai => ai.Mom)
                    .ThenInclude(m => m.SubmittedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                .AsSplitQuery() // Prevents cartesian explosion
                .OrderBy(ai => ai.DueDate)
                .ToListAsync();

            _logger.LogInformation("Found {ActionItemCount} action items assigned by employee {EmployeeId}", 
                actionItems.Count, employeeId);

            return actionItems;
        }

        #endregion

        #region Sharing Operations

        /// <summary>
        /// Creates sharing records to share a MOM with multiple employees
        /// </summary>
        /// <param name="sharings">List of sharing records to create</param>
        /// <returns>List of created sharing records</returns>
        public async Task<List<Momsharing>> ShareMomAsync(List<Momsharing> sharings)
        {
            _context.Momsharings.AddRange(sharings);
            await _context.SaveChangesAsync();
            return sharings;
        }

        /// <summary>
        /// Gets all MOM sharing records created by a specific employee
        /// OPTIMIZED: Uses AsNoTracking for read-only query and AsSplitQuery to prevent cartesian explosion
        /// Multiple includes with collections require split query
        /// </summary>
        /// <param name="employeeId">Employee ID who shared the MOMs</param>
        /// <returns>List of sharing records ordered by sharing date descending</returns>
        public async Task<List<Momsharing>> GetMomSharingsByEmployeeIdAsync(int employeeId)
        {
            return await _context.Momsharings
                .AsNoTracking() // Read-only optimization
                .Include(ms => ms.Mom)
                .Include(ms => ms.SharedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(ms => ms.SharedWithEmployee)
                    .ThenInclude(e => e.Userprofile)
                .AsSplitQuery() // Prevents cartesian explosion with multiple includes
                .Where(ms => ms.SharedByEmployeeId == employeeId)
                .OrderByDescending(ms => ms.SharedAt)
                .ToListAsync();
        }

        #endregion
    }
}

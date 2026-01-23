using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for Minutes of Meeting (MOM) data access operations.
    /// Provides methods for CRUD operations, filtering, pagination, and related entity management.
    /// </summary>
    public interface IMomRepository
    {
        /// <summary>
        /// Creates a new MOM record in the database.
        /// </summary>
        /// <param name="mom">The MOM entity to create.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>The created MOM entity with generated ID.</returns>
        Task<Mom> CreateMomAsync(Mom mom, CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves a MOM by its unique identifier with all related entities.
        /// </summary>
        /// <param name="momId">The MOM's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>The MOM entity if found; otherwise null.</returns>
        Task<Mom?> GetMomByIdAsync(int momId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all MOMs associated with a specific employee.
        /// </summary>
        /// <param name="employeeId">The employee's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of MOMs associated with the employee.</returns>
        Task<List<Mom>> GetMomsByEmployeeIdAsync(int employeeId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all MOMs submitted/created by a specific employee.
        /// </summary>
        /// <param name="employeeId">The employee's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of MOMs submitted by the employee.</returns>
        Task<List<Mom>> GetMomsSubmittedByEmployeeAsync(int employeeId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all MOMs that have been shared with a specific employee.
        /// </summary>
        /// <param name="employeeId">The employee's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of MOMs shared with the employee.</returns>
        Task<List<Mom>> GetMomsSharedWithEmployeeAsync(int employeeId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Updates an existing MOM record.
        /// </summary>
        /// <param name="mom">The MOM entity with updated values.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>The updated MOM entity.</returns>
        Task<Mom> UpdateMomAsync(Mom mom, CancellationToken cancellationToken = default);

        /// <summary>
        /// Deletes a MOM record from the database.
        /// </summary>
        /// <param name="momId">The MOM's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>True if deletion was successful; false if MOM not found.</returns>
        Task<bool> DeleteMomAsync(int momId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the total count of MOMs matching the specified filters.
        /// </summary>
        /// <param name="searchTerm">Optional search term for title/attendees.</param>
        /// <param name="meetingType">Optional meeting type filter.</param>
        /// <param name="departmentId">Optional department ID filter.</param>
        /// <param name="startDate">Optional start date for date range filter.</param>
        /// <param name="endDate">Optional end date for date range filter.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>Total count of matching MOMs.</returns>
        Task<int> GetAllMomsCountAsync(
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves MOMs with filtering and pagination.
        /// </summary>
        /// <param name="searchTerm">Optional search term for title/attendees.</param>
        /// <param name="meetingType">Optional meeting type filter.</param>
        /// <param name="departmentId">Optional department ID filter.</param>
        /// <param name="startDate">Optional start date for date range filter.</param>
        /// <param name="endDate">Optional end date for date range filter.</param>
        /// <param name="pageNumber">Page number (1-based).</param>
        /// <param name="pageSize">Number of items per page.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>Paginated list of MOMs.</returns>
        Task<List<Mom>> GetAllMomsAsync(
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Adds discussion points to a MOM.
        /// </summary>
        /// <param name="points">List of discussion points to add.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>The created discussion points.</returns>
        Task<List<Momdiscussionpoint>> AddDiscussionPointsAsync(List<Momdiscussionpoint> points, CancellationToken cancellationToken = default);

        /// <summary>
        /// Deletes all discussion points associated with a MOM.
        /// </summary>
        /// <param name="momId">The MOM's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>True if deletion was successful.</returns>
        Task<bool> DeleteDiscussionPointsByMomIdAsync(int momId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Adds action items to a MOM.
        /// </summary>
        /// <param name="actionItems">List of action items to add.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>The created action items.</returns>
        Task<List<Momactionitem>> AddActionItemsAsync(List<Momactionitem> actionItems, CancellationToken cancellationToken = default);

        /// <summary>
        /// Deletes all action items associated with a MOM.
        /// </summary>
        /// <param name="momId">The MOM's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>True if deletion was successful.</returns>
        Task<bool> DeleteActionItemsByMomIdAsync(int momId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves a specific action item by its ID.
        /// </summary>
        /// <param name="actionItemId">The action item's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>The action item if found; otherwise null.</returns>
        Task<Momactionitem?> GetActionItemByIdAsync(int actionItemId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Updates the status of an action item.
        /// </summary>
        /// <param name="actionItemId">The action item's unique identifier.</param>
        /// <param name="status">The new status value.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>The updated action item if found; otherwise null.</returns>
        Task<Momactionitem?> UpdateActionItemStatusAsync(int actionItemId, string status, CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all action items assigned to a specific employee.
        /// </summary>
        /// <param name="employeeId">The employee's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of action items assigned to the employee.</returns>
        Task<List<Momactionitem>> GetActionItemsByEmployeeIdAsync(int employeeId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all action items assigned by a specific employee (as MOM creator).
        /// </summary>
        /// <param name="employeeId">The employee's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of action items assigned by the employee.</returns>
        Task<List<Momactionitem>> GetActionItemsAssignedByEmployeeAsync(int employeeId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Shares a MOM with multiple employees.
        /// </summary>
        /// <param name="sharings">List of sharing records to create.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>The created sharing records.</returns>
        Task<List<Momsharing>> ShareMomAsync(List<Momsharing> sharings, CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all sharing records for MOMs shared by a specific employee.
        /// </summary>
        /// <param name="employeeId">The employee's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of sharing records.</returns>
        Task<List<Momsharing>> GetMomSharingsByEmployeeIdAsync(int employeeId, CancellationToken cancellationToken = default);
    }
}

using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for Minutes of Meeting (MOM) business logic operations.
    /// Provides methods for creating, retrieving, updating, deleting, and sharing MOMs,
    /// as well as managing action items.
    /// </summary>
    public interface IMomService
    {
        /// <summary>
        /// Creates a new Minutes of Meeting (MOM) with discussion points and action items.
        /// Automatically shares the MOM with employees assigned to action items.
        /// </summary>
        /// <param name="createMomDto">DTO containing MOM creation data.</param>
        /// <param name="submittedByEmployeeId">ID of the employee creating the MOM.</param>
        /// <param name="role">Role of the employee creating the MOM.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>The created MOM details including all related data.</returns>
        Task<MomResponseDto> CreateMomAsync(
            CreateMomDto createMomDto, 
            int submittedByEmployeeId, 
            string role, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves a specific MOM by its ID with all related data.
        /// </summary>
        /// <param name="momId">The unique identifier of the MOM.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>MOM details if found; otherwise null.</returns>
        Task<MomResponseDto?> GetMomByIdAsync(int momId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all MOMs submitted by a specific employee.
        /// </summary>
        /// <param name="employeeId">The employee's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of MOMs submitted by the employee.</returns>
        Task<List<MomResponseDto>> GetMomsSubmittedByEmployeeAsync(
            int employeeId, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Updates an existing MOM. Only managers can edit MOMs they created.
        /// </summary>
        /// <param name="updateMomDto">DTO containing updated MOM data.</param>
        /// <param name="employeeId">ID of the employee performing the update.</param>
        /// <param name="role">Role of the employee performing the update.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>The updated MOM details.</returns>
        Task<MomResponseDto> UpdateMomAsync(
            UpdateMomDto updateMomDto, 
            int employeeId, 
            string role, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Deletes a MOM. Only the creator can delete their own MOMs.
        /// </summary>
        /// <param name="momId">The unique identifier of the MOM to delete.</param>
        /// <param name="employeeId">ID of the employee requesting deletion.</param>
        /// <param name="role">Role of the employee requesting deletion.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>True if deletion was successful; false if MOM not found.</returns>
        Task<bool> DeleteMomAsync(
            int momId, 
            int employeeId, 
            string role, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all MOMs with filtering and pagination. Only accessible by HR role.
        /// </summary>
        /// <param name="hrEmployeeId">The HR employee's ID.</param>
        /// <param name="role">The employee's role (must be HR).</param>
        /// <param name="searchTerm">Optional search term to filter MOMs.</param>
        /// <param name="meetingType">Optional meeting type filter.</param>
        /// <param name="departmentId">Optional department ID filter.</param>
        /// <param name="startDate">Optional start date for date range filter.</param>
        /// <param name="endDate">Optional end date for date range filter.</param>
        /// <param name="pageNumber">Page number for pagination (default: 1).</param>
        /// <param name="pageSize">Number of items per page (default: 20).</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>Paginated list of MOMs with metadata.</returns>
        Task<PaginatedMomResponseDto> GetAllMomsForHRAsync(
            int hrEmployeeId,
            string role,
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Shares a MOM with specified employees.
        /// </summary>
        /// <param name="shareMomDto">DTO containing sharing information.</param>
        /// <param name="sharedByEmployeeId">ID of the employee sharing the MOM.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of created sharing records.</returns>
        Task<List<MomSharingResponseDto>> ShareMomAsync(
            ShareMomDto shareMomDto, 
            int sharedByEmployeeId, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all MOMs shared by a specific employee.
        /// </summary>
        /// <param name="employeeId">The employee's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of sharing records for MOMs shared by the employee.</returns>
        Task<List<MomSharingResponseDto>> GetMomsSharedByEmployeeAsync(
            int employeeId, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all MOMs shared with a specific employee.
        /// </summary>
        /// <param name="employeeId">The employee's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of MOMs shared with the employee.</returns>
        Task<List<MomResponseDto>> GetMomsSharedWithEmployeeAsync(
            int employeeId, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Updates the status of an action item. Only the assigned employee can update.
        /// </summary>
        /// <param name="actionItemId">The action item's unique identifier.</param>
        /// <param name="status">New status (must be 'Pending' or 'Completed').</param>
        /// <param name="employeeId">ID of the employee updating the status.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>True if update was successful.</returns>
        Task<bool> UpdateActionItemStatusAsync(
            int actionItemId, 
            string status, 
            int employeeId, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all action items assigned to a specific employee.
        /// </summary>
        /// <param name="employeeId">The employee's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of action items assigned to the employee.</returns>
        Task<List<ActionItemResponseDto>> GetMyActionItemsAsync(
            int employeeId, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all action items assigned by a specific employee (as MOM creator).
        /// </summary>
        /// <param name="employeeId">The employee's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of action items assigned by the employee.</returns>
        Task<List<ActionItemResponseDto>> GetActionItemsAssignedByMeAsync(
            int employeeId, 
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves all overdue action items for a specific employee.
        /// </summary>
        /// <param name="employeeId">The employee's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token for async operation.</param>
        /// <returns>List of incomplete action items past their due date.</returns>
        Task<List<ActionItemResponseDto>> GetOverdueActionItemsAsync(
            int employeeId, 
            CancellationToken cancellationToken = default);
    }
}

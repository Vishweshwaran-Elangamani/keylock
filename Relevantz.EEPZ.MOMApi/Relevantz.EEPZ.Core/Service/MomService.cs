using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    /// <summary>
    /// Service implementation for managing Minutes of Meeting (MOM) operations.
    /// Handles creation, retrieval, updates, sharing, and action item management.
    /// </summary>
    public class MomService : IMomService
    {
        private readonly IMomRepository _momRepository;
        private readonly ILogger<MomService> _logger;
        
        // Constants for validation and configuration
        private const int MaxDiscussionPoints = 50;
        private const int MaxActionItems = 100;
        private const int MaxPastMeetingYears = 1;
        private const string StatusPending = "Pending";
        private const string StatusCompleted = "Completed";
        private const string RoleEmployee = "Employee";
        private const string RoleManager = "Manager";
        private const string RoleHR = "HR";

        public MomService(IMomRepository momRepository, ILogger<MomService> logger)
        {
            _momRepository = momRepository ?? throw new ArgumentNullException(nameof(momRepository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<MomResponseDto> CreateMomAsync(
            CreateMomDto createMomDto, 
            int submittedByEmployeeId, 
            string role, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Creating MOM with title '{MeetingTitle}' by employee ID: {EmployeeId}, Role: {Role}", 
                createMomDto.MeetingTitle, submittedByEmployeeId, role);

            ValidateCreateMomDto(createMomDto);

            var mappedRole = MapRoleToEnum(role);
            _logger.LogDebug("Mapped role '{OriginalRole}' to '{MappedRole}'", role, mappedRole);

            var mom = new Mom
            {
                MeetingId = createMomDto.MeetingId,
                MeetingTitle = createMomDto.MeetingTitle,
                MeetingType = createMomDto.MeetingType,
                MeetingDate = createMomDto.MeetingDate,
                MeetingLink = createMomDto.MeetingLink,
                Attendees = createMomDto.Attendees,
                CommentsObservations = createMomDto.CommentsObservations,
                SubmittedByEmployeeId = submittedByEmployeeId,
                SubmittedByRole = mappedRole,
                IsEditable = mappedRole == RoleManager,
                CreatedAt = DateTime.UtcNow
            };

            // Create MOM first to get the ID
            var createdMom = await _momRepository.CreateMomAsync(mom, cancellationToken);
            _logger.LogInformation("Created MOM with ID: {MomId}", createdMom.Momid);

            // Batch: Add discussion points, action items, and sharings together
            var batchTasks = new List<Task>();

            if (createMomDto.DiscussionPoints != null && createMomDto.DiscussionPoints.Any())
            {
                _logger.LogDebug("Adding {Count} discussion points to MOM ID: {MomId}", 
                    createMomDto.DiscussionPoints.Count, createdMom.Momid);
                
                var discussionPointEntities = createMomDto.DiscussionPoints.Select(dp => new Momdiscussionpoint
                {
                    Momid = createdMom.Momid,
                    PointText = dp.PointText,
                    PointOrder = dp.PointOrder
                }).ToList();

                batchTasks.Add(_momRepository.AddDiscussionPointsAsync(discussionPointEntities, cancellationToken));
            }

            if (createMomDto.ActionItems != null && createMomDto.ActionItems.Any())
            {
                _logger.LogDebug("Adding {Count} action items to MOM ID: {MomId}", 
                    createMomDto.ActionItems.Count, createdMom.Momid);
                
                var actionItemEntities = createMomDto.ActionItems.Select(ai => new Momactionitem
                {
                    Momid = createdMom.Momid,
                    TaskDescription = ai.TaskDescription,
                    AssignedToEmployeeId = ai.AssignedToEmployeeId,
                    DueDate = ai.DueDate,
                    Status = ai.Status,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                batchTasks.Add(_momRepository.AddActionItemsAsync(actionItemEntities, cancellationToken));

                // Prepare auto-sharing
                var uniqueEmployeeIds = createMomDto.ActionItems
                    .Select(ai => ai.AssignedToEmployeeId)
                    .Distinct()
                    .Where(id => id != submittedByEmployeeId)
                    .ToList();

                if (uniqueEmployeeIds.Any())
                {
                    var sharings = uniqueEmployeeIds.Select(empId => new Momsharing
                    {
                        Momid = createdMom.Momid,
                        SharedByEmployeeId = submittedByEmployeeId,
                        SharedWithEmployeeId = empId,
                        SharedAt = DateTime.UtcNow
                    }).ToList();

                    batchTasks.Add(_momRepository.ShareMomAsync(sharings, cancellationToken));
                    
                    _logger.LogDebug("Auto-sharing MOM ID: {MomId} with {Count} employee(s)", 
                        createdMom.Momid, uniqueEmployeeIds.Count);
                }
            }

            // Execute all batch operations concurrently
            if (batchTasks.Any())
            {
                await Task.WhenAll(batchTasks);
                _logger.LogDebug("Completed batch operations for MOM ID: {MomId}", createdMom.Momid);
            }

            return await GetMomByIdAsync(createdMom.Momid, cancellationToken) 
                ?? throw new Exception($"Failed to retrieve created MOM with ID {createdMom.Momid}");
        }

        public async Task<MomResponseDto?> GetMomByIdAsync(int momId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Retrieving MOM by ID: {MomId}", momId);
            var mom = await _momRepository.GetMomByIdAsync(momId, cancellationToken);
            if (mom == null) 
            {
                _logger.LogWarning("MOM with ID {MomId} not found", momId);
                return null;
            }

            return MapToMomResponseDto(mom);
        }

        public async Task<List<MomResponseDto>> GetMomsSubmittedByEmployeeAsync(
            int employeeId, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Retrieving MOMs submitted by employee ID: {EmployeeId}", employeeId);
            var moms = await _momRepository.GetMomsSubmittedByEmployeeAsync(employeeId, cancellationToken);
            _logger.LogDebug("Found {Count} MOMs submitted by employee ID: {EmployeeId}", moms.Count, employeeId);
            return moms.Select(MapToMomResponseDto).ToList();
        }

        public async Task<MomResponseDto> UpdateMomAsync(
            UpdateMomDto updateMomDto, 
            int employeeId, 
            string role, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Updating MOM ID: {MomId} by employee ID: {EmployeeId}, Role: {Role}", 
                updateMomDto.MomId, employeeId, role);

            var existingMom = await _momRepository.GetMomByIdAsync(updateMomDto.MomId, cancellationToken);
            if (existingMom == null)
            {
                _logger.LogWarning("Update failed - MOM with ID {MomId} not found", updateMomDto.MomId);
                throw new KeyNotFoundException($"MOM with ID {updateMomDto.MomId} not found");
            }

            ValidateUpdatePermissions(existingMom, employeeId, role);
            UpdateMomProperties(existingMom, updateMomDto);

            existingMom.UpdatedAt = DateTime.UtcNow;

            // Batch: Update MOM + Discussion Points + Action Items + Sharings together
            var batchTasks = new List<Task>
            {
                _momRepository.UpdateMomAsync(existingMom, cancellationToken)
            };

            if (updateMomDto.DiscussionPoints != null)
            {
                _logger.LogDebug("Updating {Count} discussion points for MOM ID: {MomId}", 
                    updateMomDto.DiscussionPoints.Count, existingMom.Momid);
                
                batchTasks.Add(_momRepository.DeleteDiscussionPointsByMomIdAsync(existingMom.Momid, cancellationToken));
                
                var discussionPointEntities = updateMomDto.DiscussionPoints.Select(dp => new Momdiscussionpoint
                {
                    Momid = existingMom.Momid,
                    PointText = dp.PointText,
                    PointOrder = dp.PointOrder
                }).ToList();

                batchTasks.Add(_momRepository.AddDiscussionPointsAsync(discussionPointEntities, cancellationToken));
            }

            if (updateMomDto.ActionItems != null)
            {
                _logger.LogDebug("Updating {Count} action items for MOM ID: {MomId}", 
                    updateMomDto.ActionItems.Count, existingMom.Momid);
                
                batchTasks.Add(_momRepository.DeleteActionItemsByMomIdAsync(existingMom.Momid, cancellationToken));
                
                var actionItemEntities = updateMomDto.ActionItems.Select(ai => new Momactionitem
                {
                    Momid = existingMom.Momid,
                    TaskDescription = ai.TaskDescription,
                    AssignedToEmployeeId = ai.AssignedToEmployeeId,
                    DueDate = ai.DueDate,
                    Status = ai.Status,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                batchTasks.Add(_momRepository.AddActionItemsAsync(actionItemEntities, cancellationToken));

                // Prepare auto-sharing
                var uniqueEmployeeIds = updateMomDto.ActionItems
                    .Select(ai => ai.AssignedToEmployeeId)
                    .Distinct()
                    .Where(id => id != employeeId)
                    .ToList();

                if (uniqueEmployeeIds.Any())
                {
                    var sharings = uniqueEmployeeIds.Select(empId => new Momsharing
                    {
                        Momid = existingMom.Momid,
                        SharedByEmployeeId = employeeId,
                        SharedWithEmployeeId = empId,
                        SharedAt = DateTime.UtcNow
                    }).ToList();

                    batchTasks.Add(_momRepository.ShareMomAsync(sharings, cancellationToken));
                }
            }

            // Execute all batch operations concurrently
            await Task.WhenAll(batchTasks);
            _logger.LogInformation("Successfully updated MOM ID: {MomId} with all related data", existingMom.Momid);

            return await GetMomByIdAsync(existingMom.Momid, cancellationToken) 
                ?? throw new Exception($"Failed to retrieve updated MOM with ID {existingMom.Momid}");
        }

        public async Task<bool> DeleteMomAsync(
            int momId, 
            int employeeId, 
            string role, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Deleting MOM ID: {MomId} by employee ID: {EmployeeId}", momId, employeeId);

            var mom = await _momRepository.GetMomByIdAsync(momId, cancellationToken);
            if (mom == null) 
            {
                _logger.LogWarning("Delete failed - MOM with ID {MomId} not found", momId);
                return false;
            }

            if (mom.SubmittedByEmployeeId != employeeId)
            {
                _logger.LogWarning("Unauthorized delete attempt - Employee ID {EmployeeId} is not the creator of MOM ID {MomId}", 
                    employeeId, momId);
                throw new UnauthorizedAccessException($"Employee {employeeId} is not authorized to delete MOM {momId}");
            }

            var result = await _momRepository.DeleteMomAsync(momId, cancellationToken);
            _logger.LogInformation("Successfully deleted MOM ID: {MomId}", momId);
            return result;
        }

        public async Task<PaginatedMomResponseDto> GetAllMomsForHRAsync(
            int hrEmployeeId,
            string role,
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("HR employee ID {EmployeeId} requesting all MOMs - Page: {PageNumber}, PageSize: {PageSize}", 
                hrEmployeeId, pageNumber, pageSize);

            var mappedRole = MapRoleToEnum(role);
            if (mappedRole != RoleHR)
            {
                _logger.LogWarning("Unauthorized access attempt - Employee ID {EmployeeId} with role '{Role}' is not HR", 
                    hrEmployeeId, role);
                throw new UnauthorizedAccessException("Only HR employees can view all MOMs");
            }

            // Batch: Get count and data in parallel
            var countTask = _momRepository.GetAllMomsCountAsync(
                searchTerm, meetingType, departmentId, startDate, endDate, cancellationToken);

            var momsTask = _momRepository.GetAllMomsAsync(
                searchTerm, meetingType, departmentId, startDate, endDate, pageNumber, pageSize, cancellationToken);

            await Task.WhenAll(countTask, momsTask);

            var totalCount = await countTask;
            var moms = await momsTask;
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            _logger.LogInformation("Retrieved {Count} MOMs for HR employee ID {EmployeeId} (Page {PageNumber}/{TotalPages})", 
                moms.Count, hrEmployeeId, pageNumber, totalPages);

            return new PaginatedMomResponseDto
            {
                Moms = moms.Select(MapToMomResponseDto).ToList(),
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = totalPages,
                HasPreviousPage = pageNumber > 1,
                HasNextPage = pageNumber < totalPages
            };
        }

        public async Task<List<MomSharingResponseDto>> ShareMomAsync(
            ShareMomDto shareMomDto, 
            int sharedByEmployeeId, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Sharing MOM ID: {MomId} by employee ID: {EmployeeId} with {Count} employees", 
                shareMomDto.MomId, sharedByEmployeeId, shareMomDto.SharedWithEmployeeIds.Count);

            var mom = await _momRepository.GetMomByIdAsync(shareMomDto.MomId, cancellationToken);
            if (mom == null)
            {
                _logger.LogWarning("Share failed - MOM with ID {MomId} not found", shareMomDto.MomId);
                throw new KeyNotFoundException($"MOM with ID {shareMomDto.MomId} not found");
            }

            var sharings = shareMomDto.SharedWithEmployeeIds.Select(empId => new Momsharing
            {
                Momid = shareMomDto.MomId,
                SharedByEmployeeId = sharedByEmployeeId,
                SharedWithEmployeeId = empId,
                SharedAt = DateTime.UtcNow
            }).ToList();

            var createdSharings = await _momRepository.ShareMomAsync(sharings, cancellationToken);
            var sharingIds = createdSharings.Select(s => s.SharingId).ToList();
            var completeSharings = await _momRepository.GetMomSharingsByEmployeeIdAsync(sharedByEmployeeId, cancellationToken);

            _logger.LogInformation("Successfully shared MOM ID: {MomId} with {Count} employees", 
                shareMomDto.MomId, createdSharings.Count);

            return completeSharings
                .Where(s => sharingIds.Contains(s.SharingId))
                .Select(MapToMomSharingResponseDto)
                .ToList();
        }

        public async Task<List<MomSharingResponseDto>> GetMomsSharedByEmployeeAsync(
            int employeeId, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Retrieving MOMs shared by employee ID: {EmployeeId}", employeeId);
            var sharings = await _momRepository.GetMomSharingsByEmployeeIdAsync(employeeId, cancellationToken);
            _logger.LogDebug("Found {Count} sharing records for employee ID: {EmployeeId}", sharings.Count, employeeId);
            return sharings.Select(MapToMomSharingResponseDto).ToList();
        }

        public async Task<List<MomResponseDto>> GetMomsSharedWithEmployeeAsync(
            int employeeId, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Retrieving MOMs shared with employee ID: {EmployeeId}", employeeId);
            var moms = await _momRepository.GetMomsSharedWithEmployeeAsync(employeeId, cancellationToken);
            _logger.LogDebug("Found {Count} MOMs shared with employee ID: {EmployeeId}", moms.Count, employeeId);
            return moms.Select(MapToMomResponseDto).ToList();
        }

        public async Task<bool> UpdateActionItemStatusAsync(
            int actionItemId, 
            string status, 
            int employeeId, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Updating action item ID: {ActionItemId} to status '{Status}' by employee ID: {EmployeeId}", 
                actionItemId, status, employeeId);

            var actionItem = await _momRepository.GetActionItemByIdAsync(actionItemId, cancellationToken);
            if (actionItem == null)
            {
                _logger.LogWarning("Action item with ID {ActionItemId} not found", actionItemId);
                throw new KeyNotFoundException($"Action item with ID {actionItemId} not found");
            }

            if (actionItem.AssignedToEmployeeId != employeeId)
            {
                _logger.LogWarning("Unauthorized update attempt - Employee ID {EmployeeId} is not assigned to action item ID {ActionItemId}", 
                    employeeId, actionItemId);
                throw new UnauthorizedAccessException(
                    $"Employee {employeeId} can only update action items assigned to them");
            }

            if (status != StatusPending && status != StatusCompleted)
            {
                _logger.LogWarning("Invalid status '{Status}' provided for action item ID {ActionItemId}", status, actionItemId);
                throw new ArgumentException(
                    $"Invalid status '{status}'. Must be '{StatusPending}' or '{StatusCompleted}'", 
                    nameof(status));
            }

            var updated = await _momRepository.UpdateActionItemStatusAsync(actionItemId, status, cancellationToken);
            _logger.LogInformation("Successfully updated action item ID: {ActionItemId} to status '{Status}'", 
                actionItemId, status);
            return updated != null;
        }

        public async Task<List<ActionItemResponseDto>> GetMyActionItemsAsync(
            int employeeId, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Retrieving action items assigned to employee ID: {EmployeeId}", employeeId);

            var actionItems = await _momRepository.GetActionItemsByEmployeeIdAsync(employeeId, cancellationToken);

            _logger.LogInformation("Retrieved {Count} action items for employee ID: {EmployeeId}", 
                actionItems.Count, employeeId);

            return actionItems.Select(ai => new ActionItemResponseDto
            {
                ActionItemId = ai.ActionItemId,
                TaskDescription = ai.TaskDescription,
                AssignedToEmployeeId = ai.AssignedToEmployeeId,
                AssignedToEmployeeName = GetEmployeeName(ai.AssignedToEmployee),
                DueDate = ai.DueDate,
                Status = ai.Status,
                CreatedAt = ai.CreatedAt,
                MeetingTitle = ai.Mom?.MeetingTitle ?? "N/A",
                MomId = ai.Momid,
                AssignedByEmployeeId = ai.Mom?.SubmittedByEmployeeId,
                AssignedByEmployeeName = ai.Mom?.SubmittedByEmployee != null
                    ? GetEmployeeName(ai.Mom.SubmittedByEmployee)
                    : null
            }).ToList();
        }

        public async Task<List<ActionItemResponseDto>> GetActionItemsAssignedByMeAsync(
            int employeeId, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Retrieving action items assigned by employee ID: {EmployeeId}", employeeId);

            var actionItems = await _momRepository.GetActionItemsAssignedByEmployeeAsync(employeeId, cancellationToken);
            
            _logger.LogInformation("Retrieved {Count} action items assigned by employee ID: {EmployeeId}", 
                actionItems.Count, employeeId);

            return actionItems.Select(ai => new ActionItemResponseDto
            {
                ActionItemId = ai.ActionItemId,
                TaskDescription = ai.TaskDescription,
                AssignedToEmployeeId = ai.AssignedToEmployeeId,
                AssignedToEmployeeName = GetEmployeeName(ai.AssignedToEmployee),
                DueDate = ai.DueDate,
                Status = ai.Status,
                CreatedAt = ai.CreatedAt,
                MeetingTitle = ai.Mom?.MeetingTitle ?? "N/A",
                MomId = ai.Momid,
                AssignedByEmployeeId = ai.Mom?.SubmittedByEmployeeId,
                AssignedByEmployeeName = ai.Mom?.SubmittedByEmployee != null
                    ? GetEmployeeName(ai.Mom.SubmittedByEmployee)
                    : null
            }).ToList();
        }

        public async Task<List<ActionItemResponseDto>> GetOverdueActionItemsAsync(
            int employeeId, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Retrieving overdue action items for employee ID: {EmployeeId}", employeeId);

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var actionItems = await _momRepository.GetActionItemsByEmployeeIdAsync(employeeId, cancellationToken);

            var overdueItems = actionItems
                .Where(ai => ai.Status != StatusCompleted && ai.DueDate < today)
                .Select(ai => new ActionItemResponseDto
                {
                    ActionItemId = ai.ActionItemId,
                    TaskDescription = ai.TaskDescription,
                    AssignedToEmployeeId = ai.AssignedToEmployeeId,
                    AssignedToEmployeeName = GetEmployeeName(ai.AssignedToEmployee),
                    DueDate = ai.DueDate,
                    Status = ai.Status,
                    CreatedAt = ai.CreatedAt,
                    MeetingTitle = ai.Mom?.MeetingTitle ?? "N/A",
                    MomId = ai.Momid,
                    AssignedByEmployeeId = ai.Mom?.SubmittedByEmployeeId,
                    AssignedByEmployeeName = ai.Mom?.SubmittedByEmployee != null
                        ? GetEmployeeName(ai.Mom.SubmittedByEmployee)
                        : null
                })
                .ToList();

            _logger.LogInformation("Found {Count} overdue action items for employee ID: {EmployeeId}", 
                overdueItems.Count, employeeId);

            return overdueItems;
        }

        #region Private Helper Methods

        private void ValidateCreateMomDto(CreateMomDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.MeetingTitle))
            {
                _logger.LogWarning("Validation failed - Meeting title is required");
                throw new ArgumentException("Meeting title is required", nameof(dto.MeetingTitle));
            }

            if (string.IsNullOrWhiteSpace(dto.MeetingType))
            {
                _logger.LogWarning("Validation failed - Meeting type is required");
                throw new ArgumentException("Meeting type is required", nameof(dto.MeetingType));
            }

            if (dto.MeetingDate < DateTime.UtcNow.AddYears(-MaxPastMeetingYears))
            {
                _logger.LogWarning("Validation failed - Meeting date {MeetingDate} is more than {Years} year(s) in the past", 
                    dto.MeetingDate, MaxPastMeetingYears);
                throw new ArgumentException(
                    $"Meeting date cannot be more than {MaxPastMeetingYears} year(s) in the past", 
                    nameof(dto.MeetingDate));
            }

            if (dto.DiscussionPoints != null && dto.DiscussionPoints.Count > MaxDiscussionPoints)
            {
                _logger.LogWarning("Validation failed - {Count} discussion points exceeds maximum of {Max}", 
                    dto.DiscussionPoints.Count, MaxDiscussionPoints);
                throw new ArgumentException(
                    $"Maximum {MaxDiscussionPoints} discussion points allowed", 
                    nameof(dto.DiscussionPoints));
            }

            if (dto.ActionItems != null && dto.ActionItems.Count > MaxActionItems)
            {
                _logger.LogWarning("Validation failed - {Count} action items exceeds maximum of {Max}", 
                    dto.ActionItems.Count, MaxActionItems);
                throw new ArgumentException(
                    $"Maximum {MaxActionItems} action items allowed", 
                    nameof(dto.ActionItems));
            }
        }

        private void ValidateUpdatePermissions(Mom existingMom, int employeeId, string role)
        {
            var mappedRole = MapRoleToEnum(role);

            if (mappedRole != RoleManager)
            {
                _logger.LogWarning("Update validation failed - Employee ID {EmployeeId} with role '{Role}' is not a manager", 
                    employeeId, role);
                throw new UnauthorizedAccessException("Only managers can edit MOMs");
            }

            if (existingMom.SubmittedByEmployeeId != employeeId)
            {
                _logger.LogWarning("Update validation failed - Manager ID {EmployeeId} is not the creator of MOM ID {MomId}", 
                    employeeId, existingMom.Momid);
                throw new UnauthorizedAccessException(
                    $"Manager {employeeId} can only edit their own MOMs");
            }

            if (existingMom.IsEditable != true)
            {
                _logger.LogWarning("Update validation failed - MOM ID {MomId} is no longer editable", existingMom.Momid);
                throw new UnauthorizedAccessException(
                    $"MOM {existingMom.Momid} is no longer editable");
            }
        }

        private void UpdateMomProperties(Mom existingMom, UpdateMomDto updateMomDto)
        {
            if (!string.IsNullOrEmpty(updateMomDto.MeetingTitle))
                existingMom.MeetingTitle = updateMomDto.MeetingTitle;

            if (!string.IsNullOrEmpty(updateMomDto.MeetingType))
                existingMom.MeetingType = updateMomDto.MeetingType;

            if (updateMomDto.MeetingDate.HasValue)
                existingMom.MeetingDate = updateMomDto.MeetingDate.Value;

            if (!string.IsNullOrEmpty(updateMomDto.MeetingLink))
                existingMom.MeetingLink = updateMomDto.MeetingLink;

            if (!string.IsNullOrEmpty(updateMomDto.Attendees))
                existingMom.Attendees = updateMomDto.Attendees;

            if (!string.IsNullOrEmpty(updateMomDto.CommentsObservations))
                existingMom.CommentsObservations = updateMomDto.CommentsObservations;
        }

        private string MapRoleToEnum(string role)
        {
            if (string.IsNullOrWhiteSpace(role))
                return RoleEmployee;

            var roleMapping = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "User", RoleEmployee },
                { "Employee", RoleEmployee },
                { "Staff", RoleEmployee },
                { "Developer", RoleEmployee },
                { "Engineer", RoleEmployee },
                { "Analyst", RoleEmployee },
                { "Designer", RoleEmployee },
                { "Consultant", RoleEmployee },
                { "Associate", RoleEmployee },
                { "Manager", RoleManager },
                { "Engineering Manager", RoleManager },
                { "Department Manager", RoleManager },
                { "Team Lead", RoleManager },
                { "Project Manager", RoleManager },
                { "Senior Manager", RoleManager },
                { "Director", RoleManager },
                { "VP", RoleManager },
                { "Vice President", RoleManager },
                { "Lead", RoleManager },
                { "HR", RoleHR },
                { "HR Manager", RoleHR },
                { "Human Resources", RoleHR },
                { "HR Admin", RoleHR },
                { "HR Director", RoleHR },
                { "HRBP", RoleHR },
                { "HR Business Partner", RoleHR }
            };

            if (roleMapping.TryGetValue(role, out string? mappedRole))
                return mappedRole;

            var roleLower = role.ToLowerInvariant();
            
            if (roleLower.Contains("manager") || roleLower.Contains("lead") || 
                roleLower.Contains("director") || roleLower.Contains("vp"))
                return RoleManager;

            if (roleLower.Contains("hr") || roleLower.Contains("human resource"))
                return RoleHR;

            return RoleEmployee;
        }

        private MomResponseDto MapToMomResponseDto(Mom mom)
        {
            return new MomResponseDto
            {
                MomId = mom.Momid,
                MeetingId = mom.MeetingId,
                MeetingTitle = mom.MeetingTitle,
                MeetingType = mom.MeetingType,
                MeetingDate = mom.MeetingDate,
                MeetingLink = mom.MeetingLink,
                Attendees = mom.Attendees,
                CommentsObservations = mom.CommentsObservations,
                SubmittedByEmployeeId = mom.SubmittedByEmployeeId,
                SubmittedByEmployeeName = GetEmployeeName(mom.SubmittedByEmployee),
                SubmittedByRole = mom.SubmittedByRole,
                IsEditable = mom.IsEditable ?? false,
                CreatedAt = mom.CreatedAt,
                UpdatedAt = mom.UpdatedAt,
                DiscussionPoints = mom.Momdiscussionpoints?
                    .Select(dp => new DiscussionPointResponseDto
                    {
                        PointId = dp.PointId,
                        PointText = dp.PointText,
                        PointOrder = dp.PointOrder
                    })
                    .OrderBy(dp => dp.PointOrder)
                    .ToList() ?? new List<DiscussionPointResponseDto>(),
                ActionItems = mom.Momactionitems?
                    .Select(ai => new ActionItemResponseDto
                    {
                        ActionItemId = ai.ActionItemId,
                        TaskDescription = ai.TaskDescription,
                        AssignedToEmployeeId = ai.AssignedToEmployeeId,
                        AssignedToEmployeeName = GetEmployeeName(ai.AssignedToEmployee),
                        DueDate = ai.DueDate,
                        Status = ai.Status,
                        CreatedAt = ai.CreatedAt,
                        MeetingTitle = mom.MeetingTitle,
                        MomId = mom.Momid,
                        AssignedByEmployeeId = mom.SubmittedByEmployeeId,
                        AssignedByEmployeeName = GetEmployeeName(mom.SubmittedByEmployee)
                    })
                    .ToList() ?? new List<ActionItemResponseDto>()
            };
        }

        private MomSharingResponseDto MapToMomSharingResponseDto(Momsharing sharing)
        {
            return new MomSharingResponseDto
            {
                SharingId = sharing.SharingId,
                MomId = sharing.Momid,
                MeetingTitle = sharing.Mom.MeetingTitle,
                SharedByEmployeeId = sharing.SharedByEmployeeId,
                SharedByEmployeeName = GetEmployeeName(sharing.SharedByEmployee),
                SharedWithEmployeeId = sharing.SharedWithEmployeeId,
                SharedWithEmployeeName = GetEmployeeName(sharing.SharedWithEmployee),
                SharedAt = sharing.SharedAt
            };
        }

        private string GetEmployeeName(Employee? employee)
        {
            if (employee?.Userprofile == null)
                return "Unknown";

            var firstName = employee.Userprofile.FirstName ?? string.Empty;
            var lastName = employee.Userprofile.LastName ?? string.Empty;
            var fullName = $"{firstName} {lastName}".Trim();

            return string.IsNullOrWhiteSpace(fullName) ? "Unknown" : fullName;
        }

        #endregion
    }
}

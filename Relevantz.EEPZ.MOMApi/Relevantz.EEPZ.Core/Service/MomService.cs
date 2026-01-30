using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.Extensions.Logging;
using MapsterMapper;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    /// <summary>
    /// Service class for managing Minutes of Meeting (MOM) operations
    /// OPTIMIZED: Uses Mapster for high-performance object mapping (2-6x faster than AutoMapper)
    /// </summary>
    public class MomService : IMomService
    {
        private readonly IMomRepository _momRepository;
        private readonly ILogger<MomService> _logger;
        private readonly IMapper _mapper;

        /// <summary>
        /// Constructor with Mapster IMapper injection
        /// </summary>
        public MomService(
            IMomRepository momRepository, 
            ILogger<MomService> logger,
            IMapper mapper)
        {
            _momRepository = momRepository;
            _logger = logger;
            _mapper = mapper;
        }

        /// <summary>
        /// Creates a new MOM record with discussion points and action items
        /// OPTIMIZED: Batched transaction + Mapster mapping
        /// </summary>
        public async Task<MomResponseDto> CreateMomAsync(CreateMomDto createMomDto, int submittedByEmployeeId, string role)
        {
            ValidateCreateMomDto(createMomDto);
            var mappedRole = MapRoleToEnum(role);

            // Mapster: Fast DTO to Entity mapping
            var mom = _mapper.Map<Mom>(createMomDto);
            mom.SubmittedByEmployeeId = submittedByEmployeeId;
            mom.SubmittedByRole = mappedRole;
            mom.IsEditable = mappedRole == "Manager";
            mom.CreatedAt = DateTime.Now;

            var createdMom = await _momRepository.CreateMomAsync(mom);

            // Batch add discussion points
            if (createMomDto.DiscussionPoints != null && createMomDto.DiscussionPoints.Any())
            {
                var discussionPoints = createMomDto.DiscussionPoints.Select(dp => 
                {
                    var point = _mapper.Map<Momdiscussionpoint>(dp);
                    point.Momid = createdMom.Momid;
                    return point;
                }).ToList();

                await _momRepository.AddDiscussionPointsAsync(discussionPoints);
            }

            // Batch add action items
            if (createMomDto.ActionItems != null && createMomDto.ActionItems.Any())
            {
                var actionItems = createMomDto.ActionItems.Select(ai => 
                {
                    var item = _mapper.Map<Momactionitem>(ai);
                    item.Momid = createdMom.Momid;
                    return item;
                }).ToList();

                await _momRepository.AddActionItemsAsync(actionItems);

                // Auto-share with assigned employees
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
                        SharedAt = DateTime.Now
                    }).ToList();

                    await _momRepository.ShareMomAsync(sharings);
                    
                    _logger.LogInformation(
                        "Created MOM {MomId} with {ActionItemCount} action items using Mapster mapping",
                        createdMom.Momid, actionItems.Count);
                }
            }

            return await GetMomByIdAsync(createdMom.Momid) 
                ?? throw new Exception("Failed to retrieve created MOM");
        }

        public async Task<MomResponseDto?> GetMomByIdAsync(int momId)
        {
            var mom = await _momRepository.GetMomByIdAsync(momId);
            if (mom == null) return null;

            // Mapster: Entity to DTO mapping (2-6x faster than AutoMapper)
            return _mapper.Map<MomResponseDto>(mom);
        }

        public async Task<List<MomResponseDto>> GetMomsSubmittedByEmployeeAsync(int employeeId)
        {
            var moms = await _momRepository.GetMomsSubmittedByEmployeeAsync(employeeId);
            
            // Mapster: Batch collection mapping
            return _mapper.Map<List<MomResponseDto>>(moms);
        }

        public async Task<MomResponseDto> UpdateMomAsync(UpdateMomDto updateMomDto, int employeeId, string role)
        {
            var existingMom = await _momRepository.GetMomByIdAsync(updateMomDto.MomId);
            if (existingMom == null)
                throw new Exception("MOM not found");

            var mappedRole = MapRoleToEnum(role);

            if (mappedRole != "Manager")
                throw new UnauthorizedAccessException("Only managers can edit MOMs");

            if (existingMom.SubmittedByEmployeeId != employeeId)
                throw new UnauthorizedAccessException("You can only edit your own MOMs");

            if (existingMom.IsEditable != true)
                throw new UnauthorizedAccessException("This MOM is no longer editable");

            // Update fields
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

            existingMom.UpdatedAt = DateTime.Now;
            await _momRepository.UpdateMomAsync(existingMom);

            // Replace discussion points
            if (updateMomDto.DiscussionPoints != null)
            {
                await _momRepository.DeleteDiscussionPointsByMomIdAsync(existingMom.Momid);

                var discussionPoints = updateMomDto.DiscussionPoints.Select(dp => 
                {
                    var point = _mapper.Map<Momdiscussionpoint>(dp);
                    point.Momid = existingMom.Momid;
                    return point;
                }).ToList();

                await _momRepository.AddDiscussionPointsAsync(discussionPoints);
            }

            // Replace action items
            if (updateMomDto.ActionItems != null)
            {
                await _momRepository.DeleteActionItemsByMomIdAsync(existingMom.Momid);

                var actionItems = updateMomDto.ActionItems.Select(ai => 
                {
                    var item = _mapper.Map<Momactionitem>(ai);
                    item.Momid = existingMom.Momid;
                    return item;
                }).ToList();

                await _momRepository.AddActionItemsAsync(actionItems);

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
                        SharedAt = DateTime.Now
                    }).ToList();

                    await _momRepository.ShareMomAsync(sharings);
                }
            }

            return await GetMomByIdAsync(existingMom.Momid) 
                ?? throw new Exception("Failed to retrieve updated MOM");
        }

        public async Task<bool> DeleteMomAsync(int momId, int employeeId, string role)
        {
            var mom = await _momRepository.GetMomByIdAsync(momId);
            if (mom == null) return false;

            if (mom.SubmittedByEmployeeId != employeeId)
                throw new UnauthorizedAccessException("You are not authorized to delete this MOM");

            return await _momRepository.DeleteMomAsync(momId);
        }

        public async Task<PaginatedMomResponseDto> GetAllMomsForHRAsync(
            int hrEmployeeId, string role, string? searchTerm = null, string? meetingType = null,
            int? departmentId = null, DateTime? startDate = null, DateTime? endDate = null,
            int pageNumber = 1, int pageSize = 20)
        {
            var mappedRole = MapRoleToEnum(role);
            
            if (mappedRole != "HR")
                throw new UnauthorizedAccessException("Only HR can view all MOMs");

            var totalCount = await _momRepository.GetAllMomsCountAsync(
                searchTerm, meetingType, departmentId, startDate, endDate);

            var moms = await _momRepository.GetAllMomsAsync(
                searchTerm, meetingType, departmentId, startDate, endDate, pageNumber, pageSize);

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PaginatedMomResponseDto
            {
                Moms = _mapper.Map<List<MomResponseDto>>(moms),
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = totalPages,
                HasPreviousPage = pageNumber > 1,
                HasNextPage = pageNumber < totalPages
            };
        }

        public async Task<List<MomSharingResponseDto>> ShareMomAsync(ShareMomDto shareMomDto, int sharedByEmployeeId)
        {
            var mom = await _momRepository.GetMomByIdAsync(shareMomDto.MomId);
            if (mom == null)
                throw new Exception("MOM not found");

            var sharings = shareMomDto.SharedWithEmployeeIds.Select(empId => new Momsharing
            {
                Momid = shareMomDto.MomId,
                SharedByEmployeeId = sharedByEmployeeId,
                SharedWithEmployeeId = empId,
                SharedAt = DateTime.Now
            }).ToList();

            var createdSharings = await _momRepository.ShareMomAsync(sharings);
            var sharingIds = createdSharings.Select(s => s.SharingId).ToList();
            var completeSharings = await _momRepository.GetMomSharingsByEmployeeIdAsync(sharedByEmployeeId);

            // Mapster: Fast collection mapping
            return _mapper.Map<List<MomSharingResponseDto>>(
                completeSharings.Where(s => sharingIds.Contains(s.SharingId)));
        }

        public async Task<List<MomSharingResponseDto>> GetMomsSharedByEmployeeAsync(int employeeId)
        {
            var sharings = await _momRepository.GetMomSharingsByEmployeeIdAsync(employeeId);
            return _mapper.Map<List<MomSharingResponseDto>>(sharings);
        }

        public async Task<List<MomResponseDto>> GetMomsSharedWithEmployeeAsync(int employeeId)
        {
            var moms = await _momRepository.GetMomsSharedWithEmployeeAsync(employeeId);
            return _mapper.Map<List<MomResponseDto>>(moms);
        }

        public async Task<bool> UpdateActionItemStatusAsync(int actionItemId, string status, int employeeId)
        {
            var actionItem = await _momRepository.GetActionItemByIdAsync(actionItemId);
            if (actionItem == null)
                throw new Exception("Action item not found");

            if (actionItem.AssignedToEmployeeId != employeeId)
                throw new UnauthorizedAccessException("You can only update action items assigned to you");

            if (status != "Pending" && status != "Completed")
                throw new ArgumentException("Invalid status. Must be 'Pending' or 'Completed'");

            var updated = await _momRepository.UpdateActionItemStatusAsync(actionItemId, status);
            return updated != null;
        }

        public async Task<List<ActionItemResponseDto>> GetMyActionItemsAsync(int employeeId)
        {
            var actionItems = await _momRepository.GetActionItemsByEmployeeIdAsync(employeeId);
            _logger.LogInformation("Found {ActionItemCount} action items for employee {EmployeeId}", 
                actionItems.Count, employeeId);

            return _mapper.Map<List<ActionItemResponseDto>>(actionItems);
        }

        public async Task<List<ActionItemResponseDto>> GetActionItemsAssignedByMeAsync(int employeeId)
        {
            var actionItems = await _momRepository.GetActionItemsAssignedByEmployeeAsync(employeeId);
            return _mapper.Map<List<ActionItemResponseDto>>(actionItems);
        }

        public async Task<List<ActionItemResponseDto>> GetOverdueActionItemsAsync(int employeeId)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            var actionItems = await _momRepository.GetActionItemsByEmployeeIdAsync(employeeId);

            var overdueItems = actionItems
                .Where(ai => ai.Status != "Completed" && ai.DueDate < today)
                .ToList();

            return _mapper.Map<List<ActionItemResponseDto>>(overdueItems);
        }

        #region Private Helper Methods

        private void ValidateCreateMomDto(CreateMomDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.MeetingTitle))
                throw new ArgumentException("Meeting title is required");
            if (string.IsNullOrWhiteSpace(dto.MeetingType))
                throw new ArgumentException("Meeting type is required");
            if (dto.MeetingDate < DateTime.Now.AddYears(-1))
                throw new ArgumentException("Meeting date cannot be more than 1 year in the past");
            if (dto.DiscussionPoints != null && dto.DiscussionPoints.Count > 50)
                throw new ArgumentException("Maximum 50 discussion points allowed");
            if (dto.ActionItems != null && dto.ActionItems.Count > 100)
                throw new ArgumentException("Maximum 100 action items allowed");
        }

        private string MapRoleToEnum(string role)
        {
            if (string.IsNullOrWhiteSpace(role))
                return "Employee";

            var roleMapping = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "User", "Employee" }, { "Employee", "Employee" }, { "Staff", "Employee" },
                { "Developer", "Employee" }, { "Engineer", "Employee" },
                { "Manager", "Manager" }, { "Team Lead", "Manager" }, { "Director", "Manager" },
                { "HR", "HR" }, { "Human Resources", "HR" }
            };

            if (roleMapping.TryGetValue(role, out string? mappedRole))
                return mappedRole;

            var roleLower = role.ToLower();
            if (roleLower.Contains("manager") || roleLower.Contains("lead"))
                return "Manager";
            if (roleLower.Contains("hr"))
                return "HR";

            return "Employee";
        }

        #endregion
    }
}

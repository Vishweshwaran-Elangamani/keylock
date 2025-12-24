using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class MomService : IMomService
    {
        private readonly IMomRepository _momRepository;

        public MomService(IMomRepository momRepository)
        {
            _momRepository = momRepository;
        }

        public async Task<MomResponseDto> CreateMomAsync(CreateMomDto createMomDto, int submittedByEmployeeId, string role)
        {
            ValidateCreateMomDto(createMomDto);

            var mappedRole = MapRoleToEnum(role);

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
                IsEditable = mappedRole == "Manager", 
                CreatedAt = DateTime.Now
            };

            var createdMom = await _momRepository.CreateMomAsync(mom);

            if (createMomDto.DiscussionPoints != null && createMomDto.DiscussionPoints.Any())
            {
                var discussionPoints = createMomDto.DiscussionPoints.Select(dp => new Momdiscussionpoint
                {
                    Momid = createdMom.Momid,
                    PointText = dp.PointText,
                    PointOrder = dp.PointOrder
                }).ToList();

                await _momRepository.AddDiscussionPointsAsync(discussionPoints);
            }

            if (createMomDto.ActionItems != null && createMomDto.ActionItems.Any())
            {
                var actionItems = createMomDto.ActionItems.Select(ai => new Momactionitem
                {
                    Momid = createdMom.Momid,
                    TaskDescription = ai.TaskDescription,
                    AssignedToEmployeeId = ai.AssignedToEmployeeId,
                    DueDate = ai.DueDate,
                    Status = ai.Status,
                    CreatedAt = DateTime.Now
                }).ToList();

                await _momRepository.AddActionItemsAsync(actionItems);

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
                    Console.WriteLine($" Auto-shared MOM {createdMom.Momid} '{createdMom.MeetingTitle}' with {uniqueEmployeeIds.Count} employees");
                }
            }

            return await GetMomByIdAsync(createdMom.Momid) ?? throw new Exception("Failed to retrieve created MOM");
        }

        public async Task<MomResponseDto?> GetMomByIdAsync(int momId)
        {
            var mom = await _momRepository.GetMomByIdAsync(momId);
            if (mom == null) return null;

            return MapToMomResponseDto(mom);
        }

        public async Task<List<MomResponseDto>> GetMomsSubmittedByEmployeeAsync(int employeeId)
        {
            var moms = await _momRepository.GetMomsSubmittedByEmployeeAsync(employeeId);
            return moms.Select(MapToMomResponseDto).ToList();
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

            if (updateMomDto.DiscussionPoints != null)
            {
                await _momRepository.DeleteDiscussionPointsByMomIdAsync(existingMom.Momid);

                var discussionPoints = updateMomDto.DiscussionPoints.Select(dp => new Momdiscussionpoint
                {
                    Momid = existingMom.Momid,
                    PointText = dp.PointText,
                    PointOrder = dp.PointOrder
                }).ToList();

                await _momRepository.AddDiscussionPointsAsync(discussionPoints);
            }

            if (updateMomDto.ActionItems != null)
            {
                await _momRepository.DeleteActionItemsByMomIdAsync(existingMom.Momid);

                var actionItems = updateMomDto.ActionItems.Select(ai => new Momactionitem
                {
                    Momid = existingMom.Momid,
                    TaskDescription = ai.TaskDescription,
                    AssignedToEmployeeId = ai.AssignedToEmployeeId,
                    DueDate = ai.DueDate,
                    Status = ai.Status,
                    CreatedAt = DateTime.Now
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
                    Console.WriteLine($" Auto-shared updated MOM {existingMom.Momid} with {uniqueEmployeeIds.Count} employees");
                }
            }

            return await GetMomByIdAsync(existingMom.Momid) ?? throw new Exception("Failed to retrieve updated MOM");
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
            int hrEmployeeId,
            string role,
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 20)
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
                Moms = moms.Select(MapToMomResponseDto).ToList(),
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

            return completeSharings
                .Where(s => sharingIds.Contains(s.SharingId))
                .Select(s => new MomSharingResponseDto
                {
                    SharingId = s.SharingId,
                    MomId = s.Momid,
                    MeetingTitle = s.Mom.MeetingTitle,
                    SharedByEmployeeId = s.SharedByEmployeeId,
                    SharedByEmployeeName = GetEmployeeName(s.SharedByEmployee),
                    SharedWithEmployeeId = s.SharedWithEmployeeId,
                    SharedWithEmployeeName = GetEmployeeName(s.SharedWithEmployee),
                    SharedAt = s.SharedAt
                }).ToList();
        }

        public async Task<List<MomSharingResponseDto>> GetMomsSharedByEmployeeAsync(int employeeId)
        {
            var sharings = await _momRepository.GetMomSharingsByEmployeeIdAsync(employeeId);

            return sharings.Select(s => new MomSharingResponseDto
            {
                SharingId = s.SharingId,
                MomId = s.Momid,
                MeetingTitle = s.Mom.MeetingTitle,
                SharedByEmployeeId = s.SharedByEmployeeId,
                SharedByEmployeeName = GetEmployeeName(s.SharedByEmployee),
                SharedWithEmployeeId = s.SharedWithEmployeeId,
                SharedWithEmployeeName = GetEmployeeName(s.SharedWithEmployee),
                SharedAt = s.SharedAt
            }).ToList();
        }

        public async Task<List<MomResponseDto>> GetMomsSharedWithEmployeeAsync(int employeeId)
        {
            var moms = await _momRepository.GetMomsSharedWithEmployeeAsync(employeeId);
            return moms.Select(MapToMomResponseDto).ToList();
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
            
            Console.WriteLine($"[SERVICE] Found {actionItems.Count} action items for employee {employeeId}");
            
            var result = actionItems.Select(ai => {
                var meetingTitle = ai.Mom?.MeetingTitle ?? "N/A";
                Console.WriteLine($"[SERVICE] Action Item {ai.ActionItemId}: Meeting Title = '{meetingTitle}', MomId = {ai.Momid}");
                
                return new ActionItemResponseDto
                {
                    ActionItemId = ai.ActionItemId,
                    TaskDescription = ai.TaskDescription,
                    AssignedToEmployeeId = ai.AssignedToEmployeeId,
                    AssignedToEmployeeName = GetEmployeeName(ai.AssignedToEmployee),
                    DueDate = ai.DueDate,
                    Status = ai.Status,
                    CreatedAt = ai.CreatedAt,
                    MeetingTitle = meetingTitle,
                    MomId = ai.Momid,
                    AssignedByEmployeeId = ai.Mom?.SubmittedByEmployeeId,
                    AssignedByEmployeeName = ai.Mom?.SubmittedByEmployee != null 
                        ? GetEmployeeName(ai.Mom.SubmittedByEmployee) 
                        : null
                };
            }).ToList();
            
            Console.WriteLine($"[SERVICE] Returning {result.Count} action items");
            return result;
        }

        public async Task<List<ActionItemResponseDto>> GetActionItemsAssignedByMeAsync(int employeeId)
        {
            var actionItems = await _momRepository.GetActionItemsAssignedByEmployeeAsync(employeeId);
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

        public async Task<List<ActionItemResponseDto>> GetOverdueActionItemsAsync(int employeeId)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            var actionItems = await _momRepository.GetActionItemsByEmployeeIdAsync(employeeId);

            var overdueItems = actionItems
                .Where(ai => ai.Status != "Completed" && ai.DueDate < today)
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
                }).ToList();

            return overdueItems;
        }

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
                { "User", "Employee" },
                { "Employee", "Employee" },
                { "Staff", "Employee" },
                { "Developer", "Employee" },
                { "Engineer", "Employee" },
                { "Analyst", "Employee" },
                { "Designer", "Employee" },
                
                { "Manager", "Manager" },
                { "Engineering Manager", "Manager" },
                { "Department Manager", "Manager" },
                { "Team Lead", "Manager" },
                { "Project Manager", "Manager" },
                { "Senior Manager", "Manager" },
                { "Director", "Manager" },
                { "VP", "Manager" },
                
                { "HR", "HR" },
                { "HR Manager", "HR" },
                { "Human Resources", "HR" },
                { "HR Admin", "HR" },
                { "HR Director", "HR" }
            };

            if (roleMapping.TryGetValue(role, out string? mappedRole))
            {
                return mappedRole;
            }

            var roleLower = role.ToLower();
            if (roleLower.Contains("manager") || roleLower.Contains("lead") || roleLower.Contains("director"))
            {
                return "Manager";
            }

            if (roleLower.Contains("hr") || roleLower.Contains("human resource"))
            {
                return "HR";
            }

            return "Employee";
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
                DiscussionPoints = mom.Momdiscussionpoints?.Select(dp => new DiscussionPointResponseDto
                {
                    PointId = dp.PointId,
                    PointText = dp.PointText,
                    PointOrder = dp.PointOrder
                }).OrderBy(dp => dp.PointOrder).ToList() ?? new List<DiscussionPointResponseDto>(),
                ActionItems = mom.Momactionitems?.Select(ai => new ActionItemResponseDto
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
                }).ToList() ?? new List<ActionItemResponseDto>()
            };
        }

        private MeetingResponseDto MapToMeetingResponseDto(Meeting meeting)
        {
            return new MeetingResponseDto
            {
                MeetingId = meeting.MeetingId,
                MeetingTitle = meeting.MeetingTitle,
                MeetingType = meeting.MeetingType,
                MeetingDate = meeting.MeetingDate,
                MeetingLink = meeting.MeetingLink,
                Agenda = meeting.Agenda,
                ScheduledByEmployeeId = meeting.ScheduledByEmployeeId,
                ScheduledByEmployeeName = GetEmployeeName(meeting.ScheduledByEmployee),
                Status = meeting.Status,
                CreatedAt = meeting.CreatedAt,
                Participants = meeting.Meetingparticipants?.Select(mp => new MeetingParticipantDto
                {
                    ParticipantId = mp.ParticipantId,
                    EmployeeId = mp.EmployeeId,
                    EmployeeName = GetEmployeeName(mp.Employee)
                }).ToList() ?? new List<MeetingParticipantDto>()
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


        


        private MeetingInvitationDto MapToMeetingInvitationDto(Meetingparticipant participant)
        {
            var daysUntilMeeting = (int)(participant.Meeting.MeetingDate - DateTime.Now).TotalDays;

            return new MeetingInvitationDto
            {
                ParticipantId = participant.ParticipantId,
                MeetingId = participant.MeetingId,
                MeetingTitle = participant.Meeting.MeetingTitle,
                MeetingType = participant.Meeting.MeetingType,
                MeetingDate = participant.Meeting.MeetingDate,
                MeetingLink = participant.Meeting.MeetingLink,
                Agenda = participant.Meeting.Agenda,
                ScheduledByEmployeeId = participant.Meeting.ScheduledByEmployeeId,
                ScheduledByEmployeeName = GetEmployeeName(participant.Meeting.ScheduledByEmployee),
                MeetingStatus = participant.Meeting.Status,
                RsvpStatus = participant.Rsvpstatus,
                RsvpResponseDate = participant.RsvpresponseDate,
                RsvpComments = participant.Rsvpcomments,
                DaysUntilMeeting = daysUntilMeeting,
               // IsUpcoming = participant.Meeting.MeetingDate > DateTime.Now
            };
        }
    }
}

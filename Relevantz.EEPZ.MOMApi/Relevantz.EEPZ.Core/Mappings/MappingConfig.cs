using Mapster;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Mappings
{
    /// <summary>
    /// Mapster configuration for all entity-to-DTO mappings
    /// High-performance mapping with zero reflection overhead after initial setup
    /// </summary>
    public static class MappingConfig
    {
        public static void RegisterMappings()
        {
            // Configure global Mapster settings
            TypeAdapterConfig.GlobalSettings.Default
                .PreserveReference(true) // Handle circular references
                .IgnoreNullValues(false); // Map null values

            ConfigureMomMappings();
            ConfigureActionItemMappings();
            ConfigureSharingMappings();
            ConfigureMeetingMappings();
        }

        /// <summary>
        /// MOM entity to DTO mappings
        /// </summary>
        private static void ConfigureMomMappings()
        {
            // Mom Entity -> MomResponseDto
            TypeAdapterConfig<Mom, MomResponseDto>
                .NewConfig()
                .Map(dest => dest.MomId, src => src.Momid)
                .Map(dest => dest.SubmittedByEmployeeName, 
                    src => GetEmployeeName(src.SubmittedByEmployee))
                .Map(dest => dest.IsEditable, src => src.IsEditable ?? false)
                .Map(dest => dest.DiscussionPoints, 
                    src => src.Momdiscussionpoints != null 
                        ? src.Momdiscussionpoints.OrderBy(dp => dp.PointOrder).ToList() 
                        : new List<Momdiscussionpoint>())
                .Map(dest => dest.ActionItems, 
                    src => src.Momactionitems ?? new List<Momactionitem>());

            // Momdiscussionpoint -> DiscussionPointResponseDto
            TypeAdapterConfig<Momdiscussionpoint, DiscussionPointResponseDto>
                .NewConfig()
                .Map(dest => dest.PointId, src => src.PointId)
                .Map(dest => dest.PointText, src => src.PointText)
                .Map(dest => dest.PointOrder, src => src.PointOrder);

            // CreateMomDto -> Mom Entity (reverse mapping)
            TypeAdapterConfig<CreateMomDto, Mom>
                .NewConfig()
                .Map(dest => dest.CreatedAt, src => DateTime.Now)
                .Ignore(dest => dest.Momid)
                .Ignore(dest => dest.Momdiscussionpoints)
                .Ignore(dest => dest.Momactionitems)
                .Ignore(dest => dest.Momsharings)
                .Ignore(dest => dest.SubmittedByEmployee);
        }

        /// <summary>
        /// Action Item mappings
        /// </summary>
        private static void ConfigureActionItemMappings()
        {
            // Momactionitem -> ActionItemResponseDto
            TypeAdapterConfig<Momactionitem, ActionItemResponseDto>
                .NewConfig()
                .Map(dest => dest.ActionItemId, src => src.ActionItemId)
                .Map(dest => dest.AssignedToEmployeeName, 
                    src => GetEmployeeName(src.AssignedToEmployee))
                .Map(dest => dest.MeetingTitle, src => src.Mom != null ? src.Mom.MeetingTitle : "N/A")
                .Map(dest => dest.MomId, src => src.Momid)
                .Map(dest => dest.AssignedByEmployeeId, 
                    src => src.Mom != null ? (int?)src.Mom.SubmittedByEmployeeId : null)
                .Map(dest => dest.AssignedByEmployeeName, 
                    src => src.Mom != null && src.Mom.SubmittedByEmployee != null 
                        ? GetEmployeeName(src.Mom.SubmittedByEmployee) 
                        : null)
                .Map(dest => dest.IsOverdue, 
                    src => src.Status != "Completed" && src.DueDate < DateOnly.FromDateTime(DateTime.Now));

            // ActionItemDto -> Momactionitem
            TypeAdapterConfig<ActionItemDto, Momactionitem>
                .NewConfig()
                .Map(dest => dest.CreatedAt, src => DateTime.Now)
                .Ignore(dest => dest.ActionItemId)
                .Ignore(dest => dest.Mom)
                .Ignore(dest => dest.AssignedToEmployee);

            // DiscussionPointDto -> Momdiscussionpoint
            TypeAdapterConfig<DiscussionPointDto, Momdiscussionpoint>
                .NewConfig()
                .Ignore(dest => dest.PointId)
                .Ignore(dest => dest.Mom);
        }

        /// <summary>
        /// Sharing mappings
        /// </summary>
        private static void ConfigureSharingMappings()
        {
            // Momsharing -> MomSharingResponseDto
            TypeAdapterConfig<Momsharing, MomSharingResponseDto>
                .NewConfig()
                .Map(dest => dest.SharingId, src => src.SharingId)
                .Map(dest => dest.MomId, src => src.Momid)
                .Map(dest => dest.MeetingTitle, src => src.Mom != null ? src.Mom.MeetingTitle : "N/A")
                .Map(dest => dest.SharedByEmployeeName, 
                    src => GetEmployeeName(src.SharedByEmployee))
                .Map(dest => dest.SharedWithEmployeeName, 
                    src => GetEmployeeName(src.SharedWithEmployee));
        }

        /// <summary>
        /// Meeting and participant mappings
        /// </summary>
        private static void ConfigureMeetingMappings()
        {
            // Meeting -> MeetingResponseDto
            TypeAdapterConfig<Meeting, MeetingResponseDto>
                .NewConfig()
                .Map(dest => dest.ScheduledByEmployeeName, 
                    src => GetEmployeeName(src.ScheduledByEmployee))
                .Map(dest => dest.Participants, 
                    src => src.Meetingparticipants ?? new List<Meetingparticipant>());

            // Meetingparticipant -> MeetingParticipantDto
            TypeAdapterConfig<Meetingparticipant, MeetingParticipantDto>
                .NewConfig()
                .Map(dest => dest.EmployeeName, src => GetEmployeeName(src.Employee));

            // Meetingparticipant -> MeetingInvitationDto
            TypeAdapterConfig<Meetingparticipant, MeetingInvitationDto>
                .NewConfig()
                .Map(dest => dest.MeetingTitle, src => src.Meeting != null ? src.Meeting.MeetingTitle : "N/A")
                .Map(dest => dest.MeetingType, src => src.Meeting != null ? src.Meeting.MeetingType : "N/A")
                .Map(dest => dest.MeetingDate, src => src.Meeting != null ? src.Meeting.MeetingDate : DateTime.Now)
                .Map(dest => dest.MeetingLink, src => src.Meeting != null ? src.Meeting.MeetingLink : null)
                .Map(dest => dest.Agenda, src => src.Meeting != null ? src.Meeting.Agenda : null)
                .Map(dest => dest.ScheduledByEmployeeId, 
                    src => src.Meeting != null ? (int?)src.Meeting.ScheduledByEmployeeId : null)
                .Map(dest => dest.ScheduledByEmployeeName, 
                    src => src.Meeting != null && src.Meeting.ScheduledByEmployee != null
                        ? GetEmployeeName(src.Meeting.ScheduledByEmployee) 
                        : "Unknown")
                .Map(dest => dest.MeetingStatus, src => src.Meeting != null ? src.Meeting.Status : "Unknown")
                .Map(dest => dest.RsvpStatus, src => src.Rsvpstatus)
                .Map(dest => dest.RsvpResponseDate, src => src.RsvpresponseDate)
                .Map(dest => dest.RsvpComments, src => src.Rsvpcomments)
                .Map(dest => dest.InvitedAt, src => src.InvitedAt) // DateTime is non-nullable, map directly
                .Map(dest => dest.DaysUntilMeeting, 
                    src => src.Meeting != null 
                        ? (int)(src.Meeting.MeetingDate - DateTime.Now).TotalDays 
                        : 0);
        }

        /// <summary>
        /// Helper method to get employee full name
        /// </summary>
        private static string GetEmployeeName(Employee? employee)
        {
            if (employee?.Userprofile == null)
                return "Unknown";

            var firstName = employee.Userprofile.FirstName ?? string.Empty;
            var lastName = employee.Userprofile.LastName ?? string.Empty;
            var fullName = $"{firstName} {lastName}".Trim();

            return string.IsNullOrWhiteSpace(fullName) ? "Unknown" : fullName;
        }
    }
}

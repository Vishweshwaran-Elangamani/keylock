using Mapster;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Config
{
    public static class MappingConfig
    {
        public static void RegisterMappings()
        {
            /* ---------------- MOM ---------------- */

            TypeAdapterConfig<CreateMomDto, Mom>
                .NewConfig()
                .Map(dest => dest.MeetingId, src => src.MeetingId)
                .Map(dest => dest.MeetingTitle, src => src.MeetingTitle)
                .Map(dest => dest.MeetingType, src => src.MeetingType)
                .Map(dest => dest.MeetingDate, src => src.MeetingDate)
                .Map(dest => dest.MeetingLink, src => src.MeetingLink)
                .Map(dest => dest.Attendees, src => src.Attendees)
                .Map(dest => dest.CommentsObservations, src => src.CommentsObservations)
                .Map(dest => dest.Momdiscussionpoints, src => src.DiscussionPoints)
                .Map(dest => dest.Momactionitems, src => src.ActionItems);

            TypeAdapterConfig<Mom, CreateMomDto>
                .NewConfig()
                .Map(dest => dest.DiscussionPoints, src => src.Momdiscussionpoints)
                .Map(dest => dest.ActionItems, src => src.Momactionitems);


            /* ---------------- MEETING ---------------- */

            TypeAdapterConfig<ScheduleMeetingDto, Meeting>.NewConfig();

            TypeAdapterConfig<Meeting, MeetingResponseDto>
                .NewConfig()
                .Map(dest => dest.MeetingId, src => src.MeetingId)
                .Map(dest => dest.MeetingTitle, src => src.MeetingTitle)
                .Map(dest => dest.MeetingType, src => src.MeetingType)
                .Map(dest => dest.MeetingDate, src => src.MeetingDate)
                .Map(dest => dest.MeetingLink, src => src.MeetingLink)
                .Map(dest => dest.Agenda, src => src.Agenda);


TypeAdapterConfig<Meetingparticipant, MeetingInvitationDto>
.NewConfig()

.Map(dest => dest.MeetingId,
     src => src.MeetingId)

.Map(dest => dest.EmployeeId,
     src => src.EmployeeId)

.Map(dest => dest.EmployeeName,
     src => src.Employee != null && src.Employee.Userprofile != null
         ? src.Employee.Userprofile.FirstName + " " + src.Employee.Userprofile.LastName
         : string.Empty)

.Map(dest => dest.RsvpStatus,
     src => src.Rsvpstatus ?? "Pending")

.Map(dest => dest.RsvpComments,
     src => src.Rsvpcomments)

.Map(dest => dest.RsvpResponseDate,
     src => src.RsvpresponseDate)

.Map(dest => dest.MeetingTitle,
     src => src.Meeting != null ? src.Meeting.MeetingTitle : string.Empty)

.Map(dest => dest.MeetingType,
     src => src.Meeting != null ? src.Meeting.MeetingType : string.Empty)

.Map(dest => dest.MeetingDate,
     src => src.Meeting != null ? src.Meeting.MeetingDate : DateTime.MinValue)

.Map(dest => dest.MeetingLink,
     src => src.Meeting != null ? src.Meeting.MeetingLink : null);


        }
    }
}

using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs
{

    public class CreateMomDto
    {
        public int? MeetingId { get; set; }

        [Required(ErrorMessage = "Meeting title is required")]
        [StringLength(200, ErrorMessage = "Meeting title cannot exceed 200 characters")]
        public string MeetingTitle { get; set; } = null!;

        [Required(ErrorMessage = "Meeting type is required")]
        public string MeetingType { get; set; } = null!; 

        [Required(ErrorMessage = "Meeting date is required")]
        public DateTime MeetingDate { get; set; }

        [StringLength(500, ErrorMessage = "Meeting link cannot exceed 500 characters")]
        public string? MeetingLink { get; set; }

        [Required(ErrorMessage = "Attendees are required")]
        public string Attendees { get; set; } = null!;

        public string? CommentsObservations { get; set; }

        public List<DiscussionPointDto>? DiscussionPoints { get; set; }

        public List<ActionItemDto>? ActionItems { get; set; }
    }


    public class UpdateMomDto
    {
        [Required]
        public int MomId { get; set; }

        [StringLength(200)]
        public string? MeetingTitle { get; set; }

        public string? MeetingType { get; set; }

        public DateTime? MeetingDate { get; set; }

        [StringLength(500)]
        public string? MeetingLink { get; set; }

        public string? Attendees { get; set; }

        public string? CommentsObservations { get; set; }

        public List<DiscussionPointDto>? DiscussionPoints { get; set; }

        public List<ActionItemDto>? ActionItems { get; set; }
    }
    public class DiscussionPointDto
    {
        public int? PointId { get; set; }

        [Required(ErrorMessage = "Discussion point text is required")]
        public string PointText { get; set; } = null!;

        public int PointOrder { get; set; } = 1;
    }


    public class ActionItemDto
    {
        public int? ActionItemId { get; set; }

        [Required(ErrorMessage = "Task description is required")]
        [StringLength(500, ErrorMessage = "Task description cannot exceed 500 characters")]
        public string TaskDescription { get; set; } = null!;

        [Required(ErrorMessage = "Assigned employee is required")]
        public int AssignedToEmployeeId { get; set; }

        [Required(ErrorMessage = "Due date is required")]
        public DateOnly DueDate { get; set; }

        public string Status { get; set; } = "Pending"; 
    }


    public class MomResponseDto
    {
        public int MomId { get; set; }
        public int? MeetingId { get; set; }
        public string MeetingTitle { get; set; } = null!;
        public string MeetingType { get; set; } = null!;
        public DateTime MeetingDate { get; set; }
        public string? MeetingLink { get; set; }
        public string Attendees { get; set; } = null!;
        public string? CommentsObservations { get; set; }
        public int SubmittedByEmployeeId { get; set; }
        public string SubmittedByEmployeeName { get; set; } = null!;
        public string SubmittedByRole { get; set; } = null!;
        public bool IsEditable { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<DiscussionPointResponseDto> DiscussionPoints { get; set; } = new();
        public List<ActionItemResponseDto> ActionItems { get; set; } = new();
    }

   public class ActionItemResponseDto
{
    public int ActionItemId { get; set; }
    public string TaskDescription { get; set; }
    public int AssignedToEmployeeId { get; set; }
    public string AssignedToEmployeeName { get; set; }
    public DateOnly DueDate { get; set; }
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // THESE ARE MUST:
    public string? MeetingTitle { get; set; }
    public int? MomId { get; set; }
    public int? AssignedByEmployeeId { get; set; }
    public string? AssignedByEmployeeName { get; set; }
    public bool IsOverdue { get; set; }
}




    public class DiscussionPointResponseDto
    {
        public int PointId { get; set; }
        public string PointText { get; set; } = null!;
        public int PointOrder { get; set; }
    }


    public class PaginatedMomResponseDto
    {
        public List<MomResponseDto> Moms { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage { get; set; }
        public bool HasNextPage { get; set; }
    }


    public class ShareMomDto
    {
        [Required]
        public int MomId { get; set; }

        [Required(ErrorMessage = "At least one employee must be selected")]
        [MinLength(1, ErrorMessage = "At least one employee must be selected")]
        public List<int> SharedWithEmployeeIds { get; set; } = null!;
    }

    public class MomSharingResponseDto
    {
        public int SharingId { get; set; }
        public int MomId { get; set; }
        public string MeetingTitle { get; set; } = null!;
        public int SharedByEmployeeId { get; set; }
        public string SharedByEmployeeName { get; set; } = null!;
        public int SharedWithEmployeeId { get; set; }
        public string SharedWithEmployeeName { get; set; } = null!;
        public DateTime SharedAt { get; set; }
    }


    public class ScheduleMeetingDto
    {
        [Required(ErrorMessage = "Meeting title is required")]
        [StringLength(200)]
        public string MeetingTitle { get; set; } = null!;

        [Required(ErrorMessage = "Meeting type is required")]
        public string MeetingType { get; set; } = null!;

        [Required(ErrorMessage = "Meeting date is required")]
        public DateTime MeetingDate { get; set; }

        [Required(ErrorMessage = "Meeting link is required")]
        [StringLength(500)]
        public string MeetingLink { get; set; } = null!;

        public string? Agenda { get; set; }

        [Required(ErrorMessage = "At least one participant is required")]
        [MinLength(1, ErrorMessage = "At least one participant is required")]
        public List<int> ParticipantEmployeeIds { get; set; } = null!;
    }

    
    public class MeetingResponseDto
    {
        public int MeetingId { get; set; }
        public string MeetingTitle { get; set; } = null!;
        public string MeetingType { get; set; } = null!;
        public DateTime MeetingDate { get; set; }
        public string? MeetingLink { get; set; }
        public string? Agenda { get; set; }
        public int ScheduledByEmployeeId { get; set; }
        public string ScheduledByEmployeeName { get; set; } = null!;
        public string Status { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public List<MeetingParticipantDto> Participants { get; set; } = new();
    }

    public class MeetingParticipantDto
    {
        public int ParticipantId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = null!;
    }


    public class OneOnOneReportDto
    {
        public int TotalMeetings { get; set; }
        public int CompletedMeetings { get; set; }
        public int ScheduledMeetings { get; set; }
        public int CancelledMeetings { get; set; }
        public double CompletionRate { get; set; }

        public int TotalActionItems { get; set; }
        public int CompletedActionItems { get; set; }
        public int PendingActionItems { get; set; }
        public int OverdueActionItems { get; set; }
        public double ActionItemCompletionRate { get; set; }
   
        public double AverageActionItemsPerMeeting { get; set; }
        public double AverageDiscussionPointsPerMeeting { get; set; }
        public List<MeetingResponseDto> Meetings { get; set; } = new();
        public List<EmployeeOneOnOneStatsDto> EmployeeStats { get; set; } = new();
    }


    public class EmployeeOneOnOneStatsDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string? Department { get; set; }
        public int TotalMeetings { get; set; }
        public int CompletedMeetings { get; set; }
        public DateTime? LastMeetingDate { get; set; }
        public int DaysSinceLastMeeting { get; set; }
        public int TotalActionItems { get; set; }
        public int CompletedActionItems { get; set; }
        public int OverdueActionItems { get; set; }
        public bool NeedsAttention => DaysSinceLastMeeting > 30 || OverdueActionItems > 0;
    }


    public class OneOnOneSummaryDto
    {
        public int TotalTeamMembers { get; set; }
        public int TotalOneOnOnes { get; set; }
     
        public int ThisMonthOneOnOnes { get; set; }
        public int ThisQuarterOneOnOnes { get; set; }
        public int LastMonthOneOnOnes { get; set; }
   
        public double AverageMeetingsPerEmployee { get; set; }
        public double AverageDaysBetweenMeetings { get; set; }

        public int EmployeesWithNoRecentMeeting { get; set; }
        public int OverdueActionItemsCount { get; set; }
     
        public List<UpcomingMeetingDto> UpcomingMeetings { get; set; } = new();
 
        public List<RecentMeetingDto> RecentlyCompleted { get; set; } = new();
    }


    public class UpcomingMeetingDto
    {
        public int MeetingId { get; set; }
        public string MeetingTitle { get; set; } = string.Empty;
        public DateTime MeetingDate { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int DaysUntilMeeting { get; set; }
        public string? Agenda { get; set; }
    }

    public class RecentMeetingDto
    {
        public int MeetingId { get; set; }
        public int MomId { get; set; }
        public string MeetingTitle { get; set; } = string.Empty;
        public DateTime MeetingDate { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int ActionItemsCount { get; set; }
        public int CompletedActionItemsCount { get; set; }
        public int DaysSinceCompletion { get; set; }
    }

 
    public class ActionItemFilterDto
    {
        public string? Status { get; set; } 
        public bool? IsOverdue { get; set; }
        public int? AssignedToEmployeeId { get; set; }
        public DateTime? DueDateFrom { get; set; }
        public DateTime? DueDateTo { get; set; }
    }

    public class ActionItemWithContextDto
    {
        public int ActionItemId { get; set; }
        public string TaskDescription { get; set; } = null!;
        public int AssignedToEmployeeId { get; set; }
        public string AssignedToEmployeeName { get; set; } = null!;
        public DateOnly DueDate { get; set; }
        public string Status { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public bool IsOverdue { get; set; }
   
        public int MomId { get; set; }
        public string MeetingTitle { get; set; } = null!;
        public DateTime MeetingDate { get; set; }
        public string SubmittedByEmployeeName { get; set; } = null!;
    }

    public class MomFilterDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Page number must be at least 1")]
        public int PageNumber { get; set; } = 1;

        [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
        public int PageSize { get; set; } = 20;

        [StringLength(100)]
        public string? SearchTerm { get; set; }

        public string? MeetingType { get; set; }

        public int? DepartmentId { get; set; }

        public int? SubmittedByEmployeeId { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public string? SubmittedByRole { get; set; } 

        public string SortBy { get; set; } = "MeetingDate";

        public string SortOrder { get; set; } = "desc";
    }

 
    public class MeetingFilterDto
    {
        public string? MeetingType { get; set; }
        
        public string? Status { get; set; } 
        
        public int? ParticipantEmployeeId { get; set; }
        
        public DateTime? StartDate { get; set; }
        
        public DateTime? EndDate { get; set; }
        
        [Range(1, int.MaxValue)]
        public int PageNumber { get; set; } = 1;
        
        [Range(1, 100)]
        public int PageSize { get; set; } = 20;
    }


    public class MomStatisticsDto
    {
        public int TotalMoms { get; set; }
        public int ThisMonthMoms { get; set; }
        public int ThisWeekMoms { get; set; }
        public int TotalMeetings { get; set; }
        public int OneOnOneMeetings { get; set; }
        public int TeamMeetings { get; set; }
        public int Presentations { get; set; }
        public Dictionary<string, int> MomsByDepartment { get; set; } = new();
        public Dictionary<string, int> MomsByMeetingType { get; set; } = new();
    }
}

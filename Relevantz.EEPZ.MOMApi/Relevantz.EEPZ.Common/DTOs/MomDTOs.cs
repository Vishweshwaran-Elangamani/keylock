using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs
{
    public class CreateMomDto
    {
        public int? MeetingId { get; set; }

        [Required(ErrorMessage = "Meeting title is required")]
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Meeting title must be between 3 and 200 characters")]
        public string MeetingTitle { get; set; } = null!;

        [Required(ErrorMessage = "Meeting type is required")]
        [StringLength(50, ErrorMessage = "Meeting type cannot exceed 50 characters")]
        [RegularExpression(@"^(One-on-One|Team Meeting|Project Review|Client Meeting|Training|Other)$", 
            ErrorMessage = "Invalid meeting type")]
        public string MeetingType { get; set; } = null!;

        [Required(ErrorMessage = "Meeting date is required")]
        [DataType(DataType.DateTime)]
        public DateTime MeetingDate { get; set; }

        [StringLength(500, ErrorMessage = "Meeting link cannot exceed 500 characters")]
        [Url(ErrorMessage = "Meeting link must be a valid URL")]
        public string? MeetingLink { get; set; }

        [Required(ErrorMessage = "Attendees are required")]
        [StringLength(1000, MinimumLength = 2, ErrorMessage = "Attendees must be between 2 and 1000 characters")]
        public string Attendees { get; set; } = null!;

        [StringLength(2000, ErrorMessage = "Comments/Observations cannot exceed 2000 characters")]
        public string? CommentsObservations { get; set; }

        [MaxLength(50, ErrorMessage = "Maximum 50 discussion points allowed")]
        public List<DiscussionPointDto>? DiscussionPoints { get; set; }

        [MaxLength(100, ErrorMessage = "Maximum 100 action items allowed")]
        public List<ActionItemDto>? ActionItems { get; set; }
    }

    public class UpdateMomDto
    {
        [Required(ErrorMessage = "MOM ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "MOM ID must be greater than 0")]
        public int MomId { get; set; }

        [StringLength(200, MinimumLength = 3, ErrorMessage = "Meeting title must be between 3 and 200 characters")]
        public string? MeetingTitle { get; set; }

        [StringLength(50, ErrorMessage = "Meeting type cannot exceed 50 characters")]
        [RegularExpression(@"^(One-on-One|Team Meeting|Project Review|Client Meeting|Training|Other)$", 
            ErrorMessage = "Invalid meeting type")]
        public string? MeetingType { get; set; }

        [DataType(DataType.DateTime)]
        public DateTime? MeetingDate { get; set; }

        [StringLength(500, ErrorMessage = "Meeting link cannot exceed 500 characters")]
        [Url(ErrorMessage = "Meeting link must be a valid URL")]
        public string? MeetingLink { get; set; }

        [StringLength(1000, MinimumLength = 2, ErrorMessage = "Attendees must be between 2 and 1000 characters")]
        public string? Attendees { get; set; }

        [StringLength(2000, ErrorMessage = "Comments/Observations cannot exceed 2000 characters")]
        public string? CommentsObservations { get; set; }

        [MaxLength(50, ErrorMessage = "Maximum 50 discussion points allowed")]
        public List<DiscussionPointDto>? DiscussionPoints { get; set; }

        [MaxLength(100, ErrorMessage = "Maximum 100 action items allowed")]
        public List<ActionItemDto>? ActionItems { get; set; }
    }

    public class DiscussionPointDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Point ID must be greater than 0")]
        public int? PointId { get; set; }

        [Required(ErrorMessage = "Discussion point text is required")]
        [StringLength(1000, MinimumLength = 5, ErrorMessage = "Discussion point text must be between 5 and 1000 characters")]
        public string PointText { get; set; } = null!;

        [Range(1, 1000, ErrorMessage = "Point order must be between 1 and 1000")]
        public int PointOrder { get; set; } = 1;
    }

    public class ActionItemDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Action item ID must be greater than 0")]
        public int? ActionItemId { get; set; }

        [Required(ErrorMessage = "Task description is required")]
        [StringLength(500, MinimumLength = 5, ErrorMessage = "Task description must be between 5 and 500 characters")]
        public string TaskDescription { get; set; } = null!;

        [Required(ErrorMessage = "Assigned employee is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Assigned employee ID must be greater than 0")]
        public int AssignedToEmployeeId { get; set; }

        [Required(ErrorMessage = "Due date is required")]
        public DateOnly DueDate { get; set; }

        [Required(ErrorMessage = "Status is required")]
        [StringLength(20, ErrorMessage = "Status cannot exceed 20 characters")]
        [RegularExpression(@"^(Pending|In Progress|Completed|Cancelled)$", 
            ErrorMessage = "Status must be Pending, In Progress, Completed, or Cancelled")]
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
        public string TaskDescription { get; set; } = null!;
        public int AssignedToEmployeeId { get; set; }
        public string AssignedToEmployeeName { get; set; } = null!;
        public DateOnly DueDate { get; set; }
        public string Status { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public string? MeetingTitle { get; set; }
        public int? MomId { get; set; }
        public int? AssignedByEmployeeId { get; set; }
        public string? AssignedByEmployeeName { get; set; }
        public bool IsOverdue => DueDate < DateOnly.FromDateTime(DateTime.Now) && Status != "Completed";
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
        [Required(ErrorMessage = "MOM ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "MOM ID must be greater than 0")]
        public int MomId { get; set; }

        [Required(ErrorMessage = "At least one employee must be selected")]
        [MinLength(1, ErrorMessage = "At least one employee must be selected")]
        [MaxLength(100, ErrorMessage = "Maximum 100 employees can be selected at once")]
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
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Meeting title must be between 3 and 200 characters")]
        public string MeetingTitle { get; set; } = null!;

        [Required(ErrorMessage = "Meeting type is required")]
        [StringLength(50, ErrorMessage = "Meeting type cannot exceed 50 characters")]
        public string MeetingType { get; set; } = null!;

        [Required(ErrorMessage = "Meeting date is required")]
        [DataType(DataType.DateTime)]
        public DateTime MeetingDate { get; set; }

        [Required(ErrorMessage = "Meeting link is required")]
        [StringLength(500, ErrorMessage = "Meeting link cannot exceed 500 characters")]
        [Url(ErrorMessage = "Meeting link must be a valid URL")]
        public string MeetingLink { get; set; } = null!;

        [StringLength(2000, ErrorMessage = "Agenda cannot exceed 2000 characters")]
        public string? Agenda { get; set; }

        [Required(ErrorMessage = "At least one participant is required")]
        [MinLength(1, ErrorMessage = "At least one participant is required")]
        [MaxLength(50, ErrorMessage = "Maximum 50 participants allowed")]
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
        [StringLength(20, ErrorMessage = "Status cannot exceed 20 characters")]
        [RegularExpression(@"^(Pending|In Progress|Completed|Cancelled)$", 
            ErrorMessage = "Status must be Pending, In Progress, Completed, or Cancelled")]
        public string? Status { get; set; }

        public bool? IsOverdue { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Employee ID must be greater than 0")]
        public int? AssignedToEmployeeId { get; set; }

        [DataType(DataType.Date)]
        public DateTime? DueDateFrom { get; set; }

        [DataType(DataType.Date)]
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

        [StringLength(100, ErrorMessage = "Search term cannot exceed 100 characters")]
        public string? SearchTerm { get; set; }

        [StringLength(50, ErrorMessage = "Meeting type cannot exceed 50 characters")]
        public string? MeetingType { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Department ID must be greater than 0")]
        public int? DepartmentId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Employee ID must be greater than 0")]
        public int? SubmittedByEmployeeId { get; set; }

        [DataType(DataType.Date)]
        public DateTime? StartDate { get; set; }

        [DataType(DataType.Date)]
        public DateTime? EndDate { get; set; }

        [StringLength(50, ErrorMessage = "Role cannot exceed 50 characters")]
        public string? SubmittedByRole { get; set; }

        [StringLength(50, ErrorMessage = "Sort field cannot exceed 50 characters")]
        [RegularExpression(@"^(MeetingDate|MeetingTitle|CreatedAt|SubmittedByEmployeeName)$", 
            ErrorMessage = "Invalid sort field")]
        public string SortBy { get; set; } = "MeetingDate";

        [StringLength(4, ErrorMessage = "Sort order must be 'asc' or 'desc'")]
        [RegularExpression(@"^(asc|desc)$", ErrorMessage = "Sort order must be 'asc' or 'desc'")]
        public string SortOrder { get; set; } = "desc";
    }

    public class MeetingFilterDto
    {
        [StringLength(50, ErrorMessage = "Meeting type cannot exceed 50 characters")]
        public string? MeetingType { get; set; }

        [StringLength(20, ErrorMessage = "Status cannot exceed 20 characters")]
        [RegularExpression(@"^(Scheduled|Completed|Cancelled)$", 
            ErrorMessage = "Status must be Scheduled, Completed, or Cancelled")]
        public string? Status { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Employee ID must be greater than 0")]
        public int? ParticipantEmployeeId { get; set; }

        [DataType(DataType.Date)]
        public DateTime? StartDate { get; set; }

        [DataType(DataType.Date)]
        public DateTime? EndDate { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Page number must be at least 1")]
        public int PageNumber { get; set; } = 1;

        [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
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

    /// <summary>
    /// Custom validation attribute for date ranges
    /// </summary>
    public class DateRangeValidationAttribute : ValidationAttribute
    {
        private readonly int _maxYearsInPast;
        private readonly int _maxYearsInFuture;

        public DateRangeValidationAttribute(int maxYearsInPast = 1, int maxYearsInFuture = 5)
        {
            _maxYearsInPast = maxYearsInPast;
            _maxYearsInFuture = maxYearsInFuture;
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is DateTime dateValue)
            {
                var minDate = DateTime.Now.AddYears(-_maxYearsInPast);
                var maxDate = DateTime.Now.AddYears(_maxYearsInFuture);

                if (dateValue < minDate || dateValue > maxDate)
                {
                    return new ValidationResult(
                        $"Date must be within {_maxYearsInPast} year(s) in the past and {_maxYearsInFuture} year(s) in the future");
                }
            }

            return ValidationResult.Success;
        }
    }

    /// <summary>
    /// Custom validation attribute for list of employee IDs
    /// </summary>
    public class ValidEmployeeIdsAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is List<int> employeeIds)
            {
                if (employeeIds.Any(id => id <= 0))
                {
                    return new ValidationResult("All employee IDs must be greater than 0");
                }

                if (employeeIds.Distinct().Count() != employeeIds.Count)
                {
                    return new ValidationResult("Duplicate employee IDs are not allowed");
                }
            }

            return ValidationResult.Success;
        }
    }
}

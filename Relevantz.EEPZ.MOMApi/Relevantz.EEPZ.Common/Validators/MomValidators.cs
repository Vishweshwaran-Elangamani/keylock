using FluentValidation;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Common.Validators
{
    /// <summary>
    /// Validator for CreateMomDto
    /// </summary>
    public class CreateMomDtoValidator : AbstractValidator<CreateMomDto>
    {
        public CreateMomDtoValidator()
        {
            RuleFor(x => x.MeetingTitle)
                .NotEmpty().WithMessage("Meeting title is required")
                .MaximumLength(200).WithMessage("Meeting title cannot exceed 200 characters")
                .Matches(@"^[a-zA-Z0-9\s\-_.:,()&]+$").WithMessage("Meeting title contains invalid characters");

            RuleFor(x => x.MeetingType)
                .NotEmpty().WithMessage("Meeting type is required")
                .Must(BeValidMeetingType).WithMessage("Meeting type must be 'One-on-One', 'Team Meeting', 'Presentation', or 'Other'");

            RuleFor(x => x.MeetingDate)
                .NotEmpty().WithMessage("Meeting date is required")
                .Must(BeValidMeetingDate).WithMessage("Meeting date cannot be more than 1 year in the past or more than 1 year in the future");

            RuleFor(x => x.MeetingLink)
                .MaximumLength(500).WithMessage("Meeting link cannot exceed 500 characters")
                .Must(BeValidUrlOrEmpty).WithMessage("Meeting link must be a valid URL")
                .When(x => !string.IsNullOrEmpty(x.MeetingLink));

            RuleFor(x => x.Attendees)
                .NotEmpty().WithMessage("Attendees are required")
                .MinimumLength(2).WithMessage("Attendees must contain at least 2 characters")
                .MaximumLength(1000).WithMessage("Attendees cannot exceed 1000 characters");

            RuleFor(x => x.CommentsObservations)
                .MaximumLength(5000).WithMessage("Comments/Observations cannot exceed 5000 characters")
                .When(x => !string.IsNullOrEmpty(x.CommentsObservations));

            RuleFor(x => x.DiscussionPoints)
                .Must(x => x == null || x.Count <= 50).WithMessage("Maximum 50 discussion points allowed");

            RuleForEach(x => x.DiscussionPoints)
                .SetValidator(new DiscussionPointDtoValidator())
                .When(x => x.DiscussionPoints != null);

            RuleFor(x => x.ActionItems)
                .Must(x => x == null || x.Count <= 100).WithMessage("Maximum 100 action items allowed");

            RuleForEach(x => x.ActionItems)
                .SetValidator(new ActionItemDtoValidator())
                .When(x => x.ActionItems != null);
        }

        private bool BeValidMeetingType(string meetingType)
        {
            var validTypes = new[] { "One-on-One", "Team Meeting", "Presentation", "Other" };
            return validTypes.Contains(meetingType, StringComparer.OrdinalIgnoreCase);
        }

        private bool BeValidMeetingDate(DateTime meetingDate)
        {
            var oneYearAgo = DateTime.Now.AddYears(-1);
            var oneYearFuture = DateTime.Now.AddYears(1);
            return meetingDate >= oneYearAgo && meetingDate <= oneYearFuture;
        }

        private bool BeValidUrlOrEmpty(string? url)
        {
            if (string.IsNullOrEmpty(url)) return true;
            return Uri.TryCreate(url, UriKind.Absolute, out var uriResult) 
                   && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
        }
    }

    /// <summary>
    /// Validator for UpdateMomDto
    /// </summary>
    public class UpdateMomDtoValidator : AbstractValidator<UpdateMomDto>
    {
        public UpdateMomDtoValidator()
        {
            RuleFor(x => x.MomId)
                .GreaterThan(0).WithMessage("MOM ID must be greater than 0");

            RuleFor(x => x.MeetingTitle)
                .MaximumLength(200).WithMessage("Meeting title cannot exceed 200 characters")
                .When(x => !string.IsNullOrEmpty(x.MeetingTitle));

            RuleFor(x => x.MeetingType)
                .Must(BeValidMeetingType).WithMessage("Meeting type must be 'One-on-One', 'Team Meeting', 'Presentation', or 'Other'")
                .When(x => !string.IsNullOrEmpty(x.MeetingType));

            RuleFor(x => x.MeetingDate)
                .Must(date => BeValidMeetingDate(date.Value))
                .WithMessage("Meeting date cannot be more than 1 year in the past or more than 1 year in the future")
                .When(x => x.MeetingDate.HasValue);

            RuleFor(x => x.MeetingLink)
                .MaximumLength(500).WithMessage("Meeting link cannot exceed 500 characters")
                .Must(BeValidUrlOrEmpty).WithMessage("Meeting link must be a valid URL")
                .When(x => !string.IsNullOrEmpty(x.MeetingLink));

            RuleFor(x => x.Attendees)
                .MinimumLength(2).WithMessage("Attendees must contain at least 2 characters")
                .MaximumLength(1000).WithMessage("Attendees cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Attendees));

            RuleFor(x => x.CommentsObservations)
                .MaximumLength(5000).WithMessage("Comments/Observations cannot exceed 5000 characters")
                .When(x => !string.IsNullOrEmpty(x.CommentsObservations));

            RuleFor(x => x.DiscussionPoints)
                .Must(x => x == null || x.Count <= 50).WithMessage("Maximum 50 discussion points allowed");

            RuleForEach(x => x.DiscussionPoints)
                .SetValidator(new DiscussionPointDtoValidator())
                .When(x => x.DiscussionPoints != null);

            RuleFor(x => x.ActionItems)
                .Must(x => x == null || x.Count <= 100).WithMessage("Maximum 100 action items allowed");

            RuleForEach(x => x.ActionItems)
                .SetValidator(new ActionItemDtoValidator())
                .When(x => x.ActionItems != null);
        }

        private bool BeValidMeetingType(string meetingType)
        {
            var validTypes = new[] { "One-on-One", "Team Meeting", "Presentation", "Other" };
            return validTypes.Contains(meetingType, StringComparer.OrdinalIgnoreCase);
        }

        private bool BeValidMeetingDate(DateTime meetingDate)
        {
            var oneYearAgo = DateTime.Now.AddYears(-1);
            var oneYearFuture = DateTime.Now.AddYears(1);
            return meetingDate >= oneYearAgo && meetingDate <= oneYearFuture;
        }

        private bool BeValidUrlOrEmpty(string? url)
        {
            if (string.IsNullOrEmpty(url)) return true;
            return Uri.TryCreate(url, UriKind.Absolute, out var uriResult) 
                   && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
        }
    }

    /// <summary>
    /// Validator for DiscussionPointDto
    /// </summary>
    public class DiscussionPointDtoValidator : AbstractValidator<DiscussionPointDto>
    {
        public DiscussionPointDtoValidator()
        {
            RuleFor(x => x.PointText)
                .NotEmpty().WithMessage("Discussion point text is required")
                .MinimumLength(5).WithMessage("Discussion point must be at least 5 characters")
                .MaximumLength(2000).WithMessage("Discussion point cannot exceed 2000 characters");

            RuleFor(x => x.PointOrder)
                .GreaterThan(0).WithMessage("Point order must be greater than 0")
                .LessThanOrEqualTo(1000).WithMessage("Point order cannot exceed 1000");
        }
    }

    /// <summary>
    /// Validator for ActionItemDto
    /// </summary>
    public class ActionItemDtoValidator : AbstractValidator<ActionItemDto>
    {
        public ActionItemDtoValidator()
        {
            RuleFor(x => x.TaskDescription)
                .NotEmpty().WithMessage("Task description is required")
                .MinimumLength(5).WithMessage("Task description must be at least 5 characters")
                .MaximumLength(500).WithMessage("Task description cannot exceed 500 characters");

            RuleFor(x => x.AssignedToEmployeeId)
                .GreaterThan(0).WithMessage("Assigned employee ID must be greater than 0");

            RuleFor(x => x.DueDate)
                .NotEmpty().WithMessage("Due date is required")
                .Must(BeValidDueDate).WithMessage("Due date cannot be more than 30 days in the past or more than 2 years in the future");

            RuleFor(x => x.Status)
                .Must(BeValidStatus).WithMessage("Status must be 'Pending' or 'Completed'");
        }

        private bool BeValidDueDate(DateOnly dueDate)
        {
            var thirtyDaysAgo = DateOnly.FromDateTime(DateTime.Now.AddDays(-30));
            var twoYearsFuture = DateOnly.FromDateTime(DateTime.Now.AddYears(2));
            return dueDate >= thirtyDaysAgo && dueDate <= twoYearsFuture;
        }

        private bool BeValidStatus(string status)
        {
            return status == "Pending" || status == "Completed";
        }
    }

    /// <summary>
    /// Validator for ShareMomDto
    /// </summary>
    public class ShareMomDtoValidator : AbstractValidator<ShareMomDto>
    {
        public ShareMomDtoValidator()
        {
            RuleFor(x => x.MomId)
                .GreaterThan(0).WithMessage("MOM ID must be greater than 0");

            RuleFor(x => x.SharedWithEmployeeIds)
                .NotEmpty().WithMessage("At least one employee must be selected")
                .Must(x => x != null && x.Count > 0).WithMessage("At least one employee must be selected")
                .Must(x => x == null || x.Count <= 100).WithMessage("Cannot share with more than 100 employees at once")
                .Must(HaveUniqueEmployeeIds).WithMessage("Employee IDs must be unique");

            RuleForEach(x => x.SharedWithEmployeeIds)
                .GreaterThan(0).WithMessage("Employee ID must be greater than 0");
        }

        private bool HaveUniqueEmployeeIds(List<int>? employeeIds)
        {
            if (employeeIds == null) return true;
            return employeeIds.Count == employeeIds.Distinct().Count();
        }
    }

    /// <summary>
    /// Validator for MomFilterDto
    /// </summary>
    public class MomFilterDtoValidator : AbstractValidator<MomFilterDto>
    {
        public MomFilterDtoValidator()
        {
            RuleFor(x => x.PageNumber)
                .GreaterThanOrEqualTo(1).WithMessage("Page number must be at least 1");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100");

            RuleFor(x => x.SearchTerm)
                .MaximumLength(100).WithMessage("Search term cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.SearchTerm));

            RuleFor(x => x.StartDate)
                .LessThanOrEqualTo(x => x.EndDate)
                .WithMessage("Start date must be before or equal to end date")
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue);

            RuleFor(x => x.SortBy)
                .Must(BeValidSortField).WithMessage("Invalid sort field");

            RuleFor(x => x.SortOrder)
                .Must(order => order == "asc" || order == "desc")
                .WithMessage("Sort order must be 'asc' or 'desc'");
        }

        private bool BeValidSortField(string sortBy)
        {
            var validFields = new[] { "MeetingDate", "MeetingTitle", "CreatedAt", "UpdatedAt", "MeetingType" };
            return validFields.Contains(sortBy, StringComparer.OrdinalIgnoreCase);
        }
    }
}

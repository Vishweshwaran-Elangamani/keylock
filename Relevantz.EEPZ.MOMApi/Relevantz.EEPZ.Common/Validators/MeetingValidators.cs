using FluentValidation;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Common.Validators
{
    /// <summary>
    /// Validator for ScheduleMeetingDto
    /// </summary>
    public class ScheduleMeetingDtoValidator : AbstractValidator<ScheduleMeetingDto>
    {
        public ScheduleMeetingDtoValidator()
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
                .GreaterThanOrEqualTo(DateTime.Now.AddHours(-1)).WithMessage("Meeting date cannot be in the past")
                .LessThanOrEqualTo(DateTime.Now.AddYears(1)).WithMessage("Meeting date cannot be more than 1 year in the future");

            RuleFor(x => x.MeetingLink)
                .NotEmpty().WithMessage("Meeting link is required")
                .MaximumLength(500).WithMessage("Meeting link cannot exceed 500 characters")
                .Must(BeValidUrl).WithMessage("Meeting link must be a valid URL");

            RuleFor(x => x.Agenda)
                .MaximumLength(5000).WithMessage("Agenda cannot exceed 5000 characters")
                .When(x => !string.IsNullOrEmpty(x.Agenda));

            RuleFor(x => x.ParticipantEmployeeIds)
                .NotEmpty().WithMessage("At least one participant is required")
                .Must(x => x != null && x.Count > 0).WithMessage("At least one participant is required")
                .Must(x => x == null || x.Count <= 50).WithMessage("Maximum 50 participants allowed")
                .Must(HaveUniqueParticipantIds).WithMessage("Participant IDs must be unique");

            RuleForEach(x => x.ParticipantEmployeeIds)
                .GreaterThan(0).WithMessage("Participant employee ID must be greater than 0");
        }

        private bool BeValidMeetingType(string meetingType)
        {
            var validTypes = new[] { "One-on-One", "Team Meeting", "Presentation", "Other" };
            return validTypes.Contains(meetingType, StringComparer.OrdinalIgnoreCase);
        }

        private bool BeValidUrl(string url)
        {
            return Uri.TryCreate(url, UriKind.Absolute, out var uriResult) 
                   && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
        }

        private bool HaveUniqueParticipantIds(List<int>? participantIds)
        {
            if (participantIds == null) return true;
            return participantIds.Count == participantIds.Distinct().Count();
        }
    }

    /// <summary>
    /// Validator for MeetingFilterDto
    /// </summary>
    public class MeetingFilterDtoValidator : AbstractValidator<MeetingFilterDto>
    {
        public MeetingFilterDtoValidator()
        {
            RuleFor(x => x.MeetingType)
                .Must(BeValidMeetingType).WithMessage("Meeting type must be 'One-on-One', 'Team Meeting', 'Presentation', or 'Other'")
                .When(x => !string.IsNullOrEmpty(x.MeetingType));

            RuleFor(x => x.Status)
                .Must(BeValidStatus).WithMessage("Status must be 'Scheduled', 'Completed', or 'Cancelled'")
                .When(x => !string.IsNullOrEmpty(x.Status));

            RuleFor(x => x.ParticipantEmployeeId)
                .GreaterThan(0).WithMessage("Participant employee ID must be greater than 0")
                .When(x => x.ParticipantEmployeeId.HasValue);

            RuleFor(x => x.StartDate)
                .LessThanOrEqualTo(x => x.EndDate)
                .WithMessage("Start date must be before or equal to end date")
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue);

            RuleFor(x => x.PageNumber)
                .GreaterThanOrEqualTo(1).WithMessage("Page number must be at least 1");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100");
        }

        private bool BeValidMeetingType(string meetingType)
        {
            var validTypes = new[] { "One-on-One", "Team Meeting", "Presentation", "Other" };
            return validTypes.Contains(meetingType, StringComparer.OrdinalIgnoreCase);
        }

        private bool BeValidStatus(string status)
        {
            var validStatuses = new[] { "Scheduled", "Completed", "Cancelled" };
            return validStatuses.Contains(status, StringComparer.OrdinalIgnoreCase);
        }
    }
}

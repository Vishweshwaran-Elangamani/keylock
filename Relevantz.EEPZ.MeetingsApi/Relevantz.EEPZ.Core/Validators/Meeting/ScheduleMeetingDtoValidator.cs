using FluentValidation;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Validators.Meeting
{
    public class ScheduleMeetingDtoValidator : AbstractValidator<ScheduleMeetingDto>
    {
        public ScheduleMeetingDtoValidator()
        {
            RuleFor(x => x.MeetingTitle)
                .NotEmpty().WithMessage("Meeting title is required.")
                .Length(1, 200).WithMessage("Meeting title cannot exceed 200 characters.");
            
            RuleFor(x => x.MeetingDate)
                .GreaterThan(DateTime.Now).WithMessage("Meeting date must be in the future.");

            RuleFor(x => x.MeetingLink)
                .MaximumLength(500).WithMessage("Meeting link cannot exceed 500 characters.");

            RuleFor(x => x.ParticipantEmployeeIds)
                .NotEmpty().WithMessage("At least one participant is required.");
        }
    }
}

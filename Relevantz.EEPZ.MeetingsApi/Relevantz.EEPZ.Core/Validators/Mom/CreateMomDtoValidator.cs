using FluentValidation;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Validators.Mom
{
    public class CreateMomDtoValidator : AbstractValidator<CreateMomDto>
    {
        public CreateMomDtoValidator()
        {
            RuleFor(x => x.MeetingTitle)
                .NotEmpty().WithMessage("Meeting title is required.")
                .Length(1, 200).WithMessage("Meeting title cannot exceed 200 characters.");
            
            RuleFor(x => x.MeetingDate)
                .GreaterThan(DateTime.Now).WithMessage("Meeting date must be in the future.");

            RuleFor(x => x.MeetingLink)
                .MaximumLength(500).WithMessage("Meeting link cannot exceed 500 characters.");

            RuleFor(x => x.Attendees)
                .NotEmpty().WithMessage("Attendees are required.");
            
            RuleForEach(x => x.DiscussionPoints)
                .NotEmpty().WithMessage("Discussion points are required.");

            RuleForEach(x => x.ActionItems)
                .NotEmpty().WithMessage("Action items are required.");
        }
    }
}

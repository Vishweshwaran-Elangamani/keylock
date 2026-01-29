using FluentValidation;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Validators.Rvsp
{
    public class RsvpResponseDtoValidator : AbstractValidator<RsvpResponseDto>
    {
        public RsvpResponseDtoValidator()
        {
            RuleFor(x => x.MeetingId)
                .GreaterThan(0).WithMessage("Meeting ID must be greater than 0.");
            
            RuleFor(x => x.RsvpStatus)
                .IsInEnum().WithMessage("Invalid RSVP status.");
            
            RuleFor(x => x.RsvpComments)
                .MaximumLength(500).WithMessage("RSVP comments cannot exceed 500 characters.");
        }
    }
}

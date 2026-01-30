using FluentValidation;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Common.Validators
{
    /// <summary>
    /// Validator for RsvpResponseDto
    /// </summary>
    public class RsvpResponseDtoValidator : AbstractValidator<RsvpResponseDto>
    {
        public RsvpResponseDtoValidator()
        {
            RuleFor(x => x.MeetingId)
                .GreaterThan(0).WithMessage("Meeting ID must be greater than 0");

            RuleFor(x => x.RsvpStatus)
                .NotEmpty().WithMessage("RSVP status is required")
                .Must(BeValidRsvpStatus).WithMessage("RSVP status must be 'Accepted', 'Declined', or 'Tentative'");

            RuleFor(x => x.RsvpComments)
                .MaximumLength(500).WithMessage("Comments cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.RsvpComments));
        }

        private bool BeValidRsvpStatus(string status)
        {
            var validStatuses = new[] { "Accepted", "Declined", "Tentative" };
            return validStatuses.Contains(status, StringComparer.OrdinalIgnoreCase);
        }
    }
}

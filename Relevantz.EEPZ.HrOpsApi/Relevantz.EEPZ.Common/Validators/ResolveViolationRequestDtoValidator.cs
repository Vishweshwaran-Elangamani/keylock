using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class ResolveViolationRequestDtoValidator : AbstractValidator<ResolveViolationRequestDto>
    {
        public ResolveViolationRequestDtoValidator()
        {
            RuleFor(x => x.ResolutionNotes)
                .NotEmpty().WithMessage("Resolution notes are required")
                .MinimumLength(10).WithMessage("Resolution notes must be at least 10 characters")
                .MaximumLength(2000).WithMessage("Resolution notes cannot exceed 2000 characters");
        }
    }
}

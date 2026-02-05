using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class AcknowledgeRequestDtoValidator : AbstractValidator<AcknowledgeRequestDto>
    {
        public AcknowledgeRequestDtoValidator()
        {
            RuleFor(x => x.ApprovalId)
                .GreaterThan(0)
                .WithMessage("ApprovalId is required");

            RuleFor(x => x.Comments)
                .NotEmpty()
                .WithMessage("Comments are required")
                .MinimumLength(10)
                .WithMessage("Please provide at least 10 characters")
                .MaximumLength(2000)
                .WithMessage("Comments cannot exceed 2000 characters");
        }
    }
}
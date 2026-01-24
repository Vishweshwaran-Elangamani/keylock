using FluentValidation;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;

namespace Relevantz.EEPZ.Common.Validators.InternalOpportunity
{
    public class ManagerReviewRequestDtoValidator : AbstractValidator<ManagerReviewRequestDto>
    {
        public ManagerReviewRequestDtoValidator()
        {
            RuleFor(x => x.ActionTaken)
                .NotEmpty().WithMessage("Action is required")
                .MaximumLength(20).WithMessage("Action cannot exceed 20 characters")
                .Must(action => new[] { "Approved", "Rejected"}.Contains(action))
                .WithMessage("Invalid action. Must be 'Approved', or 'Rejected'");

            RuleFor(x => x.Remarks)
                .MaximumLength(500).WithMessage("Remarks cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.Remarks));

            RuleFor(x => x.Remarks)
                .NotEmpty().WithMessage("Remarks are required when Rejecting")
                .When(x => x.ActionTaken == "Rejected");
        }
    }
}

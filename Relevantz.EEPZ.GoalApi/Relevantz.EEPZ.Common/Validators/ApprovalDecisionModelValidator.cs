using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class ApprovalDecisionModelValidator : AbstractValidator<ApprovalDesicionModel>
    {
        private static readonly string[] ValidDecisions = { "approved", "rejected" };

        public ApprovalDecisionModelValidator()
        {
            RuleFor(x => x.Decision)
                .NotEmpty()
                .WithMessage("Decision is required")
                .Must(BeValidDecision)
                .WithMessage("Decision must be either 'approved' or 'rejected'");

            RuleFor(x => x.NewDeadline)
                .GreaterThan(DateTime.UtcNow)
                .WithMessage("New deadline must be in the future")
                .When(x => x.NewDeadline.HasValue);
        }

        private bool BeValidDecision(string decision)
        {
            if (string.IsNullOrEmpty(decision))
                return false;
            return ValidDecisions.Contains(decision.ToLower().Trim());
        }
    }
}

using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class ApprovalDecisionRequestModelValidator : AbstractValidator<ApprovalDecisionRequestModel>
    {
        public ApprovalDecisionRequestModelValidator()
        {
            RuleFor(x => x.ApprovalId)
                .GreaterThan(0).WithMessage("ApprovalId must be greater than 0");

            RuleFor(x => x.IsApproved)
                .NotNull().WithMessage("Approval decision must be provided");

            RuleFor(x => x.Notes)
                .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters");
        }
    }
}

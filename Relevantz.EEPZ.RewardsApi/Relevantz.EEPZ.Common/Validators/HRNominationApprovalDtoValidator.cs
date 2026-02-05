using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Response;
using System.Linq;

namespace Relevantz.EEPZ.Common.Validators
{
    public class HRNominationApprovalDtoValidator : AbstractValidator<HRNominationApprovalDto>
    {
        public HRNominationApprovalDtoValidator()
        {
            RuleLevelCascadeMode = CascadeMode.Stop;

            RuleFor(x => x.HrUserId)
                .GreaterThan(0)
                .WithMessage("HrUserId must be greater than 0.");

            RuleFor(x => x.SelectedNominationIds)
                .NotNull().WithMessage("No nominations selected.")
                .NotEmpty().WithMessage("No nominations selected.")
                .Must(list => list.Distinct().Count() == list.Count)
                    .WithMessage("Duplicate nomination IDs are not allowed.")
                .Must(list => list.Count <= 3)
                    .WithMessage("Maximum 3 nominees can be selected per opportunity.");

            RuleForEach(x => x.SelectedNominationIds)
                .GreaterThan(0)
                .WithMessage("NominationId must be greater than 0.");

            RuleFor(x => x.ApprovalRemarks)
                .MaximumLength(1000)
                .When(x => !string.IsNullOrWhiteSpace(x.ApprovalRemarks))
                .WithMessage("ApprovalRemarks cannot exceed 1000 characters.");
        }
    }
}
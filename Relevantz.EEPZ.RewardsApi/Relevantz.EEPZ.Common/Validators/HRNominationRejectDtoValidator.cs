using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Response;
using System.Linq;

namespace Relevantz.EEPZ.Common.Validators
{
    public class HRNominationRejectDtoValidator : AbstractValidator<HRNominationRejectDto>
    {
        public HRNominationRejectDtoValidator()
        {
            RuleLevelCascadeMode = CascadeMode.Stop;

            RuleFor(x => x.HrUserId)
                .GreaterThan(0)
                .WithMessage("HrUserId must be greater than 0.");

            RuleFor(x => x.SelectedNominationIds)
                .NotNull().WithMessage("No nominations selected.")
                .NotEmpty().WithMessage("No nominations selected.")
                .Must(list => list.Distinct().Count() == list.Count)
                    .WithMessage("Duplicate nomination IDs are not allowed.");

            RuleForEach(x => x.SelectedNominationIds)
                .GreaterThan(0)
                .WithMessage("NominationId must be greater than 0.");

            RuleFor(x => x.RejectionRemarks)
                .NotEmpty()
                .WithMessage("RejectionRemarks is required.")
                .MaximumLength(1000)
                .WithMessage("RejectionRemarks cannot exceed 1000 characters.");
        }
    }
}
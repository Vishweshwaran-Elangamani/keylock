using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
using System.Linq;

namespace Relevantz.EEPZ.Common.Validators
{
    public class NominationSubmitDtoValidator : AbstractValidator<NominationSubmitDto>
    {
        public NominationSubmitDtoValidator()
        {
            RuleLevelCascadeMode = CascadeMode.Stop;

            RuleFor(x => x.RewardTypeId)
                .NotNull()
                .WithMessage("Reward Type is required.")
                .GreaterThan(0)
                .WithMessage("Reward Type is required.");

            RuleFor(x => x.NomineeEmployeeId)
                .GreaterThan(0)
                .WithMessage("NomineeEmployeeId must be greater than 0.");

            RuleFor(x => x.NominatedByEmployeeId)
                .GreaterThan(0)
                .WithMessage("NominatedByEmployeeId must be greater than 0.");

            RuleFor(x => x.Justification)
                .NotEmpty()
                .WithMessage("Justification is required.")
                .MaximumLength(2000)
                .WithMessage("Justification cannot exceed 2000 characters.");

            // ParameterValues is optional — validate only if present
            RuleFor(x => x.ParameterValues)
                .Must(list => list == null || list.All(i => i != null))
                .WithMessage("ParameterValues cannot contain null entries.");

            RuleForEach(x => x.ParameterValues)
                .SetValidator(new ParameterValueDtoValidator())
                .When(x => x.ParameterValues != null);

            // Optional but recommended: no duplicate ParameterId
            RuleFor(x => x.ParameterValues)
                .Must(list =>
                {
                    if (list == null || list.Count == 0) return true;
                    return list.Select(p => p.ParameterId).Distinct().Count() == list.Count;
                })
                .When(x => x.ParameterValues != null && x.ParameterValues.Any())
                .WithMessage("Duplicate ParameterId found in ParameterValues.");
        }
    }
}
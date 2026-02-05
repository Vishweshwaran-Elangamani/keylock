using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class ParameterValueDtoValidator : AbstractValidator<ParameterValueDto>
    {
        public ParameterValueDtoValidator()
        {
            RuleLevelCascadeMode = CascadeMode.Stop;

            RuleFor(x => x.ParameterId)
                .GreaterThan(0)
                .WithMessage("ParameterId must be greater than 0.");

            RuleFor(x => x.Value)
                .NotNull()
                .WithMessage("Value cannot be null.");

            RuleFor(x => x.Value)
                .MaximumLength(2000)
                .When(x => x.Value != null)
                .WithMessage("Value cannot exceed 2000 characters.");
        }
    }
}
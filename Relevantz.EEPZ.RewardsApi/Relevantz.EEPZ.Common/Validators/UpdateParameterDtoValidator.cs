using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdateParameterDtoValidator : AbstractValidator<UpdateParameterDto>
    {
        public UpdateParameterDtoValidator()
        {
            RuleLevelCascadeMode = CascadeMode.Stop;

            RuleFor(x => x.ParameterName)
                .NotEmpty().WithMessage("ParameterName is required.")
                .MaximumLength(150).WithMessage("ParameterName cannot exceed 150 characters.");

            RuleFor(x => x.ParameterType)
                .NotEmpty().WithMessage("ParameterType is required.")
                .MaximumLength(50).WithMessage("ParameterType cannot exceed 50 characters.");

            RuleFor(x => x.PlaceholderText)
                .MaximumLength(250).WithMessage("PlaceholderText cannot exceed 250 characters.")
                .When(x => x.PlaceholderText != null);

            RuleFor(x => x.SortOrder)
                .GreaterThanOrEqualTo(0)
                .WithMessage("SortOrder must be 0 or greater.");

            RuleFor(x => x)
                .Must(x => !(x.MinimumValue.HasValue && x.MaximumValue.HasValue) || x.MinimumValue <= x.MaximumValue)
                .WithMessage("MinimumValue cannot be greater than MaximumValue.");
        }
    }
}
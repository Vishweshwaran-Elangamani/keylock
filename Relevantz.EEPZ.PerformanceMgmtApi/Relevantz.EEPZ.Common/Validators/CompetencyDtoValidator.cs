using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class CompetencyDtoValidator : AbstractValidator<CompetencyDto>
    {
        public CompetencyDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Competency name is required.")
                .MaximumLength(200).WithMessage("Competency name cannot exceed 200 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Competency description cannot exceed 2000 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Description));

            RuleFor(x => x.DisplayOrder)
                .GreaterThanOrEqualTo(0).WithMessage("DisplayOrder cannot be negative.")
                .When(x => x.DisplayOrder.HasValue);
        }
    }
}
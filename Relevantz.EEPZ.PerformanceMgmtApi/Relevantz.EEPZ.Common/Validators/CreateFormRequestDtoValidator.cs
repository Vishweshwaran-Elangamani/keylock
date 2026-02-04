using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class CreateFormRequestDtoValidator : AbstractValidator<CreateFormRequestDto>
    {
        public CreateFormRequestDtoValidator()
        {
            RuleFor(x => x.CreatedBy)
                .GreaterThan(0).WithMessage("CreatedBy must be greater than 0.");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Form name is required.")
                .MaximumLength(200).WithMessage("Form name cannot exceed 200 characters.");

            RuleFor(x => x.Type)
                .NotEmpty().WithMessage("Form type is required.")
                .MaximumLength(50).WithMessage("Form type cannot exceed 50 characters.");

            RuleFor(x => x.DeliveryEnablement)
                .NotEmpty().WithMessage("DeliveryEnablement is required.")
                .MaximumLength(100).WithMessage("DeliveryEnablement cannot exceed 100 characters.");

            RuleFor(x => x.Competencies)
                .NotNull().WithMessage("At least one competency is required.")
                .Must(c => c != null && c.Any()).WithMessage("At least one competency is required.");

            RuleForEach(x => x.Competencies)
                .SetValidator(new CompetencyDtoValidator());

            RuleFor(x => x.Competencies)
                .Must(list =>
                {
                    if (list == null) return true;
                    var names = list
                        .Where(c => !string.IsNullOrWhiteSpace(c.Name))
                        .Select(c => c.Name.Trim().ToLowerInvariant())
                        .ToList();

                    return names.Distinct().Count() == names.Count;
                })
                .WithMessage("Competency names must be unique.")
                .When(x => x.Competencies != null);
        }
    }
}
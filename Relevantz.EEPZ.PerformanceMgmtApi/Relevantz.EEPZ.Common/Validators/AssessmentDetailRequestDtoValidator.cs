using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class AssessmentDetailRequestDtoValidator : AbstractValidator<AssessmentDetailRequestDto>
    {
        public AssessmentDetailRequestDtoValidator()
        {
            RuleFor(x => x.CompetencyId)
                .GreaterThan(0)
                .WithMessage("CompetencyId must be greater than 0.");

            RuleFor(x => x.EmployeeRating)
                .InclusiveBetween(1, 5)
                .When(x => x.EmployeeRating.HasValue)
                .WithMessage("EmployeeRating must be between 1 and 5.");

            RuleFor(x => x.EmployeeComments)
                .MaximumLength(2000)
                .When(x => !string.IsNullOrWhiteSpace(x.EmployeeComments))
                .WithMessage("EmployeeComments must not exceed 2000 characters.");
        }
    }
}
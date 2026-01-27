using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class CreateCostMappingRequestDtoValidator : AbstractValidator<CreateCostMappingRequestDto>
    {
        public CreateCostMappingRequestDtoValidator()
        {
            RuleFor(x => x.DepartmentId)
                .NotEmpty().WithMessage("Department ID is required")
                .GreaterThan(0).WithMessage("Department ID must be greater than 0");

            RuleFor(x => x.FiscalYear)
                .NotEmpty().WithMessage("Fiscal year is required")
                .InclusiveBetween(2020, 2100).WithMessage("Fiscal year must be between 2020 and 2100");

            RuleFor(x => x.TotalBudget)
                .NotEmpty().WithMessage("Total budget is required")
                .GreaterThan(0).WithMessage("Total budget must be greater than 0")
                .LessThanOrEqualTo(999999999.99m).WithMessage("Total budget must be between 0 and 999,999,999.99");

            RuleFor(x => x.Headcount)
                .GreaterThanOrEqualTo(0).WithMessage("Headcount must be a non-negative number")
                .When(x => x.Headcount.HasValue);
        }
    }
}

using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class CreatePeriodAllocationDtoValidator : AbstractValidator<CreatePeriodAllocationDto>
    {
        public CreatePeriodAllocationDtoValidator()
        {
            RuleFor(x => x.BudgetId)
                .GreaterThan(0).WithMessage("Budget ID must be greater than 0");

            RuleFor(x => x.Period)
                .NotEmpty().WithMessage("Period is required")
                .MaximumLength(20).WithMessage("Period cannot exceed 20 characters");

            RuleFor(x => x.PeriodYear)
                .GreaterThan(0).WithMessage("Period year is required and must be greater than 0")
                .InclusiveBetween(2020, 2100).WithMessage("Period year must be between 2020 and 2100");

            RuleFor(x => x.AllocatedAmount)
                .GreaterThan(0).WithMessage("Allocated amount must be greater than 0")
                .LessThanOrEqualTo(999999999.99m).WithMessage("Allocated amount cannot exceed 999,999,999.99");

            RuleFor(x => x.AllocatedByUserId)
                .GreaterThan(0).WithMessage("Allocated By User ID must be greater than 0");

            RuleFor(x => x.Notes)
                .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Notes));
        }
    }
}

using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdateCostMappingRequestDtoValidator : AbstractValidator<UpdateCostMappingRequestDto>
    {
        public UpdateCostMappingRequestDtoValidator()
        {
            RuleFor(x => x.BudgetId)
                .NotEmpty().WithMessage("Budget ID is required")
                .GreaterThan(0).WithMessage("Budget ID must be greater than 0");

            RuleFor(x => x.TotalBudget)
                .GreaterThan(0).WithMessage("Total budget must be greater than 0")
                .LessThanOrEqualTo(999999999.99m).WithMessage("Total budget must be between 0 and 999,999,999.99")
                .When(x => x.TotalBudget.HasValue);

            RuleFor(x => x.AllocatedAmount)
                .GreaterThanOrEqualTo(0).WithMessage("Allocated amount must be non-negative")
                .LessThanOrEqualTo(999999999.99m).WithMessage("Allocated amount must be between 0 and 999,999,999.99")
                .LessThanOrEqualTo(x => x.TotalBudget ?? decimal.MaxValue).WithMessage("Allocated amount cannot exceed total budget")
                .When(x => x.AllocatedAmount.HasValue);

            RuleFor(x => x.UtilizedAmount)
                .GreaterThanOrEqualTo(0).WithMessage("Utilized amount must be non-negative")
                .LessThanOrEqualTo(999999999.99m).WithMessage("Utilized amount must be between 0 and 999,999,999.99")
                .LessThanOrEqualTo(x => x.AllocatedAmount ?? decimal.MaxValue).WithMessage("Utilized amount cannot exceed allocated amount")
                .When(x => x.UtilizedAmount.HasValue);

            RuleFor(x => x.Headcount)
                .GreaterThanOrEqualTo(0).WithMessage("Headcount must be a non-negative number")
                .When(x => x.Headcount.HasValue);
        }
    }
}

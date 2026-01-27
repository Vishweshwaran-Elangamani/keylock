using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdateDepartmentBudgetDtoValidator : AbstractValidator<UpdateDepartmentBudgetDto>
    {
        public UpdateDepartmentBudgetDtoValidator()
        {
            RuleFor(x => x.BudgetId)
                .GreaterThan(0).WithMessage("Budget ID must be greater than 0");

            RuleFor(x => x.DepartmentId)
                .GreaterThan(0).WithMessage("Department ID must be greater than 0");

            RuleFor(x => x.FiscalYear)
                .GreaterThan(0).WithMessage("Fiscal year must be greater than 0")
                .InclusiveBetween(2020, 2100).WithMessage("Fiscal year must be between 2020 and 2100");

            RuleFor(x => x.TotalBudget)
                .GreaterThan(0).WithMessage("Total budget must be greater than 0")
                .LessThanOrEqualTo(999999999.99m).WithMessage("Total budget cannot exceed 999,999,999.99");

            RuleFor(x => x.AllocatedAmount)
                .GreaterThanOrEqualTo(0).WithMessage("Allocated amount must be non-negative")
                .LessThanOrEqualTo(x => x.TotalBudget).WithMessage("Allocated amount cannot exceed total budget");
        }
    }
}

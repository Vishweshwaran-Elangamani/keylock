using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdateUtilizedAmountDtoValidator : AbstractValidator<UpdateUtilizedAmountDto>
    {
        public UpdateUtilizedAmountDtoValidator()
        {
            RuleFor(x => x.BudgetId)
                .GreaterThan(0).WithMessage("Budget ID must be greater than 0");

            RuleFor(x => x.UtilizedAmount)
                .GreaterThanOrEqualTo(0).WithMessage("Utilized amount must be non-negative")
                .LessThanOrEqualTo(999999999.99m).WithMessage("Utilized amount cannot exceed 999,999,999.99");
        }
    }
}

using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class CreateFundAllocationRequestDtoValidator : AbstractValidator<CreateFundAllocationRequestDto>
    {
        public CreateFundAllocationRequestDtoValidator()
        {
            RuleFor(x => x.BudgetId)
                .GreaterThan(0).WithMessage("Budget ID must be greater than 0");

            RuleFor(x => x.DepartmentId)
                .GreaterThan(0).WithMessage("Department ID must be greater than 0");

            RuleFor(x => x.EmployeeUserId)
                .GreaterThan(0).WithMessage("Employee User ID must be greater than 0")
                .When(x => x.EmployeeUserId.HasValue);

            RuleFor(x => x.AllocationType)
                .NotEmpty().WithMessage("Allocation type is required")
                .MaximumLength(50).WithMessage("Allocation type cannot exceed 50 characters");

            RuleFor(x => x.Amount)
                .GreaterThan(0).WithMessage("Amount must be greater than 0")
                .LessThanOrEqualTo(999999999.99m).WithMessage("Amount cannot exceed 999,999,999.99");

            RuleFor(x => x.GoalStatus)
                .MaximumLength(50).WithMessage("Goal status cannot exceed 50 characters")
                .When(x => !string.IsNullOrEmpty(x.GoalStatus));

            RuleFor(x => x.Notes)
                .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Notes));

            RuleFor(x => x.AllocatedByUserId)
                .GreaterThan(0).WithMessage("Allocated By User ID must be greater than 0");

            RuleFor(x => x.Period)
                .MaximumLength(20).WithMessage("Period cannot exceed 20 characters")
                .When(x => !string.IsNullOrEmpty(x.Period));

            RuleFor(x => x.PeriodYear)
                .GreaterThan(0).WithMessage("Period year must be greater than 0")
                .InclusiveBetween(2020, 2100).WithMessage("Period year must be between 2020 and 2100")
                .When(x => x.PeriodYear.HasValue);
        }
    }
}

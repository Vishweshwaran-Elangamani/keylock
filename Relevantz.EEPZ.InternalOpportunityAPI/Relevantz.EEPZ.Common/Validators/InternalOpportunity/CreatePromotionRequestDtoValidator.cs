using FluentValidation;
using Relevantz.EEPZ.Common.ViewModels.Promotion.Request;

namespace Relevantz.EEPZ.Common.Validators.InternalOpportunity
{
    public class CreatePromotionRequestDtoValidator : AbstractValidator<CreatePromotionRequestDto>
    {
        public CreatePromotionRequestDtoValidator()
        {
            RuleFor(x => x.NominationId)
                .GreaterThan(0).WithMessage("Nomination ID must be greater than 0")
                .When(x => x.NominationId > 0);

            RuleFor(x => x.EmployeeUserId)
                .GreaterThan(0).WithMessage("Employee User ID must be greater than 0")
                .When(x => x.EmployeeUserId > 0);

            RuleFor(x => x.DepartmentId)
                .GreaterThan(0).WithMessage("Department ID must be greater than 0")
                .When(x => x.DepartmentId > 0);

            RuleFor(x => x.OldRole)
                .MaximumLength(100).WithMessage("Old role cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.OldRole));

            RuleFor(x => x.NewRole)
                .NotEmpty().WithMessage("New role is required")
                .MaximumLength(100).WithMessage("New role cannot exceed 100 characters");

            RuleFor(x => x.OldSalary)
                .GreaterThanOrEqualTo(0).WithMessage("Old salary must be non-negative")
                .When(x => x.OldSalary.HasValue);

            RuleFor(x => x.NewSalary)
                .GreaterThan(0).WithMessage("New salary must be greater than 0")
                .GreaterThanOrEqualTo(x => x.OldSalary ?? 0)
                .WithMessage("New salary must be greater than or equal to old salary")
                .When(x => x.OldSalary.HasValue);

            RuleFor(x => x.IncrementPercentage)
                .GreaterThanOrEqualTo(0).WithMessage("Increment percentage must be non-negative")
                .LessThanOrEqualTo(100).WithMessage("Increment percentage cannot exceed 100%")
                .When(x => x.IncrementPercentage.HasValue);

            RuleFor(x => x.PromotionDate)
                .NotEmpty().WithMessage("Promotion date is required")
                .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.Today))
                .WithMessage("Promotion date cannot be in the past");

            RuleFor(x => x.Justification)
                .MaximumLength(1000).WithMessage("Justification cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Justification));
        }
    }
}

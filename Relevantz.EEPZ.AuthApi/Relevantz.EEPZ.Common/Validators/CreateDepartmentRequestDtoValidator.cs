using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
namespace Relevantz.EEPZ.Common.Validators
{
    public class CreateDepartmentRequestDtoValidator : AbstractValidator<CreateDepartmentRequestDto>
    {
        public CreateDepartmentRequestDtoValidator()
        {
            RuleFor(x => x.DepartmentName)
                .NotEmpty().WithMessage("Department Name is required")
                .MaximumLength(100).WithMessage("Department Name cannot exceed 100 characters");
            RuleFor(x => x.DepartmentCode)
                .NotEmpty().WithMessage("Department Code is required")
                .MaximumLength(20).WithMessage("Department Code cannot exceed 20 characters")
                .Matches(@"^[A-Z0-9_-]+$").WithMessage("Department Code must contain only uppercase letters, numbers, hyphens, and underscores");
            RuleFor(x => x.Description)
                .MaximumLength(255).WithMessage("Description cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));
            RuleFor(x => x.Status)
                .NotEmpty().WithMessage("Status is required")
                .Must(status => new[] { "Active", "Inactive" }.Contains(status))
                .WithMessage("Status must be either 'Active' or 'Inactive'");
            RuleFor(x => x.ParentDepartmentId)
                .GreaterThan(0).WithMessage("Parent Department ID must be greater than 0")
                .When(x => x.ParentDepartmentId.HasValue);
            RuleFor(x => x.HodEmployeeId)
                .GreaterThan(0).WithMessage("HOD Employee ID must be greater than 0")
                .When(x => x.HodEmployeeId.HasValue);
            RuleFor(x => x.BudgetAllocated)
                .GreaterThanOrEqualTo(0).WithMessage("Budget Allocated must be non-negative")
                .When(x => x.BudgetAllocated.HasValue);
            RuleFor(x => x.CostCenter)
                .MaximumLength(50).WithMessage("Cost Center cannot exceed 50 characters")
                .When(x => !string.IsNullOrEmpty(x.CostCenter));
        }
    }
}

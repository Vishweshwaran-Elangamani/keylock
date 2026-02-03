using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class BulkUserCreateRequestDtoValidator : AbstractValidator<BulkUserCreateRequestDto>
    {
        public BulkUserCreateRequestDtoValidator()
        {
            RuleFor(x => x.Users)
                .NotNull().WithMessage("Users list cannot be null")
                .NotEmpty().WithMessage("Users list cannot be empty")
                .Must(users => users.Count <= 100).WithMessage("Cannot create more than 100 users at once");

            RuleForEach(x => x.Users).ChildRules(user =>
            {
                user.RuleFor(u => u.Email)
                    .NotEmpty().WithMessage("Email is required")
                    .EmailAddress().WithMessage("Invalid email format")
                    .MaximumLength(255).WithMessage("Email cannot exceed 255 characters");

                user.RuleFor(u => u.FirstName)
                    .NotEmpty().WithMessage("First name is required")
                    .MaximumLength(50).WithMessage("First name cannot exceed 50 characters");

                user.RuleFor(u => u.LastName)
                    .NotEmpty().WithMessage("Last name is required")
                    .MaximumLength(50).WithMessage("Last name cannot exceed 50 characters");

                user.RuleFor(u => u.RoleId)
                    .GreaterThan(0).WithMessage("Valid role ID is required");

                user.RuleFor(u => u.DepartmentId)
                    .GreaterThan(0).WithMessage("Valid department ID is required");
            });
        }
    }

     public class BulkUserInactivateRequestDtoValidator : AbstractValidator<BulkUserInactivateRequestDto>
    {
        public BulkUserInactivateRequestDtoValidator()
        {
            RuleFor(x => x.UserIds)
                .NotNull().WithMessage("User IDs list cannot be null")
                .NotEmpty().WithMessage("User IDs list cannot be empty")
                .Must(ids => ids.Count <= 100).WithMessage("Cannot inactivate more than 100 users at once");

            RuleForEach(x => x.UserIds)
                .GreaterThan(0).WithMessage("All user IDs must be greater than 0");
        }
    }
}

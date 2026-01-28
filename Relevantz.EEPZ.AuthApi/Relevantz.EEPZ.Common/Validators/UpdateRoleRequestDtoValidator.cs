using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdateRoleRequestDtoValidator : AbstractValidator<UpdateRoleRequestDto>
    {
        public UpdateRoleRequestDtoValidator()
        {
            RuleFor(x => x.RoleId)
                .NotEmpty().WithMessage("Role ID is required")
                .GreaterThan(0).WithMessage("Role ID must be greater than 0");
            RuleFor(x => x.RoleName)
                .MaximumLength(50).WithMessage("Role Name cannot exceed 50 characters")
                .Matches(@"^[a-zA-Z0-9\s_-]+$").WithMessage("Role Name can only contain letters, numbers, spaces, underscores, and hyphens")
                .When(x => !string.IsNullOrEmpty(x.RoleName));
            RuleFor(x => x.RoleCode)
                .MaximumLength(20).WithMessage("Role Code cannot exceed 20 characters")
                .Matches(@"^[A-Z0-9_-]+$").WithMessage("Role Code must contain only uppercase letters, numbers, underscores, and hyphens")
                .When(x => !string.IsNullOrEmpty(x.RoleCode));
            RuleFor(x => x.Description)
                .MaximumLength(255).WithMessage("Description cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));
        }
    }
}

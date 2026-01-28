using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
namespace Relevantz.EEPZ.Common.Validators
{
    public class CreateRoleRequestDtoValidator : AbstractValidator<CreateRoleRequestDto>
    {
        public CreateRoleRequestDtoValidator()
        {
            RuleFor(x => x.RoleName)
                .NotEmpty().WithMessage("Role Name is required")
                .MaximumLength(50).WithMessage("Role Name cannot exceed 50 characters")
                .Matches(@"^[a-zA-Z0-9\s_-]+$").WithMessage("Role Name can only contain letters, numbers, spaces, underscores, and hyphens");
            RuleFor(x => x.RoleCode)
                .NotEmpty().WithMessage("Role Code is required")
                .MaximumLength(20).WithMessage("Role Code cannot exceed 20 characters")
                .Matches(@"^[A-Z0-9_-]+$").WithMessage("Role Code must contain only uppercase letters, numbers, underscores, and hyphens");
            RuleFor(x => x.Description)
                .MaximumLength(255).WithMessage("Description cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));
        }
    }
}

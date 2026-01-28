using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
namespace Relevantz.EEPZ.Common.Validators
{
    public class LoginRequestDtoValidator : AbstractValidator<LoginRequestDto>
    {
        public LoginRequestDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(255).WithMessage("Email cannot exceed 255 characters");
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MaximumLength(100).WithMessage("Password cannot exceed 100 characters");
            RuleFor(x => x.IpAddress)
                .MaximumLength(50).WithMessage("IP Address cannot exceed 50 characters")
                .When(x => !string.IsNullOrEmpty(x.IpAddress));
            RuleFor(x => x.UserAgent)
                .MaximumLength(500).WithMessage("User Agent cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.UserAgent));
        }
    }
}

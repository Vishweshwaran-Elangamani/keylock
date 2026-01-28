using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
using static Relevantz.EEPZ.Common.Constants.Constants;
namespace Relevantz.EEPZ.Common.Validators
{
    public class ChangeRequestDtoValidator : AbstractValidator<ChangeRequestDto>
    {
        public ChangeRequestDtoValidator()
        {
            RuleFor(x => x.ChangeType)
                .NotEmpty().WithMessage("Change Type is required")
                .Must(type => new[] 
                { 
                    ChangeTypes.Email,
                    ChangeTypes.EmployeeCompanyId,
                    ChangeTypes.Mobile,
                    ChangeTypes.Address,
                    ChangeTypes.Username
                }.Contains(type))
                .WithMessage("Invalid Change Type");
            RuleFor(x => x.NewEmployeeCompanyId)
                .NotEmpty().WithMessage("New Employee Company ID is required")
                .MaximumLength(50).WithMessage("New Employee Company ID cannot exceed 50 characters")
                .When(x => x.ChangeType == ChangeTypes.EmployeeCompanyId);
            RuleFor(x => x.NewEmail)
                .NotEmpty().WithMessage("New Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(255).WithMessage("Email cannot exceed 255 characters")
                .When(x => x.ChangeType == ChangeTypes.Email);
            RuleFor(x => x.NewValue)
                .NotEmpty().WithMessage("New Value is required")
                .When(x => !new[] { ChangeTypes.Email, ChangeTypes.EmployeeCompanyId }.Contains(x.ChangeType));
            RuleFor(x => x.Reason)
                .MaximumLength(1000).WithMessage("Reason cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Reason));
            RuleFor(x => x.CurrentPassword)
                .NotEmpty().WithMessage("Current password is required for verification")
                .MaximumLength(100).WithMessage("Password cannot exceed 100 characters");
        }
    }
}

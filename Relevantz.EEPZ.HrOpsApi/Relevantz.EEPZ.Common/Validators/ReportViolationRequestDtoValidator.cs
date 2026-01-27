using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class ReportViolationRequestDtoValidator : AbstractValidator<ReportViolationRequestDto>
    {
        public ReportViolationRequestDtoValidator()
        {
            RuleFor(x => x.EmployeeUserId)
                .NotEmpty().WithMessage("Employee user ID is required")
                .GreaterThan(0).WithMessage("Employee user ID must be greater than 0");

            RuleFor(x => x.PolicyId)
                .GreaterThan(0).WithMessage("Policy ID must be greater than 0")
                .When(x => x.PolicyId.HasValue);

            RuleFor(x => x.ViolationType)
                .NotEmpty().WithMessage("Violation type is required")
                .MaximumLength(100).WithMessage("Violation type cannot exceed 100 characters")
                .Must(type => new[] 
                { 
                    "Policy Breach", "Code of Conduct", "Attendance", "Performance", 
                    "Security", "Data Privacy", "Harassment", "Other" 
                }.Contains(type))
                .WithMessage("Invalid violation type");

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Description is required")
                .MinimumLength(10).WithMessage("Description must be at least 10 characters")
                .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters");

            RuleFor(x => x.Severity)
                .NotEmpty().WithMessage("Severity is required")
                .Must(severity => new[] { "Low", "Medium", "High", "Critical" }.Contains(severity))
                .WithMessage("Invalid severity. Must be one of: Low, Medium, High, Critical");

            RuleFor(x => x.EscalatedToUserId)
                .GreaterThan(0).WithMessage("Escalated To User ID must be greater than 0")
                .When(x => x.EscalatedToUserId.HasValue);
        }
    }
}

using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
using static Relevantz.EEPZ.Common.Constants.Constants;
namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdateUserRequestDtoValidator : AbstractValidator<UpdateUserRequestDto>
    {
        public UpdateUserRequestDtoValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("User ID is required")
                .GreaterThan(0).WithMessage("User ID must be greater than 0");
            RuleFor(x => x.EmploymentType)
                .Must(type => new[] 
                { 
                    EmploymentTypes.Permanent,
                    EmploymentTypes.Contract,
                    EmploymentTypes.Temporary,
                    EmploymentTypes.Intern,
                    EmploymentTypes.Probation
                }.Contains(type))
                .WithMessage("Invalid Employment Type")
                .When(x => !string.IsNullOrEmpty(x.EmploymentType));
            RuleFor(x => x.EmploymentStatus)
                .Must(status => new[] 
                { 
                    EmploymentStatuses.Active,
                    EmploymentStatuses.Inactive,
                    EmploymentStatuses.Terminated,
                    EmploymentStatuses.Resigned,
                    EmploymentStatuses.Retired
                }.Contains(status))
                .WithMessage("Invalid Employment Status")
                .When(x => !string.IsNullOrEmpty(x.EmploymentStatus));
            RuleFor(x => x.EmployeeType)
                .Must(type => new[] 
                { 
                    EmployeeTypes.FullTime,
                    EmployeeTypes.PartTime,
                    EmployeeTypes.Contract,
                    EmployeeTypes.Intern,
                    EmployeeTypes.Consultant
                }.Contains(type))
                .WithMessage("Invalid Employee Type")
                .When(x => !string.IsNullOrEmpty(x.EmployeeType));
            RuleFor(x => x.WorkLocation)
                .MaximumLength(100).WithMessage("Work Location cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.WorkLocation));
            RuleFor(x => x.NoticePeriodDays)
                .GreaterThanOrEqualTo(0).WithMessage("Notice Period Days must be non-negative")
                .LessThanOrEqualTo(365).WithMessage("Notice Period Days cannot exceed 365")
                .When(x => x.NoticePeriodDays.HasValue);
            RuleFor(x => x.ReportingManagerEmployeeId)
                .GreaterThan(0).WithMessage("Reporting Manager Employee ID must be greater than 0")
                .When(x => x.ReportingManagerEmployeeId.HasValue);
            RuleFor(x => x.Status)
                .Must(status => new[] 
                { 
                    UserStatuses.Active,
                    UserStatuses.Inactive,
                    UserStatuses.Locked,
                    RequestStatuses.Pending
                }.Contains(status))
                .WithMessage("Invalid Status")
                .When(x => !string.IsNullOrEmpty(x.Status));
        }
    }
}

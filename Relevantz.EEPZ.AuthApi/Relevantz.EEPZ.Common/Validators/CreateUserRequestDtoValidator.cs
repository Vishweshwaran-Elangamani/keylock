using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
using static Relevantz.EEPZ.Common.Constants.Constants;
namespace Relevantz.EEPZ.Common.Validators
{
    public class CreateUserRequestDtoValidator : AbstractValidator<CreateUserRequestDto>
    {
        public CreateUserRequestDtoValidator()
        {
            RuleFor(x => x.EmployeeCompanyId)
                .NotEmpty().WithMessage("Employee Company ID is required")
                .MaximumLength(50).WithMessage("Employee Company ID cannot exceed 50 characters");
            RuleFor(x => x.EmploymentType)
                .NotEmpty().WithMessage("Employment Type is required")
                .Must(type => new[] 
                { 
                    EmploymentTypes.Permanent,
                    EmploymentTypes.Contract,
                    EmploymentTypes.Temporary,
                    EmploymentTypes.Intern,
                    EmploymentTypes.Probation
                }.Contains(type))
                .WithMessage("Invalid Employment Type");
            RuleFor(x => x.EmploymentStatus)
                .NotEmpty().WithMessage("Employment Status is required")
                .Must(status => new[] 
                { 
                    EmploymentStatuses.Active,
                    EmploymentStatuses.Inactive,
                    EmploymentStatuses.Terminated,
                    EmploymentStatuses.Resigned,
                    EmploymentStatuses.Retired
                }.Contains(status))
                .WithMessage("Invalid Employment Status");
            RuleFor(x => x.JoiningDate)
                .NotEmpty().WithMessage("Joining Date is required")
                .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.Today.AddDays(30)))
                .WithMessage("Joining Date cannot be more than 30 days in the future");
            RuleFor(x => x.ConfirmationDate)
                .GreaterThanOrEqualTo(x => x.JoiningDate)
                .WithMessage("Confirmation Date must be on or after Joining Date")
                .When(x => x.ConfirmationDate.HasValue);
            RuleFor(x => x.WorkLocation)
                .MaximumLength(100).WithMessage("Work Location cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.WorkLocation));
            RuleFor(x => x.EmployeeType)
                .NotEmpty().WithMessage("Employee Type is required")
                .Must(type => new[] 
                { 
                    EmployeeTypes.FullTime,
                    EmployeeTypes.PartTime,
                    EmployeeTypes.Contract,
                    EmployeeTypes.Intern,
                    EmployeeTypes.Consultant
                }.Contains(type))
                .WithMessage("Invalid Employee Type");
            RuleFor(x => x.NoticePeriodDays)
                .GreaterThanOrEqualTo(0).WithMessage("Notice Period Days must be non-negative")
                .LessThanOrEqualTo(365).WithMessage("Notice Period Days cannot exceed 365");
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(255).WithMessage("Email cannot exceed 255 characters");
            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("First Name is required")
                .MaximumLength(100).WithMessage("First Name cannot exceed 100 characters")
                .Matches(@"^[a-zA-Z\s'-]+$").WithMessage("First Name can only contain letters, spaces, hyphens, and apostrophes");
            RuleFor(x => x.MiddleName)
                .MaximumLength(100).WithMessage("Middle Name cannot exceed 100 characters")
                .Matches(@"^[a-zA-Z\s'-]+$").WithMessage("Middle Name can only contain letters, spaces, hyphens, and apostrophes")
                .When(x => !string.IsNullOrEmpty(x.MiddleName));
            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last Name is required")
                .MaximumLength(100).WithMessage("Last Name cannot exceed 100 characters")
                .Matches(@"^[a-zA-Z\s'-]+$").WithMessage("Last Name can only contain letters, spaces, hyphens, and apostrophes");
            RuleFor(x => x.CallingName)
                .MaximumLength(100).WithMessage("Calling Name cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.CallingName));
            RuleFor(x => x.ReferredBy)
                .MaximumLength(100).WithMessage("Referred By cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.ReferredBy));
            RuleFor(x => x.Gender)
                .Must(gender => string.IsNullOrEmpty(gender) || new[] 
                { 
                    Genders.Male,
                    Genders.Female,
                    Genders.Other,
                    Genders.PreferNotToSay
                }.Contains(gender))
                .WithMessage("Invalid Gender value")
                .When(x => !string.IsNullOrEmpty(x.Gender));
            RuleFor(x => x.DateOfBirthOfficial)
                .LessThan(DateOnly.FromDateTime(DateTime.Today))
                .WithMessage("Date of Birth must be in the past")
                .When(x => x.DateOfBirthOfficial.HasValue);
            RuleFor(x => x.DateOfBirthActual)
                .LessThan(DateOnly.FromDateTime(DateTime.Today))
                .WithMessage("Date of Birth must be in the past")
                .When(x => x.DateOfBirthActual.HasValue);
            RuleFor(x => x.MobileNumber)
                .Matches(@"^\+?[1-9]\d{1,14}$").WithMessage("Invalid mobile number format")
                .When(x => !string.IsNullOrEmpty(x.MobileNumber));
            RuleFor(x => x.AlternateNumber)
                .Matches(@"^\+?[1-9]\d{1,14}$").WithMessage("Invalid alternate number format")
                .When(x => !string.IsNullOrEmpty(x.AlternateNumber));
            RuleFor(x => x.PersonalEmail)
                .EmailAddress().WithMessage("Invalid personal email format")
                .MaximumLength(255).WithMessage("Personal email cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.PersonalEmail));
            RuleFor(x => x.RoleId)
                .NotEmpty().WithMessage("Role ID is required")
                .GreaterThan(0).WithMessage("Role ID must be greater than 0");
            RuleFor(x => x.DepartmentId)
                .NotEmpty().WithMessage("Department ID is required")
                .GreaterThan(0).WithMessage("Department ID must be greater than 0");
            RuleFor(x => x.ReportingManagerEmployeeId)
                .GreaterThan(0).WithMessage("Reporting Manager Employee ID must be greater than 0")
                .When(x => x.ReportingManagerEmployeeId.HasValue);
        }
    }
}

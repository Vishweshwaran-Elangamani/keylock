using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
using static Relevantz.EEPZ.Common.Constants.Constants;
namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdateProfileRequestDtoValidator : AbstractValidator<UpdateProfileRequestDto>
    {
        public UpdateProfileRequestDtoValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("First name is required")
                .MaximumLength(100).WithMessage("First name cannot exceed 100 characters")
                .Matches(@"^[a-zA-Z\s'-]+$").WithMessage("First name can only contain letters, spaces, hyphens, and apostrophes");
            RuleFor(x => x.MiddleName)
                .MaximumLength(100).WithMessage("Middle name cannot exceed 100 characters")
                .Matches(@"^[a-zA-Z\s'-]+$").WithMessage("Middle name can only contain letters, spaces, hyphens, and apostrophes")
                .When(x => !string.IsNullOrEmpty(x.MiddleName));
            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last name is required")
                .MaximumLength(100).WithMessage("Last name cannot exceed 100 characters")
                .Matches(@"^[a-zA-Z\s'-]+$").WithMessage("Last name can only contain letters, spaces, hyphens, and apostrophes");
            RuleFor(x => x.CallingName)
                .MaximumLength(100).WithMessage("Calling name cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.CallingName));
            RuleFor(x => x.Gender)
                .NotEmpty().WithMessage("Gender is required")
                .Must(gender => new[] 
                { 
                    Genders.Male,
                    Genders.Female,
                    Genders.Other,
                    Genders.PreferNotToSay
                }.Contains(gender))
                .WithMessage("Invalid Gender value");
            RuleFor(x => x.DateOfBirthOfficial)
                .LessThan(DateOnly.FromDateTime(DateTime.Today))
                .WithMessage("Date of Birth must be in the past")
                .When(x => x.DateOfBirthOfficial.HasValue);
            RuleFor(x => x.DateOfBirthActual)
                .LessThan(DateOnly.FromDateTime(DateTime.Today))
                .WithMessage("Date of Birth must be in the past")
                .When(x => x.DateOfBirthActual.HasValue);
            RuleFor(x => x.MobileNumber)
                .Matches(@"^\+?[1-9]\d{1,14}$").WithMessage("Invalid phone number format")
                .MaximumLength(20).WithMessage("Mobile number cannot exceed 20 characters")
                .When(x => !string.IsNullOrEmpty(x.MobileNumber));
            RuleFor(x => x.AlternateNumber)
                .Matches(@"^\+?[1-9]\d{1,14}$").WithMessage("Invalid phone number format")
                .MaximumLength(20).WithMessage("Alternate number cannot exceed 20 characters")
                .When(x => !string.IsNullOrEmpty(x.AlternateNumber));
            RuleFor(x => x.PersonalEmail)
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(255).WithMessage("Personal email cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.PersonalEmail));
            RuleFor(x => x.MaritalStatus)
                .Must(status => string.IsNullOrEmpty(status) || new[] 
                { 
                    MaritalStatuses.Single,
                    MaritalStatuses.Married,
                    MaritalStatuses.Divorced,
                    MaritalStatuses.Widowed,
                    MaritalStatuses.PreferNotToSay
                }.Contains(status))
                .WithMessage("Invalid Marital Status")
                .When(x => !string.IsNullOrEmpty(x.MaritalStatus));
            RuleFor(x => x.Nationality)
                .MaximumLength(100).WithMessage("Nationality cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.Nationality));
            RuleFor(x => x.ProfilePhoto)
                .Must(file => file == null || file.Length <= 5 * 1024 * 1024)
                .WithMessage("Profile photo size cannot exceed 5MB")
                .Must(file => file == null || new[] { ".jpg", ".jpeg", ".png", ".gif" }.Contains(Path.GetExtension(file.FileName).ToLower()))
                .WithMessage("Profile photo must be an image file (jpg, jpeg, png, gif)")
                .When(x => x.ProfilePhoto != null);
            RuleFor(x => x.CurrentAddress)
                .SetValidator(new UpdateAddressDtoValidator()!)
                .When(x => x.CurrentAddress != null);
            RuleFor(x => x.PermanentAddress)
                .SetValidator(new UpdateAddressDtoValidator()!)
                .When(x => x.PermanentAddress != null);
        }
    }
    public class UpdateAddressDtoValidator : AbstractValidator<UpdateAddressDto>
    {
        public UpdateAddressDtoValidator()
        {
            RuleFor(x => x.DoorNumber)
                .MaximumLength(50).WithMessage("Door Number cannot exceed 50 characters")
                .When(x => !string.IsNullOrEmpty(x.DoorNumber));
            RuleFor(x => x.Street)
                .MaximumLength(200).WithMessage("Street cannot exceed 200 characters")
                .When(x => !string.IsNullOrEmpty(x.Street));
            RuleFor(x => x.Landmark)
                .MaximumLength(200).WithMessage("Landmark cannot exceed 200 characters")
                .When(x => !string.IsNullOrEmpty(x.Landmark));
            RuleFor(x => x.Area)
                .MaximumLength(100).WithMessage("Area cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.Area));
            RuleFor(x => x.City)
                .MaximumLength(100).WithMessage("City cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.City));
            RuleFor(x => x.State)
                .MaximumLength(100).WithMessage("State cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.State));
            RuleFor(x => x.Country)
                .MaximumLength(100).WithMessage("Country cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.Country));
            RuleFor(x => x.PinCode)
                .MaximumLength(20).WithMessage("Pin Code cannot exceed 20 characters")
                .Matches(@"^[A-Z0-9\s-]+$").WithMessage("Pin Code contains invalid characters")
                .When(x => !string.IsNullOrEmpty(x.PinCode));
        }
    }
}

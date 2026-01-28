using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
namespace Relevantz.EEPZ.Common.Validators
{
    public class BulkUserCreateRequestDtoValidator : AbstractValidator<BulkUserCreateRequestDto>
    {
        public BulkUserCreateRequestDtoValidator()
        {
            RuleFor(x => x.Users)
                .NotEmpty().WithMessage("Users list cannot be empty")
                .Must(users => users.Count <= 100).WithMessage("Cannot create more than 100 users at once");
            RuleForEach(x => x.Users).SetValidator(new CreateUserRequestDtoValidator());
        }
    }
}

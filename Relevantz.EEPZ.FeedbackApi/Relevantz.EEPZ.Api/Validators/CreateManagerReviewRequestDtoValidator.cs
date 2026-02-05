using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

public class CreateManagerReviewRequestDtoValidator 
    : AbstractValidator<CreateManagerReviewRequestDto>
{
    public CreateManagerReviewRequestDtoValidator()
    {
        RuleFor(x => x.ManagerEmployeeId)
            .GreaterThan(0);

        RuleFor(x => x.TargetEmployeeId)
            .GreaterThan(0)
            .NotEqual(x => x.ManagerEmployeeId)
            .WithMessage("Manager cannot review themselves.");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5);

        RuleFor(x => x.ReviewComment)
            .NotEmpty()
            .MaximumLength(2000);
    }
}

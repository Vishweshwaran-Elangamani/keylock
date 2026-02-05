using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

public class SubmitHRFormResponseRequestDtoValidator 
    : AbstractValidator<SubmitHRFormResponseRequestDto>
{
    public SubmitHRFormResponseRequestDtoValidator()
    {
        RuleFor(x => x.FormId).GreaterThan(0);
        RuleFor(x => x.SubmittedByEmployeeId).GreaterThan(0);

        RuleFor(x => x.FormResponse)
            .NotNull()
            .Must(x => x.Count > 0)
            .WithMessage("FormResponse must contain at least one entry.");
    }
}

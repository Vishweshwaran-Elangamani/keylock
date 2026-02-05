using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

public class CreateHRFeedbackFormRequestDtoValidator 
    : AbstractValidator<CreateHRFeedbackFormRequestDto>
{
    public CreateHRFeedbackFormRequestDtoValidator()
    {
        RuleFor(x => x.FormName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.FormDescription)
            .MaximumLength(1000);

        RuleFor(x => x.FormType)
            .NotEmpty();

        RuleFor(x => x.CreatedByHRId)
            .GreaterThan(0);

        RuleForEach(x => x.DistributedToEmployeeIds)
            .GreaterThan(0);

        RuleFor(x => x.Deadline)
            .GreaterThan(DateTime.UtcNow)
            .When(x => x.Deadline.HasValue);
    }
}

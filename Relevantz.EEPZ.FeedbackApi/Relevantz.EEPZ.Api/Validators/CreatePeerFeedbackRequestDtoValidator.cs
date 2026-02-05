using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

public class CreatePeerFeedbackRequestDtoValidator 
    : AbstractValidator<CreatePeerFeedbackRequestDto>
{
    public CreatePeerFeedbackRequestDtoValidator()
    {
        RuleFor(x => x.SubmittedByEmployeeId)
            .GreaterThan(0);

        RuleFor(x => x.RecipientEmployeeId)
            .GreaterThan(0)
            .NotEqual(x => x.SubmittedByEmployeeId)
            .WithMessage("You cannot give feedback to yourself.");

        RuleFor(x => x.FeedbackContent)
            .NotEmpty()
            .MaximumLength(2000);
    }
}

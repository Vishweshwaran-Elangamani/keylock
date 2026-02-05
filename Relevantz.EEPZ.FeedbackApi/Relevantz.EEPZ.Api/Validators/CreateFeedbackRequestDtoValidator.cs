using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

public class FeedbackQuestionResponseValidator 
    : AbstractValidator<FeedbackQuestionResponseRequestDto>
{
    public FeedbackQuestionResponseValidator()
    {
        RuleFor(x => x.QuestionId).GreaterThan(0);

        RuleFor(x => x)
            .Must(HaveOnlyOneAnswerType)
            .WithMessage("Only one response type can be provided.");
    }

    private bool HaveOnlyOneAnswerType(FeedbackQuestionResponseRequestDto q)
    {
        int count = 0;
        if (q.RatingValue != null) count++;
        if (q.BooleanValue != null) count++;
        if (!string.IsNullOrWhiteSpace(q.TextValue)) count++;
        if (q.SelectedOptions?.Any() == true) count++;

        return count == 1;
    }
}

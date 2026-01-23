using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Api.Validators
{
    public class CreateMentorFeedbackRequestValidator : AbstractValidator<CreateMentorFeedbackRequestDto>
    {
        public CreateMentorFeedbackRequestValidator()
        {
            RuleFor(x => x.MentorEmployeeId).GreaterThan(0);
            RuleFor(x => x.MenteeEmployeeId).GreaterThan(0);
            RuleFor(x => x.SmeId).GreaterThan(0);
            RuleFor(x => x.SkillIdReference).GreaterThan(0);
            RuleFor(x => x.SubmittedByEmployeeId).GreaterThan(0);

            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 5);

            RuleFor(x => x.FeedbackFrom)
                .NotEmpty();
        }
    }
}

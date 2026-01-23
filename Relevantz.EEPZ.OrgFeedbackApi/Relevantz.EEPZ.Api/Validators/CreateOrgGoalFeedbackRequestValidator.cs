using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Api.Validators
{
    public class CreateOrgGoalFeedbackRequestValidator : AbstractValidator<CreateOrgGoalFeedbackRequestDto>
    {
        public CreateOrgGoalFeedbackRequestValidator()
        {
            RuleFor(x => x.GoalId).GreaterThan(0);
            RuleFor(x => x.SubmittedByEmployeeId).GreaterThan(0);
            RuleFor(x => x.RecipientEmployeeId).GreaterThan(0);

            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 5);
        }
    }
}

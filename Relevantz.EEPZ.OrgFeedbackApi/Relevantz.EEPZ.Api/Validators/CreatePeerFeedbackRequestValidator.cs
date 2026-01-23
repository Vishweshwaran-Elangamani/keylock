using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Api.Validators
{
    public class CreatePeerFeedbackRequestValidator : AbstractValidator<CreatePeerFeedbackRequestDto>
    {
        public CreatePeerFeedbackRequestValidator()
        {
            RuleFor(x => x.SubmittedByEmployeeId).GreaterThan(0);
            RuleFor(x => x.RecipientEmployeeId).GreaterThan(0);
            RuleFor(x => x.FeedbackContent).NotEmpty();
        }
    }
}

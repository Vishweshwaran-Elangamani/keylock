using FluentValidation;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;

namespace Relevantz.EEPZ.Common.Validators.InternalOpportunity
{
    public class CreateManagerNominationRequestDtoValidator : AbstractValidator<CreateManagerNominationRequestDto>
    {
        public CreateManagerNominationRequestDtoValidator()
        {
            RuleFor(x => x.OpportunityId)
                .NotEmpty().WithMessage("Opportunity ID is required")
                .GreaterThan(0).WithMessage("Opportunity ID must be greater than 0");

            RuleFor(x => x.NomineeEmployeeId)
                .NotEmpty().WithMessage("Nominee employee ID is required")
                .GreaterThan(0).WithMessage("Nominee employee ID must be greater than 0");

            RuleFor(x => x.Justification)
                .Length(10, 1000).WithMessage("Justification must be between 10 and 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Justification));
        }
    }
}

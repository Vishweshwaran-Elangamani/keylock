using FluentValidation;
using Relevantz.EEPZ.Common.ViewModels.Common;

namespace Relevantz.EEPZ.Common.Validators.InternalOpportunity
{
    public class EligibilityCheckRequestDtoValidator : AbstractValidator<EligibilityCheckRequestDto>
    {
        public EligibilityCheckRequestDtoValidator()
        {
            RuleFor(x => x.OpportunityId)
                .NotEmpty().WithMessage("Opportunity ID is required")
                .GreaterThan(0).WithMessage("Opportunity ID must be greater than 0");
        }
    }
}

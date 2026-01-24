using FluentValidation;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Request;
using Relevantz.EEPZ.Common.Enums;

namespace Relevantz.EEPZ.Common.Validators.InternalOpportunity
{
    public class UpdateInternalOpportunityRequestDtoValidator : AbstractValidator<UpdateInternalOpportunityRequestDto>
    {
        public UpdateInternalOpportunityRequestDtoValidator()
        {
            RuleFor(x => x.OpportunityName)
                .Length(5, 200).WithMessage("Opportunity name must be between 5 and 200 characters")
                .Matches(@"^[a-zA-Z0-9\s\-_.,()&]+$").WithMessage("Opportunity name contains invalid characters")
                .When(x => !string.IsNullOrEmpty(x.OpportunityName));

            RuleFor(x => x.DepartmentId)
                .GreaterThan(0).WithMessage("Department ID must be greater than 0")
                .When(x => x.DepartmentId.HasValue);

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.Requirements)
                .MaximumLength(500).WithMessage("Requirements cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.Requirements));

            RuleFor(x => x.EligibilityCriteria)
                .MaximumLength(500).WithMessage("Eligibility criteria cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.EligibilityCriteria));

            RuleFor(x => x.Deadline)
                .GreaterThan(DateOnly.FromDateTime(DateTime.Today))
                .WithMessage("Deadline must be a future date")
                .When(x => x.Deadline.HasValue);

            RuleFor(x => x.Status)
                .Must(status => new[] 
                { 
                    InternalOpportunitiesConstants.OpportunityStatus.Active,
                    InternalOpportunitiesConstants.OpportunityStatus.Closed
                }.Contains(status))
                .WithMessage("Invalid status. Must be either 'Active' or 'Closed'")
                .When(x => !string.IsNullOrEmpty(x.Status));
        }
    }
}

using FluentValidation;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Request;
using Relevantz.EEPZ.Common.Enums;

namespace Relevantz.EEPZ.Common.Validators.InternalOpportunity
{
    public class CreateInternalOpportunityRequestDtoValidator : AbstractValidator<CreateInternalOpportunityRequestDto>
    {
        public CreateInternalOpportunityRequestDtoValidator()
        {
            RuleFor(x => x.OpportunityName)
                .NotEmpty().WithMessage("Opportunity name is required")
                .Length(5, 200).WithMessage("Opportunity name must be between 5 and 200 characters")
                .Matches(@"^[a-zA-Z0-9\s\-_.,()&]+$").WithMessage("Opportunity name contains invalid characters");

            RuleFor(x => x.DepartmentId)
                .NotEmpty().WithMessage("Department ID is required")
                .GreaterThan(0).WithMessage("Department ID must be greater than 0");

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
                .NotEmpty().WithMessage("Deadline is required")
                .GreaterThan(DateOnly.FromDateTime(DateTime.Today))
                .WithMessage("Deadline must be a future date");

            RuleFor(x => x.Status)
                .NotEmpty().WithMessage("Status is required")
                .Must(status => new[] 
                { 
                    InternalOpportunitiesConstants.OpportunityStatus.Active,
                    InternalOpportunitiesConstants.OpportunityStatus.Closed
                }.Contains(status))
                .WithMessage("Invalid status. Must be either 'Active' or 'Closed'");
        }
    }
}

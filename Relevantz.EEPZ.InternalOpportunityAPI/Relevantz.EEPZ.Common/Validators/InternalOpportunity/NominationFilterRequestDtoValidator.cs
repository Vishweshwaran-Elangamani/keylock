using FluentValidation;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;
using Relevantz.EEPZ.Common.Enums;

namespace Relevantz.EEPZ.Common.Validators.InternalOpportunity
{
    public class NominationFilterRequestDtoValidator : AbstractValidator<NominationFilterRequestDto>
    {
        public NominationFilterRequestDtoValidator()
        {
            RuleFor(x => x.OpportunityId)
                .GreaterThan(0).WithMessage("Opportunity ID must be greater than 0")
                .When(x => x.OpportunityId.HasValue);

            RuleFor(x => x.Status)
                .Must(status => string.IsNullOrEmpty(status) || new[] 
                { 
                    NominationStatusConstants.PendingManagerReview,
                    NominationStatusConstants.ManagerRejected,
                    NominationStatusConstants.PendingDeptHeadApproval,
                    NominationStatusConstants.DeptHeadRejected,
                    NominationStatusConstants.Approved,
                    NominationStatusConstants.Ineligible
                }.Contains(status))
                .WithMessage("Invalid nomination status")
                .When(x => !string.IsNullOrEmpty(x.Status));

            RuleFor(x => x.NominationType)
                .Must(type => string.IsNullOrEmpty(type) || new[] 
                { 
                    InternalOpportunitiesConstants.NominationTypes.EmployeeSelf,
                    InternalOpportunitiesConstants.NominationTypes.ManagerNomination,
                    InternalOpportunitiesConstants.NominationTypes.PeerNomination
                }.Contains(type))
                .WithMessage("Invalid nomination type")
                .When(x => !string.IsNullOrEmpty(x.NominationType));

            RuleFor(x => x.DepartmentId)
                .GreaterThan(0).WithMessage("Department ID must be greater than 0")
                .When(x => x.DepartmentId.HasValue);

            RuleFor(x => x.SearchTerm)
                .MaximumLength(200).WithMessage("Search term cannot exceed 200 characters")
                .When(x => !string.IsNullOrEmpty(x.SearchTerm));

            RuleFor(x => x.PageNumber)
                .GreaterThan(0).WithMessage("Page number must be greater than 0");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100");

            RuleFor(x => x.SortBy)
                .Must(sortBy => string.IsNullOrEmpty(sortBy) || new[] 
                { 
                    "SubmittedAt", "Status", "NominationType", "OpportunityId" 
                }.Contains(sortBy))
                .WithMessage("Invalid sort field")
                .When(x => !string.IsNullOrEmpty(x.SortBy));

            RuleFor(x => x.SortOrder)
                .Must(order => string.IsNullOrEmpty(order) || new[] { "ASC", "DESC" }.Contains(order.ToUpper()))
                .WithMessage("Sort order must be 'ASC' or 'DESC'")
                .When(x => !string.IsNullOrEmpty(x.SortOrder));
        }
    }
}

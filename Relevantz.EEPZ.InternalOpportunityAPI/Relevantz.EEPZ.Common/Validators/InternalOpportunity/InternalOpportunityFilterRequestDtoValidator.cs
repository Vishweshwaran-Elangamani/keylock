using FluentValidation;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Request;
using Relevantz.EEPZ.Common.Enums;

namespace Relevantz.EEPZ.Common.Validators.InternalOpportunity
{
    public class InternalOpportunityFilterRequestDtoValidator : AbstractValidator<InternalOpportunityFilterRequestDto>
    {
        public InternalOpportunityFilterRequestDtoValidator()
        {
            RuleFor(x => x.DepartmentId)
                .GreaterThan(0).WithMessage("Department ID must be greater than 0")
                .When(x => x.DepartmentId.HasValue);

            RuleFor(x => x.Status)
                .Must(status => string.IsNullOrEmpty(status) || new[] 
                { 
                    InternalOpportunitiesConstants.OpportunityStatus.Active,
                    InternalOpportunitiesConstants.OpportunityStatus.Closed
                }.Contains(status))
                .WithMessage("Invalid status")
                .When(x => !string.IsNullOrEmpty(x.Status));

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
                    "CreatedAt", "OpportunityName", "Deadline", "DepartmentId", "Status" 
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

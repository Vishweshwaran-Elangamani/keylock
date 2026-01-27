using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class PagedQueryModelValidator : AbstractValidator<PagedQueryModel>
    {
        public PagedQueryModelValidator()
        {
            RuleFor(x => x.Page).GreaterThanOrEqualTo(1).WithMessage("Page must be at least 1");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100)
                .WithMessage("Page size must be between 1 and 100");

            RuleFor(x => x.Search)
                .MaximumLength(200)
                .WithMessage("Search term cannot exceed 200 characters")
                .When(x => !string.IsNullOrEmpty(x.Search));
        }
    }
}

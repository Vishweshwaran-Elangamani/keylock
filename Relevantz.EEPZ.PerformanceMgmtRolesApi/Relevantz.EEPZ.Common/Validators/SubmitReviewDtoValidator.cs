using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
using System.Linq;

namespace Relevantz.EEPZ.Common.Validators
{
    public class SubmitReviewDtoValidator : AbstractValidator<SubmitReviewDto>
    {
        public SubmitReviewDtoValidator()
        {
            RuleLevelCascadeMode = CascadeMode.Stop;

            RuleFor(x => x.AssessmentId)
                .GreaterThan(0)
                .WithMessage("AssessmentId must be greater than 0.");

            RuleFor(x => x.Items)
                .NotNull()
                .WithMessage("Items cannot be null.")
                .NotEmpty()
                .WithMessage("At least one review item is required.");

            RuleFor(x => x.Items)
                .Must(items => items.All(i => i != null))
                .When(x => x.Items != null && x.Items.Any())
                .WithMessage("Items cannot contain null entries.");

            RuleForEach(x => x.Items)
                .SetValidator(new ReviewItemDtoValidator());

            RuleFor(x => x.Items)
                .Must(items =>
                {
                    var ids = items.Select(i => i.DetailId).ToList();
                    return ids.Count == ids.Distinct().Count();
                })
                .When(x => x.Items != null && x.Items.Any() && x.Items.All(i => i != null))
                .WithMessage("Duplicate DetailId found in Items.");
        }
    }
}

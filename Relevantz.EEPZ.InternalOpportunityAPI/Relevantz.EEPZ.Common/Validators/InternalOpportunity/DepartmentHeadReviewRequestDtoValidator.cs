using FluentValidation;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;

namespace Relevantz.EEPZ.Common.Validators.InternalOpportunity
{
    public class DepartmentHeadReviewRequestDtoValidator : AbstractValidator<DepartmentHeadReviewRequestDto>
    {
        public DepartmentHeadReviewRequestDtoValidator()
        {
            RuleFor(x => x.Action)
                .MaximumLength(20).WithMessage("Action cannot exceed 20 characters")
                .Must(action => string.IsNullOrEmpty(action) || new[] { "Approved", "Rejected" }.Contains(action))
                .WithMessage("Invalid action. Must be 'Approved', or 'Rejected'")
                .When(x => !string.IsNullOrEmpty(x.Action));

            RuleFor(x => x.ReviewRemarks)
                .MaximumLength(500).WithMessage("Review remarks cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.ReviewRemarks));

            RuleFor(x => x.MeritScore)
                .InclusiveBetween(0, 100).WithMessage("Merit score must be between 0 and 100")
                .When(x => x.MeritScore.HasValue);

            RuleFor(x => x.DiversityScore)
                .InclusiveBetween(0, 100).WithMessage("Diversity score must be between 0 and 100")
                .When(x => x.DiversityScore.HasValue);

            RuleFor(x => x.ReviewNotes)
                .MaximumLength(500).WithMessage("Review notes cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.ReviewNotes));
        }
    }
}

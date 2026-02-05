using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class ReviewItemDtoValidator : AbstractValidator<ReviewItemDto>
    {
        public ReviewItemDtoValidator()
        {
            RuleFor(x => x.DetailId)
                .GreaterThan(0)
                .WithMessage("DetailId must be greater than 0.");

            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 5)
                .When(x => x.Rating.HasValue)
                .WithMessage("Rating must be between 1 and 5.");

            RuleFor(x => x.Comments)
                .MaximumLength(2000)
                .When(x => !string.IsNullOrWhiteSpace(x.Comments))
                .WithMessage("Comments must not exceed 2000 characters.");
        }
    }
}
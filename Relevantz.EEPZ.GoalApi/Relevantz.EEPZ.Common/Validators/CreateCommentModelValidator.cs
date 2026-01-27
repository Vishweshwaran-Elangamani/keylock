using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class CreateCommentModelValidator : AbstractValidator<CreateCommentModel>
    {
        public CreateCommentModelValidator()
        {
            RuleFor(x => x.Comment)
                .NotEmpty()
                .WithMessage("Comment is required")
                .MaximumLength(5000)
                .WithMessage("Comment cannot exceed 5000 characters");
        }
    }
}

using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class CompleteAssignmentRequestModelValidator
        : AbstractValidator<CompleteAssignmentRequestModel>
    {
        public CompleteAssignmentRequestModelValidator()
        {
            RuleFor(x => x.AssignmentId)
                .GreaterThan(0)
                .WithMessage("AssignmentId must be greater than 0");

            RuleFor(x => x.NewRating)
                .InclusiveBetween(1, 10)
                .WithMessage("Rating must be between 1 and 10");

            RuleFor(x => x.Notes)
                .MaximumLength(500)
                .WithMessage("Notes cannot exceed 500 characters");
        }
    }
}

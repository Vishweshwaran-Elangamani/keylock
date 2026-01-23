using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdateSkillRatingRequestModelValidator : AbstractValidator<UpdateSkillRatingRequestModel>
    {
        public UpdateSkillRatingRequestModelValidator()
        {
            RuleFor(x => x.MapperId)
                .GreaterThan(0).WithMessage("MapperId must be greater than 0");

            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 10).WithMessage("Rating must be between 1 and 10");
        }
    }
}

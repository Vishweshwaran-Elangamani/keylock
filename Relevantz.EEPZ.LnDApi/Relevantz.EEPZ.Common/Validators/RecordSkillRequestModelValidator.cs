using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class RecordSkillRequestModelValidator : AbstractValidator<RecordSkillRequestModel>
    {
        public RecordSkillRequestModelValidator()
        {
            RuleFor(x => x.EmployeeId)
                .GreaterThan(0)
                .WithMessage("EmployeeId must be greater than 0");

            RuleFor(x => x.SkillId).GreaterThan(0).WithMessage("SkillId must be greater than 0");

            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 10)
                .WithMessage("Rating must be between 1 and 10");
        }
    }
}

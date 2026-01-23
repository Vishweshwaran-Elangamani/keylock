using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class SmeRequestModelValidator : AbstractValidator<SmeRequestModel>
    {
        public SmeRequestModelValidator()
        {
            RuleFor(x => x.SkillId)
                .GreaterThan(0).WithMessage("SkillId must be greater than 0");

            RuleFor(x => x.MentorEmployeeId)
                .GreaterThan(0).WithMessage("MentorEmployeeId must be greater than 0");

            RuleFor(x => x.MenteeEmployeeId)
                .GreaterThan(0).WithMessage("MenteeEmployeeId must be greater than 0");

            RuleFor(x => x.Deadline)
                .GreaterThanOrEqualTo(DateTime.Now).WithMessage("Deadline must be in the future");
        }
    }
}

using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class ApprovalRequestDtoValidator : AbstractValidator<ApprovalRequestDto>
    {
        public ApprovalRequestDtoValidator()
        {
            RuleFor(x => x.EmployeeId)
                .GreaterThan(0)
                .WithMessage("EmployeeId is required");

            RuleFor(x => x.ProjectId)
                .GreaterThan(0)
                .WithMessage("ProjectId is required");

            RuleFor(x => x.AssessmentId)
                .GreaterThan(0)
                .WithMessage("AssessmentId is required");
        }
    }
}
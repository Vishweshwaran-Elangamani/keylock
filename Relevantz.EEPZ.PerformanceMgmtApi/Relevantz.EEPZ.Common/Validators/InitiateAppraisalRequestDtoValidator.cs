using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class InitiateAppraisalRequestDtoValidator : AbstractValidator<InitiateAppraisalRequestDto>
    {
        public InitiateAppraisalRequestDtoValidator()
        {
            RuleFor(x => x.FormId)
                .GreaterThan(0)
                .WithMessage("FormId must be greater than 0.");

            RuleFor(x => x.AssignedBy)
                .GreaterThan(0)
                .WithMessage("AssignedBy must be greater than 0.");

            RuleFor(x => x.UserIds)
                .NotNull().WithMessage("UserIds is required.")
                .Must(ids => ids != null && ids.Count > 0)
                .WithMessage("At least one employee ID is required.");

            RuleForEach(x => x.UserIds)
                .GreaterThan(0)
                .WithMessage("Each employee ID must be greater than 0.");

            RuleFor(x => x.Action)
                .NotEmpty()
                .WithMessage("Action is required.")
                .Must(a => a == "Send" || a == "Draft")
                .WithMessage("Action must be either 'Send' or 'Draft'.");

            
            RuleFor(x => x.DeadlineInDays)
                .GreaterThan(0)
                .When(x => x.DeadlineInDays != 0) 
                .WithMessage("DeadlineInDays must be greater than 0 when provided.");

            RuleFor(x => x.DeadlineInDays)
                .LessThanOrEqualTo(365)
                .When(x => x.DeadlineInDays > 0)
                .WithMessage("DeadlineInDays cannot exceed 365.");
        }
    }
}
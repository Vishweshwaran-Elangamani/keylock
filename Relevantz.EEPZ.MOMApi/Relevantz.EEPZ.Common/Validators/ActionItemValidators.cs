using FluentValidation;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Common.Validators
{
    /// <summary>
    /// Validator for ActionItemFilterDto
    /// </summary>
    public class ActionItemFilterDtoValidator : AbstractValidator<ActionItemFilterDto>
    {
        public ActionItemFilterDtoValidator()
        {
            RuleFor(x => x.Status)
                .Must(BeValidStatus).WithMessage("Status must be 'Pending' or 'Completed'")
                .When(x => !string.IsNullOrEmpty(x.Status));

            RuleFor(x => x.AssignedToEmployeeId)
                .GreaterThan(0).WithMessage("Assigned employee ID must be greater than 0")
                .When(x => x.AssignedToEmployeeId.HasValue);

            RuleFor(x => x.DueDateFrom)
                .LessThanOrEqualTo(x => x.DueDateTo)
                .WithMessage("Due date from must be before or equal to due date to")
                .When(x => x.DueDateFrom.HasValue && x.DueDateTo.HasValue);
        }

        private bool BeValidStatus(string status)
        {
            return status == "Pending" || status == "Completed";
        }
    }
}

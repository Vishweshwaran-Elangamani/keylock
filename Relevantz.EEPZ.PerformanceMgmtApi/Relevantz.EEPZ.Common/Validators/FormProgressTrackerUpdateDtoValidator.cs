using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators.Request
{
    public class FormProgressTrackerUpdateDtoValidator : AbstractValidator<FormProgressTrackerUpdateDto>
    {
        public FormProgressTrackerUpdateDtoValidator()
        {
            RuleFor(x => x.AssignmentId)
                .GreaterThan(0)
                .WithMessage("AssignmentId must be greater than 0.");

            RuleFor(x => x)
                .Must(HasAtLeastOneUpdateFlag)
                .WithMessage("At least one tracker field must be provided to update.");
        }

        private static bool HasAtLeastOneUpdateFlag(FormProgressTrackerUpdateDto dto)
        {
            return dto.Initiated.HasValue
                || dto.SentToEmployee.HasValue
                || dto.EmployeeCompleted.HasValue
                || dto.SentToManager.HasValue
                || dto.ManagerCompleted.HasValue
                || dto.SentToDeptHead.HasValue
                || dto.SentToLeadership.HasValue;
        }
    }
}
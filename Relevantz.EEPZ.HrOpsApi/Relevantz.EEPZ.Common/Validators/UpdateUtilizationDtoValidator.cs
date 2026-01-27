using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdateUtilizationDtoValidator : AbstractValidator<UpdateUtilizationDto>
    {
        public UpdateUtilizationDtoValidator()
        {
            RuleFor(x => x.AllocationId)
                .GreaterThan(0).WithMessage("Allocation ID must be greater than 0");

            RuleFor(x => x.UtilizedAmount)
                .GreaterThanOrEqualTo(0).WithMessage("Utilized amount must be non-negative")
                .LessThanOrEqualTo(999999999.99m).WithMessage("Utilized amount cannot exceed 999,999,999.99");

            RuleFor(x => x.UtilizationPercentage)
                .GreaterThanOrEqualTo(0).WithMessage("Utilization percentage must be non-negative")
                .LessThanOrEqualTo(100).WithMessage("Utilization percentage cannot exceed 100%");

            RuleFor(x => x.Notes)
                .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Notes));

            RuleFor(x => x.UpdatedByUserId)
                .GreaterThan(0).WithMessage("Updated By User ID must be greater than 0");
        }
    }
}

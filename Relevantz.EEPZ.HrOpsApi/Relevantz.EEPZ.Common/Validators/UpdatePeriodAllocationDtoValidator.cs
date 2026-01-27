using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdatePeriodAllocationDtoValidator : AbstractValidator<UpdatePeriodAllocationDto>
    {
        public UpdatePeriodAllocationDtoValidator()
        {
            RuleFor(x => x.PeriodAllocationId)
                .GreaterThan(0).WithMessage("Period allocation ID must be greater than 0");

            RuleFor(x => x.AllocatedAmount)
                .GreaterThan(0).WithMessage("Allocated amount must be greater than 0")
                .LessThanOrEqualTo(999999999.99m).WithMessage("Allocated amount cannot exceed 999,999,999.99");

            RuleFor(x => x.Notes)
                .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Notes));
        }
    }
}

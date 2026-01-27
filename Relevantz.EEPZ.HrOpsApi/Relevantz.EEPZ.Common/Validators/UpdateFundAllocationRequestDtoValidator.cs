using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdateFundAllocationRequestDtoValidator : AbstractValidator<UpdateFundAllocationRequestDto>
    {
        public UpdateFundAllocationRequestDtoValidator()
        {
            RuleFor(x => x.AllocationId)
                .NotEmpty().WithMessage("Allocation ID is required")
                .GreaterThan(0).WithMessage("Allocation ID must be greater than 0");

            RuleFor(x => x.Amount)
                .GreaterThan(0).WithMessage("Amount must be greater than 0")
                .LessThanOrEqualTo(999999999.99m).WithMessage("Amount cannot exceed 999,999,999.99")
                .When(x => x.Amount.HasValue);

            RuleFor(x => x.GoalStatus)
                .MaximumLength(100).WithMessage("Goal Status cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.GoalStatus));

            RuleFor(x => x.Notes)
                .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.Notes));
        }
    }
}

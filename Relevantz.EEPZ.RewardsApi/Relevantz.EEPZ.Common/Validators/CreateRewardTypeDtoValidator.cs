using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Common.Validators
{
    public class CreateRewardTypeDtoValidator : AbstractValidator<CreateRewardTypeDto>
    {
        public CreateRewardTypeDtoValidator()
        {
            RuleLevelCascadeMode = CascadeMode.Stop;

            RuleFor(x => x.RewardCategory)
                .NotEmpty().WithMessage("RewardCategory is required.")
                .MaximumLength(100).WithMessage("RewardCategory cannot exceed 100 characters.");

            RuleFor(x => x.RewardName)
                .NotEmpty().WithMessage("RewardName is required.")
                .MaximumLength(150).WithMessage("RewardName cannot exceed 150 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.")
                .When(x => x.Description != null);

            RuleFor(x => x.CreatedBy)
                .NotNull().WithMessage("CreatedBy is required.")
                .GreaterThan(0).WithMessage("CreatedBy must be greater than 0.");
        }
    }
}
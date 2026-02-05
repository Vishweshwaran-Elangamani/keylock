using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdateRewardTypeDtoValidator : AbstractValidator<UpdateRewardTypeDto>
    {
        public UpdateRewardTypeDtoValidator()
        {
            RuleLevelCascadeMode = CascadeMode.Stop;

            RuleFor(x => x.RewardName)
                .NotEmpty().WithMessage("RewardName is required.")
                .MaximumLength(150).WithMessage("RewardName cannot exceed 150 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.")
                .When(x => x.Description != null);
        }
    }
}
using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdateGoalModelValidator : AbstractValidator<UpdateGoalModel>
    {
        public UpdateGoalModelValidator()
        {
            RuleFor(x => x.Title)
                .MinimumLength(3)
                .WithMessage("Goal title must be at least 3 characters")
                .MaximumLength(500)
                .WithMessage("Goal title cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.Title));

            RuleFor(x => x.Description)
                .MaximumLength(5000)
                .WithMessage("Goal description cannot exceed 5000 characters")
                .When(x => x.Description != null);

            RuleFor(x => x.Deadline)
                .GreaterThan(DateTime.UtcNow)
                .WithMessage("Deadline must be in the future")
                .When(x => x.Deadline.HasValue);

            RuleFor(x => x)
                .Must(HaveAtLeastOneFieldToUpdate)
                .WithMessage("At least one field must be provided for update");

            RuleForEach(x => x.Checklist)
                .SetValidator(new ChecklistItemModelValidator())
                .When(x => x.Checklist != null && x.Checklist.Any());
        }

        private bool HaveAtLeastOneFieldToUpdate(UpdateGoalModel model)
        {
            return !string.IsNullOrEmpty(model.Title)
                || model.Description != null
                || model.Deadline.HasValue
                || (model.Checklist != null && model.Checklist.Any());
        }
    }
}

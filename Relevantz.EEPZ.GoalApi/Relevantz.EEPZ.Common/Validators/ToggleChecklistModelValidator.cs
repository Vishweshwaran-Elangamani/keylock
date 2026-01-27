using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class ToggleChecklistModelValidator : AbstractValidator<ToggleChecklistModel>
    {
        public ToggleChecklistModelValidator()
        {
            RuleFor(x => x.ChecklistId)
                .GreaterThan(0)
                .WithMessage("Checklist ID must be greater than 0");
        }
    }
}

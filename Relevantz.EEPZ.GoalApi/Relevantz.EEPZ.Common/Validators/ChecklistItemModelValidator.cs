using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class ChecklistItemModelValidator : AbstractValidator<ChecklistItemModel>
    {
        public ChecklistItemModelValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Checklist item title is required")
                .MaximumLength(500)
                .WithMessage("Checklist item title cannot exceed 500 characters");

            RuleFor(x => x.Description)
                .MaximumLength(2000)
                .WithMessage("Checklist item description cannot exceed 2000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.AddedForEmployeeMasterId)
                .GreaterThan(0)
                .WithMessage("Assigned employee ID must be greater than 0")
                .When(x => x.AddedForEmployeeMasterId.HasValue);
        }
    }
}

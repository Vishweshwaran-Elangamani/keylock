using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class AssignGoalModelValidator : AbstractValidator<AssignGoalModel>
    {
        public AssignGoalModelValidator()
        {
            RuleFor(x => x.AssignedToEmployeeMasterIds)
                .NotNull()
                .WithMessage("Assignee list is required")
                .NotEmpty()
                .WithMessage("At least one assignee is required");

            RuleFor(x => x.AssignedToEmployeeMasterIds)
                .Must(HaveNoDuplicates)
                .WithMessage("Duplicate assignees are not allowed")
                .When(x =>
                    x.AssignedToEmployeeMasterIds != null && x.AssignedToEmployeeMasterIds.Any()
                );

            RuleFor(x => x.AssignedToEmployeeMasterIds)
                .Must(HaveAllPositiveIds)
                .WithMessage("All assignee IDs must be greater than 0")
                .When(x =>
                    x.AssignedToEmployeeMasterIds != null && x.AssignedToEmployeeMasterIds.Any()
                );

            RuleFor(x => x.AdditionalChecklist)
                .NotNull()
                .WithMessage("Additional checklist is required")
                .NotEmpty()
                .WithMessage(
                    "At least one checklist item must be provided for newly assigned users"
                );

            RuleFor(x => x.AdditionalChecklist)
                .Must(HaveNoUnassignedItems)
                .WithMessage(
                    "All checklist items must be assigned to a specific user. Shared items are not allowed"
                )
                .When(x => x.AdditionalChecklist != null && x.AdditionalChecklist.Any());

            RuleFor(x => x)
                .Must(HaveChecklistAssigneesInNewAssigneeList)
                .WithMessage("Checklist items can only be assigned to users being newly assigned")
                .When(x => x.AdditionalChecklist != null && x.AssignedToEmployeeMasterIds != null);

            RuleFor(x => x)
                .Must(EachNewAssigneeHasChecklistItem)
                .WithMessage("Each newly assigned user must have at least one checklist item")
                .When(x => x.AdditionalChecklist != null && x.AssignedToEmployeeMasterIds != null);

            RuleForEach(x => x.AdditionalChecklist)
                .SetValidator(new ChecklistItemModelValidator())
                .When(x => x.AdditionalChecklist != null && x.AdditionalChecklist.Any());
        }

        private bool HaveNoDuplicates(List<int> ids)
        {
            if (ids == null)
                return true;
            return ids.Count == ids.Distinct().Count();
        }

        private bool HaveAllPositiveIds(List<int> ids)
        {
            if (ids == null)
                return true;
            return ids.All(id => id > 0);
        }

        private bool HaveNoUnassignedItems(List<ChecklistItemModel> checklist)
        {
            if (checklist == null)
                return true;
            return checklist
                .Where(c => !string.IsNullOrWhiteSpace(c.Title))
                .All(c => c.AddedForEmployeeMasterId.HasValue);
        }

        private bool HaveChecklistAssigneesInNewAssigneeList(AssignGoalModel model)
        {
            if (model.AdditionalChecklist == null || model.AssignedToEmployeeMasterIds == null)
                return true;

            var checklistAssignees = model
                .AdditionalChecklist.Where(c => c.AddedForEmployeeMasterId.HasValue)
                .Select(c => c.AddedForEmployeeMasterId!.Value)
                .Distinct();

            return checklistAssignees.All(id => model.AssignedToEmployeeMasterIds.Contains(id));
        }

        private bool EachNewAssigneeHasChecklistItem(AssignGoalModel model)
        {
            if (model.AdditionalChecklist == null || model.AssignedToEmployeeMasterIds == null)
                return true;

            foreach (var assigneeId in model.AssignedToEmployeeMasterIds)
            {
                var hasItem = model.AdditionalChecklist.Any(c =>
                    c.AddedForEmployeeMasterId == assigneeId && !string.IsNullOrWhiteSpace(c.Title)
                );

                if (!hasItem)
                    return false;
            }
            return true;
        }
    }
}

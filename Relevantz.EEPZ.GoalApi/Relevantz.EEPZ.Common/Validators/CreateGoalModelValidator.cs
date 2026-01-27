using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class CreateGoalModelValidator : AbstractValidator<CreateGoalModel>
    {
        private static readonly string[] ValidGoalTypes = { "self", "team", "org" };

        public CreateGoalModelValidator()
        {
            RuleFor(x => x.GoalType)
                .NotEmpty()
                .WithMessage("Goal type is required")
                .Must(BeValidGoalType)
                .WithMessage($"Goal type must be one of: {string.Join(", ", ValidGoalTypes)}");

            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Goal title is required")
                .MinimumLength(3)
                .WithMessage("Goal title must be at least 3 characters")
                .MaximumLength(500)
                .WithMessage("Goal title cannot exceed 500 characters");

            RuleFor(x => x.Description)
                .MaximumLength(5000)
                .WithMessage("Goal description cannot exceed 5000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.Deadline)
                .NotEmpty()
                .WithMessage("Deadline is required")
                .GreaterThan(DateTime.UtcNow)
                .WithMessage("Deadline must be in the future");

            RuleFor(x => x.ProjectId)
                .GreaterThan(0)
                .WithMessage("Project ID must be greater than 0")
                .When(x => x.ProjectId.HasValue);

            RuleFor(x => x.Checklist)
                .NotNull()
                .WithMessage("Checklist is required")
                .Must(x => x != null && x.Count >= 3)
                .WithMessage("Goal must have at least 3 checklist items");

            RuleFor(x => x.Checklist)
                .Must(HaveAtLeastThreeValidItems)
                .WithMessage("Goal must have at least 3 valid checklist items with titles")
                .When(x => x.Checklist != null);

            RuleFor(x => x.AssignedToEmployeeMasterIds)
                .NotEmpty()
                .WithMessage("At least one assignee is required for team goals")
                .When(x => x.GoalType?.ToLower() == "team");

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

            RuleFor(x => x)
                .Must(HaveAllChecklistItemsAssigned)
                .WithMessage("All checklist items must be assigned to a team member for team goals")
                .When(x => x.GoalType?.ToLower() == "team" && x.Checklist != null);

            RuleFor(x => x)
                .Must(HaveChecklistAssigneesInAssigneeList)
                .WithMessage("Checklist items can only be assigned to users in the assignee list")
                .When(x =>
                    x.GoalType?.ToLower() == "team"
                    && x.Checklist != null
                    && x.AssignedToEmployeeMasterIds != null
                );

            RuleFor(x => x)
                .Must(AllAssigneesHaveChecklistItems)
                .WithMessage("Each assignee must have at least one checklist item assigned")
                .When(x =>
                    x.GoalType?.ToLower() == "team"
                    && x.Checklist != null
                    && x.AssignedToEmployeeMasterIds != null
                );

            RuleForEach(x => x.Checklist)
                .SetValidator(new ChecklistItemModelValidator())
                .When(x => x.Checklist != null && x.Checklist.Any());
        }

        private bool BeValidGoalType(string goalType)
        {
            if (string.IsNullOrEmpty(goalType))
                return false;
            return ValidGoalTypes.Contains(goalType.ToLower().Trim());
        }

        private bool HaveAtLeastThreeValidItems(List<ChecklistItemModel> checklist)
        {
            if (checklist == null)
                return false;
            return checklist.Count(c => !string.IsNullOrWhiteSpace(c.Title)) >= 3;
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

        private bool HaveAllChecklistItemsAssigned(CreateGoalModel model)
        {
            if (model.Checklist == null)
                return true;
            return model
                .Checklist.Where(c => !string.IsNullOrWhiteSpace(c.Title))
                .All(c => c.AddedForEmployeeMasterId.HasValue);
        }

        private bool HaveChecklistAssigneesInAssigneeList(CreateGoalModel model)
        {
            if (model.Checklist == null || model.AssignedToEmployeeMasterIds == null)
                return true;

            var checklistAssignees = model
                .Checklist.Where(c => c.AddedForEmployeeMasterId.HasValue)
                .Select(c => c.AddedForEmployeeMasterId!.Value)
                .Distinct();

            return checklistAssignees.All(id => model.AssignedToEmployeeMasterIds.Contains(id));
        }

        private bool AllAssigneesHaveChecklistItems(CreateGoalModel model)
        {
            if (model.Checklist == null || model.AssignedToEmployeeMasterIds == null)
                return true;

            foreach (var assigneeId in model.AssignedToEmployeeMasterIds)
            {
                var hasItems = model.Checklist.Any(c =>
                    c.AddedForEmployeeMasterId == assigneeId && !string.IsNullOrWhiteSpace(c.Title)
                );

                if (!hasItems)
                    return false;
            }
            return true;
        }
    }
}

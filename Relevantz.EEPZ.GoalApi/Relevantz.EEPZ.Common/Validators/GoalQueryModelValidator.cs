using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class GoalQueryModelValidator : AbstractValidator<GoalQueryModel>
    {
        private static readonly string[] ValidGoalTypes = { "self", "team", "org" };
        private static readonly string[] ValidGoalStatuses =
        {
            "pending",
            "open",
            "in_progress",
            "inprogress", // Added alternative
            "completed",
            "closed",
            "cancelled",
            "reopened",
        };

        public GoalQueryModelValidator()
        {
            RuleFor(x => x.Page).GreaterThanOrEqualTo(1).WithMessage("Page must be at least 1");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100)
                .WithMessage("Page size must be between 1 and 100");

            RuleFor(x => x.Search)
                .MaximumLength(200)
                .WithMessage("Search term cannot exceed 200 characters")
                .When(x => !string.IsNullOrEmpty(x.Search));

            RuleFor(x => x.Type)
                .Must(BeValidGoalType)
                .WithMessage($"Invalid goal type. Valid types: {string.Join(", ", ValidGoalTypes)}")
                .When(x => !string.IsNullOrEmpty(x.Type));

            RuleFor(x => x.Status)
                .Must(BeValidGoalStatus)
                .WithMessage(
                    $"Invalid goal status. Valid statuses: {string.Join(", ", ValidGoalStatuses)}"
                )
                .When(x => !string.IsNullOrEmpty(x.Status));

            RuleFor(x => x.ProjectId)
                .GreaterThan(0)
                .WithMessage("Project ID must be greater than 0")
                .When(x => x.ProjectId.HasValue);

            RuleFor(x => x.CreatedByEmployeeMasterId)
                .GreaterThan(0)
                .WithMessage("Creator employee ID must be greater than 0")
                .When(x => x.CreatedByEmployeeMasterId.HasValue);

            RuleFor(x => x.AssignedToEmployeeMasterId)
                .GreaterThan(0)
                .WithMessage("Assignee employee ID must be greater than 0")
                .When(x => x.AssignedToEmployeeMasterId.HasValue);

            RuleFor(x => x)
                .Must(HaveValidDueDateRange)
                .WithMessage("DueAfter must be before or equal to DueBefore")
                .When(x => x.DueAfter.HasValue && x.DueBefore.HasValue);

            RuleFor(x => x)
                .Must(HaveValidCreatedDateRange)
                .WithMessage("CreatedAfter must be before or equal to CreatedBefore")
                .When(x => x.CreatedAfter.HasValue && x.CreatedBefore.HasValue);
        }

        private bool BeValidGoalType(string? type)
        {
            if (string.IsNullOrEmpty(type))
                return true;
            return ValidGoalTypes.Contains(type.ToLower().Trim());
        }

        private bool BeValidGoalStatus(string? status)
        {
            if (string.IsNullOrEmpty(status))
                return true;
            // Normalize: remove underscores and spaces for flexible matching
            var normalized = status.ToLower().Trim().Replace("_", "").Replace(" ", "");
            var validNormalized = ValidGoalStatuses.Select(s => s.Replace("_", "")).ToArray();
            return validNormalized.Contains(normalized);
        }

        private bool HaveValidDueDateRange(GoalQueryModel model)
        {
            if (!model.DueAfter.HasValue || !model.DueBefore.HasValue)
                return true;
            return model.DueAfter.Value <= model.DueBefore.Value;
        }

        private bool HaveValidCreatedDateRange(GoalQueryModel model)
        {
            if (!model.CreatedAfter.HasValue || !model.CreatedBefore.HasValue)
                return true;
            return model.CreatedAfter.Value <= model.CreatedBefore.Value;
        }
    }
}

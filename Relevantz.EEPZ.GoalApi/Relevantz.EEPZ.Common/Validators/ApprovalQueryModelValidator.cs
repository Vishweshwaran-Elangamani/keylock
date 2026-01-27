using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class ApprovalQueryModelValidator : AbstractValidator<ApprovalQueryModel>
    {
        private static readonly string[] ValidStatuses =
        {
            "all",
            "pending",
            "approved",
            "rejected",
        };
        private static readonly string[] ValidTypes =
        {
            "all",
            "completion",
            "closure",
            "reopening",
            "reactivation",
            "creation",
            "selfgoalactivation",
            "delegation",
            "task_acknowledgment",
        };
        private static readonly string[] ValidInvolvements = { "all", "requested", "reviewing" };

        public ApprovalQueryModelValidator()
        {
            RuleFor(x => x.Page).GreaterThanOrEqualTo(1).WithMessage("Page must be at least 1");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100)
                .WithMessage("Page size must be between 1 and 100");

            RuleFor(x => x.Search)
                .MaximumLength(200)
                .WithMessage("Search term cannot exceed 200 characters")
                .When(x => !string.IsNullOrEmpty(x.Search));

            RuleFor(x => x.Status)
                .Must(BeValidStatus)
                .WithMessage($"Invalid status. Valid values: {string.Join(", ", ValidStatuses)}")
                .When(x => !string.IsNullOrEmpty(x.Status));

            RuleFor(x => x.Type)
                .Must(BeValidType)
                .WithMessage($"Invalid type. Valid values: {string.Join(", ", ValidTypes)}")
                .When(x => !string.IsNullOrEmpty(x.Type));

            RuleFor(x => x.Involvement)
                .Must(BeValidInvolvement)
                .WithMessage(
                    $"Invalid involvement. Valid values: {string.Join(", ", ValidInvolvements)}"
                )
                .When(x => !string.IsNullOrEmpty(x.Involvement));

            RuleFor(x => x.GoalId)
                .GreaterThan(0)
                .WithMessage("Goal ID must be greater than 0")
                .When(x => x.GoalId.HasValue);

            RuleFor(x => x)
                .Must(HaveValidDateRange)
                .WithMessage("RequestedAfter must be before or equal to RequestedBefore")
                .When(x => x.RequestedAfter.HasValue && x.RequestedBefore.HasValue);
        }

        private bool BeValidStatus(string? status)
        {
            if (string.IsNullOrEmpty(status))
                return true;
            return ValidStatuses.Contains(status.ToLower().Trim());
        }

        private bool BeValidType(string? type)
        {
            if (string.IsNullOrEmpty(type))
                return true;
            return ValidTypes.Contains(type.ToLower().Trim());
        }

        private bool BeValidInvolvement(string? involvement)
        {
            if (string.IsNullOrEmpty(involvement))
                return true;
            return ValidInvolvements.Contains(involvement.ToLower().Trim());
        }

        private bool HaveValidDateRange(ApprovalQueryModel model)
        {
            if (!model.RequestedAfter.HasValue || !model.RequestedBefore.HasValue)
                return true;
            return model.RequestedAfter.Value <= model.RequestedBefore.Value;
        }
    }
}

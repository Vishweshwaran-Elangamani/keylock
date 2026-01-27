using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class CreateApprovalRequestModelValidator : AbstractValidator<CreateApprovalRequestModel>
    {
        private static readonly string[] ValidApprovalTypes =
        {
            "completion",
            "closure",
            "reopening",
            "reactivation",
            "creation",
            "selfgoalactivation",
            "delegation",
            "task_acknowledgment",
        };

        public CreateApprovalRequestModelValidator()
        {
            RuleFor(x => x.ApprovalType)
                .NotEmpty()
                .WithMessage("Approval type is required")
                .Must(BeValidApprovalType)
                .WithMessage(
                    $"Invalid approval type. Valid types: {string.Join(", ", ValidApprovalTypes)}"
                );

            RuleFor(x => x.ReopenUntil)
                .NotNull()
                .WithMessage("Reopen deadline is required for reopening requests")
                .GreaterThan(DateTime.UtcNow)
                .WithMessage("Reopen deadline must be in the future")
                .When(x => x.ApprovalType?.ToLower().Trim() == "reopening");

            RuleFor(x => x.ProofAttachmentIds)
                .Must(HaveNoDuplicates)
                .WithMessage("Duplicate attachment IDs are not allowed")
                .When(x => x.ProofAttachmentIds != null && x.ProofAttachmentIds.Any());

            RuleFor(x => x.ProofAttachmentIds)
                .Must(HaveAllPositiveIds)
                .WithMessage("All attachment IDs must be greater than 0")
                .When(x => x.ProofAttachmentIds != null && x.ProofAttachmentIds.Any());
        }

        private bool BeValidApprovalType(string approvalType)
        {
            if (string.IsNullOrEmpty(approvalType))
                return false;
            return ValidApprovalTypes.Contains(approvalType.ToLower().Trim());
        }

        private bool HaveNoDuplicates(List<int>? ids)
        {
            if (ids == null)
                return true;
            return ids.Count == ids.Distinct().Count();
        }

        private bool HaveAllPositiveIds(List<int>? ids)
        {
            if (ids == null)
                return true;
            return ids.All(id => id > 0);
        }
    }
}

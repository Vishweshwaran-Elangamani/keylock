using FluentValidation;
using Relevantz.EEPZ.Common.ViewModels.Promotion.Request;

namespace Relevantz.EEPZ.Common.Validators.InternalOpportunity
{
    public class ApprovePromotionRequestDtoValidator : AbstractValidator<ApprovePromotionRequestDto>
    {
        public ApprovePromotionRequestDtoValidator()
        {
            RuleFor(x => x.ApprovalRemarks)
                .MaximumLength(500).WithMessage("Approval remarks cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.ApprovalRemarks));
        }
    }
}

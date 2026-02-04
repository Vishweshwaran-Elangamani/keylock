using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class AttachmentRequestDtoValidator : AbstractValidator<AttachmentRequestDto>
    {
        public AttachmentRequestDtoValidator()
        {
            RuleFor(x => x.FileName)
                .NotEmpty().WithMessage("FileName is required.")
                .MaximumLength(255).WithMessage("FileName must not exceed 255 characters.");

            RuleFor(x => x.DisplayOrder)
                .GreaterThanOrEqualTo(0)
                .When(x => x.DisplayOrder.HasValue)
                .WithMessage("DisplayOrder must be 0 or greater.");

            RuleFor(x => x.FileSize)
                .GreaterThan(0)
                .When(x => x.FileSize.HasValue)
                .WithMessage("FileSize must be greater than 0.");

            RuleFor(x => x.AttachmentNote)
                .MaximumLength(1000)
                .When(x => !string.IsNullOrWhiteSpace(x.AttachmentNote))
                .WithMessage("AttachmentNote must not exceed 1000 characters.");

            RuleFor(x => x)
                .Must(a => !string.IsNullOrWhiteSpace(a.FilePath) || !string.IsNullOrWhiteSpace(a.Base64Content))
                .WithMessage("Either FilePath or Base64Content must be provided.");

            RuleFor(x => x.FileType)
                .NotEmpty()
                .When(x => !string.IsNullOrWhiteSpace(x.Base64Content))
                .WithMessage("FileType is required when Base64Content is provided.");
        }
    }
}

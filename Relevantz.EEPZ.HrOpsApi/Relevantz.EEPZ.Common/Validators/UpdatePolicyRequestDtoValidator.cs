using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class UpdatePolicyRequestDtoValidator : AbstractValidator<UpdatePolicyRequestDto>
    {
        public UpdatePolicyRequestDtoValidator()
        {
            RuleFor(x => x.PolicyName)
                .MaximumLength(200).WithMessage("Policy name cannot exceed 200 characters")
                .When(x => !string.IsNullOrEmpty(x.PolicyName));

            RuleFor(x => x.Category)
                .MaximumLength(100).WithMessage("Category cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.Category));

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.ComplianceGuidance)
                .MaximumLength(2000).WithMessage("Compliance guidance cannot exceed 2000 characters")
                .When(x => !string.IsNullOrEmpty(x.ComplianceGuidance));

            RuleFor(x => x.Status)
                .Must(status => new[] { "Draft", "Published", "Archived" }.Contains(status))
                .WithMessage("Invalid status. Must be one of: Draft, Published, Archived")
                .When(x => !string.IsNullOrEmpty(x.Status));

            // Accept both HTTP URLs and MongoDB IDs (24-character hex strings)
            RuleFor(x => x.DocumentUrl)
                .Must(url => IsValidDocumentUrl(url))
                .WithMessage("Document URL must be a valid URL or MongoDB document ID")
                .When(x => !string.IsNullOrEmpty(x.DocumentUrl));

            RuleFor(x => x.DocumentName)
                .MaximumLength(255).WithMessage("Document name cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.DocumentName));

            RuleFor(x => x.DocumentType)
                .MaximumLength(50).WithMessage("Document type cannot exceed 50 characters")
                .When(x => !string.IsNullOrEmpty(x.DocumentType));

            RuleFor(x => x.DocumentSize)
                .GreaterThan(0).WithMessage("Document size must be greater than 0")
                .LessThanOrEqualTo(10485760).WithMessage("Document size cannot exceed 10MB")
                .When(x => x.DocumentSize.HasValue);
        }

        private bool IsValidDocumentUrl(string url)
        {
            if (string.IsNullOrEmpty(url))
                return true;

            // Check if it's a valid MongoDB ObjectId (24-character hex string)
            if (url.Length == 24 && System.Text.RegularExpressions.Regex.IsMatch(url, "^[0-9a-fA-F]{24}$"))
                return true;

            // Check if it's a valid HTTP/HTTPS URL
            if (Uri.TryCreate(url, UriKind.Absolute, out var uri))
            {
                return uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps;
            }

            return false;
        }
    }
}

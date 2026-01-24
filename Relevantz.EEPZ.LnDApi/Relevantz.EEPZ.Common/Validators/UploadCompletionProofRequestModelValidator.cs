using FluentValidation;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class UploadCompletionProofRequestModelValidator
        : AbstractValidator<UploadCompletionProofRequestModel>
    {
        public UploadCompletionProofRequestModelValidator()
        {
            RuleFor(x => x.AssignmentId)
                .GreaterThan(0)
                .WithMessage("AssignmentId must be greater than 0");

            RuleFor(x => x.ProofDocument)
                .NotNull()
                .WithMessage("ProofDocument is required")
                .Must(BeAValidFile)
                .WithMessage("Invalid file type. Only .pdf, .jpg, and .png files are allowed.");

            RuleFor(x => x.CompletionNotes)
                .MaximumLength(500)
                .WithMessage("Completion notes cannot exceed 500 characters");
        }

        private bool BeAValidFile(IFormFile file)
        {
            if (file == null)
                return false;

            var allowedExtensions = new[]
            {
                ".pdf",
                ".jpg",
                ".jpeg",
                ".png",
                ".gif",
                ".docx",
                ".doc",
                ".xlsx",
                ".xls",
                ".pptx",
                ".ppt",
                ".txt",
                ".rtf",
            };
            var fileExtension = System.IO.Path.GetExtension(file.FileName);
            return allowedExtensions.Contains(fileExtension.ToLower());
        }
    }
}

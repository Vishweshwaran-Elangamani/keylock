using FluentValidation;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class BecomeSmeRequestModelValidator : AbstractValidator<BecomeSmeRequestModel>
    {
        public BecomeSmeRequestModelValidator()
        {
            RuleFor(x => x.SkillId).GreaterThan(0).WithMessage("SkillId must be greater than 0");

            RuleFor(x => x.ProofDocument)
                .NotNull()
                .WithMessage("ProofDocument is required")
                .Must(BeAValidFile)
                .WithMessage("Invalid file type. Only .pdf, .jpg, and .png files are allowed.");
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

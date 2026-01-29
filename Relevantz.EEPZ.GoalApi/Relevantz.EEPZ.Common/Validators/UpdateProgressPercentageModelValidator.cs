using FluentValidation;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Validators
{
    public class ManualProgressUpdateModelValidator : AbstractValidator<UpdateProgressPercentageModel>
    {
        private static readonly string[] ValidSources = { "manual", "auto" };

        public ManualProgressUpdateModelValidator()
        {
            RuleFor(x => x.ProgressPercent)
                .InclusiveBetween(0, 100)
                .WithMessage("Progress must be between 0 and 100");

            RuleFor(x => x.Source)
                .NotEmpty()
                .WithMessage("Progress source is required")
                .Must(BeValidSource)
                .WithMessage($"Source must be one of: {string.Join(", ", ValidSources)}");
        }

        private bool BeValidSource(string source)
        {
            if (string.IsNullOrEmpty(source))
                return false;
            return ValidSources.Contains(source.ToLower().Trim());
        }
    }
}

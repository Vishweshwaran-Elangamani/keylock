using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
using System;
using System.Linq;

namespace Relevantz.EEPZ.Common.Validators
{
    public class SubmitSelfAssessmentRequestDtoValidator : AbstractValidator<SubmitSelfAssessmentRequestDto>
    {
        public SubmitSelfAssessmentRequestDtoValidator()
        {
            RuleFor(x => x.FormId)
                .GreaterThan(0)
                .WithMessage("FormId must be greater than 0.");

            RuleFor(x => x.UserId)
                .GreaterThan(0)
                .WithMessage("UserId must be greater than 0.");

            RuleFor(x => x.Status)
                .NotEmpty().WithMessage("Status is required.")
                .Must(BeValidStatus)
                .WithMessage("Status must be either 'Draft' or 'Submitted'.");

            RuleForEach(x => x.AssessmentDetails)
                .SetValidator(new AssessmentDetailRequestDtoValidator());

            RuleForEach(x => x.Attachments)
                .SetValidator(new AttachmentRequestDtoValidator())
                .When(x => x.Attachments != null && x.Attachments.Any());

            RuleFor(x => x.AssessmentDetails)
                .NotEmpty()
                .When(x => IsSubmitted(x.Status))
                .WithMessage("AssessmentDetails are required when submitting.");

            RuleForEach(x => x.AssessmentDetails)
                .Must(d => d.EmployeeRating.HasValue)
                .When(x => IsSubmitted(x.Status))
                .WithMessage("EmployeeRating is required for all competencies when submitting.");

            RuleFor(x => x.AssessmentDetails)
                .Must(list => list.Select(d => d.CompetencyId).Distinct().Count() == list.Count)
                .When(x => x.AssessmentDetails != null && x.AssessmentDetails.Any())
                .WithMessage("Duplicate CompetencyId found in AssessmentDetails.");
        }

        private static bool BeValidStatus(string status)
            => status.Equals("Draft", StringComparison.OrdinalIgnoreCase)
            || status.Equals("Submitted", StringComparison.OrdinalIgnoreCase);

        private static bool IsSubmitted(string status)
            => status.Equals("Submitted", StringComparison.OrdinalIgnoreCase);
    }
}
using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;
using static Relevantz.EEPZ.Common.Constants.Constants;
namespace Relevantz.EEPZ.Common.Validators
{
    public class ProcessChangeRequestDtoValidator : AbstractValidator<ProcessChangeRequestDto>
    {
        public ProcessChangeRequestDtoValidator()
        {
            RuleFor(x => x.RequestId)
                .NotEmpty().WithMessage("Request ID is required")
                .GreaterThan(0).WithMessage("Request ID must be greater than 0");
            RuleFor(x => x.Status)
                .NotEmpty().WithMessage("Status is required")
                .Must(status => new[] 
                { 
                    RequestStatuses.Approved,
                    RequestStatuses.Rejected
                }.Contains(status))
                .WithMessage("Status must be either 'Approved' or 'Rejected'");
            RuleFor(x => x.AdminRemarks)
                .MaximumLength(500).WithMessage("Admin Remarks cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.AdminRemarks));
            RuleFor(x => x.AdminRemarks)
                .NotEmpty().WithMessage("Admin Remarks are required when rejecting a request")
                .When(x => x.Status == RequestStatuses.Rejected);
        }
    }
}

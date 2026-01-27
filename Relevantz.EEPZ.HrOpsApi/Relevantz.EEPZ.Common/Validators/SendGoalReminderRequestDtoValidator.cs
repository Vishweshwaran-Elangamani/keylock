using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class SendGoalReminderRequestDtoValidator : AbstractValidator<SendGoalReminderRequestDto>
    {
        public SendGoalReminderRequestDtoValidator()
        {
            RuleFor(x => x.SendType)
                .NotEmpty().WithMessage("Send type is required")
                .Must(type => !string.IsNullOrEmpty(type) && 
                              new[] { "single", "bulk", "multiple", "all" }.Contains(type.Trim().ToLower()))
                .WithMessage("Invalid send type. Must be one of: single, bulk, multiple, all");

            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("User ID is required when send type is 'single'")
                .GreaterThan(0).WithMessage("User ID must be greater than 0")
                .When(x => !string.IsNullOrEmpty(x.SendType) && x.SendType.Trim().ToLower() == "single");

            RuleFor(x => x.UserIds)
                .NotEmpty().WithMessage("User IDs are required when send type is 'bulk' or 'multiple'")
                .Must(ids => ids != null && ids.Count > 0).WithMessage("At least one User ID must be provided")
                .Must(ids => ids == null || ids.All(id => id > 0)).WithMessage("All User IDs must be greater than 0")
                .When(x => !string.IsNullOrEmpty(x.SendType) && 
                           (x.SendType.Trim().ToLower() == "bulk" || x.SendType.Trim().ToLower() == "multiple"));

            RuleFor(x => x.FilterByDays)
                .GreaterThan(0).WithMessage("Filter by days must be greater than 0")
                .LessThanOrEqualTo(365).WithMessage("Filter by days cannot exceed 365")
                .When(x => x.FilterByDays.HasValue);
        }
    }
}

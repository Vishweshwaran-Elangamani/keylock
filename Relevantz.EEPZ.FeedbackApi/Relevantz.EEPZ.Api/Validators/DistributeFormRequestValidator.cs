using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

public class DistributeFormRequestValidator 
    : AbstractValidator<DistributeFormRequest>
{
    public DistributeFormRequestValidator()
    {
        RuleFor(x => x.EmployeeIds)
            .NotNull()
            .WithMessage("Employee list is required.");

        RuleFor(x => x.EmployeeIds)
            .Must(ids => ids.Any())
            .When(x => x.EmployeeIds != null)
            .WithMessage("At least one employee must be assigned.");

        RuleForEach(x => x.EmployeeIds)
            .GreaterThan(0);
    }
}

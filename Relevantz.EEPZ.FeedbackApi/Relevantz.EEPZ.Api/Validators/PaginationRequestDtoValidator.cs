using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

public class PaginationRequestDtoValidator 
    : AbstractValidator<PaginationRequestDto>
{
    public PaginationRequestDtoValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0)
            .WithMessage("Page number must be greater than 0.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("Page size must be between 1 and 100.");

        RuleFor(x => x.Search)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Search))
            .WithMessage("Search text cannot exceed 100 characters.");
    }
}

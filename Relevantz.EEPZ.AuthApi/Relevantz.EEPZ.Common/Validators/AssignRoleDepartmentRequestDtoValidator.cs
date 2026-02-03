using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class AssignRoleDepartmentRequestDtoValidator : AbstractValidator<AssignRoleDepartmentRequestDto>
    {
        public AssignRoleDepartmentRequestDtoValidator()
        {
            RuleFor(x => x.EmployeeId)
                .GreaterThan(0).WithMessage("Valid employee ID is required");

            RuleFor(x => x.RoleId)
                .GreaterThan(0).WithMessage("Valid role ID is required");

            RuleFor(x => x.DepartmentId)
                .GreaterThan(0).WithMessage("Valid department ID is required");
        }
    }
}

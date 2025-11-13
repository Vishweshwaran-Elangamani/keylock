using System;
using Relevantz.EEPZ.Common.ViewModels.Promotion.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class PromotionValidator
    {
        public static void ValidateCreate(CreatePromotionRequestDto request)
        {
            if (request.EmployeeUserId <= 0)
                throw new ArgumentException("Valid employee ID is required");

            if (request.DepartmentId <= 0)
                throw new ArgumentException("Valid department ID is required");

            if (string.IsNullOrEmpty(request.NewRole))
                throw new ArgumentException("New role is required");

            if (request.NewSalary <= 0)
                throw new ArgumentException("New salary must be greater than 0");

            if (request.PromotionDate == default)
                throw new ArgumentException("Promotion date is required");

            if (request.OldSalary.HasValue && request.NewSalary < request.OldSalary.Value)
                throw new ArgumentException("New salary cannot be less than old salary");
        }
    }
}

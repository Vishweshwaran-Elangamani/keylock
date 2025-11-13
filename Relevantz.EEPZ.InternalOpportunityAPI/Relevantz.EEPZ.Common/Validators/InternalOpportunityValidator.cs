using System;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class InternalOpportunityValidator
    {
        public static void ValidateCreate(CreateInternalOpportunityRequestDto request)
        {
            if (string.IsNullOrEmpty(request.OpportunityName))
                throw new ArgumentException("Opportunity name is required");

            if (request.DepartmentId <= 0)
                throw new ArgumentException("Valid department ID is required");

            if (request.Deadline == default)
                throw new ArgumentException("Deadline is required");

            if (request.Deadline < DateOnly.FromDateTime(DateTime.UtcNow))
                throw new ArgumentException("Deadline cannot be in the past");
        }

        public static void ValidateUpdate(UpdateInternalOpportunityRequestDto request)
        {
            if (request.Deadline.HasValue && request.Deadline.Value < DateOnly.FromDateTime(DateTime.UtcNow))
                throw new ArgumentException("Deadline cannot be in the past");
        }
    }
}

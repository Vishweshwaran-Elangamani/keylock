using System;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;

namespace Relevantz.EEPZ.Common.Validators
{
    public class NominationValidator
    {
        public static void ValidateSelfNomination(CreateSelfNominationRequestDto request)
        {
            if (request.OpportunityId <= 0)
                throw new ArgumentException("Valid opportunity ID is required");

            if (string.IsNullOrEmpty(request.Justification) || request.Justification.Length < 10)
                throw new ArgumentException("Justification must be at least 10 characters");
        }

        public static void ValidateManagerNomination(CreateManagerNominationRequestDto request)
        {
            if (request.OpportunityId <= 0)
                throw new ArgumentException("Valid opportunity ID is required");

            if (request.NomineeEmployeeId <= 0)
                throw new ArgumentException("Valid employee ID is required");

            if (string.IsNullOrEmpty(request.Justification) || request.Justification.Length < 10)
                throw new ArgumentException("Justification must be at least 10 characters");
        }

        public static void ValidateManagerReview(ManagerReviewRequestDto request)
        {
            if (string.IsNullOrEmpty(request.ActionTaken))
                throw new ArgumentException("Action is required");

            if (request.ActionTaken != "Approved" && request.ActionTaken != "Rejected")
                throw new ArgumentException("Action must be either 'Approved' or 'Rejected'");
        }

        public static void ValidateDeptHeadReview(DepartmentHeadReviewRequestDto request)
        {
            if (string.IsNullOrEmpty(request.Action))
                throw new ArgumentException("Action is required");

            if (request.Action != "Approved" && request.Action != "Rejected")
                throw new ArgumentException("Action must be either 'Approved' or 'Rejected'");
        }
    }
}

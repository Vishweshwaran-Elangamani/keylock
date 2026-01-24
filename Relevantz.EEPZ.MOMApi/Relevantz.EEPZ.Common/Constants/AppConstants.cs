namespace Relevantz.EEPZ.Common.Constants
{
    public static class AppConstants
    {
        public static class ExceptionMessages
        {
            public const string ValidationFailed = "Validation failed";
            public const string UnexpectedError = "An unexpected error occurred";

            public const string Unauthorized = "Unauthorized";
            public const string UnauthorizedAccess = "Unauthorized access";
            public const string UserIdNotFoundInToken = "User ID not found in token";

            public const string InvalidPagination = "PageNumber must be >= 1 and PageSize must be between 1 and 100";
            public const string InvalidDateRange = "Start date cannot be after end date";
            public const string InvalidArgument = "Invalid argument passed";
            public const string InvalidOperation = "Invalid operation";

            public const string MomNotFound = "MOM not found";
            public const string ActionItemNotFound = "Action item not found";
        }

        public static class ResponseMessages
        {
            public const string MomCreatedSuccessfully = "MOM created successfully";
            public const string MomUpdatedSuccessfully = "MOM updated successfully";
            public const string MomRetrievedSuccessfully = "MOM retrieved successfully";
            public const string MomDeletedSuccessfully = "MOM deleted successfully";
            public const string MomsRetrievedSuccessfully = "MOMs retrieved successfully";

            public const string ActionItemUpdatedSuccessfully = "Action item status updated successfully";
            public const string ActionItemsRetrievedSuccessfully = "Action items retrieved successfully";

            public const string MomSharedSuccessfully = "MOM shared successfully";
            public const string SharedMomsRetrievedSuccessfully = "Shared MOMs retrieved successfully";
        }

        public static class Roles
        {
            public const string Employee = "Employee";
            public const string Manager = "Manager";
            public const string HR = "HR";
        }

        public static class ClaimTypes
        {
            public const string Role = "role";
            public const string Sub = "sub";
            public const string MsRoleSchema = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
            public const string EmployeeId = "empId";
        }
    }
}

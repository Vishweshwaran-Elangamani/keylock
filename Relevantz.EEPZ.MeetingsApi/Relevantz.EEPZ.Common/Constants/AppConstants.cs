namespace Relevantz.EEPZ.Common.Constants
{
    public static class AppConstants
    {
        public static class ExceptionMessages
        {
            public const string ValidationFailed = "Validation failed";
            public const string UnexpectedError = "An unexpected error occurred";
            public const string Unauthorized = "Unauthorized";
            public const string UserIdNotFoundInToken = "User ID not found in token";
            public const string InvalidMeetingId = "Invalid meeting ID";
            public const string MeetingNotFound = "Meeting not found";
            public const string InvalidPagination = "PageNumber must be >= 1 and PageSize must be between 1 and 100";
            public const string InvalidDateRange = "Start date cannot be after end date";
            public const string InvalidRsvpStatus = "Invalid RSVP status";
            public const string UnauthorizedAccess = "Unauthorized access";
            public const string InvalidArgument = "Invalid argument passed";
            public const string InvalidOperation = "Invalid operation";
        }

        public static class ResponseMessages
        {
            public const string MeetingScheduledSuccessfully = "Meeting scheduled successfully";
            public const string MeetingsRetrievedSuccessfully = "Meetings retrieved successfully";
            public const string MeetingRetrievedSuccessfully = "Meeting retrieved successfully";
            public const string OneOnOneReportGeneratedSuccessfully = "One-on-one report generated successfully";
            public const string OneOnOneSummaryGeneratedSuccessfully = "One-on-one summary generated successfully";
            public const string RsvpSubmittedSuccessfully = "RSVP submitted successfully";
            public const string InvitationsRetrievedSuccessfully = "Invitations retrieved successfully";
            public const string RsvpSummaryRetrievedSuccessfully = "RSVP summary retrieved successfully";
            public const string PendingRsvpCountRetrievedSuccessfully = "Pending RSVP count retrieved successfully";
            public const string RsvpUpdatedSuccessfully = "RSVP updated successfully";
            public const string MeetingRsvpSummaryRetrievedSuccessfully = "Meeting RSVP summary retrieved successfully";
        }

        public static class Roles
        {
            public const string Employee = "Employee";
            public const string Manager = "Manager";
            public const string Admin = "Admin"; 
        }

        public static class ClaimTypes
        {
            public const string Role = "role";
            public const string Sub = "sub";
            public const string MsRoleSchema = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
            public const string EmployeeId = "empId";
        }

        public static class ValidationMessages
        {
            public const string MissingRequiredField = "Required field is missing";
            public const string InvalidFormat = "The format is invalid";
            public const string InvalidEmail = "Invalid email format";
        }

        
    }
}

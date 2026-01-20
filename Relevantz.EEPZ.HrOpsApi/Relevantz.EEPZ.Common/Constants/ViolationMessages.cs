namespace Relevantz.EEPZ.Common.Constants
{
    public static class ViolationMessages
    {
        // Success Messages
        public const string ViolationReportedSuccess = "Violation reported successfully";
        public const string ViolationResolvedSuccess = "Violation resolved successfully";
        
        // Error Messages
        public const string ViolationNotFound = "Violation not found";
        public const string InvalidEmployeeUserId = "Invalid Employee User ID";
        public const string InvalidPolicyId = "Invalid Policy ID";
        public const string InvalidViolationType = "Violation type is required";
        public const string InvalidViolationId = "Invalid Violation ID";
        
        // Failure Messages
        public const string FailedToReportViolation = "Failed to report violation";
        public const string FailedToFetchViolations = "Failed to fetch violations";
        public const string FailedToFetchViolation = "Failed to fetch violation";
        public const string FailedToResolveViolation = "Failed to resolve violation";
        public const string FailedToFetchViolationStats = "Failed to fetch violation statistics";
        public const string DatabaseError = "Database error occurred";
        public const string UnexpectedError = "Unexpected error occurred";
        
        // Log Messages
        public const string LogViolationReported = "Violation reported: {ViolationId} by user {UserId} for employee {EmployeeUserId}";
        public const string LogViolationResolved = "Violation resolved: {ViolationId} with notes: {ResolutionNotes}";
        
        public const string LogErrorReportingViolation = "Error reporting violation for employee {EmployeeUserId}";
        public const string LogErrorFetchingAllViolations = "Error fetching all violations";
        public const string LogErrorFetchingViolation = "Error fetching violation {ViolationId}";
        public const string LogErrorFetchingEmployeeViolations = "Error fetching violations for employee {EmployeeUserId}";
        public const string LogErrorFetchingPolicyViolations = "Error fetching violations for policy {PolicyId}";
        public const string LogErrorResolvingViolation = "Error resolving violation {ViolationId}";
        public const string LogErrorFetchingViolationStats = "Error fetching violation statistics";
        public const string LogDatabaseErrorFetchingViolation = "Database error fetching violation {ViolationId}";
    }
}

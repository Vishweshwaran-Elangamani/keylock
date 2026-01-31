namespace Relevantz.EEPZ.Common
{
    public static class ApiMessages
    {
        // ✅ Generic Success
        public const string Success = "Request processed successfully.";
        public const string Created = "Record created successfully.";
        public const string Updated = "Record updated successfully.";
        public const string Deleted = "Record deleted successfully.";

        // ✅ SLA Specific
        public const string Closed = "SLA closed successfully.";
        public const string Reopened = "SLA reopened successfully.";

        // ✅ Compliance
        public const string ComplianceCalculated = "Compliance calculated successfully.";
        public const string ComplianceFetched = "Compliance data fetched successfully.";

        // ✅ Validation / Client Errors
        public const string ValidationFailed = "Validation failed.";
        public const string NotFound = "Record not found.";
        public const string NoRecords = "No records found.";
        public const string BulkLimitExceeded = "Bulk limit exceeded.";
        public const string Unauthorized = "User is not authorized.";

        // ✅ System Errors
        public const string UnexpectedError = "An unexpected error occurred. Please contact support.";
    }
}

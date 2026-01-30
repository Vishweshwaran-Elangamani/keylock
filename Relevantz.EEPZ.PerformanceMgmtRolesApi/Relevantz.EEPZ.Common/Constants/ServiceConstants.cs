namespace Relevantz.EEPZ.Common.Constants
{
    public static class ServiceMessages
    {
        public const string AssessmentNotFound = "Assessment not found";
        public const string EmployeeAlreadyApproved = "Employee already approved";
        public const string AlreadyAcknowledged = "Already acknowledged";
        public const string FailedToFetchSubmittedRatings = "Failed to fetch submitted ratings";
        public const string GenericErrorPrefix = "Error:";
        public const string ApprovalRecordNotFound = "Approval record not found";
    }

    public static class ServiceErrorCodes
    {
        public const string ApprovalNotFound = "APPROVAL_NOT_FOUND";
        public const string AssessmentOrProjectNotFound = "ASSESSMENT_OR_PROJECT_NOT_FOUND";
        public const string NotFoundPrefix = "NOT_FOUND";
        public const string AttachmentNotFound = "ATTACHMENT_NOT_FOUND";
        public const string FileNotFound = "FILE_NOT_FOUND";
    }

    public static class DefaultLabels
    {
        public const string Unknown = "Unknown";
        public const string NoL1 = "No L1";
        public const string NoL2 = "No L2";
        public const string L1Reviewer = "L1 Reviewer";
        public const string L2Reviewer = "L2 Reviewer";
        public const string Employee = "Employee";
    }

    public static class ContentTypes
    {
        public const string OctetStream = "application/octet-stream";
    }
}
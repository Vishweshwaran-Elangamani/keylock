namespace Relevantz.EEPZ.Common.Constants
{
    public static class ChangeRequestMessages
    {
        // Protected Employee Messages
        public const string ProtectedAccountChangeNotAllowed = "Change requests are not allowed for this account. Please contact system administrator for assistance.";
        public const string ProtectedAccountProcessNotAllowed = "Cannot process change request for this protected account. Please contact system administrator.";
        // Password Validation Messages
        public const string CurrentPasswordRequired = "Current password is required for verification";
        public const string InvalidPassword = "Invalid password. Please enter your correct current password.";
        // Pending Request Messages
        public const string PendingRequestExists = "You already have a pending change request. Please wait for admin approval or cancel the existing request.";
        // Email Validation Messages
        public const string NewEmailRequired = "New email is required";
        public const string InvalidEmailFormat = "Invalid email format";
        public const string EmailSameAsCurrent = "New email is same as current email";
        public const string EmailAlreadyExists = "Email already exists in the system";
        // Employee Company ID Messages
        public const string NewEmployeeCompanyIdRequired = "New Employee Company ID is required";
        public const string EmployeeCompanyIdSameAsCurrent = "New Employee Company ID is same as current ID";
        public const string EmployeeCompanyIdAlreadyExists = "Employee Company ID already exists in the system";
        // Change Type Messages
        public const string InvalidChangeType = "Invalid change type: {0}. Only 'Email' and 'EmployeeCompanyId' are supported.";
        // Request Processing Messages
        public const string ChangeRequestNotFound = "Change request not found";
        public const string ChangeRequestAlreadyProcessed = "Change request already processed";
        // Authorization Messages
        public const string UnauthorizedToCancel = "You are not authorized to cancel this request";
        public const string OnlyPendingCanBeCancelled = "Only pending requests can be cancelled";
        public const string AlreadyProcessed = "Change request has already been processed";
        public const string InvalidStatusValue = "Invalid status value. Must be 'Approved' or 'Rejected'";
        public const string NewEmailMissing = "New email is missing from change request";
        public const string NewEmployeeCompanyIdMissing = "New Employee Company ID is missing from change request";
    }
}

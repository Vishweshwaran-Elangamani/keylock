namespace Relevantz.EEPZ.Common.Constants
{
    public static class PolicyMessages
    {
        // Success Messages
        public const string PolicyCreatedSuccess = "Policy created successfully";
        public const string PolicyUpdatedSuccess = "Policy updated successfully";
        public const string PolicyDeletedSuccess = "Policy deleted successfully";
        public const string PolicyPublishedSuccess = "Policy is now visible to all employees";
        public const string PolicyUnpublishedSuccess = "Policy unpublished successfully";

        // Error Messages
        public const string PolicyNotFound = "Policy not found";
        public const string PolicyNameExists = "Policy name already exists";
        public const string PolicyAlreadyPublished = "Policy is already published";
        
        // Failure Messages
        public const string FailedToCreatePolicy = "Failed to create policy";
        public const string FailedToFetchPolicies = "Failed to fetch policies";
        public const string FailedToFetchPolicy = "Failed to fetch policy";
        public const string FailedToUpdatePolicy = "Failed to update policy";
        public const string FailedToDeletePolicy = "Failed to delete policy";
        public const string FailedToPublishPolicy = "Failed to publish policy";
        public const string FailedToUnpublishPolicy = "Failed to unpublish policy";
        
        // Log Messages
        public const string LogPolicyCreated = "Policy created: {PolicyName} (ID: {PolicyId}) by user {UserId}";
        public const string LogPolicyUpdated = "Policy updated: {PolicyName} (ID: {PolicyId})";
        public const string LogPolicyDeleted = "Policy deleted (marked as inactive): ID {PolicyId}";
        public const string LogPolicyPublished = "Policy published: {PolicyName} (ID: {PolicyId}) by user {UserId}";
        public const string LogPolicyUnpublished = "Policy {PolicyId} unpublished successfully";
        
        public const string LogErrorCreatingPolicy = "Error creating policy {PolicyName}";
        public const string LogErrorFetchingAllPolicies = "Error fetching all policies";
        public const string LogErrorFetchingActivePolicies = "Error fetching active policies";
        public const string LogErrorFetchingInactivePolicies = "Error fetching inactive policies";
        public const string LogErrorFetchingPublishedPolicies = "Error fetching published policies";
        public const string LogErrorFetchingDraftPolicies = "Error fetching draft policies";
        public const string LogErrorFetchingPolicy = "Error fetching policy {PolicyId}";
        public const string LogErrorUpdatingPolicy = "Error updating policy {PolicyId}";
        public const string LogErrorDeletingPolicy = "Error deleting policy {PolicyId}";
        public const string LogErrorPublishingPolicy = "Error publishing policy {PolicyId}";
        public const string LogErrorUnpublishingPolicy = "Error unpublishing policy";
    }
}

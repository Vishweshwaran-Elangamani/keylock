namespace Relevantz.EEPZ.Api.Constants
{
    public static class MessageConstants
    {
        // Opportunity messages
        public const string OpportunityGraphData = "Opportunity graph data";
        public const string OpportunityDeletedSuccessfully = "Opportunity deleted successfully";
        
        // Authorization messages
        public const string UserIdNotFoundInToken = "User ID not found in token";
        public const string ManagerIdNotFoundInToken = "Manager ID not found in token";
        public const string DepartmentHeadIdNotFoundInToken = "Department Head ID not found in token";
        
        // Validation messages
        public const string RequestBodyRequired = "Request body is required";
        public const string ActionRequired = "Action is required";
        public const string ActionMustBeApprovedOrRejected = "Action must be 'Approved' or 'Rejected'";
    }
}

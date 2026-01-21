namespace Relevantz.EEPZ.Common.Constants
{
    public static class ServiceMessages
    {
        // Period Allocation Service Messages
        public const string PeriodAllocationCreatedSuccess = "Period allocation created successfully";
        public const string PeriodAllocationUpdatedSuccess = "Period allocation updated successfully";
        public const string PeriodAllocationDeletedSuccess = "Period allocation deleted successfully";
        public const string PeriodAllocationRetrievedSuccess = "Period allocation retrieved successfully";
        
        // ✅ FIXED: Changed {Count} to {0}
        public const string PeriodAllocationsRetrievedSuccess = "Retrieved {0} period allocations";
        
        public const string BudgetNotFound = "Budget not found";
        public const string PeriodAllocationNotFound = "Period allocation not found";
        public const string ParentBudgetNotFound = "Parent budget not found";
        
        // ✅ FIXED: Changed {Period} {Year} to {0} {1}
        public const string PeriodAllocationAlreadyExists = "Period allocation already exists for {0} {1}";
        
        // ✅ FIXED: Changed {Total:N2} {Budget:N2} to {0:N2} {1:N2}
        public const string TotalBudgetExceeded = "Total period allocations ({0:N2}) would exceed total budget ({1:N2})";
        
        // ✅ FIXED: Changed {Available:N2} to {0:N2}
        public const string UpdatedAmountExceedsBudget = "Updated amount would exceed total budget. Available: {0:N2}";
        
        public const string CannotDeleteWithSubAllocations = "Cannot delete period allocation with existing sub-allocations. Delete sub-allocations first.";
        
        public const string ErrorCreatingPeriodAllocation = "An error occurred while creating period allocation";
        public const string ErrorUpdatingPeriodAllocation = "An error occurred while updating period allocation";
        public const string ErrorDeletingPeriodAllocation = "An error occurred while deleting period allocation";
        public const string ErrorFetchingPeriodAllocation = "An error occurred while fetching period allocation";
        public const string ErrorFetchingPeriodAllocations = "An error occurred while fetching period allocations";
        
        // Input Validation Messages
        public const string InvalidBudgetId = "Budget ID must be greater than 0";
        public const string InvalidAllocatedAmount = "Allocated amount must be greater than 0";
        public const string InvalidPeriod = "Period cannot be null or empty";
        public const string InvalidPeriodYear = "Period year must be greater than 0";
        public const string InvalidPeriodAllocationId = "Period allocation ID must be greater than 0";
        
        // Fund Allocation Service Messages
        public const string FundAllocationCreatedSuccess = "Fund allocation created successfully";
        public const string FundAllocationUpdatedSuccess = "Fund allocation updated successfully";
        public const string FundAllocationDeletedSuccess = "Fund allocation deleted successfully";
        public const string FundAllocationRetrievedSuccess = "Fund allocation retrieved successfully";
        
        // ✅ FIXED: Changed {Count} to {0}
        public const string FundAllocationsRetrievedSuccess = "Retrieved {0} fund allocations";
        public const string FundAllocationsByDepartmentRetrievedSuccess = "Retrieved {0} fund allocations for department";
        
        // ✅ FIXED: Changed {Count} {Type} to {0} {1}
        public const string FundAllocationsByTypeRetrievedSuccess = "Retrieved {0} fund allocations of type: {1}";
        
        public const string FundAllocationNotFound = "Fund allocation not found";
        
        // ✅ FIXED: Changed {BudgetId} to {0}
        public const string BudgetNotFoundForAllocation = "Budget with ID {0} not found";
        
        // ✅ FIXED: Changed {Period} {Year} to {0} {1}
        public const string PeriodAllocationNotFoundForFund = "Period allocation not found for {0} {1}. Create period allocation first.";
        
        // ✅ FIXED: Changed {Amount:N2} {Available:N2} to {0:N2} {1:N2}
        public const string AmountExceedsPeriodAllocation = "Amount ({0:N2}) exceeds available period allocation ({1:N2})";
        
        public const string FailedToDeleteFundAllocation = "Failed to delete fund allocation";
        
        public const string ErrorCreatingFundAllocation = "An error occurred while creating fund allocation";
        public const string ErrorUpdatingFundAllocation = "An error occurred while updating fund allocation";
        public const string ErrorDeletingFundAllocation = "An error occurred while deleting fund allocation";
        public const string ErrorFetchingFundAllocation = "An error occurred while fetching fund allocation";
        public const string ErrorFetchingFundAllocations = "An error occurred while fetching fund allocations";
        
        // Input Validation Messages for Fund Allocation
        public const string InvalidAllocationId = "Allocation ID must be greater than 0";
        public const string InvalidAmount = "Amount must be greater than 0";
        public const string InvalidDepartmentIdForAllocation = "Department ID must be greater than 0";
        public const string InvalidAllocationTypeForFund = "Allocation type cannot be null or empty";
    }
}

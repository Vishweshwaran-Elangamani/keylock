namespace Relevantz.EEPZ.Common.Constants
{
    public static class RepositoryMessages
    {
        // Budget Period Allocation Messages
        public const string PeriodAllocationCreated = "Period allocation created with ID {PeriodAllocationId}";
        public const string PeriodAllocationUpdated = "Period allocation updated with ID {PeriodAllocationId}";
        public const string PeriodAllocationDeleted = "Period allocation deleted with ID {PeriodAllocationId}";
        
        public const string ErrorCreatingPeriodAllocation = "Error creating period allocation";
        public const string ErrorUpdatingPeriodAllocation = "Error updating period allocation with ID {PeriodAllocationId}";
        public const string ErrorDeletingPeriodAllocation = "Error deleting period allocation with ID {PeriodAllocationId}";
        public const string ErrorFetchingPeriodAllocation = "Error fetching period allocation with ID {PeriodAllocationId}";
        public const string ErrorFetchingAllPeriodAllocations = "Error fetching all period allocations";
        public const string ErrorFetchingPeriodAllocationsByBudget = "Error fetching period allocations for budget {BudgetId}";
        public const string ErrorFetchingPeriodAllocationDetails = "Error fetching period allocation details for ID {PeriodAllocationId}";
        
        // Cost Mapping (Department Budget) Messages
        public const string CostMappingCreated = "Department budget created with ID {BudgetId}";
        public const string CostMappingUpdated = "Department budget updated with ID {BudgetId}";
        public const string CostMappingDeleted = "Department budget deleted with ID {BudgetId}";
        public const string CostMappingNotFound = "Department budget with ID {BudgetId} not found";
        
        public const string ErrorCreatingCostMapping = "Error creating department budget";
        public const string ErrorUpdatingCostMapping = "Error updating department budget with ID {BudgetId}";
        public const string ErrorDeletingCostMapping = "Error deleting department budget with ID {BudgetId}";
        public const string ErrorFetchingCostMapping = "Error fetching department budget with ID {BudgetId}";
        public const string ErrorFetchingAllCostMappings = "Error fetching all department budgets";
        public const string ErrorFetchingCostMappingsByDepartment = "Error fetching department budgets for department {DepartmentId}";
        public const string ErrorFetchingCostMappingsByFiscalYear = "Error fetching department budgets for fiscal year {FiscalYear}";
        public const string ErrorFetchingCurrentHeadcount = "Error fetching current headcount for department {DepartmentId}";
        
        // Department Messages
        public const string DepartmentCreated = "Department created with ID {DepartmentId}";
        public const string DepartmentUpdated = "Department updated with ID {DepartmentId}";
        public const string DepartmentDeleted = "Department deleted with ID {DepartmentId}";
        public const string DepartmentNotFound = "Department with ID {DepartmentId} not found";
        
        public const string ErrorCreatingDepartment = "Error creating department";
        public const string ErrorUpdatingDepartment = "Error updating department with ID {DepartmentId}";
        public const string ErrorDeletingDepartment = "Error deleting department with ID {DepartmentId}";
        public const string ErrorFetchingDepartment = "Error fetching department with ID {DepartmentId}";
        public const string ErrorFetchingDepartmentByName = "Error fetching department by name {DepartmentName}";
        public const string ErrorFetchingAllDepartments = "Error fetching all departments";
        public const string ErrorCheckingDepartmentNameExists = "Error checking if department name exists: {DepartmentName}";
        
        // Fund Allocation Messages
        public const string FundAllocationCreated = "Fund allocation created with ID {AllocationId}";
        public const string FundAllocationUpdated = "Fund allocation updated with ID {AllocationId}";
        public const string FundAllocationDeleted = "Fund allocation deleted with ID {AllocationId}";
        public const string FundAllocationNotFound = "Fund allocation with ID {AllocationId} not found";
        
        public const string ErrorCreatingFundAllocation = "Error creating fund allocation";
        public const string ErrorUpdatingFundAllocation = "Error updating fund allocation with ID {AllocationId}";
        public const string ErrorDeletingFundAllocation = "Error deleting fund allocation with ID {AllocationId}";
        public const string ErrorFetchingFundAllocation = "Error fetching fund allocation with ID {AllocationId}";
        public const string ErrorFetchingAllFundAllocations = "Error fetching all fund allocations";
        public const string ErrorFetchingFundAllocationsByDepartment = "Error fetching fund allocations for department {DepartmentId}";
        public const string ErrorFetchingFundAllocationsByType = "Error fetching fund allocations by type {AllocationType}";
        public const string ErrorFetchingFundAllocationsByEmployee = "Error fetching fund allocations for employee {EmployeeUserId}";
        public const string ErrorFetchingFundAllocationDetails = "Error fetching fund allocation details for ID {AllocationId}";
        public const string ErrorCheckingBudgetExists = "Error checking if budget exists: {BudgetId}";
        public const string ErrorValidatingPeriod = "Error validating period for budget {BudgetId}, period {Period}, year {PeriodYear}";
        
        // Policy Messages
        public const string PolicyCreated = "Policy created with ID {PolicyId}";
        public const string PolicyUpdated = "Policy updated with ID {PolicyId}";
        public const string PolicyDeleted = "Policy soft-deleted (marked inactive) with ID {PolicyId}";
        public const string PolicyNotFound = "Policy with ID {PolicyId} not found";
        
        public const string ErrorCreatingPolicy = "Error creating policy";
        public const string ErrorUpdatingPolicy = "Error updating policy with ID {PolicyId}";
        public const string ErrorDeletingPolicy = "Error deleting policy with ID {PolicyId}";
        public const string ErrorFetchingPolicy = "Error fetching policy with ID {PolicyId}";
        public const string ErrorFetchingPolicyByName = "Error fetching policy by name {PolicyName}";
        public const string ErrorFetchingAllPolicies = "Error fetching all policies";
        public const string ErrorFetchingActivePolicies = "Error fetching active policies";
        public const string ErrorFetchingInactivePolicies = "Error fetching inactive policies";
        public const string ErrorFetchingPublishedPolicies = "Error fetching published policies";
        public const string ErrorFetchingDraftPolicies = "Error fetching draft policies";
        public const string ErrorFetchingPoliciesByCategory = "Error fetching policies by category {Category}";
        public const string ErrorCheckingPolicyNameExists = "Error checking if policy name exists: {PolicyName}";
        public const string ErrorGettingPoliciesCount = "Error getting total policies count";
        public const string ErrorGettingActivePoliciesCount = "Error getting active policies count";
        
        // SLA Escalation Messages
        public const string ErrorFetchingSlaEscalation = "Error fetching SLA escalation with ID {EscalationId}";
        public const string ErrorFetchingAllSlaEscalations = "Error fetching all SLA escalations";
        public const string ErrorFetchingSlaEscalationsByEmployee = "Error fetching SLA escalations for employee {EmployeeUserId}";
        public const string ErrorFetchingSlaEscalationsBySla = "Error fetching SLA escalations for SLA {SlaId}";
        public const string ErrorFetchingSlaEscalationsByLevel = "Error fetching SLA escalations by level {EscalationLevel}";
        public const string ErrorFetchingSlaEscalationsByStatus = "Error fetching SLA escalations by status {EscalationStatus}";
        
        // Violation Messages
        public const string ViolationCreated = "Violation created with ID {ViolationId}";
        public const string ViolationUpdated = "Violation updated with ID {ViolationId}";
        public const string ViolationResolved = "Violation resolved with ID {ViolationId}";
        public const string ViolationNotFound = "Violation with ID {ViolationId} not found";
        
        public const string ErrorCreatingViolation = "Error creating violation";
        public const string ErrorUpdatingViolation = "Error updating violation with ID {ViolationId}";
        public const string ErrorResolvingViolation = "Error resolving violation with ID {ViolationId}";
        public const string ErrorFetchingViolation = "Error fetching violation with ID {ViolationId}";
        public const string ErrorFetchingAllViolations = "Error fetching all violations";
        public const string ErrorFetchingViolationsByEmployee = "Error fetching violations for employee {EmployeeUserId}";
        public const string ErrorFetchingViolationsByPolicy = "Error fetching violations for policy {PolicyId}";
        public const string ErrorFetchingViolationsBySeverity = "Error fetching violations by severity {Severity}";
        public const string ErrorFetchingViolationsByStatus = "Error fetching violations by status {Status}";
        public const string ErrorGettingTotalViolationsCount = "Error getting total violations count";
        public const string ErrorGettingActiveViolationsCount = "Error getting active violations count";
        public const string ErrorGettingResolvedViolationsCount = "Error getting resolved violations count";
        public const string ErrorGettingViolationCountBySeverity = "Error getting violation count by severity";
        public const string ErrorGettingViolationCountByStatus = "Error getting violation count by status";
        public const string ErrorGettingViolationsTrends = "Error getting violations trends for {Months} months";
        
        public const string DatabaseErrorSaving = "Database error occurred while saving changes";
                // Department Budget Messages
        public const string DepartmentBudgetCreated = "Department budget created with ID {BudgetId}";
        public const string DepartmentBudgetUpdated = "Department budget updated with ID {BudgetId}";
        public const string DepartmentBudgetDeleted = "Department budget deleted with ID {BudgetId}";
        public const string DepartmentBudgetNotFound = "Department budget with ID {BudgetId} not found";
        public const string AllocationUpdated = "Budget allocation updated with ID {AllocationId}";
        public const string AllocationNotFound = "Budget allocation with ID {AllocationId} not found";
        public const string AllocationsDeletedByDepartment = "{Count} budget allocations deleted for department {DepartmentId}";
        
        public const string ErrorCreatingDepartmentBudget = "Error creating department budget";
        public const string ErrorUpdatingDepartmentBudget = "Error updating department budget with ID {BudgetId}";
        public const string ErrorDeletingDepartmentBudget = "Error deleting department budget with ID {BudgetId}";
        public const string ErrorFetchingDepartmentBudget = "Error fetching department budget with ID {BudgetId}";
        public const string ErrorFetchingDepartmentBudgetByDepartment = "Error fetching department budget for department {DepartmentId}";
        public const string ErrorFetchingAllDepartmentBudgets = "Error fetching all department budgets";
        public const string ErrorFetchingDepartmentBudgetsByFiscalYear = "Error fetching department budgets for fiscal year {FiscalYear}";
        public const string ErrorFetchingDepartmentBudgetByDepartmentAndYear = "Error fetching department budget for department {DepartmentId} and fiscal year {FiscalYear}";
        public const string ErrorDeletingAllocationsByDepartment = "Error deleting allocations for department {DepartmentId}";
        public const string ErrorFetchingAllocation = "Error fetching budget allocation with ID {AllocationId}";
        public const string ErrorFetchingAllocationsByBudget = "Error fetching budget allocations for budget {BudgetId}";
        public const string ErrorUpdatingAllocation = "Error updating budget allocation with ID {AllocationId}";
        public const string ErrorGettingTotalUtilizedByDepartment = "Error getting total utilized amount for department {DepartmentId}";
        // Employee Data Messages
        public const string ErrorFetchingEmployeesWithoutGoals = "Error fetching employees without goals";
        public const string ErrorFetchingGoalAdoptionRate = "Error fetching goal adoption rate";
        public const string ErrorFetchingGoalStatistics = "Error fetching goal statistics";
        public const string ErrorFetchingDepartmentById = "Error fetching department with ID {DepartmentId}";
        public const string ErrorFetchingUserWithEmployee = "Error fetching user with employee data for user ID {UserId}";
        public const string ErrorFetchingExistingGoalTypesForEmployee = "Error fetching existing goal types for employee {EmployeeId}";
        public const string ErrorFetchingUsersByIds = "Error fetching users by IDs";
        public const string ErrorFetchingUsersWithoutGoals = "Error fetching users without goals";


    }
}

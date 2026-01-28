namespace Relevantz.EEPZ.Common.Constants
{
    public static class DepartmentMessages
    {
        // Validation Messages
        public const string DepartmentNameAlreadyExists = "Department name already exists";
        public const string DepartmentCodeAlreadyExists = "Department code already exists";
        public const string ParentDepartmentNotFound = "Parent department not found";
        public const string CannotAddChildToInactiveParent = "Cannot add child department to an inactive parent";
        public const string DepartmentCannotBeItsOwnParent = "Department cannot be its own parent";
        public const string CircularReferenceDetected = "Circular reference detected. A department cannot be a parent of its own ancestor.";
        // HOD Messages
        public const string HodEmployeeNotFound = "HOD employee not found";
        public const string HodEmployeeMustBeActive = "HOD employee must be in active status";
        public const string EmployeeNotFound = "Employee not found";
        public const string EmployeeMustBeActiveForHod = "Employee must be in active status to be assigned as HOD";
        public const string DepartmentDoesNotHaveHod = "Department does not have an assigned HOD";
        public const string HodAssignedSuccess = "Head of Department assigned successfully";
        public const string HodRemovedSuccess = "Head of Department removed successfully";
        // Status Messages
        public const string CannotInactivateDepartmentWithActiveChildren = "Cannot inactivate department with active child departments";
        public const string InvalidStatus = "Invalid status. Must be 'Active' or 'Inactive'";
        public const string StatusUpdatedSuccess = "Department status updated to {0}";
        // Delete Messages
        public const string CannotDeleteDepartmentWithChildren = "Cannot delete department with child departments. Please delete or reassign child departments first.";
        public const string CannotDeleteDepartmentWithEmployees = "Cannot delete department with assigned employees. Please reassign employees first.";
        public const string DepartmentDeletedSuccess = "Department deleted successfully";
        // Retrieval Messages
        public const string DepartmentRetrievedSuccess = "Department retrieved successfully";
        public const string DepartmentsRetrievedSuccess = "Departments retrieved successfully";
        public const string RootDepartmentNotFound = "Root department not found";
        public const string DepartmentHierarchyRetrievedSuccess = "Department hierarchy retrieved successfully";
        public const string ChildDepartmentsRetrievedSuccess = "Child departments retrieved successfully";
        public const string RootDepartmentsRetrievedSuccess = "Root departments retrieved successfully";
        public const string DepartmentPathRetrievedSuccess = "Department path retrieved successfully";
        public const string ActiveDepartmentsRetrievedSuccess = "Active departments retrieved successfully";
        public const string InactiveDepartmentsRetrievedSuccess = "Inactive departments retrieved successfully";
        public const string HodDepartmentsRetrievedSuccess = "HOD departments retrieved successfully";
        public const string DepartmentNotFoundWithCode = "Department not found with the specified code";
        // Search Messages
        public const string DepartmentsFoundBySearch = "Found {0} departments matching '{1}'";
        // Statistics Messages
        public const string TotalDepartmentsCount = "Total departments: {0}";
        public const string ActiveDepartmentsCount = "Active departments: {0}";
        // Missing messages
public const string DepartmentNotFound = "Department not found";
public const string DepartmentCodeExists = "Department code already exists";
public const string CannotBeOwnParent = "Department cannot be its own parent";
public const string CannotDeleteWithChildren = "Cannot delete department with child departments. Please delete or reassign child departments first.";
public const string CannotDeleteWithEmployees = "Cannot delete department with assigned employees. Please reassign employees first.";

    }
}

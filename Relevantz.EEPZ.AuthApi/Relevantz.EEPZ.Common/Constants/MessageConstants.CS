namespace Relevantz.EEPZ.Common.Constants
{
    public static class MessageConstants
    {
        // Generic
        public const string InvalidUserToken = "Invalid user token";
        public const string InvalidRequestData = "Invalid request data";
        // Profile
        public const string ProfileRetrievedSuccess = "Profile retrieved successfully";
        public const string ProfileUpdatedSuccess = "Profile updated successfully";
        public const string ErrorFetchingProfile = "An error occurred while fetching profile";
        public const string ErrorUpdatingProfile = "An error occurred while updating profile";
        // Photo upload
        public const string NoPhotoProvided = "No photo file provided";
        public const string InvalidPhotoType = "Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.";
        public const string PhotoTooLarge = "File size exceeds maximum limit of 5MB.";
        public const string PhotoUploadedSuccess = "Profile photo uploaded successfully";
        public const string ErrorUploadingPhoto = "An error occurred while uploading photo";
        // User Management
        public const string UserCreatedSuccess = "User created successfully";
        public const string ErrorCreatingUser = "An error occurred while creating user";
        public const string UserUpdatedSuccess = "User updated successfully";
        public const string ErrorUpdatingUser = "An error occurred while updating user";
        public const string UserRetrievedSuccess = "User retrieved successfully";
        public const string ErrorFetchingUser = "An error occurred while fetching user";
        public const string UsersRetrievedSuccess = "Users retrieved successfully";
        public const string ErrorFetchingUsers = "An error occurred while fetching users";
        // User Activation/Deactivation
        public const string UserDeactivatedSuccess = "User deactivated successfully";
        public const string ErrorDeactivatingUser = "An error occurred while deactivating user";
        public const string UserActivatedSuccess = "User activated successfully";
        public const string ErrorActivatingUser = "An error occurred while activating user";
        // Manager / employees
        public const string ManagerForbidden = "You can only view your own employees";
        public const string EmployeesRetrievedSuccess = "Employees retrieved successfully";
        public const string ErrorFetchingEmployees = "An error occurred while fetching employees";
        // Role and Department Assignment
        public const string RoleDepartmentAssignedSuccess = "Role and department assigned successfully";
        public const string ErrorAssigningRoleDepartment = "An error occurred while assigning role and department";
        // Employee ID
        public const string NextEmpIdSuccess = "Next Employee ID retrieved successfully";
        public const string NextEmpIdError = "Failed to generate Employee ID";
        // Authentication Messages
        public const string InvalidCredentials = "Invalid email or password";
        public const string AccountInactive = "Account is inactive. Please contact administrator.";
        public const string OtpSent = "OTP sent to your email. Please check your inbox.";
        public const string OtpInvalid = "Invalid or expired OTP";
        public const string UserNotFound = "User not found";
        public const string InvalidOrExpiredOtp = "Invalid or expired OTP";
        public const string WeakPassword = "Password does not meet strength requirements";
        public const string PasswordResetSuccess = "Password reset successful";
        public const string PasswordChangedSuccess = "Password changed successfully";
        public const string InvalidCurrentPassword = "Current password is incorrect";
        // Hard-coded messages converted to constants
        public const string FirstLoginMessage = "First login detected. Please reset your password. An OTP has been sent to your email.";
        public const string PasswordResetComplete = "Password has been reset successfully. You can now login with your new password.";
        public const string PasswordChangedComplete = "Password changed successfully";
        public const string LogoutSuccess = "Logged out successfully";
        public const string EmailNotRegistered = "This email address is not registered in our system. Please check your email or contact support.";
        public const string PasswordResetBlocked = "Password reset is not allowed for this account. Please contact system administrator for assistance.";
        public const string PasswordChangeBlocked = "Password changes are not allowed for this account. Please contact system administrator.";
        public const string LoginSuccess = "Login successful";
        // General Messages
        public const string Success = "Operation completed successfully";
        public const string Failed = "Operation failed";
        public const string NotFound = "Resource not found";
        public const string InvalidRequest = "Invalid request";
        public const string UnauthorizedAccess = "Unauthorized access";
        // Role Messages  
        public const string RoleCreatedSuccess = "Role created successfully";
        public const string RoleUpdatedSuccess = "Role updated successfully";
        public const string RoleDeletedSuccess = "Role deleted successfully";
        public const string RoleRetrievedSuccess = "Role retrieved successfully";
        public const string RolesRetrievedSuccess = "Roles retrieved successfully";
        public const string RoleNotFound = "Role not found";
        public const string RoleAlreadyExists = "Role already exists";
        // Department Messages
        public const string DepartmentCreatedSuccess = "Department created successfully";
        public const string DepartmentUpdatedSuccess = "Department updated successfully";
        public const string DepartmentDeletedSuccess = "Department deleted successfully";
        public const string DepartmentRetrievedSuccess = "Department retrieved successfully";
        public const string DepartmentsRetrievedSuccess = "Departments retrieved successfully";
        public const string DepartmentNotFound = "Department not found";
        public const string DepartmentAlreadyExists = "Department already exists";
    }
}

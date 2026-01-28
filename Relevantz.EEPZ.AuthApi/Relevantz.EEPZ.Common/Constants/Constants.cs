namespace Relevantz.EEPZ.Common.Constants
{
    public static class Constants
    {
        public static class EmploymentTypes
        {
            public const string Permanent = "Permanent";
            public const string Contract = "Contract";
            public const string Temporary = "Temporary";
            public const string Intern = "Intern";
            public const string Probation = "Probation";
        }
        public static class EmploymentStatuses
        {
            public const string Active = "Active";
            public const string Inactive = "Inactive";
            public const string Terminated = "Terminated";
            public const string Resigned = "Resigned";
            public const string Retired = "Retired";
        }
        public static class EmployeeTypes
        {
            public const string FullTime = "FullTime";
            public const string PartTime = "PartTime";
            public const string Contract = "Contract";
            public const string Intern = "Intern";
            public const string Consultant = "Consultant";
        }
        public static class Genders
        {
            public const string Male = "Male";
            public const string Female = "Female";
            public const string Other = "Other";
            public const string PreferNotToSay = "PreferNotToSay";
        }
        public static class UserStatuses
        {
            public const string Active = "Active";
            public const string Inactive = "Inactive";
            public const string Locked = "Locked";
        }
        public static class Roles
        {
            public const string Admin = "Admin";
            public const string Manager = "Manager";
            public const string User = "User";
            public const string HR = "HR";
            public const string Finance = "Finance";
        }
        public static class OtpTypes
        {
            public const string Login2FA = "Login2FA";
            public const string ForgotPassword = "ForgotPassword";
        }
        public static class ChangeTypes
        {
            public const string Email = "Email";
            public const string EmployeeCompanyId = "EmployeeCompanyId";
            public const string Mobile = "Mobile";
            public const string Address = "Address";
            public const string Username = "Username";
        }
        public static class RequestStatuses
        {
            public const string Pending = "Pending";
            public const string Approved = "Approved";
            public const string Rejected = "Rejected";
            public const string Cancelled = "Cancelled";
        }
        public static class Messages
        {
            // Authentication
            public const string InvalidCredentials = "Invalid email or password";
            public const string AccountInactive = "Account is inactive. Please contact administrator";
            public const string OtpSent = "OTP has been sent to your email";
            public const string OtpInvalid = "Invalid or expired OTP";
            public const string PasswordResetSuccess = "Password reset successfully";
            public const string PasswordChangeSuccess = "Password changed successfully";
            // User Management
            public const string UserNotFound = "User not found";
            public const string UserCreatedSuccess = "User created successfully";
            public const string UserUpdatedSuccess = "User updated successfully";
            public const string EmailAlreadyExists = "Email already exists";
            public const string EmployeeIdAlreadyExists = "Employee ID already exists";
            // Role Management
            public const string RoleNotFound = "Role not found";
            public const string RoleCreatedSuccess = "Role created successfully";
            public const string RoleUpdatedSuccess = "Role updated successfully";
            // Department Management
            public const string DepartmentNotFound = "Department not found";
            public const string DepartmentCreatedSuccess = "Department created successfully";
            public const string DepartmentUpdatedSuccess = "Department updated successfully";
            // Profile
            public const string ProfileUpdatedSuccess = "Profile updated successfully";
            // Change Requests
            public const string ChangeRequestSubmitted = "Change request submitted successfully";
            public const string ChangeRequestProcessed = "Change request processed successfully";
            public const string WeakPassword = "Password is Weak!";
            public const string InvalidOrExpiredOtp = "Invalid Or ExpiredOtp!";
            public const string InvalidCurrentPassword = "Invalid Current Password!";
            public const string PasswordChangedSuccess = "Password Changed Success!";
        }
        public static class AddressTypes
        {
            public const string Current = "Current";
            public const string Permanent = "Permanent";
        }
        public static class MaritalStatuses
        {
            public const string Single = "Single";
            public const string Married = "Married";
            public const string Divorced = "Divorced";
            public const string Widowed = "Widowed";
            public const string PreferNotToSay = "Prefer not to say";
        }
        public static class Statuses
        {
            public const string Active = "Active";
            public const string Inactive = "Inactive";
        }
    }
}

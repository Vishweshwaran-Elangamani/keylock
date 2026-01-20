namespace Relevantz.EEPZ.Common.Utils
{
    public static class MessageConstants
    {
        // Generic
        public const string InvalidUserToken = "Invalid user token";
        public const string InvalidRequestData = "Invalid request data";

        // Profile
        public const string ErrorFetchingProfile = "An error occurred while fetching profile";
        public const string ErrorUpdatingProfile = "An error occurred while updating profile";

        // Photo upload
        public const string NoPhotoProvided = "No photo file provided";
        public const string InvalidPhotoType = "Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.";
        public const string PhotoTooLarge = "File size exceeds maximum limit of 5MB.";
        public const string ErrorUploadingPhoto = "An error occurred while uploading photo";

        // Manager / employees
        public const string ManagerForbidden = "You can only view your own employees";

        // Employee ID
        public const string NextEmpIdSuccess = "Next Employee ID retrieved successfully";
        public const string NextEmpIdError = "Failed to generate Employee ID";
    }
}

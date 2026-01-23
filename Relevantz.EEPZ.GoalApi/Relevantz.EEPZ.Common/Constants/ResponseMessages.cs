// Constants/ResponseMessages.cs
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Constants
{
    public static class ResponseMessages
    {
        public static class Codes
        {
            public const string Success = "SUCCESS";
            public const string Created = "CREATED";
            public const string Updated = "UPDATED";
            public const string Deleted = "DELETED";

            public const string BadRequest = "BAD_REQUEST";
            public const string ValidationError = "VALIDATION_ERROR";
            public const string NotFound = "NOT_FOUND";
            public const string Unauthorized = "UNAUTHORIZED";
            public const string Forbidden = "FORBIDDEN";
            public const string Conflict = "CONFLICT";
            public const string Duplicate = "DUPLICATE";
            public const string BusinessRuleViolation = "BUSINESS_RULE_VIOLATION";

            public const string InternalServerError = "INTERNAL_SERVER_ERROR";
            public const string ServiceUnavailable = "SERVICE_UNAVAILABLE";
            public const string Timeout = "TIMEOUT";
            public const string OperationCancelled = "OPERATION_CANCELLED";

            public const string UserNotFound = "USER_NOT_FOUND";
            public const string UserAlreadyExists = "USER_ALREADY_EXISTS";
            public const string InvalidCredentials = "INVALID_CREDENTIALS";
            public const string TokenExpired = "TOKEN_EXPIRED";
            public const string InvalidToken = "INVALID_TOKEN";

            // Goal Management - Success
            public const string GOAL_CREATED_SUCCESS = "GOAL_CREATED_SUCCESS";
            public const string GOAL_UPDATED_SUCCESS = "GOAL_UPDATED_SUCCESS";
            public const string GOAL_RETRIEVED_SUCCESS = "GOAL_RETRIEVED_SUCCESS";
            public const string GOAL_DELETED_SUCCESS = "GOAL_DELETED_SUCCESS";
            public const string GOAL_ASSIGNED_SUCCESS = "GOAL_ASSIGNED_SUCCESS";
            public const string GOAL_PROGRESS_UPDATED = "GOAL_PROGRESS_UPDATED";
            public const string GOAL_COMPLETED_SUCCESS = "GOAL_COMPLETED_SUCCESS";

            // Goal Management - Errors
            public const string GOAL_NOT_FOUND = "GOAL_NOT_FOUND";
            public const string GOAL_ACCESS_DENIED = "GOAL_ACCESS_DENIED";
            public const string GOAL_INVALID_TYPE = "GOAL_INVALID_TYPE";
            public const string GOAL_INVALID_STATUS = "GOAL_INVALID_STATUS";
            public const string GOAL_DEADLINE_PAST = "GOAL_DEADLINE_PAST";
            public const string GOAL_CHECKLIST_INSUFFICIENT = "GOAL_CHECKLIST_INSUFFICIENT";
            public const string GOAL_CHECKLIST_UNASSIGNED = "GOAL_CHECKLIST_UNASSIGNED";
            public const string CHECKLIST_LOCKED = "CHECKLIST_LOCKED";
            public const string GOAL_ASSIGNEE_INVALID = "GOAL_ASSIGNEE_INVALID";
            public const string GOAL_ALREADY_COMPLETED = "GOAL_ALREADY_COMPLETED";
            public const string GOAL_OVERDUE_COMPLETION = "GOAL_OVERDUE_COMPLETION";
            public const string GOAL_PROGRESS_INSUFFICIENT = "GOAL_PROGRESS_INSUFFICIENT";
            public const string INVALID_REQUEST = "INVALID_REQUEST";

            // Approval Management - Success
            public const string APPROVAL_REQUESTED_SUCCESS = "APPROVAL_REQUESTED_SUCCESS";
            public const string APPROVAL_DECIDED_SUCCESS = "APPROVAL_DECIDED_SUCCESS";
            public const string APPROVAL_RETRIEVED_SUCCESS = "APPROVAL_RETRIEVED_SUCCESS";

            // Approval Management - Errors
            public const string APPROVAL_NOT_FOUND = "APPROVAL_NOT_FOUND";
            public const string APPROVAL_ACCESS_DENIED = "APPROVAL_ACCESS_DENIED";
            public const string APPROVAL_ALREADY_DECIDED = "APPROVAL_ALREADY_DECIDED";
            public const string APPROVAL_INVALID_DECISION = "APPROVAL_INVALID_DECISION";
            public const string APPROVAL_NO_MANAGER = "APPROVAL_NO_MANAGER";
            public const string APPROVAL_PROOF_REQUIRED = "APPROVAL_PROOF_REQUIRED";
            public const string APPROVAL_PROOF_INVALID = "APPROVAL_PROOF_INVALID";
            public const string APPROVAL_PROOF_OLD = "APPROVAL_PROOF_OLD";

            // Assignment Management - Success
            public const string ASSIGNMENT_SUCCESS = "ASSIGNMENT_SUCCESS";
            public const string ASSIGNMENT_RETRIEVED_SUCCESS = "ASSIGNMENT_RETRIEVED_SUCCESS";

            // Assignment Management - Errors
            public const string ASSIGNMENT_ACCESS_DENIED = "ASSIGNMENT_ACCESS_DENIED";
            public const string ASSIGNMENT_INVALID_SUBORDINATE = "ASSIGNMENT_INVALID_SUBORDINATE";
            public const string ASSIGNMENT_DUPLICATE = "ASSIGNMENT_DUPLICATE";
            public const string ASSIGNMENT_CHECKLIST_REQUIRED = "ASSIGNMENT_CHECKLIST_REQUIRED";

            // File Management - Success
            public const string FILE_UPLOADED_SUCCESS = "FILE_UPLOADED_SUCCESS";
            public const string FILE_DOWNLOADED_SUCCESS = "FILE_DOWNLOADED_SUCCESS";
            public const string FILE_DELETED_SUCCESS = "FILE_DELETED_SUCCESS";

            // File Management - Success section
            public const string FILEPREVIEWEDSUCCESS = "FILEPREVIEWEDSUCCESS";

            // File Management - Errors
            public const string FILE_NOT_FOUND = "FILE_NOT_FOUND";
            public const string FILE_ACCESS_DENIED = "FILE_ACCESS_DENIED";
            public const string FILE_SIZE_EXCEEDED = "FILE_SIZE_EXCEEDED";
            public const string FILE_TYPE_INVALID = "FILE_TYPE_INVALID";
            public const string FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED";

            // Project Management - Success
            public const string PROJECTS_RETRIEVED_SUCCESS = "PROJECTS_RETRIEVED_SUCCESS";
            public const string PROJECT_RETRIEVED_SUCCESS = "PROJECT_RETRIEVED_SUCCESS";
            public const string SUBORDINATES_RETRIEVED_SUCCESS = "SUBORDINATES_RETRIEVED_SUCCESS";

            // Project Management - Errors
            public const string PROJECT_NOT_FOUND = "PROJECT_NOT_FOUND";
            public const string PROJECT_ACCESS_DENIED = "PROJECT_ACCESS_DENIED";
            public const string PROJECT_NOT_MEMBER = "PROJECT_NOT_MEMBER";
            public const string CHECKLIST_COMPLETED_IMMUTABLE = "CHECKLIST_COMPLETED_IMMUTABLE";
            public const string CHECKLIST_COMPLETED_CANNOT_DELETE =
                "CHECKLIST_COMPLETED_CANNOT_DELETE";

            // Comment Management - Success
            public const string COMMENT_ADDED_SUCCESS = "COMMENT_ADDED_SUCCESS";
            public const string COMMENTS_RETRIEVED_SUCCESS = "COMMENTS_RETRIEVED_SUCCESS";

            // Comment Management - Errors
            public const string COMMENT_ACCESS_DENIED = "COMMENT_ACCESS_DENIED";

            // Progress Management - Success
            public const string PROGRESS_CALCULATED_SUCCESS = "PROGRESS_CALCULATED_SUCCESS";
            public const string CHECKLIST_TOGGLED_SUCCESS = "CHECKLIST_TOGGLED_SUCCESS";
            public const string GOAL_COMMENT_BLOCKED = "GOAL_COMMENT_BLOCKED";

            // Progress Management - Errors
            public const string CHECKLIST_NOT_FOUND = "CHECKLIST_NOT_FOUND";
            public const string PROGRESS_UPDATE_DENIED = "PROGRESS_UPDATE_DENIED";

            // Dashboard - Success
            public const string DASHBOARD_RETRIEVED_SUCCESS = "DASHBOARD_RETRIEVED_SUCCESS";
            public const string TIMELINE_RETRIEVED_SUCCESS = "TIMELINE_RETRIEVED_SUCCESS";

            // Validation Errors
            public const string VALIDATION_FAILED = "VALIDATION_FAILED";
            public const string REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING";
            public const string INVALID_DATE_FORMAT = "INVALID_DATE_FORMAT";
            public const string INVALID_ENUM_VALUE = "INVALID_ENUM_VALUE";

            // Permission Errors
            public const string PERMISSION_DENIED = "PERMISSION_DENIED";
            public const string ROLE_INSUFFICIENT = "ROLE_INSUFFICIENT";
            public const string USER_NOT_FOUND = "USER_NOT_FOUND";

            // System Errors
            public const string INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR";
            public const string DATABASE_ERROR = "DATABASE_ERROR";
            public const string EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR";
        }

        private static readonly Dictionary<string, ResponseMessageInfo> Messages = new()
        {
            [Codes.INVALID_REQUEST] = new(
                "Invalid request data",
                "The request contains invalid or missing required data. Please check your input and try again."
            ),

            // Goal Management - Success
            [Codes.GOAL_CREATED_SUCCESS] = new(
                "Goal created successfully",
                "Your goal has been created and submitted for approval. You will be notified once it's reviewed."
            ),

            [Codes.GOAL_UPDATED_SUCCESS] = new(
                "Goal updated successfully",
                "The goal details have been updated. Changes are effective immediately."
            ),

            [Codes.GOAL_RETRIEVED_SUCCESS] = new(
                "Goal retrieved successfully",
                "Goal details have been loaded successfully."
            ),

            [Codes.GOAL_ASSIGNED_SUCCESS] = new(
                "Goal assigned successfully",
                "The goal has been assigned to selected team members and is awaiting approval."
            ),

            [Codes.GOAL_PROGRESS_UPDATED] = new(
                "Progress updated successfully",
                "Goal progress has been updated and logged."
            ),
            [Codes.FILEPREVIEWEDSUCCESS] = new(
                "File preview ready",
                "The file is ready for preview."
            ),

            [Codes.GOAL_COMPLETED_SUCCESS] = new(
                "Goal marked as completed",
                "Congratulations! The goal has been successfully completed."
            ),

            // Goal Management - Errors
            [Codes.GOAL_NOT_FOUND] = new(
                "Goal not found",
                "The requested goal does not exist or may have been deleted. Please check the goal ID and try again."
            ),

            [Codes.GOAL_ACCESS_DENIED] = new(
                "Access denied",
                "You do not have permission to access this goal. Only goal creators, assignees, and their managers can view this goal."
            ),

            [Codes.GOAL_INVALID_TYPE] = new(
                "Invalid goal type",
                "The specified goal type is not valid. Valid types are: self, team, and org."
            ),

            [Codes.GOAL_DEADLINE_PAST] = new(
                "Invalid deadline",
                "The deadline cannot be in the past. Please select a future date."
            ),

            [Codes.GOAL_CHECKLIST_INSUFFICIENT] = new(
                "Insufficient checklist items",
                "Goals must have at least 3 checklist items. Please add more items to proceed."
            ),

            [Codes.GOAL_CHECKLIST_UNASSIGNED] = new(
                "Unassigned checklist items",
                "All checklist items must be assigned to specific team members. Please assign each item before proceeding."
            ),

            [Codes.GOAL_ASSIGNEE_INVALID] = new(
                "Invalid assignee",
                "You can only assign goals to your direct subordinates. Please check the selected assignees."
            ),

            [Codes.GOAL_OVERDUE_COMPLETION] = new(
                "Cannot complete overdue goal",
                "This goal is overdue and cannot be marked as complete. Please request to reopen the goal first."
            ),

            [Codes.GOAL_PROGRESS_INSUFFICIENT] = new(
                "Insufficient progress",
                "Goal must be 100% complete before requesting completion approval. Current progress is insufficient."
            ),

            // Approval Management - Success
            [Codes.APPROVAL_REQUESTED_SUCCESS] = new(
                "Approval request submitted",
                "Your approval request has been submitted successfully. The approver will be notified and you'll receive an update once reviewed."
            ),

            [Codes.GOAL_COMMENT_BLOCKED] = new(
                "Cannot comment on this goal",
                "This goal is completed or closed and no longer accepts comments. You can only view existing comments."
            ),

            [Codes.APPROVAL_DECIDED_SUCCESS] = new(
                "Approval decision recorded",
                "Your approval decision has been recorded and the requester has been notified."
            ),

            // Approval Management - Errors
            [Codes.APPROVAL_NOT_FOUND] = new(
                "Approval request not found",
                "The requested approval does not exist or may have been processed already."
            ),

            [Codes.APPROVAL_ACCESS_DENIED] = new(
                "Cannot approve this request",
                "You are not authorized to make decisions on this approval request. Only the assigned approver can process this request."
            ),

            [Codes.APPROVAL_ALREADY_DECIDED] = new(
                "Approval already processed",
                "This approval request has already been processed and cannot be modified."
            ),

            [Codes.APPROVAL_NO_MANAGER] = new(
                "No reporting manager found",
                "Cannot submit approval request as you do not have a reporting manager assigned. Please contact HR to set up your reporting structure."
            ),

            [Codes.APPROVAL_PROOF_REQUIRED] = new(
                "Proof of completion required",
                "At least one attachment is required as proof of completion before requesting approval. Please upload supporting documents."
            ),

            [Codes.APPROVAL_PROOF_INVALID] = new(
                "Invalid proof attachments",
                "The selected proof attachments are invalid or do not belong to this goal. Please select valid attachments."
            ),

            [Codes.APPROVAL_PROOF_OLD] = new(
                "Outdated proof attachments",
                "All proof attachments are older than 30 days. Please upload current proof of completion."
            ),

            // File Management - Success
            [Codes.FILE_UPLOADED_SUCCESS] = new(
                "File uploaded successfully",
                "Your file has been uploaded and attached to the goal."
            ),

            [Codes.FILE_DELETED_SUCCESS] = new(
                "File deleted successfully",
                "The attachment has been removed from the goal."
            ),

            // File Management - Errors
            [Codes.FILE_NOT_FOUND] = new(
                "File not found",
                "The requested file does not exist or may have been deleted."
            ),
            // In Messages dictionary, add:

            [Codes.FILE_ACCESS_DENIED] = new(
                "File access denied",
                "You do not have permission to access this file."
            ),

            [Codes.FILE_SIZE_EXCEEDED] = new(
                "File size too large",
                "The file size exceeds the maximum limit of 10MB. Please upload a smaller file."
            ),

            [Codes.FILE_TYPE_INVALID] = new(
                "Invalid file type",
                "This file type is not allowed. Supported formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, TXT, ZIP."
            ),

            // Project Management - Success
            [Codes.PROJECTS_RETRIEVED_SUCCESS] = new(
                "Projects loaded successfully",
                "Your project list has been loaded."
            ),

            [Codes.PROJECT_RETRIEVED_SUCCESS] = new(
                "Project details loaded",
                "Project information has been retrieved successfully."
            ),
            [Codes.SUBORDINATES_RETRIEVED_SUCCESS] = new(
                "Subordinates loaded successfully",
                "Your team members have been retrieved successfully."
            ),

            // Project Management - Errors
            [Codes.PROJECT_NOT_FOUND] = new(
                "Project not found",
                "The requested project does not exist or you may not have access to it."
            ),

            [Codes.PROJECT_NOT_MEMBER] = new(
                "Not a project member",
                "You are not a member of the selected project and cannot link goals to it."
            ),

            // System Errors
            [Codes.INTERNAL_SERVER_ERROR] = new(
                "Internal server error",
                "An unexpected error occurred. Please try again later or contact support if the problem persists."
            ),

            [Codes.VALIDATION_FAILED] = new(
                "Validation failed",
                "The provided data is invalid. Please check your input and try again."
            ),

            [Codes.PERMISSION_DENIED] = new(
                "Permission denied",
                "You do not have sufficient permissions to perform this action."
            ),
        };

        public static ResponseMessageInfo GetMessage(string code)
        {
            return Messages.TryGetValue(code, out var message)
                ? message
                : new ResponseMessageInfo(
                    "Unknown error",
                    "An unknown error occurred. Please contact support."
                );
        }

        public static bool IsSuccessCode(string code)
        {
            return Messages.TryGetValue(code, out var message)
                && (
                    code.Contains("SUCCESS") || code.Contains("RETRIEVED") || code.Contains("ADDED")
                );
        }
    }

    public class ResponseMessageInfo
    {
        public string Message { get; set; }
        public string DetailedMessage { get; set; }

        public ResponseMessageInfo(string message, string detailedMessage)
        {
            Message = message;
            DetailedMessage = detailedMessage;
        }
    }
}

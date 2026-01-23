using System;
using System.Collections.Generic;
using System.Net;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Common.Exceptions
{
    public abstract class CustomException : Exception
    {
        public HttpStatusCode StatusCode { get; }
        public string Code { get; }
        public List<string> Errors { get; }
        public object Metadata { get; }

        protected CustomException(
            string code,
            HttpStatusCode statusCode,
            string message,
            List<string> errors,
            object metadata
        )
            : base(message)
        {
            Code = code;
            StatusCode = statusCode;
            Errors = errors ?? new List<string>();
            Metadata = metadata;
        }

        protected CustomException(
            string code,
            HttpStatusCode statusCode,
            string message,
            Exception innerException,
            List<string> errors,
            object metadata
        )
            : base(message, innerException)
        {
            Code = code;
            StatusCode = statusCode;
            Errors = errors ?? new List<string>();
            Metadata = metadata;
        }
    }

    public class NotFoundException : CustomException
    {
        public NotFoundException(string code)
            : base(code, HttpStatusCode.NotFound, null, null, null) { }

        public NotFoundException(string code, string message)
            : base(code, HttpStatusCode.NotFound, message, null, null) { }
    }

    public class BadRequestException : CustomException
    {
        public BadRequestException(string code)
            : base(code, HttpStatusCode.BadRequest, null, null, null) { }

        public BadRequestException(string code, string message)
            : base(code, HttpStatusCode.BadRequest, message, null, null) { }

        public BadRequestException(string code, List<string> errors)
            : base(code, HttpStatusCode.BadRequest, null, errors, null) { }
    }

    public class ValidationException : CustomException
    {
        public ValidationException(string code)
            : base(code, HttpStatusCode.BadRequest, null, null, null) { }

        public ValidationException(string code, string message)
            : base(code, HttpStatusCode.BadRequest, message, null, null) { }

        public ValidationException(string code, List<string> errors)
            : base(code, HttpStatusCode.BadRequest, null, errors, null) { }

        public ValidationException(List<string> errors)
            : base(
                ResponseMessages.Codes.ValidationError,
                HttpStatusCode.BadRequest,
                null,
                errors,
                null
            ) { }
    }

    public class UnauthorizedException : CustomException
    {
        public UnauthorizedException()
            : base(
                ResponseMessages.Codes.Unauthorized,
                HttpStatusCode.Unauthorized,
                null,
                null,
                null
            ) { }

        public UnauthorizedException(string code)
            : base(code, HttpStatusCode.Unauthorized, null, null, null) { }

        public UnauthorizedException(string code, string message)
            : base(code, HttpStatusCode.Unauthorized, message, null, null) { }
    }

    public class ForbiddenException : CustomException
    {
        public ForbiddenException()
            : base(ResponseMessages.Codes.Forbidden, HttpStatusCode.Forbidden, null, null, null) { }

        public ForbiddenException(string code)
            : base(code, HttpStatusCode.Forbidden, null, null, null) { }

        public ForbiddenException(string code, string message)
            : base(code, HttpStatusCode.Forbidden, message, null, null) { }
    }

    public class ConflictException : CustomException
    {
        public ConflictException()
            : base(ResponseMessages.Codes.Conflict, HttpStatusCode.Conflict, null, null, null) { }

        public ConflictException(string code)
            : base(code, HttpStatusCode.Conflict, null, null, null) { }

        public ConflictException(string code, string message)
            : base(code, HttpStatusCode.Conflict, message, null, null) { }
    }

    public class InternalServerException : CustomException
    {
        public InternalServerException()
            : base(
                ResponseMessages.Codes.InternalServerError,
                HttpStatusCode.InternalServerError,
                null,
                null,
                null
            ) { }

        public InternalServerException(string code)
            : base(code, HttpStatusCode.InternalServerError, null, null, null) { }

        public InternalServerException(string code, string message)
            : base(code, HttpStatusCode.InternalServerError, message, null, null) { }

        public InternalServerException(string code, Exception innerException)
            : base(code, HttpStatusCode.InternalServerError, null, innerException, null, null) { }
    }

    public class ServiceUnavailableException : CustomException
    {
        public ServiceUnavailableException()
            : base(
                ResponseMessages.Codes.ServiceUnavailable,
                HttpStatusCode.ServiceUnavailable,
                null,
                null,
                null
            ) { }

        public ServiceUnavailableException(string code)
            : base(code, HttpStatusCode.ServiceUnavailable, null, null, null) { }

        public ServiceUnavailableException(string code, string message)
            : base(code, HttpStatusCode.ServiceUnavailable, message, null, null) { }
    }

    public class BusinessRuleException : CustomException
    {
        public BusinessRuleException(string code)
            : base(code, HttpStatusCode.UnprocessableEntity, null, null, null) { }

        public BusinessRuleException(string code, string message)
            : base(code, HttpStatusCode.UnprocessableEntity, message, null, null) { }

        public BusinessRuleException(string code, List<string> errors)
            : base(code, HttpStatusCode.UnprocessableEntity, null, errors, null) { }
    }

    public class DuplicateException : CustomException
    {
        public DuplicateException()
            : base(ResponseMessages.Codes.Duplicate, HttpStatusCode.Conflict, null, null, null) { }

        public DuplicateException(string code)
            : base(code, HttpStatusCode.Conflict, null, null, null) { }

        public DuplicateException(string code, string message)
            : base(code, HttpStatusCode.Conflict, message, null, null) { }
    }

    public class AccessDeniedException : CustomException
    {
        public AccessDeniedException(string code)
            : base(code, HttpStatusCode.Forbidden, null, null, null) { }

        public AccessDeniedException(string code, string message)
            : base(code, HttpStatusCode.Forbidden, message, null, null) { }
    }

    public class GoalNotFoundException : NotFoundException
    {
        public GoalNotFoundException()
            : base(ResponseMessages.Codes.GOAL_NOT_FOUND) { }

        public GoalNotFoundException(object goalId)
            : base(ResponseMessages.Codes.GOAL_NOT_FOUND, $"Goal with ID '{goalId}' was not found.")
        { }
    }

    public class GoalAccessDeniedException : AccessDeniedException
    {
        public GoalAccessDeniedException()
            : base(ResponseMessages.Codes.GOAL_ACCESS_DENIED) { }
    }

    public class ApprovalNotFoundException : NotFoundException
    {
        public ApprovalNotFoundException()
            : base(ResponseMessages.Codes.APPROVAL_NOT_FOUND) { }

        public ApprovalNotFoundException(object approvalId)
            : base(
                ResponseMessages.Codes.APPROVAL_NOT_FOUND,
                $"Approval with ID '{approvalId}' was not found."
            ) { }
    }

    public class ApprovalAccessDeniedException : AccessDeniedException
    {
        public ApprovalAccessDeniedException()
            : base(ResponseMessages.Codes.APPROVAL_ACCESS_DENIED) { }
    }

    public class FileNotFoundCustomException : NotFoundException
    {
        public FileNotFoundCustomException()
            : base(ResponseMessages.Codes.FILE_NOT_FOUND) { }

        public FileNotFoundCustomException(object fileId)
            : base(ResponseMessages.Codes.FILE_NOT_FOUND, $"File with ID '{fileId}' was not found.")
        { }
    }

    public class FileAccessDeniedException : AccessDeniedException
    {
        public FileAccessDeniedException()
            : base(ResponseMessages.Codes.FILE_ACCESS_DENIED) { }
    }

    public class ProjectNotFoundException : NotFoundException
    {
        public ProjectNotFoundException()
            : base(ResponseMessages.Codes.PROJECT_NOT_FOUND) { }

        public ProjectNotFoundException(object projectId)
            : base(
                ResponseMessages.Codes.PROJECT_NOT_FOUND,
                $"Project with ID '{projectId}' was not found."
            ) { }
    }

    public class ChecklistNotFoundException : NotFoundException
    {
        public ChecklistNotFoundException()
            : base(ResponseMessages.Codes.CHECKLIST_NOT_FOUND) { }

        public ChecklistNotFoundException(object checklistId)
            : base(
                ResponseMessages.Codes.CHECKLIST_NOT_FOUND,
                $"Checklist item with ID '{checklistId}' was not found."
            ) { }
    }

    public class UserNotFoundException : NotFoundException
    {
        public UserNotFoundException()
            : base(ResponseMessages.Codes.USER_NOT_FOUND) { }

        public UserNotFoundException(object userId)
            : base(ResponseMessages.Codes.USER_NOT_FOUND, $"User with ID '{userId}' was not found.")
        { }
    }
}

// DTOs/ApiResponseDto.cs
using System.Collections.Generic;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Common.DTOs
{
    public class ApiResponseDto<T>
    {
        public bool Success { get; set; }
        public string Code { get; set; } = default!;
        public string Message { get; set; } = default!;
        public string? DetailedMessage { get; set; }
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }
        public object? Metadata { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // Success response
        public static ApiResponseDto<T> SuccessResponse(
            string code,
            T? data = default,
            object? metadata = null
        )
        {
            var message = ResponseMessages.GetMessage(code);
            return new ApiResponseDto<T>
            {
                Success = true,
                Code = code,
                Message = message.Message,
                DetailedMessage = message.DetailedMessage,
                Data = data,
                Metadata = metadata,
            };
        }

        // Error response
        public static ApiResponseDto<T> ErrorResponse(
            string code,
            List<string>? errors = null,
            object? metadata = null
        )
        {
            var message = ResponseMessages.GetMessage(code);
            return new ApiResponseDto<T>
            {
                Success = false,
                Code = code,
                Message = message.Message,
                DetailedMessage = message.DetailedMessage,
                Errors = errors,
                Metadata = metadata,
            };
        }

        // Error response with single error
        public static ApiResponseDto<T> ErrorResponse(
            string code,
            string error,
            object? metadata = null
        )
        {
            return ErrorResponse(code, new List<string> { error }, metadata);
        }
    }

    // Non-generic version for responses without data
    public class ApiResponseDto : ApiResponseDto<object>
    {
        // Fixed: Remove generic type arguments and use base class methods
        public static ApiResponseDto SuccessResponse(string code, object? metadata = null)
        {
            var message = ResponseMessages.GetMessage(code);
            return new ApiResponseDto
            {
                Success = true,
                Code = code,
                Message = message.Message,
                DetailedMessage = message.DetailedMessage,
                Data = null,
                Metadata = metadata,
            };
        }

        public static ApiResponseDto ErrorResponse(
            string code,
            List<string>? errors = null,
            object? metadata = null
        )
        {
            var message = ResponseMessages.GetMessage(code);
            return new ApiResponseDto
            {
                Success = false,
                Code = code,
                Message = message.Message,
                DetailedMessage = message.DetailedMessage,
                Errors = errors,
                Metadata = metadata,
            };
        }

        public static ApiResponseDto ErrorResponse(
            string code,
            string error,
            object? metadata = null
        )
        {
            return ErrorResponse(code, new List<string> { error }, metadata);
        }
    }
}

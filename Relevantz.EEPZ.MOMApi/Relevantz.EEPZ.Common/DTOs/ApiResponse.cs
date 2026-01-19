using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.DTOs
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string CorrelationId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public T? Data { get; set; }
        public IDictionary<string, string[]>? Errors { get; set; }

        public static ApiResponse<T> SuccessResponse(T data, string message, string correlationId)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow,
                Data = data
            };
        }

        public static ApiResponse<T> SuccessResponse(string message, string correlationId)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow
            };
        }

        public static ApiResponse<T> ErrorResponse(string message, string correlationId, IDictionary<string, string[]>? errors = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow,
                Errors = errors
            };
        }
    }
}

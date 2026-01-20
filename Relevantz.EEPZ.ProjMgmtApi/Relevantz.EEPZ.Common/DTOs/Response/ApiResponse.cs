namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }

        public string? TraceId { get; set; }
        public string? CorrelationId { get; set; }

        public static ApiResponse<T> SuccessResponse(T data, string message = "Operation successful")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        public static ApiResponse<T> ErrorResponse(string message, List<string>? errors = null, string? traceId = null, string? correlationId = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Errors = errors,
                TraceId = traceId,
                CorrelationId = correlationId
            };
        }
    }
}

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class ApiResponse<T>
    {
        public int StatusCode { get; set; } = 200;
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }
        public string? CorrelationId { get; set; }

        public static ApiResponse<T> SuccessResponse(T data, string message) =>
            new() { Data = data, Message = message };

        public static ApiResponse<T> FailResponse(string message, int statusCode, List<string>? errors = null) =>
            new() { Success = false, StatusCode = statusCode, Message = message, Errors = errors };
    }
}

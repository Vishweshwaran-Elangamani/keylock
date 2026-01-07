using System.Text.Json.Serialization;

namespace Relevantz.EEPZ.Common.Models
{
    /// <summary>
    /// Generic API Response wrapper for all endpoints
    /// </summary>
    /// <typeparam name="T">The type of data being returned</typeparam>
    public class ApiResponse<T>
    {
        [JsonPropertyName("isSuccess")]
        public bool IsSuccess { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("data")]
        public T? Data { get; set; }

        [JsonPropertyName("errors")]
        public List<string> Errors { get; set; } = new();

        /// <summary>
        /// Creates a successful API response
        /// </summary>
        /// <param name="data">The data to return</param>
        /// <param name="message">Success message</param>
        /// <returns>ApiResponse object with success status</returns>
        public static ApiResponse<T> SuccessResponse(T? data, string message = "Operation successful")
        {
            return new ApiResponse<T>
            {
                IsSuccess = true,
                Message = message,
                Data = data,
                Errors = new List<string>()
            };
        }

        /// <summary>
        /// Creates an error API response
        /// </summary>
        /// <param name="message">Error message</param>
        /// <param name="errors">List of error details</param>
        /// <returns>ApiResponse object with error status</returns>
        public static ApiResponse<T> ErrorResponse(string message, List<string>? errors = null)
        {
            return new ApiResponse<T>
            {
                IsSuccess = false,
                Message = message,
                Data = default,
                Errors = errors ?? new List<string>()
            };
        }
    }
}

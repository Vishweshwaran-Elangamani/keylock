namespace Relevantz.EEPZ.Common.DTOs.Response
{
    /// <summary>
    /// Generic API response wrapper for consistent client-server communication.
    /// </summary>
    /// <typeparam name="T">Type of the response data.</typeparam>
    public class ApiResponseDto<T>
    {
        /// <summary>
        /// Indicates whether the operation was successful.
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Optional message describing the result.
        /// </summary>
        public string? Message { get; set; }

        /// <summary>
        /// Optional payload returned from the operation.
        /// </summary>
        public T? Data { get; set; }

          
        // Factory Methods
          

        /// <summary>
        /// Creates a success response with optional message.
        /// </summary>
        public static ApiResponseDto<T> SuccessResponse(T? data, string message = "Operation successful")
        {
            return new ApiResponseDto<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        /// <summary>
        /// Creates a failure response (Sprint 3 style).
        /// </summary>
        public static ApiResponseDto<T> FailureResponse(string message, T? data = default)
        {
            return new ApiResponseDto<T>
            {
                Success = false,
                Message = message,
                Data = data
            };
        }

        /// <summary>
        /// Creates an error response (Sprint 2 style).
        /// Internally uses FailureResponse.
        /// </summary>
        public static ApiResponseDto<T> ErrorResponse(string message, T? data = default)
        {
            return FailureResponse(message, data);
        }
    }
}

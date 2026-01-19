namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class EmployeeApiResponse<T>
    {
        public bool Success { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }

        public static EmployeeApiResponse<T> SuccessResponse(T data, string code, string message)
        {
            return new EmployeeApiResponse<T>
            {
                Success = true,
                Code = code,
                Message = message,
                Data = data
            };
        }

        public static EmployeeApiResponse<T> ErrorResponse(string code, string message, List<string>? errors = null)
        {
            return new EmployeeApiResponse<T>
            {
                Success = false,
                Code = code,
                Message = message,
                Errors = errors
            };
        }
    }
}

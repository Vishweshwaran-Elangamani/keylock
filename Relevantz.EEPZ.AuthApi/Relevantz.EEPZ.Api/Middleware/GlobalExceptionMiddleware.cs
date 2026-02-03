using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Relevantz.EEPZ.Common.DTOs.Response;
using System;
using System.Net;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Api.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            HttpStatusCode statusCode;
            string message;

            switch (exception)
            {
                case InvalidOperationException:
                    statusCode = HttpStatusCode.BadRequest;
                    message = exception.Message;
                    _logger.LogWarning(exception, "Validation error occurred.");
                    break;

                case UnauthorizedAccessException:
                    statusCode = HttpStatusCode.Unauthorized;
                    message = exception.Message;
                    _logger.LogWarning(exception, "Unauthorized access attempt.");
                    break;

                case KeyNotFoundException:
                    statusCode = HttpStatusCode.NotFound;
                    message = exception.Message;
                    _logger.LogWarning(exception, "Resource not found.");
                    break;

                case ArgumentNullException:
                    statusCode = HttpStatusCode.BadRequest;
                    message = exception.Message;
                    _logger.LogWarning(exception, "Null argument provided.");
                    break;

                case ArgumentException:
                    statusCode = HttpStatusCode.BadRequest;
                    message = exception.Message;
                    _logger.LogWarning(exception, "Invalid argument provided.");
                    break;

                case System.IO.FileFormatException:
                    statusCode = HttpStatusCode.BadRequest;
                    message = "Invalid file format. Please upload a valid Excel file (.xlsx or .xls).";
                    _logger.LogWarning(exception, "Invalid file format uploaded.");
                    break;

                case System.IO.InvalidDataException:
                    statusCode = HttpStatusCode.BadRequest;
                    message = "The uploaded file contains invalid or corrupted data. Please check the file and try again.";
                    _logger.LogWarning(exception, "Corrupted file data detected.");
                    break;

                case System.IO.FileNotFoundException:
                    statusCode = HttpStatusCode.NotFound;
                    message = "The requested file was not found.";
                    _logger.LogWarning(exception, "File not found.");
                    break;

                case System.IO.IOException:
                    statusCode = HttpStatusCode.InternalServerError;
                    message = "An error occurred while processing the file. Please try again.";
                    _logger.LogError(exception, "IO exception occurred.");
                    break;

                case TimeoutException:
                    statusCode = HttpStatusCode.RequestTimeout;
                    message = "The request timed out. Please try again.";
                    _logger.LogWarning(exception, "Request timeout.");
                    break;

                default:
                    statusCode = HttpStatusCode.InternalServerError;
                    message = "An error occurred while processing your request. Please try again later.";
                    _logger.LogError(exception, "An unhandled exception occurred during the request.");
                    break;
            }

            var response = new ApiResponseDto<object>
            {
                Success = false,
                Message = message,
                Data = null
            };

            context.Response.StatusCode = (int)statusCode;
            context.Response.ContentType = "application/json";
            var result = JsonConvert.SerializeObject(response);
            return context.Response.WriteAsync(result);
        }
    }
}

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Text.Json;
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
                    _logger.LogWarning(exception, "Invalid operation error occurred.");
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

                default:
                    statusCode = HttpStatusCode.InternalServerError;
                    message = "An error occurred while processing your request. Please try again later.";
                    _logger.LogError(exception, "An unhandled exception occurred: {Message}", exception.Message);
                    break;
            }

            var response = new
            {
                success = false,
                message = message,
                data = (object)null
            };

            context.Response.StatusCode = (int)statusCode;
            context.Response.ContentType = "application/json";

            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            var result = JsonSerializer.Serialize(response, jsonOptions);
            return context.Response.WriteAsync(result);
        }
    }
}

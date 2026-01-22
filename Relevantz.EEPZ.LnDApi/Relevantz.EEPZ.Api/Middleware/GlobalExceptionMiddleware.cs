using System.Net;
using System.Text.Json;
using Relevantz.EEPZ.Common.Models;
using Serilog;

namespace Relevantz.EEPZ.Api.Middleware
{
    public class GlobalExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;

        public GlobalExceptionHandlingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // Call the next middleware in the pipeline
                await _next(context);
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "Unhandled exception occurred. Path={Path}, Method={Method}, Error={ErrorMessage}",
                    context.Request.Path,
                    context.Request.Method,
                    ex.Message
                );

                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var response = new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while processing your request",
                Errors = new List<string> { exception.Message }
            };

            var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            return context.Response.WriteAsync(jsonResponse);
        }
    }
}

using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using System.Net;
using System.Text.Json;

namespace Relevantz.EEPZ.Api.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var correlationId = context.TraceIdentifier;

            // Log with your existing logger pattern
            _logger.LogError(exception, "Unhandled exception in MOM module at {Path}: {Message}", 
                context.Request.Path, exception.Message);

            context.Response.ContentType = "application/json";

            var errorResponse = ApiResponse<object>.ErrorResponse(
                GetErrorMessage(exception), 
                correlationId);

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            var json = JsonSerializer.Serialize(errorResponse, options);
            context.Response.StatusCode = GetStatusCode(exception);
            await context.Response.WriteAsync(json);
        }

        private int GetStatusCode(Exception exception)
        {
            return exception switch
            {
                ArgumentException => (int)HttpStatusCode.BadRequest,
                InvalidOperationException => (int)HttpStatusCode.Conflict,
                DbUpdateException => (int)HttpStatusCode.InternalServerError,
                UnauthorizedAccessException => (int)HttpStatusCode.Forbidden,
                KeyNotFoundException => (int)HttpStatusCode.NotFound,
                OperationCanceledException => 499, // Client closed
                TimeoutException => (int)HttpStatusCode.RequestTimeout,
                _ => (int)HttpStatusCode.InternalServerError
            };
        }

        private string GetErrorMessage(Exception exception)
        {
            return exception switch
            {
                ArgumentException argEx => argEx.Message,
                InvalidOperationException invEx => invEx.Message,
                DbUpdateException => "A database error occurred while processing your MOM request.",
                UnauthorizedAccessException => "You do not have permission to access this MOM resource.",
                KeyNotFoundException notFound => notFound.Message,
                OperationCanceledException => "MOM request was cancelled.",
                TimeoutException => "The MOM request timed out. Please try again.",
                _ => "An unexpected error occurred while processing your MOM request."
            };
        }
    }
}

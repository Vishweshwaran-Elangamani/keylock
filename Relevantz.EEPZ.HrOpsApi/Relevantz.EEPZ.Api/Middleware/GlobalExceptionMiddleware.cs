using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Utils;
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
            // Log with your custom business logger
            EEPZBusinessLog.LogError(
                "Unhandled exception occurred: {ExceptionType} - Path: {Path} - Method: {Method}",
                exception,
                exception.GetType().Name,
                context.Request.Path,
                context.Request.Method);


            context.Response.ContentType = "application/json";


            var response = new ApiResponseDto<object>
            {
                Success = false,
                Data = null
            };


            switch (exception)
            {
                case ArgumentException argEx:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Message = argEx.Message;
                    _logger.LogWarning(argEx, "Bad request: {Message}", argEx.Message);
                    break;


                case InvalidOperationException invOpEx:
                    context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                    response.Message = invOpEx.Message;
                    _logger.LogWarning(invOpEx, "Invalid operation: {Message}", invOpEx.Message);
                    break;


                case DbUpdateException dbEx:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.Message = "A database error occurred while processing your request.";
                    _logger.LogError(dbEx, "Database update exception: {InnerMessage}", 
                        dbEx.InnerException?.Message ?? dbEx.Message);
                    break;


                case UnauthorizedAccessException:
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    response.Message = "You do not have permission to access this resource.";
                    _logger.LogWarning(exception, "Unauthorized access attempt");
                    break;


                case KeyNotFoundException notFoundEx:
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    response.Message = notFoundEx.Message;
                    _logger.LogWarning(notFoundEx, "Resource not found: {Message}", notFoundEx.Message);
                    break;


                case OperationCanceledException:
                    context.Response.StatusCode = 499; // Client closed request
                    response.Message = "Request was cancelled.";
                    _logger.LogInformation("Request cancelled by client");
                    break;


                case TimeoutException timeoutEx:
                    context.Response.StatusCode = (int)HttpStatusCode.RequestTimeout;
                    response.Message = "The request timed out. Please try again.";
                    _logger.LogWarning(timeoutEx, "Request timeout");
                    break;


                default:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.Message = "An unexpected error occurred. Please try again later.";
                    _logger.LogError(exception, "Unhandled exception: {ExceptionType}", exception.GetType().Name);
                    break;
            }


            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };


            var json = JsonSerializer.Serialize(response, options);
            await context.Response.WriteAsync(json);
        }
    }
}

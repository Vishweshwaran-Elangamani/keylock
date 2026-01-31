using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common;
using Relevantz.EEPZ.Common.DTOs.Response;
using System.Security;
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
            var correlationId = context.TraceIdentifier;

            _logger.LogInformation(
                "START Request {Method} {Path} CorrelationId: {CorrelationId}",
                context.Request.Method,
                context.Request.Path,
                correlationId);

            try
            {
                await _next(context);

                _logger.LogInformation(
                    "SUCCESS Request {Method} {Path} StatusCode: {StatusCode} CorrelationId: {CorrelationId}",
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    correlationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "FAILURE Request {Method} {Path} CorrelationId: {CorrelationId}",
                    context.Request.Method,
                    context.Request.Path,
                    correlationId);

                await HandleExceptionAsync(context, ex, correlationId);
            }
            finally
            {
                _logger.LogInformation(
                    "END Request {Method} {Path} StatusCode: {StatusCode} CorrelationId: {CorrelationId}",
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    correlationId);
            }
        }

        private async Task HandleExceptionAsync(
            HttpContext context,
            Exception exception,
            string correlationId)
        {
            if (context.Response.HasStarted)
            {
                _logger.LogWarning(
                    "Response already started. CorrelationId: {CorrelationId}",
                    correlationId);
                return;
            }

            context.Response.ContentType = "application/json";

            var response = new ApiResponse<object>
            {
                Success = false,
                CorrelationId = correlationId
            };

            switch (exception)
            {
                case ArgumentException:
                case InvalidOperationException:
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    response.StatusCode = 400;
                    response.Message = ApiMessages.ValidationFailed;
                    response.Errors = new List<string> { exception.Message };
                    break;

                case UnauthorizedAccessException:
                case SecurityException:
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    response.StatusCode = 401;
                    response.Message = ApiMessages.Unauthorized;
                    response.Errors = new List<string> { exception.Message };
                    break;

                case KeyNotFoundException:
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    response.StatusCode = 404;
                    response.Message = ApiMessages.NotFound;
                    response.Errors = new List<string> { exception.Message };
                    break;

                default:
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    response.StatusCode = 500;
                    response.Message = ApiMessages.UnexpectedError;
                    response.Errors = new List<string> { "An internal error occurred." };
                    break;
            }

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }
}

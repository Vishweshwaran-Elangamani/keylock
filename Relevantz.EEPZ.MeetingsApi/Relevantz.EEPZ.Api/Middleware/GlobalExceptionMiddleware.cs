using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Utils;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var correlationId = context.TraceIdentifier;

            using (_logger.BeginScope(new Dictionary<string, object>
            {
                ["CorrelationId"] = correlationId
            }))
            {
                try
                {
                    await _next(context);
                }
                catch (Exception ex)
                {
                    await HandleExceptionAsync(context, ex, correlationId);
                }
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception ex, string correlationId)
        {
            var request = context.Request;

            string? role = null;
            int? userId = null;

            try
            {
                role = ClaimsUtility.GetRole(context.User);
                userId = ClaimsUtility.GetUserId(context.User);
            }
            catch
            {
                // Ignore claim parse issues (guest/invalid token/etc)
            }

            var requestInfo = new
            {
                request.Method,
                Path = request.Path.Value,
                QueryString = request.QueryString.Value,
                userId,
                role
            };

            HttpStatusCode statusCode;
            string message;
            LogLevel logLevel;

            switch (ex)
            {
                case UnauthorizedAccessException:
                    statusCode = HttpStatusCode.Forbidden;
                    message = ex.Message;
                    logLevel = LogLevel.Warning;
                    break;

                case ValidationException:
                    statusCode = HttpStatusCode.BadRequest;
                    message = ex.Message;
                    logLevel = LogLevel.Warning;
                    break;

                case ArgumentException:
                    statusCode = HttpStatusCode.BadRequest;
                    message = ex.Message;
                    logLevel = LogLevel.Warning;
                    break;

                case InvalidOperationException:
                    statusCode = HttpStatusCode.BadRequest;
                    message = ex.Message;
                    logLevel = LogLevel.Warning;
                    break;

                default:
                    statusCode = HttpStatusCode.InternalServerError;
                    message = AppConstants.ExceptionMessages.UnexpectedError;
                    logLevel = LogLevel.Error;
                    break;
            }

            _logger.Log(
                logLevel,
                ex,
                "Request failed. StatusCode={StatusCode} ExceptionType={ExceptionType} ExceptionMessage={ExceptionMessage} Request={Request}",
                (int)statusCode,
                ex.GetType().Name,
                ex.Message,
                requestInfo
            );

            await WriteErrorResponseAsync(context, statusCode, message, correlationId);
        }

        private static async Task WriteErrorResponseAsync(
            HttpContext context,
            HttpStatusCode statusCode,
            string message,
            string correlationId)
        {
            context.Response.StatusCode = (int)statusCode;
            context.Response.ContentType = "application/json";
            context.Response.Headers["X-Correlation-Id"] = correlationId;

            var payload = ApiResponse<object>.ErrorResponse(message, correlationId);

            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(payload, jsonOptions));
        }
    }
}

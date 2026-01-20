using System.Net;
using System.Text.Json;
using Relevantz.EEPZ.Common.DTOs.Response;
using Serilog;

namespace Relevantz.EEPZ.Api.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private const string CorrelationHeader = "X-Correlation-Id";
        private readonly RequestDelegate _next;

        public GlobalExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var correlationId = GetOrCreateCorrelationId(context);
            context.Response.Headers[CorrelationHeader] = correlationId;

            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                var traceId = context.TraceIdentifier;

                Log.Error(
                    ex,
                    "Unhandled exception occurred. CorrelationId={CorrelationId}, TraceId={TraceId}, Path={Path}, Method={Method}, Error={ErrorMessage}",
                    correlationId,
                    traceId,
                    context.Request.Path,
                    context.Request.Method,
                    ex.Message
                );

                await HandleExceptionAsync(context, ex, traceId, correlationId);
            }
        }

        private static string GetOrCreateCorrelationId(HttpContext context)
        {
            if (context.Request.Headers.TryGetValue(CorrelationHeader, out var correlationId) &&
                !string.IsNullOrWhiteSpace(correlationId))
            {
                return correlationId.ToString();
            }

            return Guid.NewGuid().ToString();
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception, string traceId, string correlationId)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var response = ApiResponse<object>.ErrorResponse(
                "An error occurred while processing your request",
                new List<string> { exception.Message },
                traceId,
                correlationId
            );

            var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            return context.Response.WriteAsync(jsonResponse);
        }
    }
}

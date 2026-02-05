using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

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

        public async Task InvokeAsync(HttpContext context)
        {
            var correlationId = Guid.NewGuid().ToString();
            context.Response.Headers["X-Correlation-ID"] = correlationId;

            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Unhandled Exception | CorrelationId: {CorrelationId} | Path: {Path} | Method: {Method}",
                    correlationId,
                    context.Request.Path,
                    context.Request.Method);

                await HandleExceptionAsync(context, ex, correlationId);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception ex, string correlationId)
        {
            var statusCode = ex switch
            {
                ArgumentException => HttpStatusCode.BadRequest,
                KeyNotFoundException => HttpStatusCode.NotFound,
                InvalidOperationException => HttpStatusCode.UnprocessableEntity,
                UnauthorizedAccessException => HttpStatusCode.Unauthorized,
                _ => HttpStatusCode.InternalServerError
            };

            var problem = new ProblemDetails
            {
                Title = ex.GetType().Name,
                Detail = ex.Message,
                Status = (int)statusCode,
                Instance = context.Request.Path
            };

            problem.Extensions["correlationId"] = correlationId;
            problem.Extensions["traceId"] = context.TraceIdentifier;

            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = (int)statusCode;

            return context.Response.WriteAsync(JsonSerializer.Serialize(problem));
        }
    }
}

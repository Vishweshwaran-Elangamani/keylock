
using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Api.Middleware
{
    /// <summary>
    /// Centralized exception handling middleware.
    /// Logs unhandled exceptions once and returns RFC 7807 ProblemDetails.
    /// </summary>
    public sealed class ExceptionHandlingMiddleware : IMiddleware
    {
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionHandlingMiddleware(
            ILogger<ExceptionHandlingMiddleware> logger,
            IHostEnvironment env)
        {
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            try
            {
                await next(context);
            }
            // If caller cancels the request, don't treat as error
            catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
            {
                // 499: Client Closed Request (common in Nginx). Use 400/408 if preferred.
                context.Response.StatusCode = 499;
                // Intentionally no error log to avoid noise.
            }
            catch (Exception ex)
            {
                // Log unhandled exception ONCE here
                _logger.LogError(ex, "Unhandled exception during {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                var (status, title) = MapExceptionToResponse(ex);

                var problem = BuildProblemDetails(
                    status: (int)status,
                    title: title,
                    instance: context.TraceIdentifier,
                    ex: ex,
                    includeDetails: _env.IsDevelopment()
                );

                context.Response.Clear();
                context.Response.StatusCode = problem.Status ?? (int)HttpStatusCode.InternalServerError;
                context.Response.ContentType = "application/problem+json";

                var json = JsonSerializer.Serialize(problem, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    WriteIndented = _env.IsDevelopment()
                });

                await context.Response.WriteAsync(json);
            }
        }

        /// <summary>
        /// Map known exception types to HTTP status codes and titles.
        /// Extend for your domain-specific exceptions as needed.
        /// </summary>
        private static (HttpStatusCode status, string title) MapExceptionToResponse(Exception ex) =>
            ex switch
            {
                // 400 Bad Request
                ArgumentException or FormatException or InvalidCastException
                    => (HttpStatusCode.BadRequest, "Invalid request"),

                // 401/403 — choose 401 if auth missing; 403 if access denied (we use 403 here)
                UnauthorizedAccessException
                    => (HttpStatusCode.Forbidden, "Access denied"),

                // 404 Not Found
                KeyNotFoundException
                    => (HttpStatusCode.NotFound, "Resource not found"),

                // 409 Conflict (e.g., concurrency)
                DbUpdateConcurrencyException
                    => (HttpStatusCode.Conflict, "Concurrency conflict"),

                // 422 Unprocessable Entity (validation)
                ValidationException
                    => (HttpStatusCode.UnprocessableEntity, "Validation failed"),

                // Timeouts / downstream errors
                TimeoutException
                    => (HttpStatusCode.GatewayTimeout, "Operation timed out"),
                HttpRequestException
                    => (HttpStatusCode.BadGateway, "Downstream service error"),

                // Default 500
                _ => (HttpStatusCode.InternalServerError, "Internal server error")
            };

        /// <summary>
        /// Builds an RFC 7807 ProblemDetails object.
        /// In Development includes exception details; in Production keeps it generic.
        /// </summary>
        private static ProblemDetails BuildProblemDetails(
            int status,
            string title,
            string instance,
            Exception ex,
            bool includeDetails)
        {
            var problem = new ProblemDetails
            {
                Type = $"https://httpstatuses.com/{status}",
                Title = title,
                Status = status,
                Detail = includeDetails ? ex.Message : "An unexpected error occurred.",
                Instance = instance
            };

            // Extra debug info only in Development
            if (includeDetails)
            {
                problem.Extensions["exception"] = ex.GetType().FullName;
                problem.Extensions["stackTrace"] = ex.StackTrace;
                if (ex.InnerException != null)
                {
                    problem.Extensions["innerException"] = new
                    {
                        type = ex.InnerException.GetType().FullName,
                        message = ex.InnerException.Message
                    };
                }
            }

            return problem;
        }
    }
}

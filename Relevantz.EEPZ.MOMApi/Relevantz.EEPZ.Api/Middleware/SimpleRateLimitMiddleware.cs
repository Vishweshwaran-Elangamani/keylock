using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using System.Text.Json;

namespace Relevantz.EEPZ.Api.Middleware
{
    /// <summary>
    /// Simple in-memory rate limiting middleware
    /// Limits requests per client to prevent abuse
    /// Production-ready implementation with automatic cleanup
    /// </summary>
    public class SimpleRateLimitMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SimpleRateLimitMiddleware> _logger;
        
        // Thread-safe dictionary to track request counts per client
        private static readonly ConcurrentDictionary<string, (DateTime timestamp, int count)> _requestCounts = new();
        
        // Configuration
        private const int MaxRequestsPerMinute = 1000;
        private const int CleanupThreshold = 10000; // Cleanup when dictionary gets too large
        private const int CleanupAgeMinutes = 5; // Remove entries older than 5 minutes

        public SimpleRateLimitMiddleware(RequestDelegate next, ILogger<SimpleRateLimitMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Generate unique client identifier
            var clientId = GetClientIdentifier(context);
            var minuteKey = $"{clientId}_{DateTime.UtcNow:yyyyMMddHHmm}";

            // Get or create entry for this client in this minute
            var (timestamp, count) = _requestCounts.GetOrAdd(minuteKey, (DateTime.UtcNow, 0));

            // Check if we're in a new time window
            if (DateTime.UtcNow - timestamp > TimeSpan.FromMinutes(1))
            {
                // Reset counter for new time window
                _requestCounts[minuteKey] = (DateTime.UtcNow, 1);
            }
            else if (count >= MaxRequestsPerMinute)
            {
                // Rate limit exceeded
                _logger.LogWarning(
                    "Rate limit exceeded for client {ClientId}. Requests: {Count}/{Max}",
                    clientId, count, MaxRequestsPerMinute);

                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.ContentType = "application/json";
                context.Response.Headers.Append("Retry-After", "60");
                context.Response.Headers.Append("X-RateLimit-Limit", MaxRequestsPerMinute.ToString());
                context.Response.Headers.Append("X-RateLimit-Remaining", "0");
                context.Response.Headers.Append("X-RateLimit-Reset", DateTimeOffset.UtcNow.AddMinutes(1).ToUnixTimeSeconds().ToString());

                var errorResponse = new
                {
                    error = "Rate limit exceeded",
                    message = $"Maximum {MaxRequestsPerMinute} requests per minute allowed",
                    retryAfter = 60
                };

                var jsonResponse = JsonSerializer.Serialize(errorResponse);
                await context.Response.WriteAsync(jsonResponse);
                return;
            }
            else
            {
                // Increment counter
                _requestCounts[minuteKey] = (timestamp, count + 1);
                
                // Add rate limit headers to response
                context.Response.OnStarting(() =>
                {
                    context.Response.Headers.Append("X-RateLimit-Limit", MaxRequestsPerMinute.ToString());
                    context.Response.Headers.Append("X-RateLimit-Remaining", (MaxRequestsPerMinute - count - 1).ToString());
                    context.Response.Headers.Append("X-RateLimit-Reset", DateTimeOffset.UtcNow.AddMinutes(1).ToUnixTimeSeconds().ToString());
                    return Task.CompletedTask;
                });
            }

            // Periodic cleanup to prevent memory leaks
            if (_requestCounts.Count > CleanupThreshold)
            {
                CleanupOldEntries();
            }

            // Continue to next middleware
            await _next(context);
        }

        /// <summary>
        /// Generate unique identifier for the client
        /// Priority: Authenticated user > IP address > Connection ID
        /// </summary>
        private string GetClientIdentifier(HttpContext context)
        {
            // Use authenticated user ID if available
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.Identity.Name ?? 
                             context.User.FindFirst("EmployeeId")?.Value ??
                             context.User.FindFirst("sub")?.Value;
                
                if (!string.IsNullOrEmpty(userId))
                    return $"user_{userId}";
            }

            // Fall back to IP address
            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            if (!string.IsNullOrEmpty(ipAddress))
                return $"ip_{ipAddress}";

            // Last resort: connection ID
            return $"conn_{context.Connection.Id}";
        }

        /// <summary>
        /// Remove old entries from the dictionary to prevent memory leaks
        /// Runs when dictionary exceeds CleanupThreshold
        /// </summary>
        private void CleanupOldEntries()
        {
            try
            {
                var cutoffTime = DateTime.UtcNow.AddMinutes(-CleanupAgeMinutes);
                var oldKeys = _requestCounts
                    .Where(kvp => kvp.Value.timestamp < cutoffTime)
                    .Select(kvp => kvp.Key)
                    .ToList();

                foreach (var oldKey in oldKeys)
                {
                    _requestCounts.TryRemove(oldKey, out _);
                }

                if (oldKeys.Count > 0)
                {
                    _logger.LogDebug("Cleaned up {Count} old rate limit entries", oldKeys.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during rate limit cleanup");
            }
        }
    }
}

using System.Net;
using System.Text.Json;
 
namespace PerformanceManagement.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
 
        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
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
                // Log full stack trace
                _logger.LogError(ex, "Unhandled exception occurred");
 
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = MapStatusCode(ex);
 
                var response = new
                {
                    success = false,
                    message = ex.Message,
                    exceptionType = ex.GetType().Name
                };
 
                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
        }
 
        private static int MapStatusCode(Exception ex)
        {
            return ex switch
            {
                FileNotFoundException => (int)HttpStatusCode.NotFound,
                UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
                ArgumentException => (int)HttpStatusCode.BadRequest,
                _ => (int)HttpStatusCode.InternalServerError
            };
        }
    }
}
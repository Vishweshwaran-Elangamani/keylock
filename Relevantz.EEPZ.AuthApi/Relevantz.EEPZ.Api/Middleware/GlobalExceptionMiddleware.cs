using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Relevantz.EEPZ.Common.DTOs.Response;
using System;
using System.Net;
using System.Threading.Tasks;

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

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                // Call the next middleware in the pipeline
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                // Handle any exceptions globally
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            // Log the exception
            _logger.LogError(exception, "An unhandled exception occurred during the request.");

            // Prepare the response object
            var response = new ApiResponseDto<object>
            {
                Success = false,
                Message = "An error occurred while processing your request. Please try again later.",
                Data = null
            };

            // Set the response status code
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            // Write the response to the client
            var result = JsonConvert.SerializeObject(response);
            return context.Response.WriteAsync(result);
        }
    }
}

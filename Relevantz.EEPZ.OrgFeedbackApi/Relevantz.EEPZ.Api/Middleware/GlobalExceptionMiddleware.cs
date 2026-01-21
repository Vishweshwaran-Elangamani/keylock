using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Response;
using System.Net;

namespace Relevantz.EEPZ.Api.Middleare
{
    public class GlobalExceptionMiddleware : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public GlobalExceptionMiddleware(
            ILogger<GlobalExceptionMiddleware> logger,
            IHostEnvironment env)
        {
            _logger = logger;
            _env = env;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            _logger.LogError(exception,
                "Unhandled exception. Path: {Path}, Message: {Message}",
                httpContext.Request.Path,
                exception.Message);

            httpContext.Response.ContentType = "application/json";

            var statusCode = (int)HttpStatusCode.InternalServerError;
            var message = MessageConstants.InternalServerError;

            httpContext.Response.StatusCode = statusCode;

            var response = ApiResponseDto<object>.ErrorResponse(
                message: message,
                errors: _env.IsDevelopment()
                    ? new List<string> { exception.Message }
                    : null
            );

            await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);

            return true;
        }
    }
}

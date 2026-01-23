using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Exceptions;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Common.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System
                .Text
                .Json
                .Serialization
                .JsonIgnoreCondition
                .WhenWritingNull,
        };

        public GlobalExceptionMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionMiddleware> logger,
            IHostEnvironment environment
        )
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception exception)
            {
                await HandleExceptionAsync(context, exception);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var traceId = context.TraceIdentifier;
            var path = context.Request.Path;
            var method = context.Request.Method;

            HttpStatusCode statusCode;
            string code;
            List<string> errors = null;
            object metadata = null;

            switch (exception)
            {
                case CustomException customException:
                    statusCode = customException.StatusCode;
                    code = customException.Code;
                    errors = customException.Errors.Count > 0 ? customException.Errors : null;
                    metadata = customException.Metadata;
                    LogCustomException(customException, traceId, path, method);
                    break;

                case ArgumentNullException argumentNullException:
                    statusCode = HttpStatusCode.BadRequest;
                    code = ResponseMessages.Codes.BadRequest;
                    errors = new List<string>
                    {
                        $"Required argument '{argumentNullException.ParamName}' was not provided.",
                    };
                    _logger.LogWarning(
                        exception,
                        "Argument null error. TraceId: {TraceId}, Path: {Path}, Method: {Method}, Parameter: {ParamName}",
                        traceId,
                        path,
                        method,
                        argumentNullException.ParamName
                    );
                    break;

                case ArgumentException argumentException:
                    statusCode = HttpStatusCode.BadRequest;
                    code = ResponseMessages.Codes.BadRequest;
                    errors = new List<string> { argumentException.Message };
                    _logger.LogWarning(
                        exception,
                        "Argument error. TraceId: {TraceId}, Path: {Path}, Method: {Method}",
                        traceId,
                        path,
                        method
                    );
                    break;

                case InvalidOperationException invalidOperationException:
                    statusCode = HttpStatusCode.Conflict;
                    code = ResponseMessages.Codes.Conflict;
                    errors = new List<string> { invalidOperationException.Message };
                    _logger.LogWarning(
                        exception,
                        "Invalid operation. TraceId: {TraceId}, Path: {Path}, Method: {Method}",
                        traceId,
                        path,
                        method
                    );
                    break;

                case UnauthorizedAccessException:
                    statusCode = HttpStatusCode.Unauthorized;
                    code = ResponseMessages.Codes.Unauthorized;
                    _logger.LogWarning(
                        exception,
                        "Unauthorized access attempt. TraceId: {TraceId}, Path: {Path}, Method: {Method}",
                        traceId,
                        path,
                        method
                    );
                    break;

                case System.TimeoutException:
                    statusCode = HttpStatusCode.RequestTimeout;
                    code = ResponseMessages.Codes.Timeout;
                    _logger.LogError(
                        exception,
                        "Request timeout. TraceId: {TraceId}, Path: {Path}, Method: {Method}",
                        traceId,
                        path,
                        method
                    );
                    break;

                case OperationCanceledException:
                    statusCode = HttpStatusCode.BadRequest;
                    code = ResponseMessages.Codes.OperationCancelled;
                    _logger.LogInformation(
                        "Operation cancelled. TraceId: {TraceId}, Path: {Path}, Method: {Method}",
                        traceId,
                        path,
                        method
                    );
                    break;

                default:
                    statusCode = HttpStatusCode.InternalServerError;
                    code = ResponseMessages.Codes.InternalServerError;
                    _logger.LogError(
                        exception,
                        "Unhandled exception. TraceId: {TraceId}, Path: {Path}, Method: {Method}, Exception: {ExceptionType}, Message: {Message}",
                        traceId,
                        path,
                        method,
                        exception.GetType().Name,
                        exception.Message
                    );
                    break;
            }

            if (_environment.IsDevelopment() && errors == null && exception is not CustomException)
            {
                errors = new List<string> { exception.Message };
                if (exception.InnerException != null)
                {
                    errors.Add($"Inner: {exception.InnerException.Message}");
                }
            }

            var requestMetadata = new
            {
                traceId,
                path = path.ToString(),
                method,
            };

            if (metadata != null)
            {
                metadata = new { request = requestMetadata, additional = metadata };
            }
            else
            {
                metadata = new { request = requestMetadata };
            }

            var response = ApiResponseModel.ErrorResponse(code, errors, metadata);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var jsonResponse = JsonSerializer.Serialize(response, JsonOptions);
            await context.Response.WriteAsync(jsonResponse);
        }

        private void LogCustomException(
            CustomException exception,
            string traceId,
            PathString path,
            string method
        )
        {
            var statusCode = (int)exception.StatusCode;

            if (statusCode >= 500)
            {
                _logger.LogError(
                    exception,
                    "Server error. TraceId: {TraceId}, Path: {Path}, Method: {Method}, StatusCode: {StatusCode}, Code: {Code}",
                    traceId,
                    path,
                    method,
                    statusCode,
                    exception.Code
                );
            }
            else if (statusCode >= 400)
            {
                _logger.LogWarning(
                    "Client error. TraceId: {TraceId}, Path: {Path}, Method: {Method}, StatusCode: {StatusCode}, Code: {Code}, Message: {Message}",
                    traceId,
                    path,
                    method,
                    statusCode,
                    exception.Code,
                    exception.Message
                );
            }
        }
    }
}

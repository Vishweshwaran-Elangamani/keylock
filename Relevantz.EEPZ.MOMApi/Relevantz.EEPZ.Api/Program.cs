global using Serilog;
global using Serilog.Events;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Core.Services.Implementations;
using System.IO.Compression;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog early with correlation ID enrichment
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "EEPZ-MoM-API")
    .CreateLogger();

builder.Host.UseSerilog();

Log.Information("Building EEPZ MoM Backend Application");
Log.Information("Starting EEPZ MoM Backend Application");

// Configure Response Compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "application/xml",
        "text/plain",
        "text/css",
        "text/html",
        "application/javascript",
        "image/svg+xml"
    });
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.SmallestSize;
});

// Add Response Caching
builder.Services.AddResponseCaching();

// Add Memory Cache
builder.Services.AddMemoryCache();

// Add model validation configuration
builder.Services.AddControllers(options =>
{
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = false;
    
    // Add cache profiles
    options.CacheProfiles.Add("Default30", new CacheProfile
    {
        Duration = 30,
        Location = ResponseCacheLocation.Any,
        VaryByHeader = "Accept-Encoding"
    });
    
    options.CacheProfiles.Add("Default300", new CacheProfile
    {
        Duration = 300,
        Location = ResponseCacheLocation.Any,
        VaryByHeader = "Accept-Encoding"
    });
    
    options.CacheProfiles.Add("NoCache", new CacheProfile
    {
        Duration = 0,
        Location = ResponseCacheLocation.None,
        NoStore = true
    });
})
.ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var correlationId = context.HttpContext.TraceIdentifier;
        var errors = context.ModelState
            .Where(e => e.Value?.Errors.Count > 0)
            .SelectMany(e => e.Value!.Errors.Select(er => new
            {
                Field = e.Key,
                Message = er.ErrorMessage
            }))
            .ToList();

        var problemDetails = new ValidationProblemDetails(context.ModelState)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validation Error",
            Detail = "One or more validation errors occurred",
            Instance = context.HttpContext.Request.Path,
            Extensions =
            {
                ["traceId"] = correlationId,
                ["timestamp"] = DateTime.UtcNow,
                ["errors"] = errors
            }
        };

        return new BadRequestObjectResult(problemDetails)
        {
            ContentTypes = { "application/problem+json" }
        };
    };
});

builder.Services.AddEndpointsApiExplorer();

// Configure Swagger
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EEPZ MoM API",
        Version = "v1",
        Description = "Minutes of Meeting (MoM) Management API with Health Checks and Metrics",
        Contact = new OpenApiContact
        {
            Name = "EEPZ Team",
            Email = "support@eepz.com"
        }
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by a space and your JWT token.\n\nExample: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// Database configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// JWT Configuration
var jwtSection = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSection["SecretKey"];
var issuer = jwtSection["Issuer"];
var audience = jwtSection["Audience"];

if (string.IsNullOrEmpty(secretKey))
{
    throw new InvalidOperationException("JWT SecretKey is not configured. Please add 'Jwt:SecretKey' to appsettings.json or use environment variables.");
}
if (string.IsNullOrEmpty(issuer))
{
    throw new InvalidOperationException("JWT Issuer is not configured. Please add 'Jwt:Issuer' to appsettings.json or use environment variables.");
}
if (string.IsNullOrEmpty(audience))
{
    throw new InvalidOperationException("JWT Audience is not configured. Please add 'Jwt:Audience' to appsettings.json or use environment variables.");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Log.Warning("Authentication failed: {Error}, CorrelationId: {CorrelationId}", 
                context.Exception.Message, context.HttpContext.TraceIdentifier);
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Log.Debug("Token validated for user: {User}, CorrelationId: {CorrelationId}", 
                context.Principal?.Identity?.Name ?? "Unknown", context.HttpContext.TraceIdentifier);
            return Task.CompletedTask;
        }
    };
});

// Register repositories and services
builder.Services.AddScoped<IMomRepository, MomRepository>();
builder.Services.AddScoped<IMomService, MomService>();

// Configure Health Checks
builder.Services.AddHealthChecks()
    .AddCheck<EFCoreHealthCheck>("database", tags: new[] { "db", "ready" })
    .AddMySql(
        connectionString!,
        name: "mysql",
        failureStatus: HealthStatus.Unhealthy,
        tags: new[] { "db", "mysql", "ready" },
        timeout: TimeSpan.FromSeconds(5))
    .AddCheck("self", () => HealthCheckResult.Healthy("API is running"), tags: new[] { "live" })
    .AddCheck("version", () => HealthCheckResult.Healthy($"Version: 1.0.0"), tags: new[] { "live" });

// Configure OpenTelemetry Metrics
builder.Services.AddOpenTelemetry()
    .WithMetrics(metrics =>
    {
        metrics
            .SetResourceBuilder(ResourceBuilder.CreateDefault()
                .AddService("EEPZ-MoM-API")
                .AddAttributes(new Dictionary<string, object>
                {
                    ["environment"] = builder.Environment.EnvironmentName,
                    ["version"] = "1.0.0"
                }))
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddProcessInstrumentation()
            .AddPrometheusExporter();
    });

// Configure CORS
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:3007" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()
              .WithExposedHeaders("X-Correlation-Id", "X-Pagination");
    });

    options.AddPolicy("ProductionPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
              .WithHeaders("Authorization", "Content-Type", "Accept")
              .AllowCredentials()
              .WithExposedHeaders("X-Correlation-Id", "X-Pagination")
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

// Configure HSTS
builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
    options.ExcludedHosts.Clear();
});

// Configure HTTPS Redirection
builder.Services.AddHttpsRedirection(options =>
{
    options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect;
    options.HttpsPort = 443;
});

// Add ProblemDetails support
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
        context.ProblemDetails.Extensions["timestamp"] = DateTime.UtcNow;
    };
});

var app = builder.Build();

// Enable Response Compression (should be first)
app.UseResponseCompression();

// Enable Response Caching
app.UseResponseCaching();

// Correlation ID Middleware
app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault() 
        ?? context.TraceIdentifier;
    
    context.TraceIdentifier = correlationId;
    context.Response.Headers.Append("X-Correlation-Id", correlationId);
    
    using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
    {
        await next();
    }
});

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ MoM API v1");
        options.RoutePrefix = string.Empty;
        options.DocumentTitle = "EEPZ MoM API Documentation";
        options.DisplayRequestDuration();
        options.EnableDeepLinking();
        options.EnableFilter();
    });

    app.UseCors("DevelopmentPolicy");
    
    Log.Information("Running in Development mode with permissive CORS for: {Origins}", 
        string.Join(", ", allowedOrigins));
}
else
{
    app.UseHsts();
    app.UseCors("ProductionPolicy");
    
    Log.Information("Running in Production mode with strict CORS for: {Origins}", 
        string.Join(", ", allowedOrigins));
}

// Configure request logging
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate =
        "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms | CorrelationId: {CorrelationId}";
    options.GetLevel = (httpContext, elapsed, ex) => LogEventLevel.Information;
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
        diagnosticContext.Set("CorrelationId", httpContext.TraceIdentifier);
        diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].ToString());
        diagnosticContext.Set("RemoteIP", httpContext.Connection.RemoteIpAddress?.ToString());
    };
});

// Security headers middleware
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    
    await next();
});

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// Map Health Check Endpoints
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("live"),
    ResponseWriter = WriteHealthCheckResponse
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = WriteHealthCheckResponse
});

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = WriteHealthCheckResponse
});

// Map Prometheus Metrics Endpoint
app.MapPrometheusScrapingEndpoint("/metrics");

app.MapControllers();

// Database migration
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<EEPZDbContext>();
    try
    {
        Log.Information("Starting database migration... CorrelationId: {CorrelationId}", Guid.NewGuid());
        dbContext.Database.Migrate();
        Log.Information("Database migration completed successfully");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Database migration failed: {Message}", ex.Message);
        throw;
    }
}

// Log application configuration
Log.Information("Application Configuration:");
Log.Information("   Environment: {Environment}", app.Environment.EnvironmentName);
Log.Information("   JWT Issuer: {Issuer}", issuer);
Log.Information("   JWT Audience: {Audience}", audience);
Log.Information("   Allowed Origins: {Origins}", string.Join(", ", allowedOrigins));
Log.Information("   HTTPS Redirection: Enabled");
Log.Information("   HSTS: {HstsEnabled}", !app.Environment.IsDevelopment() ? "Enabled" : "Disabled (Development)");
Log.Information("   Response Compression: Enabled (Brotli, Gzip)");
Log.Information("   Response Caching: Enabled");
Log.Information("   Health Checks: /health/live, /health/ready, /health");
Log.Information("   Metrics: /metrics (Prometheus)");
Log.Information("   Database: {Database}", 
    connectionString?.Split(';').FirstOrDefault(x => x.Contains("Database")));

try
{
    Log.Information("MoM Application started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "MoM Application terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

// Health Check Response Writer
static Task WriteHealthCheckResponse(HttpContext context, HealthReport healthReport)
{
    context.Response.ContentType = "application/json; charset=utf-8";

    var options = new JsonSerializerOptions
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    var result = new
    {
        status = healthReport.Status.ToString(),
        totalDuration = healthReport.TotalDuration.TotalMilliseconds,
        checks = healthReport.Entries.Select(e => new
        {
            name = e.Key,
            status = e.Value.Status.ToString(),
            description = e.Value.Description,
            duration = e.Value.Duration.TotalMilliseconds,
            exception = e.Value.Exception?.Message,
            data = e.Value.Data
        }),
        timestamp = DateTime.UtcNow
    };

    return context.Response.WriteAsync(JsonSerializer.Serialize(result, options));
}

// Custom EF Core Health Check
public class EFCoreHealthCheck : IHealthCheck
{
    private readonly EEPZDbContext _dbContext;

    public EFCoreHealthCheck(EEPZDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _dbContext.Database.CanConnectAsync(cancellationToken);
            return HealthCheckResult.Healthy("Database connection is healthy");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database connection failed", ex);
        }
    }
}

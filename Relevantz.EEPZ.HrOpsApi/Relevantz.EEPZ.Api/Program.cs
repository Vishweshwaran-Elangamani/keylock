using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Text;
using System.IO.Compression;
using Serilog;
var builder = WebApplication.CreateBuilder(args);
// Configure Serilog with structured logging
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "EEPZ-HR-Operations")
    .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
    .CreateLogger();
builder.Host.UseSerilog();
Log.Information("Starting EEPZ HR Operations Microservice in {Environment} mode", builder.Environment.EnvironmentName);
// Add Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
// Configure Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EEPZ HR Operations API",
        Version = "v1.0",
        Description = "HR Operations - Policies, Goals, Career Progression & Payroll API",
        Contact = new OpenApiContact
        {
            Name = "EEPZ Support",
            Email = "support@eepz.com"
        }
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by your JWT token"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});
// Configure MySQL Database Context with proper connection handling
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Database connection string is not configured");
var dbRetryCount = builder.Configuration.GetValue<int>("Database:MaxRetryCount", 3);
var dbRetryDelay = builder.Configuration.GetValue<int>("Database:MaxRetryDelaySeconds", 10);
var dbCommandTimeout = builder.Configuration.GetValue<int>("Database:CommandTimeoutSeconds", 30);
builder.Services.AddDbContext<EEPZDbContext>(options =>
{
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 36)),
        mySqlOptions =>
        {
            mySqlOptions.EnableRetryOnFailure(
                maxRetryCount: dbRetryCount,
                maxRetryDelay: TimeSpan.FromSeconds(dbRetryDelay),
                errorNumbersToAdd: null);
            mySqlOptions.CommandTimeout(dbCommandTimeout);
        })
        .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
        .EnableDetailedErrors(builder.Environment.IsDevelopment());
}, ServiceLifetime.Scoped);
// Configure JWT Authentication with enhanced security
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] 
    ?? throw new InvalidOperationException("JWT Secret Key not configured");
var issuer = jwtSettings["Issuer"] 
    ?? throw new InvalidOperationException("JWT Issuer not configured");
var audience = jwtSettings["Audience"] 
    ?? throw new InvalidOperationException("JWT Audience not configured");
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
        ClockSkew = TimeSpan.Zero,
        RequireExpirationTime = true,
        RequireSignedTokens = true
    };
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Log.Warning("JWT Authentication Failed: {ExceptionType}", 
                context.Exception.GetType().Name);
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var userId = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var correlationId = context.HttpContext.TraceIdentifier;
            Log.Information("JWT Token Validated - UserId: {UserId}, CorrelationId: {CorrelationId}", 
                userId, correlationId);
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            Log.Warning("JWT Challenge - Path: {Path}, CorrelationId: {CorrelationId}",
                context.Request.Path, context.HttpContext.TraceIdentifier);
            return Task.CompletedTask;
        }
    };
});
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => 
        policy.RequireRole("Admin"));
    options.AddPolicy("HROnly", policy => 
        policy.RequireRole("HR"));
    options.AddPolicy("EmployeeAccess", policy => 
        policy.RequireRole("Employee", "HR", "Admin"));
});
// Register Repositories
builder.Services.AddScoped<IPolicyRepository, PolicyRepository>();
builder.Services.AddScoped<IViolationRepository, ViolationRepository>();
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<ICostMappingRepository, CostMappingRepository>();
builder.Services.AddScoped<IResponsibilityDistributionRepository, ResponsibilityDistributionRepository>();
builder.Services.AddScoped<INominationManagementRepository, NominationManagementRepository>();
builder.Services.AddScoped<IPayrollManagementRepository, PayrollManagementRepository>();
builder.Services.AddScoped<ICareerProgressionRepository, CareerProgressionRepository>();
builder.Services.AddScoped<IBudgetPeriodAllocationRepository, BudgetPeriodAllocationRepository>();
builder.Services.AddScoped<IFundAllocationRepository, FundAllocationRepository>();
builder.Services.AddScoped<ISlaEscalationRepository, SlaEscalationRepository>();
Log.Information("Repositories registered successfully");
// Register Services
builder.Services.AddScoped<IPolicyService, PolicyService>();
builder.Services.AddScoped<IViolationService, ViolationService>();
builder.Services.AddScoped<IComplianceService, ComplianceService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ICostMappingService, CostMappingService>();
builder.Services.AddScoped<IResponsibilityDistributionService, ResponsibilityDistributionService>();
builder.Services.AddScoped<INominationManagementService, NominationManagementService>();
builder.Services.AddScoped<IPayrollManagementService, PayrollManagementService>();
builder.Services.AddScoped<IPeriodAllocationService, PeriodAllocationService>();
builder.Services.AddScoped<ICareerProgressionService, CareerProgressionService>();
builder.Services.AddScoped<IFundAllocationService, FundAllocationService>();
builder.Services.AddScoped<ISlaEscalationService, SlaEscalationService>();
builder.Services.AddScoped<IMongoDbService, MongoDbService>();
Log.Information("Services registered successfully");
// Configure CORS with environment-specific policies
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("DevelopmentPolicy", policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    });
    Log.Warning("CORS configured with AllowAny policy for Development environment");
}
else
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("ProductionPolicy", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials()
                  .SetIsOriginAllowedToAllowWildcardSubdomains();
        });
    });
    Log.Information("CORS configured with restricted origins for Production");
}
// Add Response Compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<GzipCompressionProvider>();
    options.Providers.Add<BrotliCompressionProvider>();
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});
// Add Memory Cache
builder.Services.AddMemoryCache();
// Add HTTP Client with timeout
var httpTimeout = builder.Configuration.GetValue<int>("HttpClient:TimeoutSeconds", 30);
builder.Services.AddHttpClient("DefaultClient")
    .SetHandlerLifetime(TimeSpan.FromMinutes(5))
    .ConfigureHttpClient(client =>
    {
        client.Timeout = TimeSpan.FromSeconds(httpTimeout);
    });
// Configure Health Checks
builder.Services.AddHealthChecks()
    .AddCheck("mysql-db", () =>
    {
        try
        {
            using var scope = builder.Services.BuildServiceProvider().CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<EEPZDbContext>();
            var canConnect = context.Database.CanConnect();
            return canConnect 
                ? HealthCheckResult.Healthy("MySQL database is healthy")
                : HealthCheckResult.Unhealthy("MySQL database connection failed");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("MySQL database connection failed", ex);
        }
    }, new[] { "db", "mysql" });
var app = builder.Build();
// Database Initialization with proper error handling
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<EEPZDbContext>();
        Log.Information("Initializing MySQL database connection");
        if (builder.Environment.IsDevelopment())
        {
            await context.Database.EnsureCreatedAsync();
            Log.Information("Database schema validated in Development mode");
        }
        else
        {
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
            if (pendingMigrations.Any())
            {
                Log.Information("Applying {Count} pending migrations", pendingMigrations.Count());
                await context.Database.MigrateAsync();
            }
        }
        Log.Information("Seeding database with initial data");
        var initializerType = typeof(Program).Assembly.GetType("eepzbackend.Data.DbInitializer");
        var method = initializerType?.GetMethod("InitializeAsync");
        if (method != null)
        {
            await (Task)method.Invoke(null, new object[] { context });
            Log.Information("Database seeding completed successfully");
        }
        Log.Information("MySQL database initialized successfully");
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "Critical error during database initialization");
        throw;
    }
}
// Configure middleware pipeline
// 1. Response Compression
app.UseResponseCompression();
// 2. Correlation ID Middleware
app.Use(async (context, next) =>
{
    var correlationId = context.TraceIdentifier;
    context.Response.Headers.Add("X-Correlation-ID", correlationId);
    using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
    {
        await next();
    }
});
// 3. Security Headers Middleware (Environment-Aware CSP)
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
    if (builder.Environment.IsDevelopment())
    {
        // Relaxed CSP for Development (allows Swagger)
        context.Response.Headers.Add("Content-Security-Policy", 
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' data:; img-src 'self' data:; style-src 'self' 'unsafe-inline'");
    }
    else
    {
        // Strict CSP for Production
        context.Response.Headers.Add("Content-Security-Policy", 
            "default-src 'self'; frame-ancestors 'none'");
        context.Response.Headers.Add("Strict-Transport-Security", 
            "max-age=31536000; includeSubDomains");
    }
    await next();
});
// 4. Exception Handler
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var error = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var correlationId = context.TraceIdentifier;
        if (error != null)
        {
            Log.Error(error.Error, 
                "Unhandled exception - CorrelationId: {CorrelationId}, Path: {Path}",
                correlationId, context.Request.Path);
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var errorResponse = new
            {
                success = false,
                message = "An internal server error occurred",
                correlationId = correlationId,
                timestamp = DateTime.UtcNow,
                error = app.Environment.IsDevelopment() 
                    ? error.Error.Message 
                    : "Internal Server Error"
            };
            await context.Response.WriteAsJsonAsync(errorResponse);
        }
    });
});
// 5. Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ HR Operations API V1");
        c.RoutePrefix = string.Empty;
        c.DocumentTitle = "EEPZ HR Operations API Documentation";
    });
    Log.Information("Swagger UI enabled at root /");
}
// 6. Serilog Request Logging
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.GetLevel = (httpContext, elapsed, ex) => ex != null
        ? Serilog.Events.LogEventLevel.Error
        : httpContext.Response.StatusCode > 499
            ? Serilog.Events.LogEventLevel.Error
            : Serilog.Events.LogEventLevel.Information;
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
        diagnosticContext.Set("RemoteIP", httpContext.Connection.RemoteIpAddress?.ToString());
        diagnosticContext.Set("CorrelationId", httpContext.TraceIdentifier);
    };
});
// 7. Static Files
app.UseStaticFiles();
// 8. HTTPS Redirection
if (!builder.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
// 9. CORS
var corsPolicy = app.Environment.IsDevelopment() ? "DevelopmentPolicy" : "ProductionPolicy";
app.UseCors(corsPolicy);
Log.Information("CORS policy '{Policy}' applied", corsPolicy);
// 10. Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();
// 11. Map Controllers
app.MapControllers();
// 12. Health Check Endpoints
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false,
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            status = "Healthy",
            timestamp = DateTime.UtcNow,
            service = "EEPZ-HR-Operations",
            version = "v1.0"
        });
    }
}).AllowAnonymous();
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("db"),
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration.TotalMilliseconds,
                tags = e.Value.Tags
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        };
        await context.Response.WriteAsJsonAsync(result);
    }
}).AllowAnonymous();
// 13. Health Endpoint
app.MapGet("/health", async (EEPZDbContext dbContext, IConfiguration config) =>
{
    bool dbConnected = false;
    try
    {
        dbConnected = await dbContext.Database.CanConnectAsync();
    }
    catch (Exception ex)
    {
        Log.Warning("Health check database connection failed: {Message}", ex.Message);
    }
    return Results.Ok(new
    {
        status = "Healthy",
        timestamp = DateTime.UtcNow,
        service = "EEPZ HR Operations Microservice",
        version = "v1.0",
        environment = builder.Environment.EnvironmentName,
        database = new
        {
            connected = dbConnected,
            provider = "MySQL (Pomelo EF Core 8.0)",
            connectionStringName = "DefaultConnection"
        },
        endpoints = new
        {
            total = 57,
            categories = new[]
            {
                "Employee Data (10)",
                "Fund Allocation (16)",
                "Period Allocation (6)",
                "Policy (13)",
                "Violation (12)"
            }
        },
        authentication = new
        {
            enabled = true,
            type = "JWT Bearer",
            issuerConfigured = !string.IsNullOrEmpty(config["Jwt:Issuer"])
        },
        cors = corsPolicy,
        swagger = app.Environment.IsDevelopment()
    });
}).AllowAnonymous();
// 14. API Info Endpoint
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/info", () =>
    {
        return Results.Ok(new
        {
            service = "EEPZ HR Operations Microservice",
            version = "v1.0",
            environment = builder.Environment.EnvironmentName,
            endpoints = new
            {
                swagger = "/",
                health = "/health",
                healthLive = "/health/live",
                healthReady = "/health/ready"
            },
            authentication = "JWT Bearer",
            documentation = "See / for API documentation"
        });
    }).AllowAnonymous();
}
try
{
    Log.Information("EEPZ HR Operations Microservice started successfully on {Environment}", 
        builder.Environment.EnvironmentName);
    Log.Information("Authentication: JWT Bearer Token Enabled");
    Log.Information("Endpoints: 57 Total");
    Log.Information("Environment: {Environment}", app.Environment.EnvironmentName);
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "HR Operations Microservice terminated unexpectedly");
    throw;
}
finally
{
    Log.Information("EEPZ HR Operations Microservice shutting down");
    await Log.CloseAndFlushAsync();
}

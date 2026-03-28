global using Serilog;
global using Serilog.Events;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Mappings;
using Relevantz.EEPZ.Api.Middleware;
using System.Text;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Prometheus;
using FluentValidation;
using FluentValidation.AspNetCore;
using Relevantz.EEPZ.Common.Validators;
using Mapster;
using MapsterMapper;
using System.Reflection;

// Initialize Serilog Logger
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

Log.Information("Initializing EEPZ MoM Backend Application");

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Configure Serilog from appsettings
    Log.Logger = new LoggerConfiguration()
        .ReadFrom.Configuration(builder.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "EEPZ.MoM.API")
        .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
        .CreateLogger();

    builder.Host.UseSerilog();

    Log.Information("Building application configuration");

    // Add Controllers with JSON options
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = null; // Preserve property names
            options.JsonSerializerOptions.WriteIndented = builder.Environment.IsDevelopment();
        });

    // Add FluentValidation
    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddFluentValidationClientsideAdapters();
    builder.Services.AddValidatorsFromAssemblyContaining<CreateMomDtoValidator>();
    Log.Information("FluentValidation configured successfully");

    // Configure Mapster - High-performance object mapping
    MappingConfig.RegisterMappings();
    var mapsterConfig = TypeAdapterConfig.GlobalSettings;
    mapsterConfig.Scan(Assembly.GetExecutingAssembly());
    builder.Services.AddSingleton(mapsterConfig);
    builder.Services.AddScoped<IMapper, ServiceMapper>();
    Log.Information("Mapster object mapping configured successfully");

    // Add Memory Cache for performance optimization
    builder.Services.AddMemoryCache(options =>
    {
        options.SizeLimit = 1024; // Limit cache size
        options.CompactionPercentage = 0.25; // Compact when 25% over limit
    });
    Log.Information("Memory cache configured successfully");

    // Add API Explorer
    builder.Services.AddEndpointsApiExplorer();

    // Configure Swagger/OpenAPI
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "EEPZ Minutes of Meeting API",
            Version = "v1.0",
            Description = "Enterprise API for managing Minutes of Meeting with advanced features including " +
                          "Mapster integration, rate limiting, caching, input validation, and comprehensive security",
            Contact = new OpenApiContact
            {
                Name = "EEPZ Development Team",
                Email = "support@relevantz.com"
            }
        });

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below."
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

        // Include XML comments if available
        var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
        {
            options.IncludeXmlComments(xmlPath);
        }
    });
    Log.Information("Swagger/OpenAPI documentation configured successfully");

    // Configure Database Context
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrEmpty(connectionString))
    {
        throw new InvalidOperationException("Database connection string 'DefaultConnection' is not configured");
    }

    builder.Services.AddDbContext<EEPZDbContext>(options =>
    {
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString), mysqlOptions =>
        {
            mysqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorNumbersToAdd: null);
            mysqlOptions.CommandTimeout(30);
        });

        // Enable sensitive data logging only in development
        if (builder.Environment.IsDevelopment())
        {
            options.EnableSensitiveDataLogging();
            options.EnableDetailedErrors();
        }
    });
    Log.Information("Database context configured successfully");

    // Configure JWT Authentication
   builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    // ✅ Keycloak realm (JWKS auto-discovered)
    options.Authority =
        "https://unprotractive-elmo-estipulate.ngrok-free.dev/realms/eepz-realm";

    options.RequireHttpsMetadata = true;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        // ✅ Keep consistent across all APIs
        ValidateIssuer = false,
        ValidateAudience = false,

        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,

        // ✅ Must match Keycloak token
        NameClaimType = "preferred_username",
        RoleClaimType = "role"
    };
});

builder.Services.AddAuthorization();
    Log.Information("JWT authentication configured successfully");

    // Register Application Services
    builder.Services.AddScoped<IMomRepository, MomRepository>();
    builder.Services.AddScoped<IMomService, MomService>();
    Log.Information("Application services registered successfully");

    // Health Checks Configuration
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<EEPZDbContext>(
            name: "database",
            failureStatus: HealthStatus.Unhealthy,
            tags: new[] { "ready", "db" })
        .AddCheck("self", () => HealthCheckResult.Healthy("API is running"), 
            tags: new[] { "live" });
    Log.Information("Health checks configured successfully");

    // CORS Configuration
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
        ?? new[] { "http://localhost:3007" };

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowSpecificOrigin", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials()
                  .WithExposedHeaders("X-Correlation-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining");
        });
    });
    Log.Information("CORS configured for origins: {Origins}", string.Join(", ", allowedOrigins));

    // Build the application
    var app = builder.Build();

    Log.Information("Application built successfully. Configuring HTTP pipeline");

    // Configure the HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ MoM API v1.0");
            c.RoutePrefix = string.Empty; // Swagger UI at root
            c.DocumentTitle = "EEPZ MoM API Documentation";
            c.DefaultModelsExpandDepth(-1); // Hide schemas section by default
        });
        Log.Information("Swagger UI enabled at root URL");
    }

    // Serilog Request Logging with custom enrichers
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.GetLevel = (httpContext, elapsed, ex) => 
        {
            if (ex != null) return LogEventLevel.Error;
            if (httpContext.Response.StatusCode >= 500) return LogEventLevel.Error;
            if (httpContext.Response.StatusCode >= 400) return LogEventLevel.Warning;
            if (elapsed > 5000) return LogEventLevel.Warning; // Slow requests
            return LogEventLevel.Information;
        };
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
            diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].ToString());
            diagnosticContext.Set("ClientIP", httpContext.Connection.RemoteIpAddress?.ToString());
            
            if (httpContext.User.Identity?.IsAuthenticated == true)
            {
                diagnosticContext.Set("UserName", httpContext.User.Identity.Name);
            }
        };
    });

    // HTTPS Redirection
    app.UseHttpsRedirection();
    app.UseMiddleware<Relevantz.EEPZ.Api.Middleware.GlobalExceptionMiddleware>();

    // CORS
    app.UseCors("AllowSpecificOrigin");

    // Prometheus Metrics Middleware
    app.UseHttpMetrics();
    Log.Information("Prometheus metrics middleware configured");

    // Simple Rate Limiting Middleware
    app.UseMiddleware<SimpleRateLimitMiddleware>();
    Log.Information("Rate limiting middleware configured");

    // Authentication & Authorization
    app.UseAuthentication();
    app.UseAuthorization();

    // Health Check Endpoints
    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
        Predicate = (check) => check.Tags.Contains("live"),
        AllowCachingResponses = false
    });

    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = (check) => check.Tags.Contains("ready"),
        AllowCachingResponses = false
    });
    Log.Information("Health check endpoints configured at /health/live and /health/ready");

    // Prometheus Metrics Endpoint
    app.MapMetrics();
    Log.Information("Prometheus metrics endpoint configured at /metrics");

    // Map Controllers
    app.MapControllers();

    // Database Migration on Startup
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<EEPZDbContext>();
        try
        {
            Log.Information("Starting database migration check");
            
            if (dbContext.Database.GetPendingMigrations().Any())
            {
                Log.Information("Pending migrations detected. Applying migrations");
                dbContext.Database.Migrate();
                Log.Information("Database migrations applied successfully");
            }
            else
            {
                Log.Information("Database is up to date. No pending migrations");
            }

            // Verify database connection
            if (dbContext.Database.CanConnect())
            {
                Log.Information("Database connection verified successfully");
            }
            else
            {
                Log.Error("Database connection failed");
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Database migration failed: {ErrorMessage}", ex.Message);
            
            if (!builder.Environment.IsDevelopment())
            {
                throw; // Re-throw in production to prevent startup with database issues
            }
        }
    }

    // Log Application Configuration Summary
    Log.Information("================================================================================");
    Log.Information("Application Configuration Summary:");
    Log.Information("================================================================================");
    Log.Information("Environment:           {Environment}", app.Environment.EnvironmentName);
    Log.Information("Application Name:      EEPZ Minutes of Meeting API");
    Log.Information("Version:               1.0");
    Log.Information("--------------------------------------------------------------------------------");
    Log.Information("Security:");

    Log.Information("  Authentication:      Enabled (JWT Bearer)");
    Log.Information("  Rate Limiting:       Enabled (100 requests/minute per client)");
    Log.Information("  Input Sanitization:  Enabled (XSS/Injection protection)");
    Log.Information("--------------------------------------------------------------------------------");
    Log.Information("Database:");
    Log.Information("  Provider:            MySQL");
    Log.Information("  Database:            {Database}", 
        connectionString?.Split(';').FirstOrDefault(x => x.Contains("Database"))?.Split('=').LastOrDefault() ?? "N/A");
    Log.Information("  Connection Retry:    Enabled (3 attempts, 5s delay)");
    Log.Information("--------------------------------------------------------------------------------");
    Log.Information("Performance:");
    Log.Information("  Object Mapping:      Mapster (2-6x faster than AutoMapper)");
    Log.Information("  Memory Cache:        Enabled (5-minute expiration, 1024 entry limit)");
    Log.Information("  Response Caching:    Enabled for read operations");
    Log.Information("--------------------------------------------------------------------------------");
    Log.Information("Monitoring & Health:");
    Log.Information("  Health Checks:       /health/live, /health/ready");
    Log.Information("  Metrics:             /metrics (Prometheus format)");
    Log.Information("  Logging:             Serilog with structured logging");
    Log.Information("  Request Logging:     Enabled with enrichment");
    Log.Information("--------------------------------------------------------------------------------");
    Log.Information("Documentation:");
    if (app.Environment.IsDevelopment())
    {
        Log.Information("  Swagger UI:          Enabled at root URL (/)");
    }
    else
    {
        Log.Information("  Swagger UI:          Disabled (Production mode)");
    }
    Log.Information("--------------------------------------------------------------------------------");
    Log.Information("Features:");
    Log.Information("  FluentValidation:    Enabled for request validation");
    Log.Information("  CORS:                Enabled for origins: {Origins}", string.Join(", ", allowedOrigins));
    Log.Information("  Audit Logging:       Enabled for all operations");
    Log.Information("  Soft Delete:         Enabled with audit trail");
    Log.Information("================================================================================");

    // Start the application
    Log.Information("Starting EEPZ MoM Application");
    app.Run();
    Log.Information("EEPZ MoM Application stopped gracefully");
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly: {ErrorMessage}", ex.Message);
    throw;
}
finally
{
    Log.Information("Shutting down EEPZ MoM Application");
    Log.CloseAndFlush();
}

using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Data.Repository;
using Relevantz.EEPZ.Core.Service;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Relevantz.EEPZ.Data.DBContexts;
using System.Text;
using System.IO.Compression;
using AutoMapper;
using Serilog;


var builder = WebApplication.CreateBuilder(args);


// Configure Serilog with structured logging
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "EEPZ-Internal-Opportunities")
    .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
    .CreateLogger();


builder.Host.UseSerilog();


Log.Information("Starting EEPZ Internal Opportunities Service in {Environment} mode", builder.Environment.EnvironmentName);


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
        Title = "EEPZ Internal Opportunities API",
        Version = "v1.0",
        Description = "Internal Opportunities, Nominations, Promotions & Manager Tracking API",
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


// Register Repositories (Internal Opportunities Module)
builder.Services.AddScoped<IInternalOpportunityRepository, InternalOpportunityRepository>();
builder.Services.AddScoped<INominationRepository, NominationRepository>();
builder.Services.AddScoped<IManagerNominationTrackingRepository, ManagerNominationTrackingRepository>();
builder.Services.AddScoped<INominationReviewMetricRepository, NominationReviewMetricRepository>();
builder.Services.AddScoped<IPromotionRepository, PromotionRepository>();
builder.Services.AddScoped<IPromotionHistoryRepository, PromotionHistoryRepository>();


Log.Information("Repositories registered successfully");


// Register Services (Internal Opportunities Module)
builder.Services.AddScoped<IInternalOpportunityService, InternalOpportunityService>();
builder.Services.AddScoped<INominationService, NominationService>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEmailService, EmailService>();


Log.Information("Services registered successfully");


// Configure AutoMapper
var mapperConfig = new MapperConfiguration(mc =>
{
    mc.AddProfile(new InternalOpportunitiesMappingProfile());
});
builder.Services.AddSingleton(mapperConfig.CreateMapper());
Log.Information("AutoMapper configured successfully");


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


// Database Connection Verification
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<EEPZDbContext>();


        Log.Information("Verifying MySQL database connection");


        if (await context.Database.CanConnectAsync())
        {
            Log.Information("Database connection established successfully");
            
            if (builder.Environment.IsDevelopment())
            {
                await context.Database.EnsureCreatedAsync();
                Log.Information("Database schema validated in Development mode");
            }
        }
        else
        {
            Log.Warning("Failed to connect to the database");
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred while connecting to the database");
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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ Internal Opportunities API V1");
        c.RoutePrefix = string.Empty;
        c.DocumentTitle = "EEPZ Internal Opportunities API Documentation";
        c.DisplayRequestDuration();
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


// 7. HTTPS Redirection
if (!builder.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}


// 8. CORS
var corsPolicy = app.Environment.IsDevelopment() ? "DevelopmentPolicy" : "ProductionPolicy";
app.UseCors(corsPolicy);
Log.Information("CORS policy '{Policy}' applied", corsPolicy);


// 9. Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();


// 10. Map Controllers
app.MapControllers();


// 11. Health Check Endpoints
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
            service = "EEPZ-Internal-Opportunities",
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


// 12. Health Endpoint (backward compatible)
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
        service = "EEPZ Internal Opportunities API",
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
            total = 32,
            categories = new[]
            {
                "Internal Opportunities (7)",
                "Nominations (12)",
                "Opportunity Analytics (2)",
                "Promotions (11)"
            }
        },


        authentication = new
        {
            enabled = true,
            type = "JWT Bearer",
            issuerConfigured = !string.IsNullOrEmpty(config["Jwt:Issuer"])
        },


        features = new
        {
            autoMapperEnabled = true,
            cors = corsPolicy,
            swagger = app.Environment.IsDevelopment()
        }
    });
}).AllowAnonymous();


// 13. API Info Endpoint 
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/info", () =>
    {
        return Results.Ok(new
        {
            service = "EEPZ Internal Opportunities Microservice",
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
    Log.Information("EEPZ Internal Opportunities API started successfully on {Environment}", 
        builder.Environment.EnvironmentName);
    Log.Information("Authentication: JWT Bearer Token Enabled");
    Log.Information("Endpoints: 32 Total");
    Log.Information("Environment: {Environment}", app.Environment.EnvironmentName);
    
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Internal Opportunities API terminated unexpectedly");
    throw;
}
finally
{
    Log.Information("EEPZ Internal Opportunities API shutting down");
    await Log.CloseAndFlushAsync();
}

using FluentValidation.AspNetCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Relevantz.EEPZ.Common.Validators;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Versioning;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

using Prometheus;
using Serilog;

using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Service;
using Relevantz.EEPZ.Core.Services;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Swashbuckle.AspNetCore.SwaggerGen;
using FluentValidation;
using Relevantz.EEPZ.Common.DTOs.Response;

// NEW: Load .env early for local development (DotNetEnv)
try
{
    // Try a few common locations: project root (when running from root) and ../bin/... scenarios
    var candidates = new[]
    {
        Path.Combine(Directory.GetCurrentDirectory(), ".env"),
        Path.Combine(AppContext.BaseDirectory, ".env"),
        Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".env"),
    };

    foreach (var p in candidates)
    {
        if (File.Exists(p))
        {
            DotNetEnv.Env.Load(p);
            Console.WriteLine($"[config] Loaded .env from {Path.GetFullPath(p)}");
            break;
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[config] Skipped .env load: {ex.Message}");
}

var builder = WebApplication.CreateBuilder(args);

// Ensure configuration order: appsettings.json -> appsettings.{Env}.json -> Environment Variables
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

// -------------------------------------------------
// Shared uploads directory
// -------------------------------------------------
var sharedUploadsPath = Path.GetFullPath(Path.Combine(
    Directory.GetCurrentDirectory(), "..", "..", "SharedUploads"
));
if (!Directory.Exists(sharedUploadsPath))
{
    Directory.CreateDirectory(sharedUploadsPath);
    Console.WriteLine($"Created shared uploads directory at: {sharedUploadsPath}");
}
else
{
    Console.WriteLine($"Shared uploads directory exists at: {sharedUploadsPath}");
}
builder.Services.AddSingleton(new FileUploadSettings { UploadPath = sharedUploadsPath });

// -------------------------------------------------
// Serilog
// -------------------------------------------------
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

Log.Information("Starting EEPZ Performance Management Application...");
Log.Information("Shared Uploads Path: {Path}", sharedUploadsPath);

// -------------------------------------------------
// Controllers + global model validation behavior
// -------------------------------------------------
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var problem = new ValidationProblemDetails(context.ModelState)
            {
                Title = "One or more validation errors occurred.",
                Status = StatusCodes.Status400BadRequest,
                Type = "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.1"
            };
            return new BadRequestObjectResult(problem);
        };
    });
    
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();


builder.Services.AddEndpointsApiExplorer();

// -------------------------------------------------
// CORS (Dev: AllowAny; Prod: Allowlist)
// -------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", p => p
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader()
        .WithExposedHeaders("Content-Disposition", "Content-Type"));

    options.AddPolicy("ProdCors", p =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        p.WithOrigins(allowedOrigins)
         .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
         .WithHeaders("Content-Type", "Authorization", "If-Match", "If-None-Match")
         .WithExposedHeaders("Content-Disposition", "Content-Type");
    });
});

// -------------------------------------------------
// API Versioning + Explorer (OpenAPI source of truth)
// -------------------------------------------------
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;

    // Support URL segment (preferred), header, and query to avoid breaking existing clients
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("x-api-version"),
        new QueryStringApiVersionReader("api-version")
    );
});
builder.Services.AddVersionedApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";           // v1, v1.1, etc.
    options.SubstituteApiVersionInUrl = true;     // allows /api/v{version}/...
});

// -------------------------------------------------
// Swagger (versioned docs via ConfigureSwaggerOptions + JWT security)
// -------------------------------------------------
builder.Services.AddSwaggerGen(options =>
{
    // IMPORTANT: Do NOT call options.SwaggerDoc("v1", ...) here.
    // Docs are registered centrally by ConfigureSwaggerOptions to avoid duplicates.

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by your JWT token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    options.CustomSchemaIds(t => t.FullName!.Replace("+", "."));
});
builder.Services.ConfigureOptions<ConfigureSwaggerOptions>();

// -------------------------------------------------
// EF Core (MySQL) -- now expects CONNECTIONSTRINGS__DEFAULTCONNECTION from env/.env
// -------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured. Ensure it is provided via environment variables (CONNECTIONSTRINGS__DEFAULTCONNECTION) or appsettings.");
}
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
builder.Services.AddScoped<DbContext>(sp => sp.GetRequiredService<EEPZDbContext>());

// -------------------------------------------------
// JWT (values overridden by env variables loaded from .env)
// -------------------------------------------------
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"];
if (string.IsNullOrWhiteSpace(secretKey))
{
    throw new InvalidOperationException("Jwt:SecretKey not configured. Provide JWT__SECRETKEY via environment variables or appsettings.");
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
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero,
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = JwtRegisteredClaimNames.Sub
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            Log.Debug("JWT OnMessageReceived Path={Path}", ctx.Request.Path);
            return Task.CompletedTask;
        },
        OnTokenValidated = ctx =>
        {
            Log.Information("JWT Validated Sub={Sub} CID={CID}",
                ctx.Principal?.FindFirstValue(JwtRegisteredClaimNames.Sub),
                ctx.HttpContext.TraceIdentifier);
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = ctx =>
        {
            Log.Warning(ctx.Exception, "JWT Authentication Failed Path={Path}", ctx.Request.Path);
            return Task.CompletedTask;
        }
    };
});
builder.Services.AddAuthorization();

// -------------------------------------------------
// DI registrations (explicit)
// -------------------------------------------------
builder.Services.AddScoped<IHRNominationRepository, HRNominationRepository>();
builder.Services.AddScoped<IHRNominationService, HRNominationService>();

builder.Services.AddScoped<IManagerNominationRepository, ManagerNominationRepository>();
builder.Services.AddScoped<IManagerNominationService, ManagerNominationService>();

builder.Services.AddScoped<IEmployeeNominationRepository, EmployeeNominationRepository>();
builder.Services.AddScoped<IEmployeeNominationService, EmployeeNominationService>();

builder.Services.AddScoped<IDepartmentHeadNominationRepository, DepartmentHeadNominationRepository>();
builder.Services.AddScoped<IDepartmentHeadNominationService, DepartmentHeadNominationService>();

builder.Services.AddValidatorsFromAssemblyContaining<HRNominationApprovalDtoValidator>();
builder.Services.AddScoped<IValidator<HRNominationApprovalDto>, HRNominationApprovalDtoValidator>();
builder.Services.AddScoped<IValidator<HRNominationRejectDto>, HRNominationRejectDtoValidator>();
builder.Services.AddScoped<IValidator<CreateRewardTypeDto>, CreateRewardTypeDtoValidator>();
builder.Services.AddScoped<IValidator<UpdateRewardTypeDto>, UpdateRewardTypeDtoValidator>();
builder.Services.AddScoped<IValidator<CreateParameterDto>, CreateParameterDtoValidator>();
builder.Services.AddScoped<IValidator<UpdateParameterDto>, UpdateParameterDtoValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<NominationSubmitDtoValidator>();

// -------------------------------------------------
// Health checks
// -------------------------------------------------
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("App is running"), tags: new[] { "live" })
    .AddCheck<MySqlDbHealthCheck>("mysql-db", tags: new[] { "ready", "db", "mysql" });

// -------------------------------------------------
// Rate limiting (per-IP, 100 req/min)
// -------------------------------------------------
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("PerIp", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

// -------------------------------------------------
// Exception middleware
// -------------------------------------------------
builder.Services.AddTransient<Relevantz.EEPZ.Api.Middleware.ExceptionHandlingMiddleware>();

// -------------------------------------------------
// Build
// -------------------------------------------------
var app = builder.Build();

// -------------------------------------------------
// Dev error page / HSTS
// -------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseHsts();
}

// -------------------------------------------------
// Security headers (CSP relaxed for Swagger in Dev; strict elsewhere)
// -------------------------------------------------
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Remove("Server");
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    ctx.Response.Headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()";

    if (app.Environment.IsDevelopment())
    {
        // Allow Swagger UI (served from root when RoutePrefix="") to load JS/CSS/images and inline snippets in Dev
        ctx.Response.Headers["Content-Security-Policy"] =
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data:; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none'; " +
            "base-uri 'none'";
    }
    else
    {
        // Strict in Prod for all non-swagger routes (Swagger UI not enabled in Prod anyway)
        var isSwagger = ctx.Request.Path.StartsWithSegments("/swagger") || ctx.Request.Path.Equals("/");
        if (!isSwagger)
        {
            ctx.Response.Headers["Content-Security-Policy"] =
                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";
        }
    }

    await next();
});

// -------------------------------------------------
// Rate Limiter
// -------------------------------------------------
app.UseRateLimiter();

// -------------------------------------------------
// Metrics
// -------------------------------------------------
app.UseHttpMetrics();
app.MapMetrics("/metrics");

// -------------------------------------------------
// Serilog request logging
// -------------------------------------------------
app.UseSerilogRequestLogging();

// -------------------------------------------------
// Swagger UI (Dev)
// -------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        // Build UI endpoints per API version
        var provider = app.Services.GetRequiredService<IApiVersionDescriptionProvider>();
        foreach (var desc in provider.ApiVersionDescriptions)
        {
            options.SwaggerEndpoint($"/swagger/{desc.GroupName}/swagger.json", $"EEPZ API {desc.GroupName.ToUpperInvariant()}");
        }
        options.RoutePrefix = string.Empty; // serve at root
    });
}

// -------------------------------------------------
// Exception handling
// -------------------------------------------------
app.UseMiddleware<Relevantz.EEPZ.Api.Middleware.ExceptionHandlingMiddleware>();

// -------------------------------------------------
// HTTPS, CORS, Auth
// -------------------------------------------------
app.UseHttpsRedirection();
app.UseCors(app.Environment.IsDevelopment() ? "DevCors" : "ProdCors");
app.UseAuthentication();
app.UseAuthorization();

// -------------------------------------------------
// Controllers
// -------------------------------------------------
app.MapControllers();

// -------------------------------------------------
// Health checks
// -------------------------------------------------
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("live"),
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            status = "Healthy",
            timestamp = DateTime.UtcNow,
            service = "EEPZ-Performance",
            version = "v1.0"
        });
    }
}).AllowAnonymous();

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
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
                durationMs = e.Value.Duration.TotalMilliseconds,
                tags = e.Value.Tags
            }),
            totalDurationMs = report.TotalDuration.TotalMilliseconds
        };
        await context.Response.WriteAsJsonAsync(result);
    }
}).AllowAnonymous();

// -------------------------------------------------
// Run
// -------------------------------------------------
try
{
    Log.Information("EEPZ Performance Management API started successfully on port 5114");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

// -------------------------------------------------
// Supporting types
// -------------------------------------------------
public class FileUploadSettings
{
    public string UploadPath { get; set; } = string.Empty;
}

internal sealed class MySqlDbHealthCheck : IHealthCheck
{
    private readonly EEPZDbContext _db;

    public MySqlDbHealthCheck(EEPZDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(3));

            var canConnect = await _db.Database.CanConnectAsync(cts.Token);

            return canConnect
                ? HealthCheckResult.Healthy("MySQL database reachable")
                : HealthCheckResult.Unhealthy("MySQL database unreachable");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("MySQL database exception", ex);
        }
    }
}

// -------------------------------------------------
// Swagger options to register one document per API version
// -------------------------------------------------
public sealed class ConfigureSwaggerOptions : IConfigureOptions<SwaggerGenOptions>
{
    private readonly IApiVersionDescriptionProvider _provider;
    public ConfigureSwaggerOptions(IApiVersionDescriptionProvider provider) => _provider = provider;

    public void Configure(SwaggerGenOptions options)
    {
        foreach (var desc in _provider.ApiVersionDescriptions)
        {
            options.SwaggerDoc(desc.GroupName, new OpenApiInfo
            {
                Title = "EEPZ API",
                Version = desc.ApiVersion.ToString(),
                Description = "Performance Management API"
            });
        }
    }
}
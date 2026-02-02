using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
 
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
 
using Serilog;
 
using Relevantz.EEPZ.Data.DBContexts; 
 
using Prometheus;
 
var builder = WebApplication.CreateBuilder(args);
 

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "EEPZ-Performance")
    .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
    .CreateLogger();
 
builder.Host.UseSerilog();
Log.Information("Starting EEPZ Performance Management API…");
 

var sharedUploadsPath = Path.GetFullPath(Path.Combine(
    Directory.GetCurrentDirectory(), "..", "..", "SharedUploads"
));
if (!Directory.Exists(sharedUploadsPath))
{
    Directory.CreateDirectory(sharedUploadsPath);
    Log.Information("Created shared uploads directory at: {Path}", sharedUploadsPath);
}
else
{
    Log.Information("Shared uploads directory exists at: {Path}", sharedUploadsPath);
}
builder.Services.AddSingleton(new FileUploadSettings { UploadPath = sharedUploadsPath });
 

builder.Services.AddControllers();
 

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EEPZ API",
        Version = "v1",
        Description = "Performance Management API"
    });
 
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer {token}'"
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
 

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is not configured");

builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
builder.Services.AddScoped<DbContext>(sp => sp.GetRequiredService<EEPZDbContext>());
 

var jwt = builder.Configuration.GetSection("Jwt");
var secretKey = jwt["SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey not configured");
 
builder.Services.AddAuthentication(o =>
{
    o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwt["Issuer"],
        ValidAudience = jwt["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero,
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = JwtRegisteredClaimNames.Sub,
        ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 }
    };
 
    o.Events = new JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            // Do NOT log token/headers
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
 

// Authorization — secure-by-default (+ optional MFA policy)

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
 
    options.AddPolicy("RequireMfa", p => p.RequireClaim("mfa", "true"));
});
 

DiRegistration.RegisterByConvention(builder.Services,
    "Relevantz.EEPZ.Core",
    "Relevantz.EEPZ.Data");
 

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", p => p
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader()
        .WithExposedHeaders("Content-Disposition", "Content-Type"));
 
    options.AddPolicy("ProdCors", p => p
        .WithOrigins(allowedOrigins)
        .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        .WithHeaders("Content-Type", "Authorization", "If-Match", "If-None-Match")
        .WithExposedHeaders("Content-Disposition", "Content-Type"));
});
 
// Rate limiting (per-IP, 100 req/min)
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
 

builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 10 * 1024 * 1024;
});
 

// Health checks

builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("App is running"), tags: new[] { "live" })
    .AddCheck<MySqlDbHealthCheck>("mysql-db", tags: new[] { "ready", "db", "mysql" });
 

<<<<<<< Updated upstream
//  Register custom exception handling middleware (added)
=======
>>>>>>> Stashed changes
builder.Services.AddTransient<Relevantz.EEPZ.Api.Middleware.ExceptionHandlingMiddleware>();
 
var app = builder.Build();
 

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseHsts();
}
 

<<<<<<< Updated upstream
//  Removed: Inline UseExceptionHandler block
//  Add custom exception handling middleware early in the pipeline (added)
app.UseMiddleware<Relevantz.EEPZ.Api.Middleware.ExceptionHandlingMiddleware>();
=======
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Remove("Server");
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    ctx.Response.Headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()";
 
    var isSwagger = ctx.Request.Path.StartsWithSegments("/swagger") || string.Equals(ctx.Request.Path, "/");
    if (!isSwagger)
        ctx.Response.Headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";
 
    await next();
});
 


app.UseRateLimiter();
 

app.UseHttpMetrics();
app.MapMetrics("/metrics");
 

app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.GetLevel = (httpContext, elapsed, ex) =>
        ex != null || httpContext.Response.StatusCode >= 500
            ? Serilog.Events.LogEventLevel.Error
            : httpContext.Response.StatusCode >= 400
                ? Serilog.Events.LogEventLevel.Warning
                : Serilog.Events.LogEventLevel.Information;
 
    options.EnrichDiagnosticContext = (diag, ctx) =>
    {
        diag.Set("RequestHost", ctx.Request.Host.Value);
        diag.Set("RequestScheme", ctx.Request.Scheme);
        diag.Set("RemoteIP", ctx.Connection.RemoteIpAddress?.ToString());
        diag.Set("CorrelationId", ctx.TraceIdentifier);
    };
});
 
>>>>>>> Stashed changes

app.UseHttpsRedirection();
 

app.UseCors(app.Environment.IsDevelopment() ? "DevCors" : "ProdCors");
 

app.UseAuthentication();
app.UseAuthorization();
 

app.Use(async (ctx, next) =>
{
    if (ctx.Request.HasFormContentType && ctx.Request.Form.Files.Count > 0)
    {
        foreach (var f in ctx.Request.Form.Files)
        {
            var safeName = Path.GetFileName(f.FileName);
            if (!string.Equals(safeName, f.FileName, StringComparison.Ordinal))
            {
                ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
                await ctx.Response.WriteAsync("Invalid file name.");
                return;
            }
 
            var allowed = new[] { ".pdf", ".png", ".jpg", ".jpeg" };
            if (!allowed.Contains(Path.GetExtension(safeName).ToLowerInvariant()))
            {
                ctx.Response.StatusCode = StatusCodes.Status415UnsupportedMediaType;
                await ctx.Response.WriteAsync("Unsupported file type.");
                return;
            }
 
            if (f.Length == 0 || f.Length > 10 * 1024 * 1024)
            {
                ctx.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
                await ctx.Response.WriteAsync("Invalid file size.");
                return;
            }
        }
    }
    await next();
});
 

app.MapControllers();
 
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
 

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ API v1");
    if (app.Environment.IsDevelopment())
        c.RoutePrefix = string.Empty;
});
 

try
{
    Log.Information("EEPZ Performance Management API started successfully");
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
 

// DI helper: register by convention (no explicit type refs)

internal static class DiRegistration
{
    public static void RegisterByConvention(Microsoft.Extensions.DependencyInjection.IServiceCollection services, params string[] assemblyNames)
    {
        var assemblies = assemblyNames
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(Assembly.Load)
            .ToArray();
 
        var allTypes = assemblies.SelectMany(a =>
        {
            try { return a.GetTypes(); }
            catch (ReflectionTypeLoadException rtle) { return rtle.Types.Where(t => t != null)!; }
        }).Where(t => t != null).Cast<Type>();
 
        var implementations = allTypes
            .Where(t => t.IsClass && !t.IsAbstract);
 
        foreach (var impl in implementations)
        {
            bool isCandidate =
                impl.Name.EndsWith("Service", StringComparison.Ordinal) ||
                impl.Name.EndsWith("Repository", StringComparison.Ordinal);
 
            if (!isCandidate) continue;
 
            var serviceInterfaces = impl.GetInterfaces()
                .Where(i =>
                    i.Name.EndsWith("Service", StringComparison.Ordinal) ||
                    i.Name.EndsWith("Repository", StringComparison.Ordinal));
 
            foreach (var itf in serviceInterfaces)
            {
                services.AddScoped(itf, impl);
            }
        }
    }
}
 
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System.Security.Claims;
using System.Text;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Data.DBContexts;
using System.IdentityModel.Tokens.Jwt;
using Serilog;
using Relevantz.EEPZ.Data.Repository;
using Relevantz.EEPZ.Core.Services;
 
// ✅ Added for health checks & exception handling
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Diagnostics;
using System.Linq;
 
var builder = WebApplication.CreateBuilder(args);
 
var sharedUploadsPath = Path.GetFullPath(Path.Combine(
    Directory.GetCurrentDirectory(),
    "..", "..",
    "SharedUploads"
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
 
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();
 
builder.Host.UseSerilog();
 
Log.Information("Starting EEPZ Performance Management Application...");
Log.Information("Shared Uploads Path: {Path}", sharedUploadsPath);
 
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
        Description = "Enter 'Bearer' followed by your JWT token"
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
 
    options.CustomSchemaIds(type => type.FullName.Replace("+", "."));
});
 
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
 
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
 
Log.Information("JWT Issuer: {Issuer}", jwtSettings["Issuer"]);
Log.Information("JWT Audience: {Audience}", jwtSettings["Audience"]);
Log.Information("JWT SecretKey Length: {Length} characters", secretKey.Length);
 
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
        OnMessageReceived = context =>
        {
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader))
            {
                var token = authHeader.Replace("Bearer ", "");
                Log.Debug("Token received (first 30 chars): {Token}...", token.Substring(0, Math.Min(30, token.Length)));
            }
            else
            {
                Log.Warning("No Authorization header found");
            }
            return Task.CompletedTask;
        },
 
        OnAuthenticationFailed = context =>
        {
            Log.Error("Authentication failed: {Message}", context.Exception.Message);
 
            if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
            {
                Log.Warning("Token expired");
                context.Response.Headers.Add("Token-Expired", "true");
            }
            else if (context.Exception.Message.Contains("signature"))
            {
                Log.Error("Signature validation failed - Check JWT SecretKey!");
            }
 
            return Task.CompletedTask;
        },
 
        OnTokenValidated = context =>
        {
            Log.Information("Token validated successfully");
 
            var claims = context.Principal?.Claims.Select(c => $"{c.Type}={c.Value}");
            Log.Debug("All Claims: {Claims}", string.Join(" | ", claims ?? new List<string>()));
 
            var roleClaim = context.Principal?.FindFirst(ClaimTypes.Role);
 
            if (roleClaim != null)
            {
                Log.Information("Role found: {Role}", roleClaim.Value);
            }
            else
            {
                Log.Warning("No role claim found in token");
            }
 
            return Task.CompletedTask;
        },
 
        OnChallenge = context =>
        {
            Log.Warning("Authentication Challenge: {Error} - {ErrorDescription}", context.Error, context.ErrorDescription);
            return Task.CompletedTask;
        }
    };
});
 
builder.Services.AddAuthorization();
 
builder.Services.AddScoped<IHRNominationRepository, HRNominationRepository>();
builder.Services.AddScoped<IHRNominationService, HRNominationService>();
builder.Services.AddScoped<IManagerNominationRepository, ManagerNominationRepository>();
builder.Services.AddScoped<IManagerNominationService, ManagerNominationService>();
builder.Services.AddScoped<IEmployeeNominationRepository, EmployeeNominationRepository>();
builder.Services.AddScoped<IEmployeeNominationService, EmployeeNominationService>();
 
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("Content-Disposition", "Content-Type");
    });
});
 
/* ===========================
   Health Checks (DI-based)
   =========================== */
builder.Services.AddHealthChecks()
    // Liveness: no dependencies
    .AddCheck("self", () => HealthCheckResult.Healthy("App is running"), tags: new[] { "live" })
    // Readiness: MySQL via EF Core DbContext
    .AddCheck<MySqlDbHealthCheck>("mysql-db", tags: new[] { "ready", "db", "mysql" });
 
var app = builder.Build();
 
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ Performance API v1");
        c.RoutePrefix = string.Empty;
    });
}
 
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
    };
});
 
/* ===========================
   Global Exception Handling
   =========================== */
if (app.Environment.IsDevelopment())
{
    // Detailed exception page for local debugging
    app.UseDeveloperExceptionPage();
}
 
// Catch-all handler that returns JSON for unhandled exceptions
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.ContentType = "application/json";
        var statusCode = StatusCodes.Status500InternalServerError;
        context.Response.StatusCode = statusCode;
 
        var exceptionFeature = context.Features.Get<IExceptionHandlerFeature>();
        var error = exceptionFeature?.Error;
 
        var correlationId = context.TraceIdentifier;
        var path = context.Request.Path.Value;
        var method = context.Request.Method;
 
        if (error != null)
        {
            Log.Error(error,
                "Unhandled exception caught by Global Handler | {Method} {Path} | CorrelationId={CorrelationId}",
                method, path, correlationId);
        }
        else
        {
            Log.Error("Global handler invoked without exception | {Method} {Path} | CorrelationId={CorrelationId}",
                method, path, correlationId);
        }
 
        var response = new
        {
            success = false,
            message = app.Environment.IsDevelopment()
                ? (error?.Message ?? "An error occurred.")
                : "An internal server error occurred.",
            correlationId,
            path,
            method,
            timestamp = DateTime.UtcNow,
            statusCode
        };
 
        await context.Response.WriteAsJsonAsync(response);
    });
});
 
// Optional: return JSON for non-exception 4xx/5xx results too
app.UseStatusCodePages(async statusContext =>
{
    if (statusContext.HttpContext.Response.ContentType?.Contains("application/json") == true)
        return;
 
    var ctx = statusContext.HttpContext;
    var payload = new
    {
        success = false,
        message = "A non-success status code was returned.",
        statusCode = ctx.Response.StatusCode,
        path = ctx.Request.Path.Value,
        method = ctx.Request.Method,
        timestamp = DateTime.UtcNow,
        correlationId = ctx.TraceIdentifier
    };
 
    ctx.Response.ContentType = "application/json";
    await ctx.Response.WriteAsJsonAsync(payload);
});
 
app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
 
app.MapControllers();
 
/* ===========================
   Health Endpoints
   =========================== */
 
// Liveness — runs only the "self" check, no dependencies
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
 
// Readiness — runs only checks tagged "ready" (DB, etc.)
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
 
public class FileUploadSettings
{
    public string UploadPath { get; set; } = string.Empty;
}
 
/* =========================================================
   DI-based Health Check (kept in THIS file, no new files)
   =========================================================*/
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
            // time-box to keep readiness fast
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
 
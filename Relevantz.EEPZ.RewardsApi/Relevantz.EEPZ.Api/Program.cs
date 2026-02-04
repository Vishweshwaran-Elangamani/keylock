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
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Diagnostics;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Service;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Prometheus;

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
builder.Services.AddScoped<DbContext>(sp => sp.GetRequiredService<EEPZDbContext>());


var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");

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

    // Safe logging (no tokens/headers)
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

builder.Services.AddScoped<IHRNominationRepository, HRNominationRepository>();
builder.Services.AddScoped<IHRNominationService, HRNominationService>();

builder.Services.AddScoped<IManagerNominationRepository, ManagerNominationRepository>();
builder.Services.AddScoped<IManagerNominationService, ManagerNominationService>();

builder.Services.AddScoped<IEmployeeNominationRepository, EmployeeNominationRepository>();
builder.Services.AddScoped<IEmployeeNominationService, EmployeeNominationService>();

builder.Services.AddScoped<IDepartmentHeadNominationRepository, DepartmentHeadNominationRepository>();
builder.Services.AddScoped<IDepartmentHeadNominationService, DepartmentHeadNominationService>();


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


builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("App is running"), tags: new[] { "live" })
    .AddCheck<MySqlDbHealthCheck>("mysql-db", tags: new[] { "ready", "db", "mysql" });

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


builder.Services.AddTransient<Relevantz.EEPZ.Api.Middleware.ExceptionHandlingMiddleware>();


var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    // ADDED: HSTS for production
    app.UseHsts();
}


// SECURITY HEADERS 

app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Remove("Server");
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    ctx.Response.Headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()";

    var isSwagger = ctx.Request.Path.StartsWithSegments("/swagger") || string.Equals(ctx.Request.Path, "/");
    if (!isSwagger)
    {
        ctx.Response.Headers["Content-Security-Policy"] =
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";
    }

    await next();
});

app.UseRateLimiter();


app.UseHttpMetrics();
app.MapMetrics("/metrics");


app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ Performance API v1");
        c.RoutePrefix = string.Empty;
    });
}


app.UseMiddleware<Relevantz.EEPZ.Api.Middleware.ExceptionHandlingMiddleware>();


app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();


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

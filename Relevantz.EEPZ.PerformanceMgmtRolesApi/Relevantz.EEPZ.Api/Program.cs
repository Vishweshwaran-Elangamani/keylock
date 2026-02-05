
using FluentValidation;
using FluentValidation.AspNetCore;

using Relevantz.EEPZ.Common.Validators;

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
using PerformanceManagement.Middleware; 

var builder = WebApplication.CreateBuilder(args);

// -----------------------------------------------
// Shared uploads folder
// -----------------------------------------------
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

// -----------------------------------------------
// Serilog
// -----------------------------------------------
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

Log.Information("Starting EEPZ Performance Management Application...");
Log.Information("Shared Uploads Path: {Path}", sharedUploadsPath);

// -----------------------------------------------
// MVC / Swagger
// -----------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers();

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();

builder.Services.AddValidatorsFromAssemblyContaining<SubmitReviewDtoValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<AcknowledgeRequestDtoValidator>();


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

    options.CustomSchemaIds(type => type.FullName!.Replace("+", "."));
});

// -----------------------------------------------
// EF Core
// -----------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// -----------------------------------------------
// JWT Authentication
// -----------------------------------------------
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");

Log.Information("JWT Issuer: {Issuer}", jwtSettings["Issuer"]);
Log.Information("JWT Audience: {Audience}", jwtSettings["Audience"]);
Log.Information("JWT SecretKey Length: {Length} characters", secretKey.Length);

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

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
        NameClaimType = ClaimTypes.NameIdentifier
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var token = authHeader.Substring("Bearer ".Length).Trim();
                Log.Debug("Token received (length): {Length}", token.Length);
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

            if (context.Exception is SecurityTokenExpiredException)
            {
                Log.Warning("Token expired");
                context.Response.Headers.Add("Token-Expired", "true");
            }
            else if (context.Exception.Message.Contains("signature", StringComparison.OrdinalIgnoreCase))
            {
                Log.Error("Signature validation failed - Check JWT SecretKey!");
            }

            return Task.CompletedTask;
        },

        OnTokenValidated = context =>
        {
            Log.Information("Token validated successfully");

            var principal = context.Principal;
            if (principal is not null)
            {
                var nameId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var sub = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (string.IsNullOrEmpty(nameId) && !string.IsNullOrEmpty(sub))
                {
                    var identity = principal.Identity as ClaimsIdentity;
                    identity?.AddClaim(new Claim(ClaimTypes.NameIdentifier, sub));
                    Log.Debug("Added NameIdentifier claim from 'sub'");
                }

                var roleClaim = principal.FindFirst(ClaimTypes.Role);
                if (roleClaim != null)
                {
                    Log.Information("Role found: {Role}", roleClaim.Value);
                }
                else
                {
                    Log.Warning("No role claim found in token");
                }
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

// -----------------------------------------------
// DI Registrations (deduplicated)
// -----------------------------------------------
builder.Services.AddScoped<IApproverRepository, ApproverRepository>();
builder.Services.AddScoped<IApproverService, ApproverService>();

builder.Services.AddScoped<IReviewerRepository, ReviewerRepository>();
builder.Services.AddScoped<IReviewerService, ReviewerService>();

builder.Services.AddScoped<IDeptHeadApprovalsRepository, DeptHeadApprovalsRepository>();
builder.Services.AddScoped<IDeptHeadApprovalsService, DeptHeadApprovalsService>();

builder.Services.AddScoped<IEmployeesRepository, EmployeesRepository>();
builder.Services.AddScoped<IEmployeesService, EmployeesService>();
builder.Services.AddValidatorsFromAssemblyContaining<SubmitReviewDtoValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<AcknowledgeRequestDtoValidator>();

// -----------------------------------------------
// CORS
// -----------------------------------------------
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

var app = builder.Build();

// -----------------------------------------------
// Pipeline
// -----------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ Performance API v1");
        c.RoutePrefix = string.Empty;
    });
}

// Serilog request logging
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
    };
});

app.UseGlobalExceptionHandling();

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

try
{
    Log.Information("EEPZ Performance Management API started successfully on port 5222");
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

// -----------------------------------------------
// Support class
// -----------------------------------------------
public class FileUploadSettings
{
    public string UploadPath { get; set; } = string.Empty;
}
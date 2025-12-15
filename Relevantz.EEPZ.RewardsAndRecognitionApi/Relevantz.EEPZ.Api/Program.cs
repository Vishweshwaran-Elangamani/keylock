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

var builder = WebApplication.CreateBuilder(args);

// ============ SHARED UPLOADS PATH CONFIGURATION ============
var sharedUploadsPath = Path.GetFullPath(Path.Combine(
    Directory.GetCurrentDirectory(), 
    "..", "..", 
    "SharedUploads"
));

// Ensure shared directory exists
if (!Directory.Exists(sharedUploadsPath))
{
    Directory.CreateDirectory(sharedUploadsPath);
    Console.WriteLine($"Created shared uploads directory at: {sharedUploadsPath}");
}
else
{
    Console.WriteLine($"Shared uploads directory exists at: {sharedUploadsPath}");
}

// Register shared path as singleton for DI
builder.Services.AddSingleton(new FileUploadSettings { UploadPath = sharedUploadsPath });

// ============ SERILOG CONFIGURATION ============
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

Log.Information("Starting EEPZ Performance Management Application...");
Log.Information("Shared Uploads Path: {Path}", sharedUploadsPath);

// ============ CORE SERVICES ============
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ============ SWAGGER CONFIGURATION ============
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

// ============ DATABASE CONFIGURATION ============
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// ============ JWT AUTHENTICATION ============
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

// ============ DEPENDENCY INJECTION ============
// builder.Services.AddScoped<IFormManagementService, FormManagementService>();
// builder.Services.AddScoped<IAppraisalProcessService, AppraisalProcessService>();
// builder.Services.AddScoped<ISelfAssessmentService, SelfAssessmentService>();
// builder.Services.AddScoped<IManagerReviewRepository, ManagerReviewRepository>();
// builder.Services.AddScoped<ILeadershipRepository, LeadershipRepository>();
// builder.Services.AddScoped<ILeadershipService, LeadershipService>();

// Add this line in your Program.cs where other services are registered
builder.Services.AddScoped<IAppraisalProcessService, AppraisalProcessService>();


// ============ CORS CONFIGURATION ============
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

// ============ BUILD APPLICATION ============
var app = builder.Build();

// ============ HTTP REQUEST PIPELINE ============
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
app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
try
{
    Log.Information("EEPZ Performance Management API started successfully on port 5113");
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

// Simple settings class
public class FileUploadSettings
{
    public string UploadPath { get; set; } = string.Empty;
}

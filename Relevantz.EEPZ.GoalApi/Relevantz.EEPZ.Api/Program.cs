global using Serilog;
global using Serilog.Events;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Data.Repository.Interface;

// CRITICAL: Clear JWT claim type mappings BEFORE building
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
JwtSecurityTokenHandler.DefaultOutboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);
Console.WriteLine("Building........");

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Log application starting
Log.Information("Starting EEPZ Backend Application");

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with JWT support
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "EEPZ API",
            Version = "v1",
            Description = "Goal API",
        }
    );

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter 'Bearer' followed by your JWT token",
        }
    );

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer",
                    },
                },
                Array.Empty<string>()
            },
        }
    );
});

// Configure MySQL Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

// UPDATED: Configure JWT Authentication with debugging
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

if (string.IsNullOrEmpty(secretKey))
{
    throw new InvalidOperationException("JWT SecretKey is not configured in appsettings.json");
}

builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme; // ADD THIS
    })
    .AddJwtBearer(options =>
    {
        var keyBytes = Encoding.UTF8.GetBytes(secretKey);

        options.SaveToken = true; // ADD THIS
        options.RequireHttpsMetadata = false; // Set to true in production

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),

            ClockSkew = TimeSpan.Zero,

            // FIX: Use the full claim type
            RoleClaimType = ClaimTypes.Role, // Instead of "role"
            NameClaimType = "sub",
        };

        // ADD: Event handlers for debugging
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Log.Error("❌ JWT Authentication Failed: {Message}", context.Exception.Message);
                if (context.Exception.InnerException != null)
                {
                    Log.Error(
                        "   Inner Exception: {Message}",
                        context.Exception.InnerException.Message
                    );
                }
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                var claims =
                    context.Principal?.Claims.Select(c => $"{c.Type}={c.Value}").ToList()
                    ?? new List<string>();

                Log.Information("JWT Token Validated Successfully");
                Log.Information("   Claims: {Claims}", string.Join(", ", claims));

                var empMasterIdClaim = context.Principal?.FindFirst("empMasterId");

                // FIX: Use ClaimTypes.Role instead of "role"
                var roleClaim = context.Principal?.FindFirst(ClaimTypes.Role); // ← CHANGED

                if (empMasterIdClaim == null)
                {
                    Log.Warning("⚠ WARNING: empMasterId claim not found!");
                }
                else
                {
                    Log.Information("   empMasterId: {EmpMasterId}", empMasterIdClaim.Value);
                }

                if (roleClaim == null)
                {
                    Log.Warning("⚠ WARNING: role claim not found!");
                }
                else
                {
                    Log.Information("   role: {Role}", roleClaim.Value);
                }

                return Task.CompletedTask;
            },

            OnChallenge = context =>
            {
                Log.Warning(
                    "❌ JWT Challenge: {Error}, {ErrorDescription}",
                    context.Error,
                    context.ErrorDescription
                );
                return Task.CompletedTask;
            },
            OnMessageReceived = context =>
            {
                var token = context
                    .Request.Headers["Authorization"]
                    .FirstOrDefault()
                    ?.Split(" ")
                    .Last();
                if (!string.IsNullOrEmpty(token))
                {
                    Log.Information(
                        "📨 JWT Token Received (first 20 chars): {Token}...",
                        token.Substring(0, Math.Min(20, token.Length))
                    );
                }
                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();

// Register module DI (Goal Management)
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IBaseGoalRepository, BaseGoalRepository>();
builder.Services.AddScoped<IGoalApprovalsRepository, GoalApprovalsRepository>();
builder.Services.AddScoped<IGoalAttachmentRepository, GoalAttachmentRepository>();
builder.Services.AddScoped<IGoalInteractionRepository, GoalInteractionRepository>();
builder.Services.AddScoped<IGoalProgressRepository, GoalProgressRepository>();
builder.Services.AddScoped<IGoalRepository, GoalRepository>();

builder.Services.AddScoped<IBaseGoalService, BaseGoalService>();
builder.Services.AddScoped<IGoalApprovalsService, GoalApprovalsService>();
builder.Services.AddScoped<IGoalAttachmentService, GoalAttachmentService>();
builder.Services.AddScoped<IGoalInteractionService, GoalInteractionService>();
builder.Services.AddScoped<IGoalProgressService, GoalProgressService>();
builder.Services.AddScoped<IGoalService, GoalService>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        }
    );
});

var app = builder.Build();

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ API v1");
    });
}

// Enable Serilog request logging
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate =
        "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.GetLevel = (httpContext, elapsed, ex) => LogEventLevel.Information;
});

app.UseHttpsRedirection();
app.UseStaticFiles();

// CRITICAL: Order matters!
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Log configuration details
Log.Information("🚀 Application Configuration:");
Log.Information("   Environment: {Environment}", app.Environment.EnvironmentName);
Log.Information("   JWT Issuer: {Issuer}", jwtSettings["Issuer"]);
Log.Information("   JWT Audience: {Audience}", jwtSettings["Audience"]);
Log.Information(
    "   Database: {Database}",
    connectionString?.Split(';').FirstOrDefault(x => x.Contains("Database"))
);

try
{
    Log.Information("Application started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "❌ Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

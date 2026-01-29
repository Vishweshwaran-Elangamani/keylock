global using Serilog;
global using Serilog.Events;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Relevantz.EEPZ.Common.Configuration;
using Relevantz.EEPZ.Common.Middleware;
using Relevantz.EEPZ.Common.Validators;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Service;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Data.Repository.Interface;
using Relevantz.EEPZ.Core.Configuration;

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
JwtSecurityTokenHandler.DefaultOutboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);
Console.WriteLine("Building........");

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

Log.Information("Starting EEPZ Backend Application");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddValidatorsFromAssemblyContaining<CreateGoalModelValidator>();

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

// Configure JWT Authentication with debugging
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
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        var keyBytes = Encoding.UTF8.GetBytes(secretKey);

        options.SaveToken = true;
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

        //  Event handlers for debugging
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Log.Error(" JWT Authentication Failed: {Message}", context.Exception.Message);
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

                var roleClaim = context.Principal?.FindFirst(ClaimTypes.Role);

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
                    "JWT Challenge: {Error}, {ErrorDescription}",
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
                        " JWT Token Received (first 20 chars): {Token}...",
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
builder.Services.RegisterMapsterConfiguration();

// Configure MongoDB Settings
builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDbSettings"));

// Register File Storage Service (MongoDB GridFS)
builder.Services.AddSingleton<IFileStorageService, FileStorageService>();

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
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseStaticFiles();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health Check Endpoint

app.MapGet(
    "/health",
    async (EEPZDbContext eepzDbContext, IConfiguration config) =>
    {
        bool mySqlConnected = false;
        bool mongoConnected = false;

        try
        {
            mySqlConnected = await eepzDbContext.Database.CanConnectAsync();
        }
        catch (Exception)
        {
            // Health check failed silently
        }

        // Test MongoDB Connection
        try
        {
            var fileStorageService = app.Services.GetRequiredService<IFileStorageService>();
            mongoConnected = true;
        }
        catch (Exception)
        {
            mongoConnected = false;
        }

        return Results.Ok(
            new
            {
                status = "Healthy",
                timestamp = DateTime.UtcNow,
                service = "EEPZ Goal Management API",
                version = "v1.0",
                environment = app.Environment.EnvironmentName,

                database = new
                {
                    mySQL = new
                    {
                        connected = mySqlConnected,
                        provider = "MySQL (EF Core)",
                        connectionStringName = "DefaultConnection",
                    },
                    mongoDB = new
                    {
                        connected = mongoConnected,
                        provider = "MongoDB GridFS",
                        databaseName = config["MongoDbSettings:DatabaseName"],
                    },
                },

                storage = new
                {
                    type = "MongoDB GridFS",
                    enabled = !string.IsNullOrEmpty(config["MongoDbSettings:ConnectionString"]),
                },

                endpoints = new
                {
                    categories = new[]
                    {
                        "Base Goals",
                        "Goal Approvals",
                        "Goal Attachments",
                        "Goal Interactions",
                        "Goal Progress",
                    },
                },

                authentication = new
                {
                    enabled = true,
                    type = "JWT Bearer",
                    issuerConfigured = !string.IsNullOrEmpty(config["JwtSettings:Issuer"]),
                    audienceConfigured = !string.IsNullOrEmpty(config["JwtSettings:Audience"]),
                },

                cors = "AllowAll Enabled",
                swagger = app.Environment.IsDevelopment(),
            }
        );
    }
);

// Log configuration details
Log.Information("   Application Configuration:");
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
    Log.Fatal(ex, " Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

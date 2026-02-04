using FluentValidation;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Serilog;

using Relevantz.EEPZ.Common.Configuration;
using Relevantz.EEPZ.Data.DBContexts;

// Repository interfaces & implementations
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Data.Repository.Implementations;

// Service interfaces & implementations
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Core.Services.Implementations;

// File storage
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Service;

using Relevantz.EEPZ.Common.Validators;
using FluentValidation.AspNetCore;


var builder = WebApplication.CreateBuilder(args);

// ==========================================================================
// FILE UPLOAD DIRECTORY
// ==========================================================================
var sharedUploadsPath = Path.Combine(builder.Environment.ContentRootPath, "SharedUploads");

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

// ==========================================================================
// SERILOG CONFIGURATION (DATE IN FILENAME ADDED AS REQUESTED)
// ==========================================================================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.File(
        path: $"Logs/log-{DateTime.Now:yyyy-MM-dd}.txt",   // <--- DATE INCLUDED IN FILENAME
        rollingInterval: RollingInterval.Infinite,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}"
    )
    .CreateLogger();

builder.Host.UseSerilog();

Log.Information("Starting EEPZ Performance Management Application...");
Log.Information("Shared Uploads Path: {Path}", sharedUploadsPath);

// ==========================================================================
// CONTROLLERS + SWAGGER
// ==========================================================================
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
        Description = "Enter 'Bearer <token>'"
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

    options.CustomSchemaIds(t => t.FullName.Replace("+", "."));
});

// ==========================================================================
// DATABASE
// ==========================================================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// ==========================================================================
// JWT AUTHENTICATION SETUP
// ==========================================================================
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new Exception("JWT SecretKey missing");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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

                if (token.Length >= 4)
                    Log.Debug("Token received (...{Last4})", token[^4..]);
                else
                    Log.Debug("Token received (too short to log)");
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
                context.Response.Headers.Add("Token-Expired", "true");

            return Task.CompletedTask;
        },

        OnTokenValidated = context =>
        {
            Log.Information("Token validated successfully");

            var roleClaim = context.Principal?.FindFirst(ClaimTypes.Role);
            if (roleClaim != null)
                Log.Information("Role found: {Role}", roleClaim.Value);
            else
                Log.Warning("No role claim found");

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ==========================================================================
// DEPENDENCY INJECTION
// ==========================================================================

// Repositories
builder.Services.AddScoped<IAssessmentDetailsRepository, AssessmentDetailsRepository>();
builder.Services.AddScoped<IAssignmentsRepository, AssignmentsRepository>();
builder.Services.AddScoped<IFormManagementRepository, FormManagementRepository>();
builder.Services.AddScoped<IFormProgressTrackerRepository, FormProgressTrackerRepository>();
builder.Services.AddScoped<ISelfAssessmentRepository, SelfAssessmentRepository>();

// Services
builder.Services.AddScoped<IAssessmentDetailsService, AssessmentDetailsService>();
builder.Services.AddScoped<IAssignmentsService, AssignmentsService>();
builder.Services.AddScoped<IFormManagementService, FormManagementService>();
builder.Services.AddScoped<IFormProgressTrackerService, FormProgressTrackerService>();
builder.Services.AddScoped<ISelfAssessmentService, SelfAssessmentService>();

// File storage (MongoDB)
builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDbSettings"));
builder.Services.AddSingleton<IFileStorageService, FileStorageService>();

builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();

builder.Services.AddValidatorsFromAssemblyContaining<InitiateAppraisalRequestDtoValidator>();

builder.Services.AddValidatorsFromAssemblyContaining<CreateFormRequestDtoValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<SubmitSelfAssessmentRequestDtoValidator>();


// ==========================================================================
// CORS
// ==========================================================================
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

// ==========================================================================
// BUILD & RUN APP
// ==========================================================================
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ API v1");
        c.RoutePrefix = "";
    });
}

app.UseSerilogRequestLogging();

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

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

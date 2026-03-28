
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
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    // ✅ Keycloak realm (JWKS auto-loaded)
    options.Authority =
        "https://unprotractive-elmo-estipulate.ngrok-free.dev/realms/eepz-realm";

    options.RequireHttpsMetadata = true;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        // ✅ same setup used in all your other services
        ValidateIssuer = false,
        ValidateAudience = false,

        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,

        // ✅ Must match Keycloak access token
        NameClaimType = "preferred_username",
        RoleClaimType = "role"
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
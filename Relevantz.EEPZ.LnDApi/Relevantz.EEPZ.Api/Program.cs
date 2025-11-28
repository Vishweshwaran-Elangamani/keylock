using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Relevantz.EEPZ.Data;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;
using System.Text;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Relevantz.EEPZ.Data.Repositories.Implementations;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Core.Services.Implementations;
var builder = WebApplication.CreateBuilder(args);
Console.WriteLine("Building EEPZ Backend........");

// ===================================
// Configure Serilog for Logging
// ===================================
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("Logs/eepz-log-.txt",
        rollingInterval: RollingInterval.Day,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Warning)
    .CreateLogger();

builder.Host.UseSerilog();

// ===================================
// Add Services to Container
// ===================================

// Add Controllers with JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();

// ===================================
// Configure Swagger with JWT Support
// ===================================
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EEPZ  API",
        Version = "v1",
        Description = "LnD API",
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your valid JWT token.\n\nExample: \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\""
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
});

// ===================================
// Configure MySQL Database
// ===================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    Log.Fatal("Database connection string is not configured!");
    throw new InvalidOperationException("Database connection string 'DefaultConnection' not found.");
}

// Register EEPZDbContext (the main context used by LnDService)
builder.Services.AddDbContext<EEPZDbContext>(options =>
{
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString),
        mysqlOptions =>
        {
            mysqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
            mysqlOptions.CommandTimeout(60);
        }
    );

    // Enable sensitive data logging only in development
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Register EEPZDbContext (for legacy/backward compatibility)
builder.Services.AddDbContext<EEPZDbContext>(options =>
{
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString),
        mysqlOptions =>
        {
            mysqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
            mysqlOptions.CommandTimeout(60);
        }
    );

    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});  

// ===================================
// Configure JWT Authentication
// ===================================
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

if (string.IsNullOrEmpty(secretKey))
{
    Log.Fatal("JWT SecretKey is not configured!");
    throw new InvalidOperationException("JWT SecretKey not found in configuration.");
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
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Log.Warning($"JWT Authentication failed: {context.Exception.Message}");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var empId = context.Principal?.FindFirst("empId")?.Value;
            Log.Information($"JWT Token validated for EmployeeId: {empId}");
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            Log.Warning($"JWT Challenge: {context.Error}, {context.ErrorDescription}");
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ===================================
// Register Application Services (DI)
// ===================================

// File Storage Service
builder.Services.AddScoped<IFileStorageService, FileStorageService>();


builder.Services.AddScoped<ILnDRepository, LnDRepository>();

// Existing service registration
builder.Services.AddScoped<ILnDService, LnDService>();


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });

    // Production CORS policy (more restrictive)
    options.AddPolicy("Production", policy =>
    {
        policy.WithOrigins(
                "https://yourdomain.com",
                "https://www.yourdomain.com"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// ===================================
// Add HTTP Client
// ===================================
builder.Services.AddHttpClient();

// ===================================
// Configure Session (if needed)
// ===================================
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});

// ===================================
// Add Memory Cache
// ===================================
builder.Services.AddMemoryCache();

// ===================================
// Build Application
// ===================================
var app = builder.Build();

Log.Information("EEPZ Backend Application Starting...");

// ===================================
// Configure HTTP Request Pipeline
// ===================================

// Enable CORS
app.UseCors("AllowAll");

// Enable Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ Learning and Development API v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "EEPZ Learning and Development API Documentation";
    });

    Log.Information("Swagger UI enabled at: /swagger");
}
else
{
    // Enable Swagger in Production (optional - remove if not needed)
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ API v1");
        c.RoutePrefix = "swagger";
    });
}

// Enable Serilog Request Logging
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
    };
});

// HTTPS Redirection
app.UseHttpsRedirection();

// Static Files for File Storage (wwwroot folder)
app.UseStaticFiles(new StaticFileOptions
{
    ServeUnknownFileTypes = false,
    OnPrepareResponse = ctx =>
    {
        // Add security headers for static files
        ctx.Context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    }
});

// Enable Session
app.UseSession();

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map Controllers
app.MapControllers();

// ===================================
// Global Exception Handler
// ===================================
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";

        var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var exception = exceptionHandlerPathFeature?.Error;

        Log.Error(exception, "Unhandled exception occurred: {Message}", exception?.Message);

        var response = new
        {
            success = false,
            message = "An internal server error occurred. Please try again later.",
            error = app.Environment.IsDevelopment() ? exception?.Message : null,
            stackTrace = app.Environment.IsDevelopment() ? exception?.StackTrace : null
        };

        await context.Response.WriteAsJsonAsync(response);
    });
});

// ===================================
// Database Migration and Initialization
// ===================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        var EEPZDbContext = services.GetRequiredService<EEPZDbContext>();

        // Ensure database connection is working
        if (EEPZDbContext.Database.CanConnect())
        {
            Log.Information("EEPZDbContext - Database connection established successfully.");
        }
        else
        {
            Log.Error("EEPZDbContext - Failed to connect to the database!");
        }

        // Also check EEPZDbContext
        try
        {
            var appDbContext = services.GetRequiredService<EEPZDbContext>();
            if (appDbContext.Database.CanConnect())
            {
                Log.Information("EEPZDbContext - Database connection established successfully.");
            }
        }
        catch (Exception ex)
        {
            Log.Warning($"EEPZDbContext connection check skipped: {ex.Message}");
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred while migrating the database: {Message}", ex.Message);

        if (app.Environment.IsDevelopment())
        {
            throw; // Re-throw in development to see the full error
        }
    }
}

// ===================================
// Create Required Directories
// ===================================
try
{
    var webRootPath = app.Environment.WebRootPath;

    if (!string.IsNullOrEmpty(webRootPath))
    {
        var uploadsPath = Path.Combine(webRootPath, "uploads");
        var smeProofsPath = Path.Combine(uploadsPath, "sme-proofs");
        var completionProofsPath = Path.Combine(uploadsPath, "completion-proofs");

        Directory.CreateDirectory(smeProofsPath);
        Directory.CreateDirectory(completionProofsPath);

        Log.Information("File upload directories created successfully.");
        Log.Information($"SME Proofs: {smeProofsPath}");
        Log.Information($"Completion Proofs: {completionProofsPath}");
    }
    else
    {
        Log.Warning("WebRootPath is null. Static files may not work correctly.");
    }
}
catch (Exception ex)
{
    Log.Error(ex, "Failed to create upload directories: {Message}", ex.Message);
}

// ===================================
// Application Startup
// ===================================
try
{
    Log.Information("========================================");
    Log.Information("EEPZ Backend Application Started Successfully");
    Log.Information($"Environment: {app.Environment.EnvironmentName}");
    Log.Information($"Content Root: {app.Environment.ContentRootPath}");
    Log.Information($"Web Root: {app.Environment.WebRootPath}");
    Log.Information($"Swagger UI: {(app.Environment.IsDevelopment() ? "https://localhost:5001/swagger" : "Available at /swagger")}");
    Log.Information("========================================");

    app.Run();

    Log.Information("EEPZ Backend Application Stopped Gracefully");
}
catch (Exception ex)
{
    Log.Fatal(ex, "EEPZ Backend Application Terminated Unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

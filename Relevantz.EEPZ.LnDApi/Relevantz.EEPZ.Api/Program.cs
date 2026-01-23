using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Relevantz.EEPZ.Common.Configuration;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Implementations;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Relevantz.EEPZ.Api.Middleware;
using FluentValidation;
using FluentValidation.AspNetCore; 
using Relevantz.EEPZ.Common.Validators; 
using Serilog;



var builder = WebApplication.CreateBuilder(args);
Console.WriteLine("Building EEPZ Backend........");


// Configure Serilog for Logging

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File(
        "Logs/eepz-log-.txt",
        rollingInterval: RollingInterval.Day,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}"
    )
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Warning)
    .CreateLogger();



builder.Host.UseSerilog();

// Add Services to Container
// Add Controllers with JSON Options
builder
    .Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System
            .Text
            .Json
            .Serialization
            .ReferenceHandler
            .IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System
            .Text
            .Json
            .Serialization
            .JsonIgnoreCondition
            .WhenWritingNull;
        options.JsonSerializerOptions.PropertyNamingPolicy = System
            .Text
            .Json
            .JsonNamingPolicy
            .CamelCase;
    }).AddFluentValidation(fv => fv.RegisterValidatorsFromAssemblyContaining<Relevantz.EEPZ.Common.Validators.ApprovalDecisionRequestModelValidator>());




builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with JWT Support

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "EEPZ  API",
            Version = "v1",
            Description = "LnD API",
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
            Description =
                "Enter 'Bearer' [space] and then your valid JWT token.\n\nExample: \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\"",
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

if (string.IsNullOrEmpty(connectionString))
{
    Log.Fatal("Database connection string is not configured!");
    throw new InvalidOperationException(
        "Database connection string 'DefaultConnection' not found."
    );
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
                errorNumbersToAdd: null
            );
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

// Configure MongoDB Settings

builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));


// Validate MongoDB Configuration  
var mongoConfig = builder.Configuration.GetSection("MongoDbSettings");
var mongoConnectionString = mongoConfig["ConnectionString"];
var mongoDatabaseName = mongoConfig["DatabaseName"];

if (string.IsNullOrEmpty(mongoConnectionString))
{
    Log.Warning("MongoDB connection string is not configured. File storage will not work!");
}
else
{
    Log.Information($"MongoDB configured - Database: {mongoDatabaseName}");
}

// Configure JWT Authentication

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

if (string.IsNullOrEmpty(secretKey))
{
    Log.Fatal("JWT SecretKey is not configured!");
    throw new InvalidOperationException("JWT SecretKey not found in configuration.");
}

builder
    .Services.AddAuthentication(options =>
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
            },
        };
    });


builder.Services.AddAuthorization();


// Register Application Services (DI)
// File Storage Service - MongoDB GridFS

builder.Services.AddSingleton<IFileStorageService, FileStorageService>();
Log.Information("File Storage Service registered with MongoDB GridFS");



// LnD Module - Complete Registration
// LnD Repositories
builder.Services.AddScoped<ILnDEmployeeSkillRepository, LnDEmployeeSkillRepository>();
builder.Services.AddScoped<ILnDSmeRepository, LnDSmeRepository>();
builder.Services.AddScoped<ILnDAssignmentRepository, LnDAssignmentRepository>();
builder.Services.AddScoped<ILnDApprovalRepository, LnDApprovalRepository>();
builder.Services.AddScoped<ILnDHRRepository, LnDHRRepository>();
builder.Services.AddScoped<ILnDBaseRepository, LnDBaseRepository>();



// LnD Services
builder.Services.AddScoped<ILnDEmployeeSkillService, LnDEmployeeSkillService>();
builder.Services.AddScoped<ILnDSmeService, LnDSmeService>();
builder.Services.AddScoped<ILnDAssignmentService, LnDAssignmentService>();
builder.Services.AddScoped<ILnDApprovalService, LnDApprovalService>();
builder.Services.AddScoped<ILnDHRService, LnDHRService>();


// File Migration Service (Optional - for migrating existing files)
// builder.Services.AddScoped<FileStorageMigrationService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        }
    );
    options.AddPolicy(
        "Production",
        policy =>
        {
            policy
                .WithOrigins(
                    "https://yourdomain.com",
                    "https://www.yourdomain.com",
                    "http://localhost:3007"
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
    );
});




// Add HTTP Client

builder.Services.AddHttpClient();



// Configure Session (if needed)

builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});




// Add Memory Cache

builder.Services.AddMemoryCache();



// Build Application

var app = builder.Build();


Log.Information("EEPZ Backend Application Starting...");



// Configure HTTP Request Pipeline
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
    // Enable Swagger in Production 
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
    options.MessageTemplate =
        "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
    };
});



// HTTPS Redirection
app.UseHttpsRedirection();


app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
// No longer using wwwroot for file storage

// Enable Session
app.UseSession();
// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map Controllers
app.MapControllers();

// Health Check Endpoint

app.MapGet("/health", async (EEPZDbContext eepzDbContext, IConfiguration config) =>
{
    bool mySqlConnected = false;
    bool mongoConnected = false;

    try
    {
        mySqlConnected = await eepzDbContext.Database.CanConnectAsync();
    }
    catch (Exception)
    {

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

    return Results.Ok(new
    {
        status = "Healthy",
        timestamp = DateTime.UtcNow,
        service = "EEPZ Learning and Development API",
        version = "v1.0",
        environment = app.Environment.EnvironmentName,

        database = new
        {
            mySQL = new
            {
                connected = mySqlConnected,
                provider = "MySQL (EF Core)",
                connectionStringName = "DefaultConnection"
            },
            mongoDB = new
            {
                connected = mongoConnected,
                provider = "MongoDB GridFS",
                databaseName = config["MongoDbSettings:DatabaseName"]
            }
        },

        storage = new
        {
            type = "MongoDB GridFS",
            enabled = !string.IsNullOrEmpty(config["MongoDbSettings:ConnectionString"])
        },

        endpoints = new
        {
            categories = new[]
            {
                "LnD Employee Skills",
                "LnD SME Management",
                "LnD Assignments",
                "LnD Approvals",
                "LnD HR Operations"
            }
        },

        authentication = new
        {
            enabled = true,
            type = "JWT Bearer",
            issuerConfigured = !string.IsNullOrEmpty(config["JwtSettings:Issuer"])
        },

        cors = "AllowAll Enabled",
        swagger = app.Environment.IsDevelopment() || app.Environment.IsProduction()
    });
});


// Global Exception Handler

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";



        var exceptionHandlerPathFeature =
            context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var exception = exceptionHandlerPathFeature?.Error;



        Log.Error(exception, "Unhandled exception occurred: {Message}", exception?.Message);



        var response = new
        {
            success = false,
            message = "An internal server error occurred. Please try again later.",
            error = app.Environment.IsDevelopment() ? exception?.Message : null,
            stackTrace = app.Environment.IsDevelopment() ? exception?.StackTrace : null,
        };



        await context.Response.WriteAsJsonAsync(response);
    });
});


// Database Migration and Initialization

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;



    try
    {
        var eepzDbContext = services.GetRequiredService<EEPZDbContext>();



        if (eepzDbContext.Database.CanConnect())
        {
            Log.Information("EEPZDbContext - MySQL database connection established successfully.");
        }
        else
        {
            Log.Error("EEPZDbContext - Failed to connect to the MySQL database!");
        }


        try
        {
            var fileStorageService = services.GetRequiredService<IFileStorageService>();
            Log.Information("MongoDB GridFS File Storage Service initialized successfully.");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to initialize MongoDB GridFS: {Message}", ex.Message);
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred during database initialization: {Message}", ex.Message);



        if (app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}


// Application Startup

try
{
    Log.Information("========================================");
    Log.Information("EEPZ Backend Application Started Successfully");
    Log.Information($"Environment: {app.Environment.EnvironmentName}");
    Log.Information($"Content Root: {app.Environment.ContentRootPath}");
    Log.Information($"Web Root: {app.Environment.WebRootPath}");
    Log.Information("File Storage: MongoDB GridFS");
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


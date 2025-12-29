using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Data.Repository;
using Relevantz.EEPZ.Core.Service;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Relevantz.EEPZ.Data.DBContexts;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "EEPZ-Auth")
    .CreateLogger();

builder.Host.UseSerilog();

Log.Information("Starting EEPZ Application...");

// Add Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new DateOnlyJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new NullableDateOnlyJsonConverter());
    });

builder.Services.AddEndpointsApiExplorer();

// Configure Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EEPZ API",
        Version = "v1",
        Description = "EEPZ Authentication & User Management API with MongoDB Integration"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by your JWT token"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
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

// Configure MySQL Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
   options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 36)),
        mySqlOptions =>
        {
            mySqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
        }
    ));

// Configure MongoDB Settings
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

Log.Information($"MongoDB Configuration - ConnectionString: {builder.Configuration["MongoDbSettings:ConnectionString"]}");
Log.Information($"MongoDB Configuration - Database: {builder.Configuration["MongoDbSettings:DatabaseName"]}");
Log.Information($"MongoDB Configuration - Collection: {builder.Configuration["MongoDbSettings:ProfileImagesCollectionName"]}");

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT Secret Key not configured");

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
            Log.Warning("JWT Authentication Failed: {Message}", context.Exception.Message);
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var userId = context.Principal?
                .FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?
                .Value;
            Log.Information("JWT Token Validated for UserId: {UserId}", userId);
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Register MySQL Repositories
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IUserAuthenticationRepository, UserAuthenticationRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<IEmployeeDetailsMasterRepository, EmployeeDetailsMasterRepository>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddScoped<ILoginAttemptRepository, LoginAttemptRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IChangeRequestRepository, ChangeRequestRepository>();
builder.Services.AddScoped<IBulkOperationLogRepository, BulkOperationLogRepository>();

// Register MongoDB Repository
builder.Services.AddScoped<IProfileImageRepository, ProfileImageRepository>();
Log.Information("MongoDB ProfileImageRepository registered successfully");   

// Register Services
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IChangeRequestService, ChangeRequestService>();
builder.Services.AddScoped<IBulkOperationService, BulkOperationService>();
builder.Services.AddScoped<IExportService, ExportService>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add Memory Cache
builder.Services.AddMemoryCache();

// Add HTTP Client
builder.Services.AddHttpClient();

var app = builder.Build();

// Database Initialization
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<EEPZDbContext>();
        var configuration = services.GetRequiredService<IConfiguration>();

        Log.Information("Initializing MySQL database...");
        context.Database.EnsureCreated();

        Log.Information("Seeding database with initial data...");
        await DbInitializer.InitializeAsync(context, configuration);

        Log.Information("MySQL database initialized successfully");

        // Test MongoDB Connection
        try
        {
            var profileImageRepo = services.GetRequiredService<IProfileImageRepository>();
            var mongoTestExists = await profileImageRepo.ImageExistsAsync(0); // Test query
            Log.Information("MongoDB connection verified successfully");
        }
        catch (Exception mongoEx)
        {
            Log.Warning($"MongoDB connection test failed - continuing with startup: {mongoEx.Message}");
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred while initializing the database");
        throw;
    }
}

// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ API V1");
        c.RoutePrefix = "swagger";
    });
}

// Serilog Request Logging
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
        diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].ToString());
    };
});

// Global Exception Handler
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        
        var error = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        if (error != null)
        {
            Log.Error(error.Error, "Unhandled exception occurred");
            
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "An internal server error occurred",
                error = app.Environment.IsDevelopment() ? error.Error.Message : "Internal Server Error",
                timestamp = DateTime.UtcNow
            });
        }
    });
});

app.UseHttpsRedirection();
app.UseStaticFiles(); // Enable static files from wwwroot

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", async (EEPZDbContext dbContext, IConfiguration config) =>
{
    bool dbConnected = false;
    
    try
    {
        dbConnected = await dbContext.Database.CanConnectAsync();
    }
    catch (Exception)
    {
        // Health check failed silently
    }

    return Results.Ok(new
    {
        status = "Healthy",
        timestamp = DateTime.UtcNow,
        service = "EEPZ Authentication & User Management API",
        version = "v1.0",
        environment = builder.Environment.EnvironmentName,
        
        database = new
        {
            connected = dbConnected,
            provider = "MySQL (EF Core 8.0)",
            connectionStringName = "DefaultConnection"
        },
        
        endpoints = new
        {
            total = 64,
            categories = new[]
            {
                "Authentication (6)",
                "Bulk Operations (8)",
                "Role & Department (24)",
                "User (12)",
                "Change Requests (7)"
            }
        },
        
        authentication = new
        {
            enabled = true,
            type = "JWT Bearer",
            issuerConfigured = !string.IsNullOrEmpty(config["Jwt:Issuer"])
        },
        
        cors = "AllowAll Enabled",
        swagger = app.Environment.IsDevelopment()
    });
});

try
{
    Log.Information("EEPZ Application Starting...");
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

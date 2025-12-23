using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Service;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

using Serilog;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ===================================
// Configure Serilog
// ===================================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "Chatbot")
    .CreateLogger();

builder.Host.UseSerilog();

Log.Information("Starting EEPZ Chatbot Microservice...");

// ===================================
// Service configuration
// ===================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ---------- JWT AUTHENTICATION ----------
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"]
    ?? throw new InvalidOperationException("JWT Secret Key not configured");

builder.Services
    .AddAuthentication(options =>
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

// ---------- SWAGGER ----------
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EEPZ Chatbot API",
        Version = "v1",
        Description = "Chatbot microservice for user conversations and pattern management"
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

// ---------- DATABASE ----------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// ---------- REPOSITORIES & SERVICES ----------
// Chatbot
builder.Services.AddScoped<IChatbotRepository, ChatbotRepository>();
builder.Services.AddScoped<IChatbotService, ChatbotService>();

// ---------- CORS ----------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .SetIsOriginAllowed(origin => true)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

// DATABASE INITIALIZATION
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<EEPZDbContext>();
        await context.Database.MigrateAsync();

        Log.Information("Chatbot API: Database migration completed successfully");

        // Adjust namespace/assembly if needed
        var initializerType = typeof(Program).Assembly.GetType("eepzbackend.Data.DbInitializer");
        var method = initializerType?.GetMethod("InitializeAsync");

        if (method != null)
        {
            await (Task)method.Invoke(null, new object[] { context });
            Log.Information("Chatbot API: Database seeding completed");
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Chatbot API: An error occurred while migrating the database");
    }
}

// HTTP REQUEST PIPELINE
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ Chatbot API V1");
        c.RoutePrefix = string.Empty;
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

app.UseStaticFiles();
app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", async (EEPZDbContext dbContext, IChatbotRepository chatbotRepo, IConfiguration config) =>
{
    bool dbConnected = false;
    int activePatterns = 0;
    
    try
    {
        dbConnected = await dbContext.Database.CanConnectAsync();
        
        // Quick stats check
        var patterns = await chatbotRepo.GetActivePatternsAsync();
        activePatterns = patterns.Count;
    }
    catch (Exception)
    {
        // Health check failed silently
    }

    return Results.Ok(new
    {
        status = "Healthy",
        timestamp = DateTime.UtcNow,
        service = "EEPZ Chatbot Microservice",
        version = "v1.0",
        environment = builder.Environment.EnvironmentName,
        
        database = new
        {
            connected = dbConnected,
            provider = "MySQL (Pomelo EF Core 8.0)",
            connectionStringName = "DefaultConnection"
        },
        
        chatbot = new
        {
            activePatterns = activePatterns,
            messageEndpointReady = true,
            patternManagementReady = true
        },
        
        endpoints = new
        {
            total = 7,
            categories = new[]
            {
                "Message Processing (1)",
                "Conversation History (1)", 
                "Pattern Management (5)"
            }
        },
        
        authentication = new
        {
            enabled = true,
            type = "JWT Bearer",
            rolesRequired = "Admin",
            issuerConfigured = !string.IsNullOrEmpty(config["Jwt:Issuer"])
        },
        
        cors = "AllowAll Enabled",
        swagger = app.Environment.IsDevelopment()
    });
});

try
{
    Log.Information("EEPZ Chatbot Microservice Started Successfully");
    Log.Information("Authentication: JWT Bearer Token Enabled");
    Log.Information("Environment: {Environment}", app.Environment.EnvironmentName);

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Chatbot Microservice terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

global using Serilog;
global using Serilog.Events;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Core.Services;



var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddEnvironmentVariables();

Console.WriteLine("Building........");

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

Log.Information("Starting EEPZ SLA Backend Application");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EEPZ API",
        Version = "v1",
        Description = "SLA API"
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
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

Log.Information("Database connection configured");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    // ✅ Keycloak realm (JWKS auto-discovered)
    options.Authority =
        "https://unprotractive-elmo-estipulate.ngrok-free.dev/realms/eepz-realm";

    options.RequireHttpsMetadata = true;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        // ✅ Same simple setup as all your other services
        ValidateIssuer = false,
        ValidateAudience = false,

        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,

        // ✅ Must match Keycloak token
        NameClaimType = "preferred_username",
        RoleClaimType = "role"
    };
});

builder.Services.AddAuthorization();


Log.Information("JWT Authentication configured");

builder.Services.AddScoped<IEmailClient, EmailClient>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ISlaService, SlaService>();
builder.Services.AddScoped<ISlaRepository, SlaRepository>();
builder.Services.AddScoped<ISlaAutomationService, SlaAutomationService>();

Log.Information("Dependency Injection configured - EmailService, ISlaService, ISlaRepository");
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        if (allowedOrigins != null && allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            Log.Warning("CORS AllowedOrigins not configured. Cross-origin requests will be blocked.");
        }
    });
});


Log.Information("CORS configured");

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ API v1");
    });
    Log.Information("Swagger UI enabled");
}

app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate =
        "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.GetLevel = (httpContext, elapsed, ex) => LogEventLevel.Information;
});

app.UseHttpsRedirection();

app.UseCors("CorsPolicy");


app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


Log.Information("Application Configuration:");
Log.Information("   Environment: {Environment}", app.Environment.EnvironmentName);

Log.Information(
    "   Database: {Database}",
    connectionString?.Split(';').FirstOrDefault(x => x.Contains("Database"))
);

try
{
    Log.Information("SLA API started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "SLA API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

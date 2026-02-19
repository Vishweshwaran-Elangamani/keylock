global using Serilog;
global using Serilog.Events;
using Relevantz.EEPZ.Api.Middleware;

using System.IdentityModel.Tokens.Jwt;
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

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
JwtSecurityTokenHandler.DefaultOutboundClaimTypeMap.Clear();

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting EEPZ Project Management Backend Application");

    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "EEPZ.ProjectManagement.API")
        .Filter.ByExcluding(logEvent =>
            logEvent.Properties.Any(p =>
                p.Key.ToLower().Contains("password") ||
                p.Key.ToLower().Contains("token") ||
                p.Key.ToLower().Contains("authorization") ||
                p.Key.ToLower().Contains("secret")))
        .WriteTo.Console());

    // CONTROLLERS
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();

    // SWAGGER + JWT
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "EEPZ Project Management API",
            Version = "v1",
            Description = "Project Management Module API",
        });

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter Bearer token"
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

    // DATABASE + SAFE SQL LOGGING
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    builder.Services.AddDbContext<EEPZDbContext>((serviceProvider, options) =>
    {
        var logger = serviceProvider.GetRequiredService<ILogger<EEPZDbContext>>();

        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString),
            o => o.CommandTimeout(30))
            .EnableSensitiveDataLogging(false)
            .LogTo(message => logger.LogInformation(message), LogLevel.Information);
    });

    // JWT AUTH
    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
    var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey missing");

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

                NameClaimType = "sub",
                RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("HROnly", policy =>
            policy.RequireRole("HR"));

        options.AddPolicy("ManagerOnly", policy =>
            policy.RequireRole("Manager"));

        options.AddPolicy("EmployeeOnly", policy =>
            policy.RequireRole("Employee"));

        options.AddPolicy("HRorManager", policy =>
            policy.RequireRole("HR", "Manager"));

        options.AddPolicy("HRorEmployee", policy =>
            policy.RequireRole("HR", "Employee"));
    });

    builder.Services.AddHttpContextAccessor();

    // DI
    builder.Services.AddScoped<IProjectRepository, ProjectRepository>();
    builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
    builder.Services.AddScoped<IProjectService, ProjectService>();
    builder.Services.AddScoped<IEmployeeService, EmployeeService>();

    builder.Services.AddMemoryCache();

    // CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("FrontendOnly", policy =>
            policy.WithOrigins("http://localhost:5173", "http://localhost:3007")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials());
    });

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseSerilogRequestLogging(opts =>
    {
        opts.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
            diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].ToString());
            diagnosticContext.Set("ClientIP", httpContext.Connection.RemoteIpAddress?.ToString());
        };
    });

    app.UseMiddleware<GlobalExceptionMiddleware>();
    app.UseHttpsRedirection();
    app.UseCors("FrontendOnly");
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    Log.Information("Project Management API started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

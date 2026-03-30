global using Serilog;
global using Serilog.Events;
global using Relevantz.EEPZ.Core.IService;
global using Relevantz.EEPZ.Common.DTOs.Response;
global using Relevantz.EEPZ.Data.IRepository;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Relevantz.EEPZ.Shared.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common;
using Relevantz.EEPZ.Core.Service;
using Relevantz.EEPZ.Api.Middleware;
using FluentValidation;
using FluentValidation.AspNetCore;
using Relevantz.EEPZ.Data.Repository;
using Relevantz.EEPZ.Core.Mapping;


JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
JwtSecurityTokenHandler.DefaultOutboundClaimTypeMap.Clear();

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting EEPZ Feedback Backend Application");

    var builder = WebApplication.CreateBuilder(args);
    Console.WriteLine("Building........");

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    Log.Information("Serilog configured successfully");

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();

builder.Services.AddExceptionHandler<GlobalExceptionMiddleware>();
builder.Services.AddProblemDetails();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Relevantz.EEPZ.Api.Validators.CreateMentorFeedbackRequestValidator>();




    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc(
            "v1",
            new OpenApiInfo
            {
                Title = "EEPZ Feedback API",
                Version = "v1",
                Description = "Feedback Module API",
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

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    builder.Services.AddDbContext<EEPZDbContext>(options =>
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
    );

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
        // ✅ Keep it simple (same as your working services)
        ValidateIssuer = false,
        ValidateAudience = false,

        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,

        // ✅ Match Keycloak access token exactly
        NameClaimType = "preferred_username",
        RoleClaimType = "role"
    };
});

builder.Services.AddAuthorization();


  


    Log.Information("JWT Authentication configured");

    builder.Services.AddHttpContextAccessor();

      MapsterConfig.RegisterMappings();

    builder.Services.AddScoped<IMentorFeedbackRepository, MentorFeedbackRepository>();
    builder.Services.AddScoped<IOrgGoalFeedbackRepository, OrgGoalFeedbackRepository>();

    builder.Services.AddScoped<IMentorFeedbackService, MentorFeedbackService>();
    builder.Services.AddScoped<IOrgGoalFeedbackService, OrgGoalFeedbackService>();
    builder.Services.AddScoped<IGoalService,GoalService>();
    builder.Services.AddScoped<IGoalRepository, GoalRepository>();
    builder.Services.AddScoped<IOrgwideObjectivesRepository, OrgwideObjectivesRepository>();
    builder.Services.AddScoped<IOrgwideObjectivesService, OrgwideObjectivesService>();
    builder.Services.AddScoped<ISmeRepository, SmeRepository>();
    builder.Services.AddScoped<ISmeService, SmeService>();

Log.Information("Global Exception Handler configured");



    Log.Information("Dependency Injection configured - 5 repositories, 5 services");

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

    Log.Information("CORS configured");

    var app = builder.Build();
    app.UseExceptionHandler();


    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ Feedback API v1");
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
    app.UseStaticFiles();

    app.UseCors("AllowAll");
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    Log.Information("========================================");
    Log.Information("Feedback Application Configuration:");
    Log.Information("========================================");
    Log.Information("   Environment: {Environment}", app.Environment.EnvironmentName);
    
    Log.Information(
        "   Database: {Database}",
        connectionString?.Split(';').FirstOrDefault(x => x.Contains("Database"))
    );
    Log.Information("========================================");

    Log.Information("Feedback API started successfully");
    Log.Information("Ready to accept requests...");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Feedback Application terminated unexpectedly");
    throw;
}
finally
{
    Log.Information("Shutting down Feedback Application");
    Log.CloseAndFlush();
}

using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

  
//  SERVICE CONFIGURATION
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ---------- JWT AUTHENTICATION ----------
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
            Console.WriteLine($"JWT Authentication Failed: {context.Exception.Message}");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var userId = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"JWT Token Validated for UserId: {userId}");
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
        Title = "EEPZ API",
        Version = "v1",
        Description = "HR Operations API"
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
// Sprint 2
builder.Services.AddScoped<IPolicyRepository, PolicyRepository>();
builder.Services.AddScoped<IViolationRepository, ViolationRepository>();
builder.Services.AddScoped<IPolicyService, PolicyService>();
builder.Services.AddScoped<IViolationService, ViolationService>();
builder.Services.AddScoped<IComplianceService, ComplianceService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Sprint 3
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<ICostMappingRepository, CostMappingRepository>();
builder.Services.AddScoped<ICostMappingService, CostMappingService>();
builder.Services.AddScoped<IResponsibilityDistributionRepository, ResponsibilityDistributionRepository>();
builder.Services.AddScoped<IResponsibilityDistributionService, ResponsibilityDistributionService>();
builder.Services.AddScoped<INominationManagementRepository, NominationManagementRepository>();
builder.Services.AddScoped<INominationManagementService, NominationManagementService>();
builder.Services.AddScoped<IPayrollManagementRepository, PayrollManagementRepository>();
builder.Services.AddScoped<IPayrollManagementService, PayrollManagementService>();
builder.Services.AddScoped<ICareerProgressionRepository, CareerProgressionRepository>();
builder.Services.AddScoped<IBudgetPeriodAllocationRepository, BudgetPeriodAllocationRepository>();
builder.Services.AddScoped<IPeriodAllocationService, PeriodAllocationService>();
builder.Services.AddScoped<ICareerProgressionService, CareerProgressionService>();
builder.Services.AddScoped<IFundAllocationRepository, FundAllocationRepository>();
builder.Services.AddScoped<IFundAllocationService, FundAllocationService>();
builder.Services.AddScoped<ISlaEscalationRepository, SlaEscalationRepository>();
// ---------- CORS ----------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:4173",
            "http://localhost:3001"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

  
// 🗄️ DATABASE INITIALIZATION
  

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<EEPZDbContext>();
        await context.Database.MigrateAsync();

        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("HR API: Database migration completed successfully");

        var initializerType = typeof(Program).Assembly.GetType("eepzbackend.Data.DbInitializer");
        var method = initializerType?.GetMethod("InitializeAsync");

        if (method != null)
        {
            await (Task)method.Invoke(null, new object[] { context });
            logger.LogInformation("HR API: Database seeding completed");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "HR API: An error occurred while migrating the database");
    }
}

  
//  HTTP REQUEST PIPELINE
  

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ HR Operations API V1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseStaticFiles();
app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "EEPZ HR Operations Microservice",
    version = "Sprint 2 + Sprint 3",
    endpoints = "16 Total Endpoints",
    timestamp = DateTime.UtcNow
}));

Console.WriteLine("EEPZ HR Operations Microservice is starting...");
Console.WriteLine("Sprints: Sprint 2 (Auth & Goals) + Sprint 3 (Career Progression & Payroll)");
Console.WriteLine("Authentication: JWT Bearer Token Enabled");
Console.WriteLine("Endpoints: 16 Total");

app.Run();

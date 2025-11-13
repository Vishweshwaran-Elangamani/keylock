using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;

using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;


// Add these usings to match your folders (adjust if your namespaces differ)

using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;

var builder = WebApplication.CreateBuilder(args);
Console.WriteLine("Building........");

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();
builder.Host.UseSerilog();

// MVC + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EEPZ Internal Opportunities API",
        Version = "v1",
        Description = "Backend API for EEPZ Internal Opportunities Management System"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
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

// Database (MySQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Auth (JWT)
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ==================================================================================
// FEEDBACK MODULE - DEPENDENCY INJECTION
// ==================================================================================
// Repositories
builder.Services.AddScoped<IManagerReviewRepository, ManagerReviewRepository>();
builder.Services.AddScoped<IMentorFeedbackRepository, MentorFeedbackRepository>();
builder.Services.AddScoped<IOrgGoalFeedbackRepository, OrgGoalFeedbackRepository>();
builder.Services.AddScoped<IPeerFeedbackQueueRepository, PeerFeedbackQueueRepository>();
builder.Services.AddScoped<IHrFeedbackFormRepository, HrFeedbackFormRepository>();

// Services
builder.Services.AddScoped<IManagerReviewService, ManagerReviewService>();
builder.Services.AddScoped<IMentorFeedbackService, MentorFeedbackService>();
builder.Services.AddScoped<IOrgGoalFeedbackService, OrgGoalFeedbackService>();
builder.Services.AddScoped<IPeerFeedbackQueueService, PeerFeedbackQueueService>();
builder.Services.AddScoped<IHrFeedbackFormService, HrFeedbackFormService>();

// ==================================================================================
// CORS
// ==================================================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ API v1"); });
}

app.UseSerilogRequestLogging();

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Auto-migrate
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<EEPZDbContext>();
    try
    {
        dbContext.Database.Migrate();
        Log.Information("Database migration completed successfully");
    }
    catch (Exception ex)
    {
        Log.Error($"Database migration failed: {ex.Message}");
    }
}

app.Run();

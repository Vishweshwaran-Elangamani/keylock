using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Data.Repository;
using Relevantz.EEPZ.Core.Service;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Relevantz.EEPZ.Data.DBContexts;
using System.Text;
using AutoMapper;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog (Optional - uncomment if needed)
// Log.Logger = new LoggerConfiguration()
//     .ReadFrom.Configuration(builder.Configuration)
//     .CreateLogger();
// builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with JWT
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "EEPZ API", 
        Version = "v1",
        Description = "Internal Opportunities API"
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

// Configure Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

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
});

builder.Services.AddAuthorization();

// ============================================================================
// REGISTER EXISTING REPOSITORIES (Authentication & User Management)
// ============================================================================
// builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
// builder.Services.AddScoped<IUserAuthenticationRepository, UserAuthenticationRepository>();
// builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
// builder.Services.AddScoped<IRoleRepository, RoleRepository>();
// builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
// builder.Services.AddScoped<IEmployeeDetailsMasterRepository, EmployeeDetailsMasterRepository>();
// builder.Services.AddScoped<IOtpRepository, OtpRepository>();
// builder.Services.AddScoped<ILoginAttemptRepository, LoginAttemptRepository>();
// builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
// builder.Services.AddScoped<IChangeRequestRepository, ChangeRequestRepository>();
// builder.Services.AddScoped<IBulkOperationLogRepository, BulkOperationLogRepository>();

// ============================================================================
// REGISTER NEW REPOSITORIES (Internal Opportunities Module)
// ============================================================================
builder.Services.AddScoped<IInternalOpportunityRepository, InternalOpportunityRepository>();
builder.Services.AddScoped<INominationRepository, NominationRepository>();
builder.Services.AddScoped<IManagerNominationTrackingRepository, ManagerNominationTrackingRepository>();
builder.Services.AddScoped<INominationReviewMetricRepository, NominationReviewMetricRepository>();
builder.Services.AddScoped<IPromotionRepository, PromotionRepository>();
builder.Services.AddScoped<IPromotionHistoryRepository, PromotionHistoryRepository>();

// ============================================================================
// REGISTER EXISTING SERVICES (Authentication & User Management)
// ============================================================================
// builder.Services.AddScoped<IPasswordService, PasswordService>();
// builder.Services.AddScoped<IOtpService, OtpService>();
// builder.Services.AddScoped<ITokenService, TokenService>();
// builder.Services.AddScoped<IEmailService, EmailService>();
// builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
// builder.Services.AddScoped<IUserManagementService, UserManagementService>();
// builder.Services.AddScoped<IRoleService, RoleService>();
// builder.Services.AddScoped<IDepartmentService, DepartmentService>();
// builder.Services.AddScoped<IProfileService, ProfileService>();
// builder.Services.AddScoped<IChangeRequestService, ChangeRequestService>();
// builder.Services.AddScoped<IBulkOperationService, BulkOperationService>();
// builder.Services.AddScoped<IExportService, ExportService>();

// ============================================================================
// REGISTER NEW SERVICES (Internal Opportunities Module)
// ============================================================================
builder.Services.AddScoped<IInternalOpportunityService, InternalOpportunityService>();
builder.Services.AddScoped<INominationService, NominationService>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// ============================================================================
// CONFIGURE AUTOMAPPER
// ============================================================================
var mapperConfig = new MapperConfiguration(mc =>
{
    mc.AddProfile(new InternalOpportunitiesMappingProfile());
});

builder.Services.AddSingleton(mapperConfig.CreateMapper());

// Alternative: Use this if AutoMapper.Extensions.Microsoft.DependencyInjection is installed
// builder.Services.AddAutoMapper(typeof(InternalOpportunitiesMappingProfile));

// ============================================================================
// CONFIGURE CORS
// ============================================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ============================================================================
// ADD JSON OPTIONS FOR DATEONLY
// ============================================================================
// builder.Services.AddControllers()
//     .AddJsonOptions(options =>
//     {
//         options.JsonSerializerOptions.Converters.Add(new DateOnlyJsonConverter());
//         options.JsonSerializerOptions.Converters.Add(new NullableDateOnlyJsonConverter());
//     });

var app = builder.Build();

// ============================================================================
// SEED DATABASE
// ============================================================================
// using (var scope = app.Services.CreateScope())
// {
//     var services = scope.ServiceProvider;
//     try
//     {
//         var context = services.GetRequiredService<EEPZDbContext>();
//         var configuration = services.GetRequiredService<IConfiguration>();

//         // Apply pending migrations
//         // await context.Database.MigrateAsync();

//         // Seed existing data
//         await DbInitializer.InitializeAsync(context, configuration);
        
//         // Seed Internal Opportunities data
//         await DbInitializer.SeedInternalOpportunitiesAsync(context);
        
//         Console.WriteLine("✓ Database seeding completed successfully!");
//     }
//     catch (Exception ex)
//     {
//         Console.WriteLine($"✗ An error occurred while seeding the database: {ex.Message}");
//         Console.WriteLine($"  Stack Trace: {ex.StackTrace}");
//     }
// }

// ============================================================================
// CONFIGURE HTTP REQUEST PIPELINE
// ============================================================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ API V1");
        c.DisplayRequestDuration();
    });
}

// app.UseSerilogRequestLogging();

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

Console.WriteLine("🚀 EEPZ API Server is starting...");
app.Run();

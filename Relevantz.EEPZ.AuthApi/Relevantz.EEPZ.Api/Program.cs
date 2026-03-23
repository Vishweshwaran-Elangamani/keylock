using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.Extensions.Options;
using Relevantz.EEPZ.Api.Middleware;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Service;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Data.Repository;
using Serilog;
using MongoDB.Driver;
using MapsterMapper;

// Alias to resolve ambiguity between MongoDB.Driver.ServerVersion and EF Core ServerVersion
using EFServerVersion = Microsoft.EntityFrameworkCore.ServerVersion;

var builder = WebApplication.CreateBuilder(args);

// ── Serilog ───────────────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();
builder.Host.UseSerilog();

// ── Basic Services ────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpClient();

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "EEPZ API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter JWT Bearer token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
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

// ── MySQL Database ────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(
        connectionString,
        EFServerVersion.AutoDetect(connectionString),   // ✅ Alias fixes CS0104 ambiguity
        mySqlOptions => mySqlOptions
            .EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null)
            .CommandTimeout(30)
    )
);

// ── MongoDB ───────────────────────────────────────────────────────────────────
// ✅ Standard Options pattern — fixes CS1061 (no custom extension needed)
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var mongoConfig = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
    return new MongoClient(mongoConfig.ConnectionString);
});

// ── Mapster ───────────────────────────────────────────────────────────────────
builder.Services.AddSingleton<IMapper, Mapper>();

// ── FluentValidation ──────────────────────────────────────────────────────────
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddValidatorsFromAssemblyContaining<UpdateProfileRequestDto>();
builder.Services.AddFluentValidationAutoValidation();

// ── Memory Cache & HttpContextAccessor ───────────────────────────────────────
builder.Services.AddHttpContextAccessor();
builder.Services.AddMemoryCache();

// ── Application Services ──────────────────────────────────────────────────────
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddScoped<IChangeRequestService, ChangeRequestService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IBulkOperationService, BulkOperationService>();
builder.Services.AddScoped<IExportService, ExportService>();
builder.Services.AddScoped<ISuperAdminSeederService, SuperAdminSeederService>(); // ✅ Seeder

// ── Keycloak Admin Service ────────────────────────────────────────────────────
builder.Services.AddHttpClient<IKeycloakAdminService, KeycloakAdminService>();

// ── Repositories ─────────────────────────────────────────────────────────────
builder.Services.AddScoped<IUserAuthenticationRepository, UserAuthenticationRepository>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IProfileImageRepository, ProfileImageRepository>();
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IEmployeeDetailsMasterRepository, EmployeeDetailsMasterRepository>();
builder.Services.AddScoped<IChangeRequestRepository, ChangeRequestRepository>();
builder.Services.AddScoped<IBulkOperationLogRepository, BulkOperationLogRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<ILoginAttemptRepository, LoginAttemptRepository>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddScoped<IAddressRepository, AddressRepository>();

// ── Keycloak JWT Authentication ───────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "http://host.docker.internal:9090/realms/eepz-realm";
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "http://localhost:9090/realms/eepz-realm",
            ClockSkew = TimeSpan.FromMinutes(5)
        };
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Log.Error("JWT Auth Failed: {Error}", context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Log.Information("JWT SUCCESS: {UserEmail} ClaimsCount: {Count}",
                    context.Principal?.FindFirst("email")?.Value,
                    context.Principal?.Claims.Count());
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();
// ─────────────────────────────────────────────────────────────────────────────

// ── DB Migration + Super Admin Seed at Startup ────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    var retries = 0;
    const int maxRetries = 10;

    while (retries < maxRetries)
    {
        try
        {
            var db = services.GetRequiredService<EEPZDbContext>();
            await db.Database.EnsureCreatedAsync();
            logger.LogInformation("✅ Database schema ready.");

            var seeder = services.GetRequiredService<ISuperAdminSeederService>();
            await seeder.SeedAsync();
            logger.LogInformation("✅ Super admin seeded.");
            break;
        }
        catch (Exception ex)
        {
            retries++;
            logger.LogWarning(ex, "DB not ready. Retry {Retry}/{Max} in 5s...", retries, maxRetries);
            if (retries >= maxRetries)
            {
                logger.LogError("FATAL: DB unavailable after {Max} retries.", maxRetries);
                throw;
            }
            await Task.Delay(TimeSpan.FromSeconds(5));
        }
    }
}

// ── Middleware Pipeline ───────────────────────────────────────────────────────
app.UseSwagger();
app.UseSwaggerUI();

app.UseMiddleware<GlobalExceptionMiddleware>(); // ✅ namespace resolved via using above

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

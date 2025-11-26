 
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System.Security.Claims;
using System.Text;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Data.DBContexts;
using System.IdentityModel.Tokens.Jwt;
 
var builder = WebApplication.CreateBuilder(args);
 
// ============ CORE SERVICES ============
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
 
// ============ SWAGGER CONFIGURATION ============
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EEPZ API",
        Version = "v1",
        Description = "Performance Management API"
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
 
    options.CustomSchemaIds(type => type.FullName.Replace("+", "."));
});
 
// ============ DATABASE CONFIGURATION ============
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
 
// ============ JWT AUTHENTICATION ============
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"];
 
if (string.IsNullOrEmpty(secretKey))
{
    throw new InvalidOperationException("❌ JWT SecretKey not configured in appsettings.json");
}
 
Console.WriteLine($"✅ JWT Issuer: {jwtSettings["Issuer"]}");
Console.WriteLine($"✅ JWT Audience: {jwtSettings["Audience"]}");
Console.WriteLine($"✅ JWT SecretKey Length: {secretKey.Length} characters");
 
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
        ClockSkew = TimeSpan.Zero,
       
        // ✅ FIXED: Match the claim type used in JwtHelper (ClaimTypes.Role)
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = JwtRegisteredClaimNames.Sub
    };
 
    // ✅ DEBUG: Log JWT validation
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader))
            {
                var token = authHeader.Replace("Bearer ", "");
                Console.WriteLine($"📥 Token received (first 30 chars): {token.Substring(0, Math.Min(30, token.Length))}...");
            }
            else
            {
                Console.WriteLine("⚠️ No Authorization header found");
            }
            return Task.CompletedTask;
        },
       
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"❌ Authentication failed: {context.Exception.Message}");
           
            if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
            {
                Console.WriteLine("⏰ Token expired");
                context.Response.Headers.Add("Token-Expired", "true");
            }
            else if (context.Exception.Message.Contains("signature"))
            {
                Console.WriteLine("🔑 Signature validation failed - Check JWT SecretKey!");
            }
           
            return Task.CompletedTask;
        },
       
        OnTokenValidated = context =>
        {
            Console.WriteLine("✅ Token validated successfully!");
           
            var claims = context.Principal?.Claims.Select(c => $"{c.Type}={c.Value}");
            Console.WriteLine($"📋 All Claims: {string.Join(" | ", claims ?? new List<string>())}");
           
            // Check role claim
            var roleClaim = context.Principal?.FindFirst(ClaimTypes.Role);
           
            if (roleClaim != null)
            {
                Console.WriteLine($"✅ Role found: {roleClaim.Value}");
            }
            else
            {
                Console.WriteLine("⚠️ WARNING: No role claim found in token!");
            }
           
            return Task.CompletedTask;
        },
       
        OnChallenge = context =>
        {
            Console.WriteLine($"⚠️ Authentication Challenge: {context.Error} - {context.ErrorDescription}");
            return Task.CompletedTask;
        }
    };
});
 
builder.Services.AddAuthorization();
 
// ============ DEPENDENCY INJECTION ============
builder.Services.AddScoped<IFormManagementService, FormManagementService>();
builder.Services.AddScoped<IAppraisalProcessService, AppraisalProcessService>();
builder.Services.AddScoped<ISelfAssessmentService, SelfAssessmentService>();
builder.Services.AddScoped<IManagerReviewRepository, ManagerReviewRepository>();
builder.Services.AddScoped<ILeadershipRepository, LeadershipRepository>();
builder.Services.AddScoped<ILeadershipService, LeadershipService>();
builder.Services.AddScoped<IRecognitionRewardRepository, RecognitionRewardRepository>();
builder.Services.AddScoped<IRecognitionRewardService, RecognitionRewardService>();
 
// ============ CORS CONFIGURATION ============
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("Content-Disposition", "Content-Type"); // ✅ THIS IS THE KEY FIX!
    });
});
 
// ============ BUILD APPLICATION ============
var app = builder.Build();
 
// ============ HTTP REQUEST PIPELINE ============
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ Performance API v1");
        c.RoutePrefix = string.Empty;
    });
}
 
// ✅ CRITICAL: Middleware order
app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();  // ✅ Must be BEFORE UseAuthorization
app.UseAuthorization();
app.MapControllers();
 
Console.WriteLine("🚀 Performance Management API started on port 5253");
app.Run();
 
 
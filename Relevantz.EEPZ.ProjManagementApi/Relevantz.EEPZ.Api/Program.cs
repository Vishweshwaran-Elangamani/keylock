global using Serilog;
global using Serilog.Events;
using Relevantz.EEPZ.Data;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;

var builder = WebApplication.CreateBuilder(args);
Console.WriteLine("Building........");

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Log application starting
Log.Information("Starting EEPZ Project Management Backend Application");

// Add services to the container
builder.Services.AddControllers();

// Database Context with migrations assembly
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString),
        b => b.MigrationsAssembly("Relevantz.EEPZ.Data") // Important for EF migrations
    ));

Log.Information("Database configured with migrations assembly: Relevantz.EEPZ.Data");

// Register Repositories
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();

// Register Services
builder.Services.AddScoped<IProjectService, ProjectService>();

Log.Information("Dependency Injection configured - 1 repository, 1 service");

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "EEPZ API",
        Version = "v1",
        Description = "Project Management API"
    });

    // Enable XML comments for better Swagger documentation
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
        Log.Information("XML documentation included in Swagger");
    }
});

// CORS Policy for React App
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // Vite default ports
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

Log.Information("CORS configured for React app (localhost:5173, localhost:3000)");

var app = builder.Build();

// Seed the database with default project
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<EEPZDbContext>();
    try
    {
        Log.Information("Starting database seeding...");
        await DbInitializer.SeedAsync(dbContext);
        Log.Information("Database seeding completed successfully");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Database seeding failed: {Message}", ex.Message);
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ Backend API V1");
    });
    Log.Information("Swagger UI enabled");
}

// Enable Serilog request logging
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate =
        "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.GetLevel = (httpContext, elapsed, ex) => LogEventLevel.Information;
});

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();

// Log configuration details
Log.Information("   Application Configuration:");
Log.Information("   Environment: {Environment}", app.Environment.EnvironmentName);
Log.Information(
    "   Database: {Database}",
    connectionString?.Split(';').FirstOrDefault(x => x.Contains("Database"))
);
Log.Information("   CORS Origins: localhost:5173, localhost:3000");

try
{
    Log.Information("Project Management Application started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Project Management Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

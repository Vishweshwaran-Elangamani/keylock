global using Serilog;
global using Serilog.Events;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Data.Repository.Interfaces;

var builder = WebApplication.CreateBuilder(args);
Console.WriteLine("Building........");

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

Log.Information("Starting EEPZ Project Management Backend Application");

builder.Services.AddControllers();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString),
        b => b.MigrationsAssembly("Relevantz.EEPZ.Data")
    )
);

Log.Information("Database configured with migrations assembly: Relevantz.EEPZ.Data");

builder.Services.AddScoped<IProjectRepository, ProjectRepository>();

builder.Services.AddScoped<IProjectService, ProjectService>();

Log.Information("Dependency Injection configured - 1 repository, 1 service");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "EEPZ API",
            Version = "v1",
            Description = "Project Management API",
        }
    );

    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
        Log.Information("XML documentation included in Swagger");
    }
});

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowReactApp",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173", "http://localhost:3007")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

Log.Information("CORS configured for React app (localhost:5173, localhost:3007)");

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ Backend API V1");
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
app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();

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

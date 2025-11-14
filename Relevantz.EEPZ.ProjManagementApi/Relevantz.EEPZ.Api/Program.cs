using Relevantz.EEPZ.Data;
using Relevantz.EEPZ.Data.Repository.Implementations;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// ✅ Database Context with migrations assembly
builder.Services.AddDbContext<EEPZDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection")),
        b => b.MigrationsAssembly("Relevantz.EEPZ.Data") // Important for EF migrations
    ));

// Register Repositories
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();

// Register Services
builder.Services.AddScoped<IProjectService, ProjectService>();

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "EEPZ Backend API",
        Version = "v1",
        Description = "Enterprise Employee Performance & Management System API"
    });

    // Enable XML comments for better Swagger documentation
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// ✅ CORS Policy for React App
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

var app = builder.Build();

// ✅ Seed the database with default project
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<EEPZDbContext>();
    await DbInitializer.SeedAsync(dbContext);
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EEPZ Backend API V1");
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();
app.Run();
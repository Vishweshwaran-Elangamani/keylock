using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Serilog;

public static class DbInitializer
{
    public static async Task SeedAsync(EEPZDbContext context)
    {
        try
        {
            Log.Information("Database seeding started");
            
            await context.Database.EnsureCreatedAsync();
            Log.Information("Database ensured created");

            var existingProject = await context.Projects
                .FirstOrDefaultAsync(p => p.ProjectName == "ORG.RZ.RESOURCEPOOL");

            if (existingProject == null)
            {
                Log.Information("Creating default resource pool project: ORG.RZ.RESOURCEPOOL");
                
                var resourcePoolProject = new Project
                {
                    ProjectName = "ORG.RZ.RESOURCEPOOL",
                    ClientName = "Relevantz",
                    Description = "Auto-created resource pool project",
                    BusinessUnit = "Resource Management",
                    Department = null,
                    EngagementModel = "Internal",
                    Status = "Active",
                    StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
                    EndDate = null,
                    ResourceOwnerId = null,
                    ResourceOwnerEmployeeId = null,
                    L1approverId = null,
                    L1approverEmployeeId = null,
                    L2approverId = null,
                    L2approverEmployeeId = null,
                    IsDeletable = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                context.Projects.Add(resourcePoolProject);
                await context.SaveChangesAsync();
                
                Log.Information("Resource pool project created successfully");
            }
            else
            {
                Log.Information("Resource pool project already exists (ID: {ProjectId})", existingProject.ProjectId);
            }
            
            Log.Information("Database seeding completed");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Database seeding failed: {Message}", ex.Message);
            throw;
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;

public static class DbInitializer
{
    public static async Task SeedAsync(EEPZDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        var existingProject = await context.Projects
            .FirstOrDefaultAsync(p => p.ProjectName == "ORG.RZ.RESOURCEPOOL");

        if (existingProject == null)
        {
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
        }
    }
}
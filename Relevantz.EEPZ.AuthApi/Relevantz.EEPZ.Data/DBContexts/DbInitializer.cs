using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Data.DBContexts
{
    public class DbInitializer
    {
        /// <summary>
        /// Seeds all system roles and admin user
        /// </summary>
        public static async Task InitializeAsync(EEPZDbContext context, IConfiguration configuration)
        {
            try
            {
                Console.WriteLine("Starting database initialization...");

                // Seed roles first
                await SeedRolesAsync(context);

                // Seed default departments
                await SeedDepartmentsAsync(context);

                // Seed admin user
                await SeedAdminUserAsync(context, configuration);

                // Seed Resource Pool Project
                await SeedResourcePoolProjectAsync(context);

                // Seed Master Skills
                await SeedMasterSkillsAsync(context);

                Console.WriteLine("Database initialization completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during database initialization: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Seeds all system roles
        /// </summary>
        private static async Task SeedRolesAsync(EEPZDbContext context)
        {
            Console.WriteLine("Seeding roles...");

            var roles = new List<Role>
            {
                new Role
                {
                    RoleName = "Admin",
                    RoleCode = "ADMIN",
                    Description = "System Administrator with full access",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow
                },
                 new Role
                {
                    RoleName = "Leadership",
                    RoleCode = "LEADERSHIP",
                    Description = "Team Leader - Oversees department heads and managers",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow,
                },
                new Role
                {
                    RoleName = "HR",
                    RoleCode = "HR",
                    Description = "Human Resources - Manages employees and HR processes",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Role
                {
                    RoleName = "Department Head",
                    RoleCode = "DEPT_HEAD",
                    Description = "Department Head - Manages department operations",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Role
                {
                    RoleName = "Manager",
                    RoleCode = "MANAGER",
                    Description = "Manager - Manages team performance and operations",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Role
                {
                    RoleName = "Employee",
                    RoleCode = "EMPLOYEE",
                    Description = "Regular employee user",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            foreach (var role in roles)
            {
                var existingRole = await context.Roles
                    .FirstOrDefaultAsync(r => r.RoleCode == role.RoleCode);

                if (existingRole == null)
                {
                    context.Roles.Add(role);
                    Console.WriteLine($"   Added role: {role.RoleName} ({role.RoleCode})");
                }
                else
                {
                    Console.WriteLine($"  ⏭  Role already exists: {role.RoleName}");
                }
            }

            await context.SaveChangesAsync();
            Console.WriteLine(" Roles seeding completed!");
        }

        /// <summary>
        /// Seeds default departments
        /// </summary>
        private static async Task SeedDepartmentsAsync(EEPZDbContext context)
        {
            Console.WriteLine(" Seeding departments...");

            var departments = new List<Department>
            {
                new Department
                {
                    DepartmentName = "Administration",
                    BudgetAllocated = 0,
                    CostCenter = "ADMIN001",
                    CreatedAt = DateTime.UtcNow
                },
                new Department
                {
                    DepartmentName = "Human Resources",
                    BudgetAllocated = 0,
                    CostCenter = "HR001",
                    CreatedAt = DateTime.UtcNow
                },
                new Department
                {
                    DepartmentName = "Information Technology",
                    BudgetAllocated = 0,
                    CostCenter = "IT001",
                    CreatedAt = DateTime.UtcNow
                },
                new Department
                {
                    DepartmentName = "Finance",
                    BudgetAllocated = 0,
                    CostCenter = "FIN001",
                    CreatedAt = DateTime.UtcNow
                },
                new Department
                {
                    DepartmentName = "Operations",
                    BudgetAllocated = 0,
                    CostCenter = "OPS001",
                    CreatedAt = DateTime.UtcNow
                }
            };

            foreach (var department in departments)
            {
                var existingDepartment = await context.Departments
                    .FirstOrDefaultAsync(d => d.DepartmentName == department.DepartmentName);

                if (existingDepartment == null)
                {
                    context.Departments.Add(department);
                    Console.WriteLine($"   Added department: {department.DepartmentName}");
                }
                else
                {
                    Console.WriteLine($"    Department already exists: {department.DepartmentName}");
                }
            }

            await context.SaveChangesAsync();
            Console.WriteLine(" Departments seeding completed!");
        }

        /// <summary>
        /// Seeds admin user with all required data
        /// </summary>
        private static async Task SeedAdminUserAsync(EEPZDbContext context, IConfiguration configuration)
        {
            Console.WriteLine(" Seeding admin user...");

            try
            {
                // Check if admin already exists
                var adminEmail = configuration["AdminSeedData:Email"] ?? "emailserviceeepz@gmail.com";
                var existingAdmin = await context.Userauthentications
                    .FirstOrDefaultAsync(u => u.Email == adminEmail);

                if (existingAdmin != null)
                {
                    Console.WriteLine("    Admin user already exists. Skipping seed.");
                    return;
                }

                // Get Admin Role
                var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleCode == "ADMIN");
                if (adminRole == null)
                {
                    throw new Exception("Admin role not found. Please ensure roles are seeded first.");
                }

                // Get Administration Department
                var adminDepartment = await context.Departments
                    .FirstOrDefaultAsync(d => d.DepartmentName == "Administration");
                if (adminDepartment == null)
                {
                    throw new Exception("Administration department not found. Please ensure departments are seeded first.");
                }

                // Create Admin Employee
                var adminEmployee = new Employee
                {
                    EmployeeCompanyId = configuration["AdminSeedData:EmployeeCompanyId"] ?? "12501",
                    EmploymentType = Constants.EmploymentTypes.Permanent,
                    EmploymentStatus = Constants.EmploymentStatuses.Active,
                    JoiningDate = DateOnly.FromDateTime(DateTime.UtcNow),
                    ConfirmationDate = DateOnly.FromDateTime(DateTime.UtcNow),
                    EmployeeType = Constants.EmployeeTypes.FullTime,
                    WorkLocation = "Head Office",
                    NoticePeriodDays = 0,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Employees.Add(adminEmployee);
                await context.SaveChangesAsync();
                Console.WriteLine($"   Created admin employee: {adminEmployee.EmployeeCompanyId}");

                // Create Admin Authentication
                var adminPassword = configuration["AdminSeedData:Password"] ?? "Admin@123456";
                var adminAuth = new Userauthentication
                {
                    EmployeeId = adminEmployee.EmployeeId,
                    Email = adminEmail,
                    PasswordHash = PasswordHelper.HashPassword(adminPassword),
                    Status = Constants.UserStatuses.Active,
                    IsFirstLogin = false,
                    CreatedAt = DateTime.UtcNow
                };
                context.Userauthentications.Add(adminAuth);
                await context.SaveChangesAsync();
                Console.WriteLine($"   Created admin authentication: {adminEmail}");

                // Create Admin Profile
                var adminProfile = new Userprofile
                {
                    EmployeeId = adminEmployee.EmployeeId,
                    FirstName = configuration["AdminSeedData:FirstName"] ?? "Super",
                    LastName = configuration["AdminSeedData:LastName"] ?? "Administrator",
                    CallingName = "Admin",
                    Gender = Constants.Genders.PreferNotToSay,
                    MobileNumber = configuration["AdminSeedData:MobileNumber"] ?? "+91-0000000000"
                };
                context.Userprofiles.Add(adminProfile);
                await context.SaveChangesAsync();
                Console.WriteLine($"   Created admin profile: {adminProfile.FirstName} {adminProfile.LastName}");

                // Assign Role and Department to Admin
                var adminEmployeeDetails = new Employeedetailsmaster
                {
                    EmployeeId = adminEmployee.EmployeeId,
                    RoleId = adminRole.RoleId,
                    DepartmentId = adminDepartment.DepartmentId
                };
                context.Employeedetailsmasters.Add(adminEmployeeDetails);
                await context.SaveChangesAsync();
                Console.WriteLine($"   Assigned role and department to admin");

                Console.WriteLine("\n" + new string('=', 60));
                Console.WriteLine(" ADMIN USER SEEDED SUCCESSFULLY!");
                Console.WriteLine(new string('=', 60));
                Console.WriteLine($" Email: {adminEmail}");
                Console.WriteLine($" Password: {adminPassword}");
                Console.WriteLine($" Name: {adminProfile.FirstName} {adminProfile.LastName}");
                Console.WriteLine($" Role: Admin");
                Console.WriteLine($" Department: Administration");
                Console.WriteLine(new string('=', 60) + "\n");
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error seeding admin user: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Seeds resource pool project
        /// </summary>
        public static async Task SeedResourcePoolProjectAsync(EEPZDbContext context)
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
                    Description = "Resource Pool Project.",
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

        /// <summary>
        /// Seeds master skills for the organization
        /// </summary>
        private static async Task SeedMasterSkillsAsync(EEPZDbContext context)
        {
            Console.WriteLine("Seeding master skills...");

            var skills = new List<MasterSkill>
            {
                // Programming Skills
                new MasterSkill
                {
                    SkillName = "Python Programming",
                    Description = "Advanced Python development with frameworks",
                    Category = "Programming",
                },
                new MasterSkill
                {
                    SkillName = "Java Development",
                    Description = "Enterprise Java application development",
                    Category = "Programming",
                },
                new MasterSkill
                {
                    SkillName = "JavaScript/TypeScript",
                    Description = "Modern JavaScript and TypeScript development",
                    Category = "Programming",
                },

                // Frontend Skills
                new MasterSkill
                {
                    SkillName = "React.js",
                    Description = "Frontend development using React framework",
                    Category = "Frontend",
                },

                // Backend Skills
                new MasterSkill
                {
                    SkillName = "Node.js",
                    Description = "Backend development using Node.js",
                    Category = "Backend",
                },
                new MasterSkill
                {
                    SkillName = ".NET Core",
                    Description = "Cross-platform .NET development",
                    Category = "Backend",
                },
                new MasterSkill
                {
                    SkillName = "API Design",
                    Description = "RESTful and GraphQL API design",
                    Category = "Backend",
                },

                // Database Skills
                new MasterSkill
                {
                    SkillName = "SQL Database Design",
                    Description = "Relational database design and optimization",
                    Category = "Database",
                },
                new MasterSkill
                {
                    SkillName = "MongoDB",
                    Description = "NoSQL database development",
                    Category = "Database",
                },

                // Cloud Skills
                new MasterSkill
                {
                    SkillName = "AWS Cloud Architecture",
                    Description = "Amazon Web Services cloud solutions",
                    Category = "Cloud",
                },
                new MasterSkill
                {
                    SkillName = "Azure DevOps",
                    Description = "Microsoft Azure DevOps and CI/CD",
                    Category = "Cloud",
                },
                new MasterSkill
                {
                    SkillName = "Cloud Migration",
                    Description = "Legacy to cloud migration strategies",
                    Category = "Cloud",
                },

                // DevOps Skills
                new MasterSkill
                {
                    SkillName = "Docker & Kubernetes",
                    Description = "Container orchestration and deployment",
                    Category = "DevOps",
                },
                new MasterSkill
                {
                    SkillName = "Infrastructure as Code",
                    Description = "Terraform and CloudFormation",
                    Category = "DevOps",
                },

                // Architecture Skills
                new MasterSkill
                {
                    SkillName = "Microservices Architecture",
                    Description = "Designing and implementing microservices",
                    Category = "Architecture",
                },
                new MasterSkill
                {
                    SkillName = "System Design",
                    Description = "Large-scale system design and architecture",
                    Category = "Architecture",
                },

                // Project Management Skills
                new MasterSkill
                {
                    SkillName = "Agile/Scrum",
                    Description = "Agile project management methodologies",
                    Category = "Project Management",
                },

                // Leadership Skills
                new MasterSkill
                {
                    SkillName = "Technical Leadership",
                    Description = "Leading engineering teams",
                    Category = "Leadership",
                },

                // Quality Skills
                new MasterSkill
                {
                    SkillName = "Code Review Best Practices",
                    Description = "Effective code review techniques",
                    Category = "Quality",
                },
                new MasterSkill
                {
                    SkillName = "Test-Driven Development",
                    Description = "TDD methodology and practices",
                    Category = "Quality",
                },

                // Performance Skills
                new MasterSkill
                {
                    SkillName = "Performance Optimization",
                    Description = "Application performance tuning",
                    Category = "Performance",
                },

                // Security Skills
                new MasterSkill
                {
                    SkillName = "Security Best Practices",
                    Description = "Application security and OWASP",
                    Category = "Security",
                },

                // Sales Skills
                new MasterSkill
                {
                    SkillName = "CRM Systems",
                    Description = "Customer Relationship Management systems",
                    Category = "Sales",
                },
                new MasterSkill
                {
                    SkillName = "Sales Analytics",
                    Description = "Data-driven sales analysis and forecasting",
                    Category = "Sales",
                },

                // Tools Skills
                new MasterSkill
                {
                    SkillName = "Git Version Control",
                    Description = "Advanced Git workflows",
                    Category = "Tools",
                }
            };

            int addedCount = 0;
            int skippedCount = 0;

            foreach (var skill in skills)
            {
                var existingSkill = await context.MasterSkills
                    .FirstOrDefaultAsync(s => s.SkillName == skill.SkillName);

                if (existingSkill == null)
                {
                    context.MasterSkills.Add(skill);
                    addedCount++;
                }
                else
                {
                    skippedCount++;
                    Console.WriteLine($"Skill already exists: {skill.SkillName}");
                }
            }

            await context.SaveChangesAsync();

            Console.WriteLine($"Master skills seeding completed!");
            Console.WriteLine($"Added: {addedCount} | Skipped: {skippedCount} | Total: {skills.Count}");
            Console.WriteLine(new string('-', 50));
        }
    }
}
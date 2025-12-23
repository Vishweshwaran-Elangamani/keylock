using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Data.DBContexts
{
    public class DbInitializer
    {
        /// <summary>
        /// Seeds all system roles and admin user
        /// </summary>
        public static async Task InitializeAsync(
            EEPZDbContext context,
            IConfiguration configuration
        )
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

                // Seed Chat Patterns
                await SeedChatPatternsAsync(context);

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
                    CreatedAt = DateTime.UtcNow,
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
                    CreatedAt = DateTime.UtcNow,
                },
                new Role
                {
                    RoleName = "Department Head",
                    RoleCode = "DEPT_HEAD",
                    Description = "Department Head - Manages department operations",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow,
                },
                new Role
                {
                    RoleName = "Manager",
                    RoleCode = "MANAGER",
                    Description = "Manager - Manages team performance and operations",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow,
                },
                new Role
                {
                    RoleName = "Employee",
                    RoleCode = "EMPLOYEE",
                    Description = "Regular employee user",
                    IsSystemRole = true,
                    CreatedAt = DateTime.UtcNow,
                },
            };

            foreach (var role in roles)
            {
                var existingRole = await context.Roles.FirstOrDefaultAsync(r =>
                    r.RoleCode == role.RoleCode
                );

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
                    DepartmentCode = "ADMIN100",
                    BudgetAllocated = 0,
                    CostCenter = "ADMIN001",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                },
                new Department
                {
                    DepartmentName = "Human Resources",
                    DepartmentCode = "HR100",
                    BudgetAllocated = 0,
                    CostCenter = "HR001",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                },
                new Department
                {
                    DepartmentName = "Information Technology",
                    DepartmentCode = "IT100",
                    BudgetAllocated = 0,
                    CostCenter = "IT001",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                },
                new Department
                {
                    DepartmentName = "Finance",
                    DepartmentCode = "FIN100",
                    BudgetAllocated = 0,
                    CostCenter = "FIN001",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                },
                new Department
                {
                    DepartmentName = "Operations",
                    DepartmentCode = "OPS100",
                    BudgetAllocated = 0,
                    CostCenter = "OPS001",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                },
            };

            foreach (var department in departments)
            {
                var existingDepartment = await context.Departments.FirstOrDefaultAsync(d =>
                    d.DepartmentName == department.DepartmentName
                );

                if (existingDepartment == null)
                {
                    context.Departments.Add(department);
                    Console.WriteLine($"   Added department: {department.DepartmentName}");
                }
                else
                {
                    Console.WriteLine(
                        $"    Department already exists: {department.DepartmentName}"
                    );
                }
            }

            await context.SaveChangesAsync();
            Console.WriteLine(" Departments seeding completed!");
        }

        /// <summary>
        /// Seeds admin user with all required data
        /// </summary>
        private static async Task SeedAdminUserAsync(
            EEPZDbContext context,
            IConfiguration configuration
        )
        {
            Console.WriteLine(" Seeding admin user...");

            try
            {
                // Check if admin already exists
                var adminEmail =
                    configuration["AdminSeedData:Email"] ?? "emailserviceeepz@gmail.com";
                var existingAdmin = await context.Userauthentications.FirstOrDefaultAsync(u =>
                    u.Email == adminEmail
                );

                if (existingAdmin != null)
                {
                    Console.WriteLine("    Admin user already exists. Skipping seed.");
                    return;
                }

                // Get Admin Role
                var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleCode == "ADMIN");
                if (adminRole == null)
                {
                    throw new Exception(
                        "Admin role not found. Please ensure roles are seeded first."
                    );
                }

                // Get Administration Department
                var adminDepartment = await context.Departments.FirstOrDefaultAsync(d =>
                    d.DepartmentName == "Administration"
                );
                if (adminDepartment == null)
                {
                    throw new Exception(
                        "Administration department not found. Please ensure departments are seeded first."
                    );
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
                    CreatedAt = DateTime.UtcNow,
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
                    CreatedAt = DateTime.UtcNow,
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
                    MobileNumber = configuration["AdminSeedData:MobileNumber"] ?? "+91-0000000000",
                };
                context.Userprofiles.Add(adminProfile);
                await context.SaveChangesAsync();
                Console.WriteLine(
                    $"   Created admin profile: {adminProfile.FirstName} {adminProfile.LastName}"
                );

                // Assign Role and Department to Admin
                var adminEmployeeDetails = new Employeedetailsmaster
                {
                    EmployeeId = adminEmployee.EmployeeId,
                    RoleId = adminRole.RoleId,
                    DepartmentId = adminDepartment.DepartmentId,
                };
                context.Employeedetailsmasters.Add(adminEmployeeDetails);
                await context.SaveChangesAsync();
                Console.WriteLine("   Assigned role and department to admin");

                Console.WriteLine("\n" + new string('=', 60));
                Console.WriteLine(" ADMIN USER SEEDED SUCCESSFULLY!");
                Console.WriteLine(new string('=', 60));
                Console.WriteLine($" Email: {adminEmail}");
                Console.WriteLine($" Password: {adminPassword}");
                Console.WriteLine($" Name: {adminProfile.FirstName} {adminProfile.LastName}");
                Console.WriteLine(" Role: Admin");
                Console.WriteLine(" Department: Administration");
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

            var existingProject = await context.Projects.FirstOrDefaultAsync(p =>
                p.ProjectName == "ORG.RZ.RESOURCEPOOL"
            );

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
                    UpdatedAt = DateTime.UtcNow,
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
                },
            };

            int addedCount = 0;
            int skippedCount = 0;

            foreach (var skill in skills)
            {
                var existingSkill = await context.MasterSkills.FirstOrDefaultAsync(s =>
                    s.SkillName == skill.SkillName
                );

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

            Console.WriteLine("Master skills seeding completed!");
            Console.WriteLine(
                $"Added: {addedCount} | Skipped: {skippedCount} | Total: {skills.Count}"
            );
            Console.WriteLine(new string('-', 50));
        }

        /// <summary>
        /// Seeds chat patterns for admin assistant
        /// </summary>
        private static async Task SeedChatPatternsAsync(EEPZDbContext context)
        {
            Console.WriteLine("Seeding chat patterns...");

            var patterns = new List<Chatpattern>
            {
                // === GREETINGS ===
                new Chatpattern
                {
                    Pattern = "hello",
                    Response = "Hello Admin! 👋 I can help you with user management, bulk operations, change requests, roles, departments, and exports. What would you like to do?",
                    Category = "greeting",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "hi",
                    Response = "Hi there! How can I assist you today with your admin tasks?",
                    Category = "greeting",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "hey",
                    Response = "Hey! Ready to help you manage the EEPZ system. What do you need?",
                    Category = "greeting",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // === USER MANAGEMENT ===
                new Chatpattern
                {
                    Pattern = "create user",
                    Response = "To create a user, I need: Employee Company ID, Email, First Name, Last Name, Role, and Department. Would you like to:\n1. Create single user\n2. Bulk create users\n3. Upload Excel file",
                    Category = "user_management",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "add user",
                    Response = "To add a new user, I need: Employee Company ID, Email, First Name, Last Name, Role, and Department. Would you like to:\n1. Create single user\n2. Bulk create users\n3. Upload Excel file",
                    Category = "user_management",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "new user",
                    Response = "To create a new user, provide: Employee Company ID, Email, Name, Role, Department. Type \"create single user\" or \"bulk create\" based on your need.",
                    Category = "user_management",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "update user",
                    Response = "To update a user, I need the User ID and what you want to change (name, email, role, department, etc.). What user would you like to update?",
                    Category = "user_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "edit user",
                    Response = "I can help you edit user details. Please provide the User ID or Employee Company ID you want to update.",
                    Category = "user_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "modify user",
                    Response = "To modify user information, provide the User ID and the fields you want to change.",
                    Category = "user_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "deactivate user",
                    Response = "To deactivate a user, provide the User ID or Employee Company ID. Type: \"deactivate user [ID]\"",
                    Category = "user_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "activate user",
                    Response = "To activate a user, provide the User ID or Employee Company ID. Type: \"activate user [ID]\"",
                    Category = "user_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "disable user",
                    Response = "To disable a user account, provide the User ID. Type: \"deactivate user [ID]\"",
                    Category = "user_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "list users",
                    Response = "Fetching all users... Please wait a moment.",
                    Category = "user_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "show all users",
                    Response = "Retrieving complete user list...",
                    Category = "user_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "get users",
                    Response = "Loading all users from the system...",
                    Category = "user_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "user details",
                    Response = "To get user details, provide the User ID or Employee Company ID. Type: \"get user [ID]\"",
                    Category = "user_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "find user",
                    Response = "Please provide the User ID, Email, or Employee Company ID to search for a user.",
                    Category = "user_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "search user",
                    Response = "I can search users by: User ID, Email, Employee Company ID, or Name. What are you looking for?",
                    Category = "user_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // === BULK OPERATIONS ===
                new Chatpattern
                {
                    Pattern = "bulk create",
                    Response = "For bulk user creation, you can:\n1. Upload Excel file (.xlsx/.xls)\n2. Provide JSON data with multiple users\n3. Download our Excel template\n\nWhich option do you prefer?",
                    Category = "bulk_operations",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "bulk upload",
                    Response = "Ready for bulk user upload! Please upload your Excel file (.xlsx or .xls). Make sure it follows our template format.",
                    Category = "bulk_operations",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "import users",
                    Response = "To import users from Excel:\n1. Download template: \"download user template\"\n2. Fill in user details\n3. Upload the file here",
                    Category = "bulk_operations",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "bulk inactivate",
                    Response = "To bulk inactivate users, provide a list of User IDs (comma-separated). Example: \"inactivate users 101,102,103\"",
                    Category = "bulk_operations",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "deactivate multiple",
                    Response = "I can deactivate multiple users at once. Provide User IDs separated by commas.",
                    Category = "bulk_operations",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "download template",
                    Response = "Generating Excel template for bulk user upload... Click the link to download.",
                    Category = "bulk_operations",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "user template",
                    Response = "I'll generate the bulk user import template. One moment...",
                    Category = "bulk_operations",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "bulk operation logs",
                    Response = "Fetching bulk operation history... This shows all recent bulk imports and their status.",
                    Category = "bulk_operations",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "import history",
                    Response = "Loading your bulk operation logs...",
                    Category = "bulk_operations",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // === CHANGE REQUESTS ===
                new Chatpattern
                {
                    Pattern = "change requests",
                    Response = "Change request options:\n1. View pending requests\n2. View all requests\n3. Approve/Reject request\n4. View user's requests\n\nWhat would you like to do?",
                    Category = "change_requests",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "pending requests",
                    Response = "Fetching all pending change requests...",
                    Category = "change_requests",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "approve request",
                    Response = "To approve a change request, provide the Request ID. Type: \"approve request [ID]\"",
                    Category = "change_requests",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "reject request",
                    Response = "To reject a change request, provide the Request ID and reason. Type: \"reject request [ID]\"",
                    Category = "change_requests",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "process request",
                    Response = "I can help process change requests. Do you want to approve or reject? Provide Request ID.",
                    Category = "change_requests",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "all change requests",
                    Response = "Loading all change requests (approved, rejected, pending)...",
                    Category = "change_requests",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // === ROLE MANAGEMENT ===
                new Chatpattern
                {
                    Pattern = "create role",
                    Response = "To create a new role, provide:\n- Role Name\n- Role Code\n- Description (optional)\n\nExample: \"create role name=Manager code=MGR description=Team Manager\"",
                    Category = "role_management",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "add role",
                    Response = "I can add a new role. Provide: Role Name, Role Code, and Description.",
                    Category = "role_management",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "update role",
                    Response = "To update a role, provide Role ID and the fields to change. Type: \"update role [ID] name=NewName\"",
                    Category = "role_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "edit role",
                    Response = "I can edit role details. Provide the Role ID you want to update.",
                    Category = "role_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "delete role",
                    Response = "To delete a role, provide the Role ID. Type: \"delete role [ID]\". Note: Cannot delete if users are assigned.",
                    Category = "role_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "remove role",
                    Response = "I can remove a role if no users are assigned to it. Provide Role ID.",
                    Category = "role_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "list roles",
                    Response = "Fetching all roles in the system...",
                    Category = "role_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "show roles",
                    Response = "Loading complete role list...",
                    Category = "role_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "get roles",
                    Response = "Retrieving all available roles...",
                    Category = "role_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "role details",
                    Response = "To get role details, provide the Role ID. Type: \"get role [ID]\"",
                    Category = "role_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // === DEPARTMENT MANAGEMENT ===
                new Chatpattern
                {
                    Pattern = "create department",
                    Response = "To create a department, provide:\n- Department Name\n- Budget Allocated (optional)\n- Cost Center (optional)\n\nExample: \"create department name=IT budget=500000\"",
                    Category = "department_management",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "add department",
                    Response = "I can add a new department. Provide: Department Name, Budget, Cost Center.",
                    Category = "department_management",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "update department",
                    Response = "To update a department, provide Department ID and fields to change. Type: \"update department [ID] name=NewName\"",
                    Category = "department_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "edit department",
                    Response = "I can edit department details. Provide the Department ID.",
                    Category = "department_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "delete department",
                    Response = "To delete a department, provide Department ID. Type: \"delete department [ID]\". Note: Cannot delete if users are assigned.",
                    Category = "department_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "remove department",
                    Response = "I can remove a department if no users are assigned. Provide Department ID.",
                    Category = "department_management",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "list departments",
                    Response = "Fetching all departments...",
                    Category = "department_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "show departments",
                    Response = "Loading department list...",
                    Category = "department_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "get departments",
                    Response = "Retrieving all departments...",
                    Category = "department_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "department details",
                    Response = "To get department details, provide Department ID. Type: \"get department [ID]\"",
                    Category = "department_management",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // === EXPORT OPERATIONS ===
                new Chatpattern
                {
                    Pattern = "export users",
                    Response = "Generating Excel export of all users... This may take a moment.",
                    Category = "export",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "download users",
                    Response = "Preparing user data export to Excel...",
                    Category = "export",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "export roles",
                    Response = "Generating Excel export of all roles...",
                    Category = "export",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "download roles",
                    Response = "Preparing role data export...",
                    Category = "export",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "export departments",
                    Response = "Generating Excel export of all departments...",
                    Category = "export",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "download departments",
                    Response = "Preparing department data export...",
                    Category = "export",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                new Chatpattern
                {
                    Pattern = "export all data",
                    Response = "Generating complete EEPZ export (Users, Roles, Departments) in single Excel with multiple sheets...",
                    Category = "export",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "export everything",
                    Response = "Preparing complete system export... This includes all users, roles, and departments.",
                    Category = "export",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "download all",
                    Response = "Generating comprehensive data export...",
                    Category = "export",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // === ASSIGN ROLE & DEPARTMENT ===
                new Chatpattern
                {
                    Pattern = "assign role",
                    Response = "To assign a role and department to a user:\n- User ID\n- Role ID\n- Department ID\n\nType: \"assign user [UserID] role=[RoleID] department=[DeptID]\"",
                    Category = "assignment",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "assign department",
                    Response = "I can assign role and department. Provide: User ID, Role ID, Department ID.",
                    Category = "assignment",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "change user role",
                    Response = "To change user's role and department, provide User ID, new Role ID, and Department ID.",
                    Category = "assignment",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // === HELP & GUIDANCE ===
                new Chatpattern
                {
                    Pattern = "help",
                    Response = "I can assist you with:\n\n📋 **User Management**: create, update, activate, deactivate users\n📦 **Bulk Operations**: import users via Excel, bulk inactivate\n✏️ **Change Requests**: view, approve, reject pending requests\n👥 **Roles**: create, update, delete, list roles\n🏢 **Departments**: create, update, delete, list departments\n📥 **Exports**: export users, roles, departments, or all data\n\nType a command or ask me what you need!",
                    Category = "help",
                    Priority = 10,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "what can you do",
                    Response = "I can help you with user management, bulk operations, change requests, role/department management, and data exports. Type \"help\" for detailed commands.",
                    Category = "help",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "commands",
                    Response = "Available commands:\n- User Management: create/update/deactivate/activate user, list users\n- Bulk: bulk create, bulk inactivate, download template\n- Change Requests: pending requests, approve/reject request\n- Roles: create/update/delete role, list roles\n- Departments: create/update/delete department, list departments\n- Exports: export users/roles/departments/all data",
                    Category = "help",
                    Priority = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // === STATISTICS & REPORTS ===
                new Chatpattern
                {
                    Pattern = "user statistics",
                    Response = "Generating user statistics:\n- Total Users\n- Active Users\n- Inactive Users\n- Users by Role\n- Users by Department",
                    Category = "statistics",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "dashboard",
                    Response = "Loading admin dashboard data...",
                    Category = "statistics",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "system status",
                    Response = "Fetching system status:\n- Total Users: [loading...]\n- Pending Change Requests: [loading...]\n- Recent Bulk Operations: [loading...]\n- Active Roles: [loading...]\n- Active Departments: [loading...]",
                    Category = "statistics",
                    Priority = 9,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // === ERRORS & FALLBACK ===
                new Chatpattern
                {
                    Pattern = "thanks",
                    Response = "You're welcome! Let me know if you need anything else. 😊",
                    Category = "closing",
                    Priority = 5,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "thank you",
                    Response = "Happy to help! Feel free to ask anytime.",
                    Category = "closing",
                    Priority = 5,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "bye",
                    Response = "Goodbye! Have a productive day managing EEPZ! 👋",
                    Category = "closing",
                    Priority = 5,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Chatpattern
                {
                    Pattern = "goodbye",
                    Response = "See you later! Don't hesitate to reach out for help.",
                    Category = "closing",
                    Priority = 5,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
            };

            int added = 0;
            int skipped = 0;

            foreach (var pattern in patterns)
            {
                var exists = await context.Chatpatterns
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Pattern == pattern.Pattern);

                if (exists == null)
                {
                    context.Chatpatterns.Add(pattern);
                    added++;
                }
                else
                {
                    skipped++;
                    Console.WriteLine($"Chatpattern already exists: {pattern.Pattern}");
                }
            }

            if (added > 0)
            {
                await context.SaveChangesAsync();
            }

            Console.WriteLine($"Chat patterns seeding completed! Added: {added}, Skipped: {skipped}");
        }
    }
}

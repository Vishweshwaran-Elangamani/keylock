using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Configuration;
using MapsterMapper;
using Relevantz.EEPZ.Core.Service;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Core.Tests
{
    [TestFixture]
    public class ServiceTests
    {
        private IConfiguration CreateMockConfiguration()
        {
            var inMemorySettings = new Dictionary<string, string> {
                {"PasswordSettings:TemporaryPasswordLength", "12"},
                {"PasswordSettings:RequireUppercase", "true"},
                {"PasswordSettings:RequireLowercase", "true"},
                {"PasswordSettings:RequireDigit", "true"},
                {"PasswordSettings:RequireSpecialChar", "true"},
                {"PasswordSettings:MinimumLength", "8"},
                {"Jwt:Issuer", "TestIssuer"},
                {"Jwt:Audience", "TestAudience"},
                {"Jwt:SecretKey", "YourVerySecureSecretKeyThatIsAtLeast32CharactersLongForTesting"},
                {"Jwt:RefreshTokenExpirationDays", "7"}
            };

            return new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings!)
                .Build();
        }

        [Test]
        public void TestSetup_Passes()
        {
            Assert.Pass("Test infrastructure is working");
        }

        [Test]
        public void PasswordService_HashPassword_ReturnsHash()
        {
            // Arrange
            var config = CreateMockConfiguration();
            var service = new PasswordService(config);

            // Act
            var result = service.HashPassword("Test123!");

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result, Is.Not.EqualTo("Test123!"));
        }

        [Test]
        public void PasswordService_VerifyPassword_ReturnsTrue()
        {
            // Arrange
            var config = CreateMockConfiguration();
            var service = new PasswordService(config);
            var hash = service.HashPassword("Test123!");

            // Act
            var result = service.VerifyPassword("Test123!", hash);

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public void PasswordService_GenerateTemporaryPassword_ReturnsValidPassword()
        {
            // Arrange
            var config = CreateMockConfiguration();
            var service = new PasswordService(config);

            // Act
            var result = service.GenerateTemporaryPassword();

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Length, Is.EqualTo(12));
        }

        [Test]
        public void PasswordService_ValidatePasswordStrength_WithStrongPassword_ReturnsTrue()
        {
            // Arrange
            var config = CreateMockConfiguration();
            var service = new PasswordService(config);

            // Act
            var result = service.ValidatePasswordStrength("Strong123!");

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public async Task RoleService_GetRoleById_ReturnsRole()
        {
            // Arrange
            var mockRepo = new Mock<IRoleRepository>();
            var expectedRole = new Role { RoleId = 1, RoleName = "Admin", RoleCode = "ADM" };
            mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(expectedRole);

            var service = new RoleService(mockRepo.Object);

            // Act
            var result = await service.GetRoleByIdAsync(1);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.RoleName, Is.EqualTo("Admin"));
        }

        [Test]
        public async Task RoleService_GetAllRoles_ReturnsRoleList()
        {
            // Arrange
            var mockRepo = new Mock<IRoleRepository>();
            var roles = new List<Role>
            {
                new Role { RoleId = 1, RoleName = "Admin", RoleCode = "ADM" },
                new Role { RoleId = 2, RoleName = "User", RoleCode = "USR" }
            };
            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(roles);

            var service = new RoleService(mockRepo.Object);

            // Act
            var result = await service.GetAllRolesAsync();

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count(), Is.EqualTo(2));
        }

        [Test]
        public async Task TokenService_ValidateRefreshToken_ReturnsFalse_WhenInvalid()
        {
            // Arrange
            var mockRepo = new Mock<IRefreshTokenRepository>();
            var config = CreateMockConfiguration();
            
            mockRepo.Setup(r => r.GetByTokenAsync("invalid")).ReturnsAsync((Refreshtoken?)null);

            var service = new TokenService(null!, mockRepo.Object, config);

            // Act
            var result = await service.ValidateRefreshTokenAsync("invalid");

            // Assert
            Assert.That(result, Is.False);
        }

        [Test]
        public async Task TokenService_ValidateRefreshToken_ReturnsTrue_WhenValid()
        {
            // Arrange
            var mockRepo = new Mock<IRefreshTokenRepository>();
            var config = CreateMockConfiguration();
            
            var validToken = new Refreshtoken 
            { 
                Token = "validtoken", 
                IsRevoked = false, 
                ExpiresAt = DateTime.UtcNow.AddDays(1) 
            };
            mockRepo.Setup(r => r.GetByTokenAsync("validtoken")).ReturnsAsync(validToken);

            var service = new TokenService(null!, mockRepo.Object, config);

            // Act
            var result = await service.ValidateRefreshTokenAsync("validtoken");

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public void ExportService_GetLastExportPassword_ReturnsPassword()
        {
            // Arrange
            var mockRoleRepo = new Mock<IRoleRepository>();
            var mockDeptRepo = new Mock<IDepartmentRepository>();
            var mockUserRepo = new Mock<IUserAuthenticationRepository>();
            
            var service = new ExportService(mockRoleRepo.Object, mockDeptRepo.Object, mockUserRepo.Object);

            // Act
            var result = service.GetLastExportPassword();

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result, Is.Not.Empty);
        }

        [Test]
        public async Task DepartmentService_GetAllDepartments_ReturnsListOrEmpty()
        {
            // Arrange
            var mockDeptRepo = new Mock<IDepartmentRepository>();
            var mockEmpRepo = new Mock<IEmployeeRepository>();
            var mockMapper = new Mock<IMapper>();
            
            mockDeptRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Department>());
            mockMapper.Setup(m => m.Map<IEnumerable<DepartmentResponseDto>>(It.IsAny<List<Department>>()))
                .Returns(new List<DepartmentResponseDto>());

            var service = new DepartmentService(mockDeptRepo.Object, mockEmpRepo.Object, mockMapper.Object);

            // Act
            var result = await service.GetAllDepartmentsAsync();

            // Assert
            Assert.That(result, Is.Not.Null);
        }

        [Test]
        public async Task DepartmentService_GetDepartmentById_ReturnsDepartment()
        {
            // Arrange
            var mockDeptRepo = new Mock<IDepartmentRepository>();
            var mockEmpRepo = new Mock<IEmployeeRepository>();
            var mockMapper = new Mock<IMapper>();
            
            var department = new Department 
            { 
                DepartmentId = 1, 
                DepartmentCode = "IT001", 
                DepartmentName = "IT Department" 
            };
            
            mockDeptRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(department);
            mockMapper.Setup(m => m.Map<DepartmentResponseDto>(department))
                .Returns(new DepartmentResponseDto 
                { 
                    DepartmentId = 1, 
                    DepartmentName = "IT Department" 
                });

            var service = new DepartmentService(mockDeptRepo.Object, mockEmpRepo.Object, mockMapper.Object);

            // Act
            var result = await service.GetDepartmentByIdAsync(1);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.DepartmentName, Is.EqualTo("IT Department"));
        }
    }
}

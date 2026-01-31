using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Relevantz.EEPZ.Api.Controllers;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Api.Tests.Controllers
{
    [TestFixture]
    public class AuthenticationControllerTests
    {
        private Mock<IAuthenticationService> _mockAuthService;
        private Mock<ILogger<AuthenticationController>> _mockLogger;
        private AuthenticationController _controller;

        [SetUp]
        public void Setup()
        {
            _mockAuthService = new Mock<IAuthenticationService>();
            _mockLogger = new Mock<ILogger<AuthenticationController>>();
            _controller = new AuthenticationController(_mockAuthService.Object, _mockLogger.Object);
            
            var httpContext = new DefaultHttpContext();
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");
            httpContext.Request.Headers["User-Agent"] = "Test Agent";
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        }

        [Test]
        public async Task Login_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            var loginRequest = new LoginRequestDto { Email = "test@example.com" };
            var expectedResponse = new ApiResponseDto<LoginResponseDto> 
            { 
                Success = true, 
                Message = "OTP sent",
                Data = new LoginResponseDto()
            };
            _mockAuthService
                .Setup(s => s.LoginAsync(It.IsAny<LoginRequestDto>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            _mockAuthService.Verify(s => s.LoginAsync(It.IsAny<LoginRequestDto>()), Times.Once);
        }

        [Test]
        public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var loginRequest = new LoginRequestDto { Email = "invalid@example.com" };
            var expectedResponse = new ApiResponseDto<LoginResponseDto> 
            { 
                Success = false, 
                Message = "Invalid credentials" 
            };
            _mockAuthService
                .Setup(s => s.LoginAsync(It.IsAny<LoginRequestDto>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task VerifyOtp_WithValidOtp_ReturnsOkResult()
        {
            // Arrange
            var verifyRequest = new VerifyOtpRequestDto { Email = "test@example.com" };
            var expectedResponse = new ApiResponseDto<LoginResponseDto> 
            { 
                Success = true,
                Data = new LoginResponseDto()
            };
            _mockAuthService
                .Setup(s => s.VerifyOtpAndLoginAsync(It.IsAny<VerifyOtpRequestDto>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.VerifyOtp(verifyRequest);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task VerifyOtp_WithInvalidOtp_ReturnsBadRequest()
        {
            // Arrange
            var verifyRequest = new VerifyOtpRequestDto { Email = "test@example.com" };
            var expectedResponse = new ApiResponseDto<LoginResponseDto> 
            { 
                Success = false, 
                Message = "Invalid OTP" 
            };
            _mockAuthService
                .Setup(s => s.VerifyOtpAndLoginAsync(It.IsAny<VerifyOtpRequestDto>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.VerifyOtp(verifyRequest);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ForgotPassword_WithValidEmail_ReturnsOkResult()
        {
            // Arrange
            var request = new ForgotPasswordRequestDto { Email = "test@example.com" };
            var expectedResponse = new ApiResponseDto<OtpResponseDto> 
            { 
                Success = true,
                Data = new OtpResponseDto()
            };
            _mockAuthService
                .Setup(s => s.ForgotPasswordAsync(It.IsAny<ForgotPasswordRequestDto>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.ForgotPassword(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task ResetPassword_WithValidData_ReturnsOkResult()
        {
            // Arrange
            var request = new ResetPasswordRequestDto { Email = "test@example.com", NewPassword = "NewPass123!" };
            var expectedResponse = new ApiResponseDto<string> { Success = true };
            _mockAuthService
                .Setup(s => s.ResetPasswordAsync(It.IsAny<ResetPasswordRequestDto>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.ResetPassword(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task ResetPassword_WithInvalidData_ReturnsBadRequest()
        {
            // Arrange
            var request = new ResetPasswordRequestDto { Email = "test@example.com", NewPassword = "NewPass123!" };
            var expectedResponse = new ApiResponseDto<string> 
            { 
                Success = false, 
                Message = "Invalid OTP" 
            };
            _mockAuthService
                .Setup(s => s.ResetPasswordAsync(It.IsAny<ResetPasswordRequestDto>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.ResetPassword(request);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ChangePassword_WithValidAuthentication_ReturnsOkResult()
        {
            // Arrange
            var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "1") };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

            var request = new ChangePasswordRequestDto { NewPassword = "NewPass123!" };
            var expectedResponse = new ApiResponseDto<string> { Success = true };
            _mockAuthService
                .Setup(s => s.ChangePasswordAsync(It.IsAny<int>(), It.IsAny<ChangePasswordRequestDto>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.ChangePassword(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task ChangePassword_WithInvalidToken_ReturnsUnauthorized()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();
            var request = new ChangePasswordRequestDto();

            // Act
            var result = await _controller.ChangePassword(request);

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task Logout_WithValidUser_ReturnsOkResult()
        {
            // Arrange
            var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "1") };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

            var expectedResponse = new ApiResponseDto<string> { Success = true };
            _mockAuthService
                .Setup(s => s.LogoutAsync(It.IsAny<int>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.Logout();

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            _mockAuthService.Verify(s => s.LogoutAsync(1), Times.Once);
        }
    }

    [TestFixture]
    public class BulkOperationControllerTests
    {
        private Mock<IBulkOperationService> _mockBulkService;
        private Mock<IExportService> _mockExportService;
        private BulkOperationController _controller;

        [SetUp]
        public void Setup()
        {
            _mockBulkService = new Mock<IBulkOperationService>();
            _mockExportService = new Mock<IExportService>();
            _controller = new BulkOperationController(_mockBulkService.Object, _mockExportService.Object);
            
            var httpContext = new DefaultHttpContext();
            var claims = new List<Claim> 
            { 
                new Claim(ClaimTypes.NameIdentifier, "1"), 
                new Claim(ClaimTypes.Role, "Admin") 
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            httpContext.User = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        }

        [Test]
        public async Task BulkCreateUsers_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            var request = new BulkUserCreateRequestDto { Users = new List<CreateUserRequestDto>() };
            var expectedResponse = new BulkOperationResponseDto();
            _mockBulkService
                .Setup(s => s.BulkCreateUsersAsync(It.IsAny<List<CreateUserRequestDto>>(), It.IsAny<int>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.BulkCreateUsers(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task BulkCreateUsers_WithoutAuthentication_ReturnsUnauthorized()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();
            var request = new BulkUserCreateRequestDto();

            // Act
            var result = await _controller.BulkCreateUsers(request);

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task BulkInactivateUsers_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            var request = new BulkUserInactivateRequestDto { UserIds = new List<int> { 1, 2, 3 } };
            var expectedResponse = new BulkOperationResponseDto();
            _mockBulkService
                .Setup(s => s.BulkInactivateUsersAsync(It.IsAny<BulkUserInactivateRequestDto>(), It.IsAny<int>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.BulkInactivateUsers(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task BulkCreateUsersFromExcel_WithValidFile_ReturnsOkResult()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            var ms = new MemoryStream(new byte[] { 1, 2, 3 });
            fileMock.Setup(_ => _.OpenReadStream()).Returns(ms);
            fileMock.Setup(_ => _.FileName).Returns("test.xlsx");
            fileMock.Setup(_ => _.Length).Returns(100);
            fileMock.Setup(_ => _.ContentType).Returns("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

            var expectedResponse = new BulkOperationResponseDto();
            _mockBulkService
                .Setup(s => s.BulkCreateUsersFromExcelAsync(It.IsAny<Stream>(), It.IsAny<int>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.BulkCreateUsersFromExcel(fileMock.Object);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task BulkCreateUsersFromExcel_WithNullFile_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.BulkCreateUsersFromExcel(null!);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task BulkCreateUsersFromExcel_WithInvalidExtension_ReturnsBadRequest()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(_ => _.FileName).Returns("test.txt");
            fileMock.Setup(_ => _.Length).Returns(100);

            // Act
            var result = await _controller.BulkCreateUsersFromExcel(fileMock.Object);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task DownloadExcelTemplate_ReturnsFileResult()
        {
            // Arrange
            var templateBytes = new byte[] { 1, 2, 3, 4, 5 };
            _mockBulkService
                .Setup(s => s.GenerateExcelTemplateAsync())
                .ReturnsAsync(templateBytes);

            // Act
            var result = await _controller.DownloadExcelTemplate();

            // Assert
            Assert.That(result, Is.InstanceOf<FileContentResult>());
            var fileResult = result as FileContentResult;
            Assert.That(fileResult!.ContentType, Is.EqualTo("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        }

        [Test]
        public async Task ExportRoles_ReturnsFileWithPassword()
        {
            // Arrange
            var fileBytes = new byte[] { 1, 2, 3 };
            _mockExportService.Setup(s => s.ExportRolesToExcelAsync()).ReturnsAsync(fileBytes);
            _mockExportService.Setup(s => s.GetLastExportPassword()).Returns("TestPassword123");

            // Act
            var result = await _controller.ExportRoles();

            // Assert
            Assert.That(result, Is.InstanceOf<FileContentResult>());
            Assert.That(_controller.Response.Headers.ContainsKey("X-Export-Password"), Is.True);
        }

        [Test]
        public async Task ExportUsers_ReturnsFileResult()
        {
            // Arrange
            var fileBytes = new byte[] { 1, 2, 3 };
            _mockExportService.Setup(s => s.ExportUsersToExcelAsync()).ReturnsAsync(fileBytes);
            _mockExportService.Setup(s => s.GetLastExportPassword()).Returns("TestPassword123");

            // Act
            var result = await _controller.ExportUsers();

            // Assert
            Assert.That(result, Is.InstanceOf<FileContentResult>());
        }

        [Test]
        public async Task ExportAllData_ReturnsFileResult()
        {
            // Arrange
            var fileBytes = new byte[] { 1, 2, 3 };
            _mockExportService.Setup(s => s.ExportAllDataToExcelAsync()).ReturnsAsync(fileBytes);
            _mockExportService.Setup(s => s.GetLastExportPassword()).Returns("TestPassword123");

            // Act
            var result = await _controller.ExportAllData();

            // Assert
            Assert.That(result, Is.InstanceOf<FileContentResult>());
        }
    }

    [TestFixture]
    public class ChangeRequestControllerTests
    {
        private Mock<IChangeRequestService> _mockChangeRequestService;
        private ChangeRequestController _controller;

        [SetUp]
        public void Setup()
        {
            _mockChangeRequestService = new Mock<IChangeRequestService>();
            _controller = new ChangeRequestController(_mockChangeRequestService.Object);
            
            var httpContext = new DefaultHttpContext();
            var claims = new List<Claim> 
            { 
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "User")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            httpContext.User = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        }

        [Test]
        public async Task SubmitChangeRequest_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            var request = new ChangeRequestDto();
            var expectedResponse = new ChangeRequestResponseDto();
            _mockChangeRequestService
                .Setup(s => s.SubmitChangeRequestAsync(It.IsAny<int>(), It.IsAny<ChangeRequestDto>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.SubmitChangeRequest(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task ProcessChangeRequest_WithAdminRole_ReturnsOkResult()
        {
            // Arrange
            var claims = new List<Claim> 
            { 
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

            var request = new ProcessChangeRequestDto();
            var expectedResponse = new ChangeRequestResponseDto();
            _mockChangeRequestService
                .Setup(s => s.ProcessChangeRequestAsync(It.IsAny<ProcessChangeRequestDto>(), It.IsAny<int>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.ProcessChangeRequest(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetPendingRequests_AsAdmin_ReturnsOkResult()
        {
            // Arrange
            var claims = new List<Claim> 
            { 
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

            var expectedResponse = new List<ChangeRequestResponseDto>();
            _mockChangeRequestService
                .Setup(s => s.GetPendingRequestsAsync())
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.GetPendingRequests();

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetMyChangeRequests_ReturnsOkResult()
        {
            // Arrange
            var expectedResponse = new List<ChangeRequestResponseDto>();
            _mockChangeRequestService
                .Setup(s => s.GetUserChangeRequestsAsync(It.IsAny<int>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.GetMyChangeRequests();

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            _mockChangeRequestService.Verify(s => s.GetUserChangeRequestsAsync(1), Times.Once);
        }

        [Test]
        public async Task CancelChangeRequest_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            int requestId = 1;
            _mockChangeRequestService
                .Setup(s => s.CancelChangeRequestAsync(It.IsAny<int>(), requestId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.CancelChangeRequest(requestId);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task HasPendingRequest_WithPendingRequest_ReturnsOkWithData()
        {
            // Arrange
            var expectedResponse = new ChangeRequestResponseDto();
            _mockChangeRequestService
                .Setup(s => s.HasPendingRequestAsync(It.IsAny<int>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.HasPendingRequest();

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task HasPendingRequest_WithNoPendingRequest_ReturnsOkWithNull()
        {
            // Arrange
            _mockChangeRequestService
                .Setup(s => s.HasPendingRequestAsync(It.IsAny<int>()))
                .ReturnsAsync((ChangeRequestResponseDto?)null);

            // Act
            var result = await _controller.HasPendingRequest();

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }
    }

    [TestFixture]
    public class RoleDepartmentManagementControllerTests
    {
        private Mock<IRoleService> _mockRoleService;
        private Mock<IDepartmentService> _mockDepartmentService;
        private Mock<ILogger<RoleDepartmentManagementController>> _mockLogger;
        private RoleDepartmentManagementController _controller;

        [SetUp]
        public void Setup()
        {
            _mockRoleService = new Mock<IRoleService>();
            _mockDepartmentService = new Mock<IDepartmentService>();
            _mockLogger = new Mock<ILogger<RoleDepartmentManagementController>>();
            _controller = new RoleDepartmentManagementController(
                _mockRoleService.Object, 
                _mockDepartmentService.Object, 
                _mockLogger.Object);
            
            var httpContext = new DefaultHttpContext();
            var claims = new List<Claim> 
            { 
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            httpContext.User = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        }

        [Test]
        public async Task CreateRole_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            var request = new CreateRoleRequestDto { RoleName = "TestRole" };
            var expectedResponse = new RoleResponseDto();
            _mockRoleService
                .Setup(s => s.CreateRoleAsync(It.IsAny<CreateRoleRequestDto>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.CreateRole(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdateRole_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            var request = new UpdateRoleRequestDto();
            var expectedResponse = new RoleResponseDto();
            _mockRoleService
                .Setup(s => s.UpdateRoleAsync(It.IsAny<UpdateRoleRequestDto>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.UpdateRole(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetAllRoles_ReturnsOkResult()
        {
            // Arrange
            var expectedResponse = new List<RoleResponseDto>();
            _mockRoleService
                .Setup(s => s.GetAllRolesAsync())
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.GetAllRoles();

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task DeleteRole_WithValidId_ReturnsOkResult()
        {
            // Arrange
            int roleId = 1;
            _mockRoleService
                .Setup(s => s.DeleteRoleAsync(roleId))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeleteRole(roleId);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task CreateDepartment_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            var request = new CreateDepartmentRequestDto { DepartmentName = "IT Department" };
            var expectedResponse = new DepartmentResponseDto();
            _mockDepartmentService
                .Setup(s => s.CreateDepartmentAsync(It.IsAny<CreateDepartmentRequestDto>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.CreateDepartment(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetAllDepartments_ReturnsOkResult()
        {
            // Arrange
            var expectedResponse = new List<DepartmentResponseDto>();
            _mockDepartmentService
                .Setup(s => s.GetAllDepartmentsAsync())
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.GetAllDepartments();

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task SearchDepartments_WithValidSearchTerm_ReturnsOkResult()
        {
            // Arrange
            string searchTerm = "IT";
            var expectedResponse = new List<DepartmentResponseDto>();
            _mockDepartmentService
                .Setup(s => s.SearchDepartmentsAsync(searchTerm))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.SearchDepartments(searchTerm);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task SearchDepartments_WithEmptySearchTerm_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.SearchDepartments("");

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }
    }

    [TestFixture]
    public class UserControllerTests
    {
        private Mock<IProfileService> _mockProfileService;
        private Mock<IUserManagementService> _mockUserManagementService;
        private UserController _controller;

        [SetUp]
        public void Setup()
        {
            _mockProfileService = new Mock<IProfileService>();
            _mockUserManagementService = new Mock<IUserManagementService>();
            _controller = new UserController(_mockProfileService.Object, _mockUserManagementService.Object);
            
            var httpContext = new DefaultHttpContext();
            var claims = new List<Claim> 
            { 
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "User")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            httpContext.User = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        }

        [Test]
        public async Task GetMyProfile_WithValidUser_ReturnsOkResult()
        {
            // Arrange
            var expectedProfile = new ProfileResponseDto();
            _mockProfileService
                .Setup(s => s.GetProfileByUserIdAsync(1))
                .ReturnsAsync(expectedProfile);

            // Act
            var result = await _controller.GetMyProfile();

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetMyProfile_WithInvalidUser_ReturnsUnauthorized()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

            // Act
            var result = await _controller.GetMyProfile();

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task UpdateMyProfile_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            var request = new UpdateProfileRequestDto();
            var expectedProfile = new ProfileResponseDto();
            _mockProfileService
                .Setup(s => s.UpdateProfileAsync(1, It.IsAny<UpdateProfileRequestDto>()))
                .ReturnsAsync(expectedProfile);

            // Act
            var result = await _controller.UpdateMyProfile(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task UploadProfilePhoto_WithValidFile_ReturnsOkResult()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            var ms = new MemoryStream(new byte[] { 1, 2, 3 });
            fileMock.Setup(_ => _.OpenReadStream()).Returns(ms);
            fileMock.Setup(_ => _.FileName).Returns("profile.jpg");
            fileMock.Setup(_ => _.Length).Returns(100);
            fileMock.Setup(_ => _.ContentType).Returns("image/jpeg");

            var expectedProfile = new ProfileResponseDto();
            _mockProfileService
                .Setup(s => s.UpdateProfileAsync(1, It.IsAny<UpdateProfileRequestDto>()))
                .ReturnsAsync(expectedProfile);

            // Act
            var result = await _controller.UploadProfilePhoto(fileMock.Object);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task UploadProfilePhoto_WithNullFile_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.UploadProfilePhoto(null!);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task UploadProfilePhoto_WithInvalidFileType_ReturnsBadRequest()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(_ => _.Length).Returns(100);
            fileMock.Setup(_ => _.ContentType).Returns("application/pdf");

            // Act
            var result = await _controller.UploadProfilePhoto(fileMock.Object);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreateUser_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            var request = new CreateUserRequestDto { Email = "newuser@example.com" };
            var expectedUser = new UserResponseDto();
            _mockUserManagementService
                .Setup(s => s.CreateUserAsync(It.IsAny<CreateUserRequestDto>(), It.IsAny<int>()))
                .ReturnsAsync(expectedUser);

            // Act
            var result = await _controller.CreateUser(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetAllUsers_ReturnsOkResult()
        {
            // Arrange
            var expectedUsers = new List<UserResponseDto>();
            _mockUserManagementService
                .Setup(s => s.GetAllUsersAsync())
                .ReturnsAsync(expectedUsers);

            // Act
            var result = await _controller.GetAllUsers();

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task DeactivateUser_WithValidId_ReturnsOkResult()
        {
            // Arrange
            int userId = 5;
            _mockUserManagementService
                .Setup(s => s.DeactivateUserAsync(userId))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeactivateUser(userId);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task ActivateUser_WithValidId_ReturnsOkResult()
        {
            // Arrange
            int userId = 5;
            _mockUserManagementService
                .Setup(s => s.ActivateUserAsync(userId))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.ActivateUser(userId);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task AssignRoleAndDepartment_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            var request = new AssignRoleDepartmentRequestDto();
            _mockUserManagementService
                .Setup(s => s.AssignRoleAndDepartmentAsync(It.IsAny<AssignRoleDepartmentRequestDto>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.AssignRoleAndDepartment(request);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }
    }
}

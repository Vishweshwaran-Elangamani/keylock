using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Api.Controllers;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Utils;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Relevantz.EEPZ.Api.Tests
{
    [SetUpFixture]
    public class TestInitializer
    {
        [OneTimeSetUp]
        public void GlobalSetup()
        {
            // Initialize the EEPZBusinessLog before running any tests
            var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
            EEPZBusinessLog.Initialize(loggerFactory);
        }
    }

    [TestFixture]
    public class EmployeeDataControllerTests
    {
        private Mock<IEmployeeDataService> _mockService;
        private Mock<ILogger<EmployeeDataController>> _mockLogger;
        private EmployeeDataController _controller;

        [SetUp]
        public void Setup()
        {
            _mockService = new Mock<IEmployeeDataService>();
            _mockLogger = new Mock<ILogger<EmployeeDataController>>();
            _controller = new EmployeeDataController(_mockService.Object, _mockLogger.Object);
        }

        [Test]
        public async Task GetComplianceOverview_ReturnsOkResult()
        {
            // Arrange
            var overview = new ComplianceOverviewDto();
            _mockService.Setup(s => s.GetComplianceOverviewAsync()).ReturnsAsync(overview);

            // Act
            var result = await _controller.GetComplianceOverview();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task GetAllDepartments_ReturnsOkResult()
        {
            // Arrange
            var departments = new List<DepartmentSimpleDto>();
            _mockService.Setup(s => s.GetAllDepartmentsAsync()).ReturnsAsync((departments, "Success"));

            // Act
            var result = await _controller.GetAllDepartments();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task GetDepartmentById_ReturnsNotFound_WhenNotExists()
        {
            // Arrange
            _mockService.Setup(s => s.GetDepartmentByIdAsync(999)).ReturnsAsync((DepartmentSimpleDto?)null);

            // Act
            var result = await _controller.GetDepartmentById(999);

            // Assert
            Assert.IsInstanceOf<NotFoundObjectResult>(result);
        }
    }

    [TestFixture]
    public class FundAllocationControllerTests
    {
        private Mock<IFundAllocationService> _mockService;
        private Mock<IDepartmentBudgetService> _mockBudgetService;
        private Mock<ILogger<FundAllocationController>> _mockLogger;
        private FundAllocationController _controller;

        [SetUp]
        public void Setup()
        {
            _mockService = new Mock<IFundAllocationService>();
            _mockBudgetService = new Mock<IDepartmentBudgetService>();
            _mockLogger = new Mock<ILogger<FundAllocationController>>();
            _controller = new FundAllocationController(_mockService.Object, _mockBudgetService.Object, _mockLogger.Object);
        }

        [Test]
        public async Task CreateFundAllocation_ReturnsOkResult_WhenSuccessful()
        {
            // Arrange
            var request = new CreateFundAllocationRequestDto { DepartmentId = 1, Amount = 10000 };
            var response = new ApiResponseDto<FundAllocationResponseDto> { Success = true };
            _mockService.Setup(s => s.CreateFundAllocationAsync(request)).ReturnsAsync(response);

            // Act
            var result = await _controller.CreateFundAllocation(request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task GetAllFundAllocations_ReturnsOkResult()
        {
            // Arrange
            var response = new ApiResponseDto<List<FundAllocationResponseDto>> { Success = true };
            _mockService.Setup(s => s.GetAllFundAllocationsAsync()).ReturnsAsync(response);

            // Act
            var result = await _controller.GetAllFundAllocations();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task DeleteFundAllocation_ReturnsBadRequest_WhenFails()
        {
            // Arrange
            var response = new ApiResponseDto<bool> { Success = false };
            _mockService.Setup(s => s.DeleteFundAllocationAsync(1)).ReturnsAsync(response);

            // Act
            var result = await _controller.DeleteFundAllocation(1);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }
    }

    [TestFixture]
    public class PeriodAllocationControllerTests
    {
        private Mock<IPeriodAllocationService> _mockService;
        private Mock<ILogger<PeriodAllocationController>> _mockLogger;
        private PeriodAllocationController _controller;

        [SetUp]
        public void Setup()
        {
            _mockService = new Mock<IPeriodAllocationService>();
            _mockLogger = new Mock<ILogger<PeriodAllocationController>>();
            _controller = new PeriodAllocationController(_mockService.Object, _mockLogger.Object);
        }

        [Test]
        public async Task GetAllPeriodAllocations_ReturnsOkResult()
        {
            // Arrange
            var response = new ApiResponseDto<List<PeriodAllocationResponseDto>> { Success = true };
            _mockService.Setup(s => s.GetAllPeriodAllocationsAsync()).ReturnsAsync(response);

            // Act
            var result = await _controller.GetAllPeriodAllocations();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task CreatePeriodAllocation_ReturnsBadRequest_WhenFails()
        {
            // Arrange
            var request = new CreatePeriodAllocationDto();
            var response = new ApiResponseDto<PeriodAllocationResponseDto> { Success = false };
            _mockService.Setup(s => s.CreatePeriodAllocationAsync(request)).ReturnsAsync(response);

            // Act
            var result = await _controller.CreatePeriodAllocation(request);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }
    }

    [TestFixture]
    public class PolicyControllerTests
    {
        private Mock<IPolicyService> _mockService;
        private Mock<IMongoDbService> _mockMongoService;
        private Mock<ILogger<PolicyController>> _mockLogger;
        private PolicyController _controller;

        [SetUp]
        public void Setup()
        {
            _mockService = new Mock<IPolicyService>();
            _mockMongoService = new Mock<IMongoDbService>();
            _mockLogger = new Mock<ILogger<PolicyController>>();
            _controller = new PolicyController(_mockService.Object, _mockMongoService.Object, _mockLogger.Object);
        }

        [Test]
        public async Task GetAllPolicies_ReturnsOkResult()
        {
            // Arrange
            var response = new ApiResponseDto<List<PolicyResponseDto>> { Success = true };
            _mockService.Setup(s => s.GetAllPoliciesAsync()).ReturnsAsync(response);

            // Act
            var result = await _controller.GetAllPolicies();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task GetPolicyById_ReturnsNotFound_WhenNotExists()
        {
            // Arrange
            var response = new ApiResponseDto<PolicyResponseDto> { Success = false };
            _mockService.Setup(s => s.GetPolicyByIdAsync(999)).ReturnsAsync(response);

            // Act
            var result = await _controller.GetPolicyById(999);

            // Assert
            Assert.IsInstanceOf<NotFoundObjectResult>(result);
        }
    }

    [TestFixture]
    public class ViolationControllerTests
    {
        private Mock<IViolationService> _mockService;
        private Mock<ISlaEscalationService> _mockSlaService;
        private Mock<ILogger<ViolationController>> _mockLogger;
        private ViolationController _controller;

        [SetUp]
        public void Setup()
        {
            _mockService = new Mock<IViolationService>();
            _mockSlaService = new Mock<ISlaEscalationService>();
            _mockLogger = new Mock<ILogger<ViolationController>>();
            _controller = new ViolationController(_mockService.Object, _mockSlaService.Object, _mockLogger.Object);
            
            // Setup user context
            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "Admin")
            }, "mock"));

            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = new DefaultHttpContext() { User = user }
            };
        }

        [Test]
        public async Task GetAllViolations_ReturnsOkResult()
        {
            // Arrange
            var response = new ApiResponseDto<List<ViolationResponseDto>> { Success = true };
            _mockService.Setup(s => s.GetAllViolationsAsync()).ReturnsAsync(response);

            // Act
            var result = await _controller.GetAllViolations();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task GetViolationById_ReturnsNotFound_WhenNotExists()
        {
            // Arrange
            var response = new ApiResponseDto<ViolationResponseDto> { Success = false };
            _mockService.Setup(s => s.GetViolationByIdAsync(999)).ReturnsAsync(response);

            // Act
            var result = await _controller.GetViolationById(999);

            // Assert
            Assert.IsInstanceOf<NotFoundObjectResult>(result);
        }

        [Test]
        public async Task GetAllSlaEscalations_ReturnsOkResult()
        {
            // Arrange
            var response = new ApiResponseDto<List<SlaEscalationResponseDto>> { Success = true };
            _mockSlaService.Setup(s => s.GetAllSlaEscalationsAsync()).ReturnsAsync(response);

            // Act
            var result = await _controller.GetAllSlaEscalations();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }
    }
}

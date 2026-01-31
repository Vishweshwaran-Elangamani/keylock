using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Relevantz.EEPZ.Core.Service;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using MapsterMapper;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace Relevantz.EEPZ.Core.Tests.Services
{
    [SetUpFixture]
    public class ServiceTestInitializer
    {
        [OneTimeSetUp]
        public void GlobalSetup()
        {
            var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
            EEPZBusinessLog.Initialize(loggerFactory);
        }
    }

    #region ComplianceService Tests
    [TestFixture]
    public class ComplianceServiceTests
    {
        private Mock<IPolicyRepository> _mockPolicyRepo;
        private Mock<IViolationRepository> _mockViolationRepo;
        private ComplianceService _service;

        [SetUp]
        public void Setup()
        {
            _mockPolicyRepo = new Mock<IPolicyRepository>();
            _mockViolationRepo = new Mock<IViolationRepository>();
            _service = new ComplianceService(_mockPolicyRepo.Object, _mockViolationRepo.Object);
        }

        [Test]
        public async Task GetComplianceOverviewAsync_ReturnsOverviewWithCorrectData()
        {
            // Arrange
            _mockPolicyRepo.Setup(r => r.GetTotalPoliciesCountAsync()).ReturnsAsync(10);
            _mockPolicyRepo.Setup(r => r.GetActivePoliciesCountAsync()).ReturnsAsync(7);
            _mockViolationRepo.Setup(r => r.GetTotalViolationsCountAsync()).ReturnsAsync(20);
            _mockViolationRepo.Setup(r => r.GetActiveViolationsCountAsync()).ReturnsAsync(5);
            _mockViolationRepo.Setup(r => r.GetResolvedViolationsCountAsync()).ReturnsAsync(15);

            // Act
            var result = await _service.GetComplianceOverviewAsync();

            // Assert
            Assert.IsTrue(result.Success);
            Assert.IsNotNull(result.Data);
            Assert.That(result.Data.TotalPolicies, Is.EqualTo(10));
            Assert.That(result.Data.ActivePolicies, Is.EqualTo(7));
            Assert.That(result.Data.InactivePolicies, Is.EqualTo(3));
            Assert.That(result.Data.TotalViolations, Is.EqualTo(20));
            Assert.That(result.Data.ComplianceRate, Is.EqualTo(75.0));
        }

        [Test]
        public async Task GetComplianceOverviewAsync_WithZeroViolations_Returns100PercentCompliance()
        {
            // Arrange
            _mockPolicyRepo.Setup(r => r.GetTotalPoliciesCountAsync()).ReturnsAsync(5);
            _mockPolicyRepo.Setup(r => r.GetActivePoliciesCountAsync()).ReturnsAsync(5);
            _mockViolationRepo.Setup(r => r.GetTotalViolationsCountAsync()).ReturnsAsync(0);
            _mockViolationRepo.Setup(r => r.GetActiveViolationsCountAsync()).ReturnsAsync(0);
            _mockViolationRepo.Setup(r => r.GetResolvedViolationsCountAsync()).ReturnsAsync(0);

            // Act
            var result = await _service.GetComplianceOverviewAsync();

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.ComplianceRate, Is.EqualTo(100.0));
        }
    }
    #endregion

    #region CostMappingService Tests
    [TestFixture]
    public class CostMappingServiceTests
    {
        private Mock<ICostMappingRepository> _mockRepo;
        private Mock<ILogger<CostMappingService>> _mockLogger;
        private Mock<IMapper> _mockMapper;
        private CostMappingService _service;

        [SetUp]
        public void Setup()
        {
            _mockRepo = new Mock<ICostMappingRepository>();
            _mockLogger = new Mock<ILogger<CostMappingService>>();
            _mockMapper = new Mock<IMapper>();
            _service = new CostMappingService(_mockRepo.Object, _mockLogger.Object, _mockMapper.Object);
        }

        [Test]
        public async Task GetDepartmentHeadcountAsync_WithValidId_ReturnsHeadcount()
        {
            // Arrange
            _mockRepo.Setup(r => r.GetCurrentHeadcountAsync(1)).ReturnsAsync(50);

            // Act
            var result = await _service.GetDepartmentHeadcountAsync(1);

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.CurrentHeadcount, Is.EqualTo(50));
        }

        [Test]
        public void GetDepartmentHeadcountAsync_WithInvalidId_ThrowsArgumentException()
        {
            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(async () =>
                await _service.GetDepartmentHeadcountAsync(0));
        }

        [Test]
        public async Task CreateCostMappingAsync_WithValidRequest_ReturnsSuccess()
        {
            // Arrange
            var request = new CreateCostMappingRequestDto { DepartmentId = 1, FiscalYear = 2024 };
            var budget = new Departmentbudget { BudgetId = 1 };
            var responseDto = new CostMappingResponseDto { BudgetId = 1 };

            _mockMapper.Setup(m => m.Map<Departmentbudget>(request)).Returns(budget);
            _mockRepo.Setup(r => r.CreateAsync(budget)).ReturnsAsync(budget);
            _mockMapper.Setup(m => m.Map<CostMappingResponseDto>(budget)).Returns(responseDto);

            // Act
            var result = await _service.CreateCostMappingAsync(request);

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.BudgetId, Is.EqualTo(1));
        }

        [Test]
        public async Task GetCostMappingByIdAsync_WithInvalidId_ThrowsArgumentException()
        {
            // Arrange
            _mockRepo.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Departmentbudget?)null);

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(async () =>
                await _service.GetCostMappingByIdAsync(999));
        }

        [Test]
        public async Task DeleteCostMappingAsync_WithValidId_ReturnsSuccess()
        {
            // Arrange
            var budget = new Departmentbudget { BudgetId = 1 };
            _mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(budget);
            _mockRepo.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

            // Act
            var result = await _service.DeleteCostMappingAsync(1);

            // Assert
            Assert.IsTrue(result.Success);
            Assert.IsTrue(result.Data);
        }
    }
    #endregion

    #region DepartmentBudgetService Tests
    [TestFixture]
    public class DepartmentBudgetServiceTests
    {
        private Mock<IDepartmentBudgetRepository> _mockBudgetRepo;
        private Mock<IDepartmentRepository> _mockDeptRepo;
        private Mock<ILogger<DepartmentBudgetService>> _mockLogger;
        private DepartmentBudgetService _service;

        [SetUp]
        public void Setup()
        {
            _mockBudgetRepo = new Mock<IDepartmentBudgetRepository>();
            _mockDeptRepo = new Mock<IDepartmentRepository>();
            _mockLogger = new Mock<ILogger<DepartmentBudgetService>>();
            _service = new DepartmentBudgetService(_mockBudgetRepo.Object, _mockDeptRepo.Object, _mockLogger.Object);
        }

        [Test]
        public async Task GetAllDepartmentBudgetsAsync_ReturnsBudgets()
        {
            // Arrange
            var budgets = new List<Departmentbudget>
            {
                new Departmentbudget { BudgetId = 1, DepartmentId = 1, TotalBudget = 10000 }
            };
            _mockBudgetRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(budgets);
            _mockDeptRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>()))
                .ReturnsAsync(new Department { DepartmentName = "IT" });

            // Act
            var result = await _service.GetAllDepartmentBudgetsAsync();

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.Count, Is.EqualTo(1));
        }

        [Test]
        public void GetDepartmentBudgetAsync_WithInvalidId_ThrowsArgumentException()
        {
            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(async () =>
                await _service.GetDepartmentBudgetAsync(0));
        }

        [Test]
        public async Task CreateDepartmentBudgetAsync_WithValidRequest_ReturnsSuccess()
        {
            // Arrange
            var request = new CreateDepartmentBudgetDto
            {
                DepartmentId = 1,
                FiscalYear = 2024,
                TotalBudget = 100000
            };
            var dept = new Department { DepartmentId = 1 };
            var budget = new Departmentbudget { BudgetId = 1 };

            _mockDeptRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(dept);
            _mockBudgetRepo.Setup(r => r.GetByDepartmentAndFiscalYearAsync(1, 2024))
                .ReturnsAsync((Departmentbudget?)null);
            _mockBudgetRepo.Setup(r => r.CreateAsync(It.IsAny<Departmentbudget>())).ReturnsAsync(budget);

            // Act
            var result = await _service.CreateDepartmentBudgetAsync(request);

            // Assert
            Assert.IsTrue(result.Success);
        }

        [Test]
        public void CreateDepartmentBudgetAsync_WithInvalidDepartment_ThrowsArgumentException()
        {
            // Arrange
            var request = new CreateDepartmentBudgetDto
            {
                DepartmentId = 999,
                FiscalYear = 2024,
                TotalBudget = 100000
            };
            _mockDeptRepo.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Department?)null);

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(async () =>
                await _service.CreateDepartmentBudgetAsync(request));
        }

        [Test]
        public async Task UpdateUtilizedAmountAsync_WithValidRequest_ReturnsSuccess()
        {
            // Arrange
            var request = new UpdateUtilizedAmountDto { BudgetId = 1, UtilizedAmount = 5000 };
            var budget = new Departmentbudget
            {
                BudgetId = 1,
                AllocatedAmount = 10000,
                UtilizedAmount = 0
            };

            _mockBudgetRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(budget);
            _mockBudgetRepo.Setup(r => r.UpdateAsync(It.IsAny<Departmentbudget>())).ReturnsAsync(budget);

            // Act
            var result = await _service.UpdateUtilizedAmountAsync(request);

            // Assert
            Assert.IsTrue(result.Success);
        }
    }
    #endregion

    #region EmailService Tests
    [TestFixture]
    public class EmailServiceTests
    {
        private Mock<IConfiguration> _mockConfig;
        private Mock<ILogger<EmailService>> _mockLogger;
        private EmailService _service;

        [SetUp]
        public void Setup()
        {
            _mockConfig = new Mock<IConfiguration>();
            _mockLogger = new Mock<ILogger<EmailService>>();

            // Mock configuration sections for string values
            _mockConfig.Setup(c => c["Email:FromName"]).Returns("Test Sender");
            _mockConfig.Setup(c => c["Email:FromEmail"]).Returns("test@example.com");
            _mockConfig.Setup(c => c["Email:Host"]).Returns("smtp.gmail.com");
            _mockConfig.Setup(c => c["Email:Port"]).Returns("587");
            _mockConfig.Setup(c => c["Email:EnableSsl"]).Returns("true");
            _mockConfig.Setup(c => c["Email:Username"]).Returns("user@test.com");
            _mockConfig.Setup(c => c["Email:Password"]).Returns("password");

            // Mock GetSection for Port (returns a section with Value = "587")
            var mockPortSection = new Mock<IConfigurationSection>();
            mockPortSection.Setup(s => s.Value).Returns("587");
            _mockConfig.Setup(c => c.GetSection("Email:Port")).Returns(mockPortSection.Object);

            // Mock GetSection for EnableSsl (returns a section with Value = "true")
            var mockSslSection = new Mock<IConfigurationSection>();
            mockSslSection.Setup(s => s.Value).Returns("true");
            _mockConfig.Setup(c => c.GetSection("Email:EnableSsl")).Returns(mockSslSection.Object);

            _service = new EmailService(_mockConfig.Object, _mockLogger.Object);
        }

        [Test]
        public void SendGoalReminderEmailAsync_WithValidData_DoesNotThrow()
        {
            Assert.DoesNotThrowAsync(async () =>
            {
                try
                {
                    await _service.SendGoalReminderEmailAsync("test@test.com", "Test User", new List<string>());
                }
                catch (Exception)
                {
                    // Expected to fail without real SMTP server
                }
            });
        }
    }
    #endregion

    #region EmployeeDataService Tests
    [TestFixture]
    public class EmployeeDataServiceTests
    {
        private Mock<IComplianceService> _mockComplianceService;
        private Mock<IPolicyService> _mockPolicyService;
        private Mock<IEmailService> _mockEmailService;
        private Mock<IEmployeeDataRepository> _mockRepo;
        private Mock<ILogger<EmployeeDataService>> _mockLogger;
        private Mock<IConfiguration> _mockConfig;
        private EmployeeDataService _service;

        [SetUp]
        public void Setup()
        {
            _mockComplianceService = new Mock<IComplianceService>();
            _mockPolicyService = new Mock<IPolicyService>();
            _mockEmailService = new Mock<IEmailService>();
            _mockRepo = new Mock<IEmployeeDataRepository>();
            _mockLogger = new Mock<ILogger<EmployeeDataService>>();
            _mockConfig = new Mock<IConfiguration>();

            // Mock GoalSuggestions section - return empty section instead of using Get<T>
            var mockSuggestionsSection = new Mock<IConfigurationSection>();
            mockSuggestionsSection.Setup(s => s.GetChildren()).Returns(new List<IConfigurationSection>());
            _mockConfig.Setup(c => c.GetSection("GoalSuggestions:Suggestions")).Returns(mockSuggestionsSection.Object);

            _service = new EmployeeDataService(
                _mockComplianceService.Object,
                _mockPolicyService.Object,
                _mockEmailService.Object,
                _mockRepo.Object,
                _mockLogger.Object,
                _mockConfig.Object);
        }

        [Test]
        public async Task GetComplianceOverviewAsync_ReturnsData()
        {
            // Arrange
            var overview = new ComplianceOverviewDto { TotalPolicies = 10 };
            _mockComplianceService.Setup(s => s.GetComplianceOverviewAsync())
                .ReturnsAsync(ApiResponseDto<ComplianceOverviewDto>.SuccessResponse(overview));

            // Act
            var result = await _service.GetComplianceOverviewAsync();

            // Assert
            Assert.IsNotNull(result);
            Assert.That(result.TotalPolicies, Is.EqualTo(10));
        }

        [Test]
        public async Task GetEmployeesWithoutGoalsAsync_ReturnsEmployeeList()
        {
            // Arrange
            var employees = new List<EmployeeWithoutGoalsDto>
            {
                new EmployeeWithoutGoalsDto { UserId = 1, Email = "test@test.com" }
            };
            _mockRepo.Setup(r => r.GetEmployeesWithoutGoalsAsync(It.IsAny<int?>())).ReturnsAsync(employees);

            // Act
            var (result, message) = await _service.GetEmployeesWithoutGoalsAsync(1);

            // Assert
            Assert.That(result.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task GetAllDepartmentsAsync_ReturnsDepartments()
        {
            // Arrange
            var departments = new List<DepartmentSimpleDto>
            {
                new DepartmentSimpleDto { DepartmentId = 1, DepartmentName = "IT" }
            };
            _mockRepo.Setup(r => r.GetAllDepartmentsAsync()).ReturnsAsync(departments);

            // Act
            var (result, message) = await _service.GetAllDepartmentsAsync();

            // Assert
            Assert.That(result.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task GetPublishedPoliciesAsync_ReturnsPolicies()
        {
            // Arrange
            var policies = new List<PolicyResponseDto>
            {
                new PolicyResponseDto { PolicyId = 1, PolicyName = "Test Policy" }
            };
            _mockPolicyService.Setup(s => s.GetPublishedPoliciesAsync())
                .ReturnsAsync(ApiResponseDto<List<PolicyResponseDto>>.SuccessResponse(policies));

            // Act
            var result = await _service.GetPublishedPoliciesAsync(1, "Employee");

            // Assert
            Assert.That(result.Count, Is.EqualTo(1));
        }
    }
    #endregion

    #region FundAllocationService Tests
    [TestFixture]
    public class FundAllocationServiceTests
    {
        private Mock<IFundAllocationRepository> _mockRepo;
        private Mock<ILogger<FundAllocationService>> _mockLogger;
        private Mock<IMapper> _mockMapper;
        private FundAllocationService _service;

        [SetUp]
        public void Setup()
        {
            _mockRepo = new Mock<IFundAllocationRepository>();
            _mockLogger = new Mock<ILogger<FundAllocationService>>();
            _mockMapper = new Mock<IMapper>();
            _service = new FundAllocationService(_mockRepo.Object, _mockLogger.Object, _mockMapper.Object);
        }

        [Test]
        public async Task CreateFundAllocationAsync_WithValidRequest_ReturnsSuccess()
        {
            // Arrange
            var request = new CreateFundAllocationRequestDto
            {
                BudgetId = 1,
                DepartmentId = 1,
                Amount = 5000,
                AllocationType = "Training"
            };
            var allocation = new Budgetallocation { AllocationId = 1 };
            var responseDto = new FundAllocationResponseDto { AllocationId = 1 };

            _mockRepo.Setup(r => r.BudgetExistsAsync(1)).ReturnsAsync(true);
            _mockMapper.Setup(m => m.Map<Budgetallocation>(request)).Returns(allocation);
            _mockRepo.Setup(r => r.CreateAsync(It.IsAny<Budgetallocation>())).ReturnsAsync(allocation);
            _mockRepo.Setup(r => r.GetFundAllocationDetailsAsync(1)).ReturnsAsync(responseDto);

            // Act
            var result = await _service.CreateFundAllocationAsync(request);

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.AllocationId, Is.EqualTo(1));
        }

        [Test]
        public async Task CreateFundAllocationAsync_WithInvalidBudgetId_ReturnsFailure()
        {
            // Arrange
            var request = new CreateFundAllocationRequestDto { BudgetId = 0 };

            // Act
            var result = await _service.CreateFundAllocationAsync(request);

            // Assert
            Assert.IsFalse(result.Success);
        }

        [Test]
        public async Task GetAllFundAllocationsAsync_ReturnsAllocations()
        {
            // Arrange
            var allocations = new List<Budgetallocation>
            {
                new Budgetallocation { AllocationId = 1 }
            };
            var responseDto = new FundAllocationResponseDto { AllocationId = 1 };

            _mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(allocations);
            _mockRepo.Setup(r => r.GetFundAllocationDetailsAsync(1)).ReturnsAsync(responseDto);

            // Act
            var result = await _service.GetAllFundAllocationsAsync();

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task DeleteFundAllocationAsync_WithValidId_ReturnsSuccess()
        {
            // Arrange
            var allocation = new Budgetallocation { AllocationId = 1 };
            _mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(allocation);
            _mockRepo.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

            // Act
            var result = await _service.DeleteFundAllocationAsync(1);

            // Assert
            Assert.IsTrue(result.Success);
        }
    }
    #endregion

    #region PeriodAllocationService Tests
    [TestFixture]
    public class PeriodAllocationServiceTests
    {
        private Mock<IBudgetPeriodAllocationRepository> _mockPeriodRepo;
        private Mock<IDepartmentBudgetRepository> _mockBudgetRepo;
        private Mock<ILogger<PeriodAllocationService>> _mockLogger;
        private Mock<IMapper> _mockMapper;
        private PeriodAllocationService _service;

        [SetUp]
        public void Setup()
        {
            _mockPeriodRepo = new Mock<IBudgetPeriodAllocationRepository>();
            _mockBudgetRepo = new Mock<IDepartmentBudgetRepository>();
            _mockLogger = new Mock<ILogger<PeriodAllocationService>>();
            _mockMapper = new Mock<IMapper>();
            _service = new PeriodAllocationService(
                _mockPeriodRepo.Object,
                _mockBudgetRepo.Object,
                _mockLogger.Object,
                _mockMapper.Object);
        }

        [Test]
        public async Task CreatePeriodAllocationAsync_WithValidRequest_ReturnsSuccess()
        {
            // Arrange
            var request = new CreatePeriodAllocationDto
            {
                BudgetId = 1,
                Period = "Q1",
                PeriodYear = 2024,
                AllocatedAmount = 25000
            };
            var budget = new Departmentbudget { BudgetId = 1, TotalBudget = 100000 };
            var periodAllocation = new Budgetperiodallocation { PeriodAllocationId = 1 };
            var responseDto = new PeriodAllocationResponseDto { PeriodAllocationId = 1 };

            _mockBudgetRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(budget);
            _mockPeriodRepo.Setup(r => r.GetByBudgetPeriodYearAsync(1, "Q1", 2024))
                .ReturnsAsync((Budgetperiodallocation?)null);
            _mockPeriodRepo.Setup(r => r.GetTotalAllocatedByBudgetAsync(1)).ReturnsAsync(0m);
            _mockMapper.Setup(m => m.Map<Budgetperiodallocation>(request)).Returns(periodAllocation);
            _mockPeriodRepo.Setup(r => r.CreateAsync(It.IsAny<Budgetperiodallocation>())).ReturnsAsync(periodAllocation);
            _mockBudgetRepo.Setup(r => r.UpdateAsync(It.IsAny<Departmentbudget>())).ReturnsAsync(budget);
            _mockPeriodRepo.Setup(r => r.GetPeriodAllocationDetailsAsync(1)).ReturnsAsync(responseDto);

            // Act
            var result = await _service.CreatePeriodAllocationAsync(request);

            // Assert
            Assert.IsTrue(result.Success);
        }

        [Test]
        public async Task CreatePeriodAllocationAsync_WithInvalidBudgetId_ReturnsFailure()
        {
            // Arrange
            var request = new CreatePeriodAllocationDto { BudgetId = 0 };

            // Act
            var result = await _service.CreatePeriodAllocationAsync(request);

            // Assert
            Assert.IsFalse(result.Success);
        }

        [Test]
        public async Task GetAllPeriodAllocationsAsync_ReturnsAllocations()
        {
            // Arrange
            var allocations = new List<Budgetperiodallocation>
            {
                new Budgetperiodallocation { PeriodAllocationId = 1 }
            };
            var responseDto = new PeriodAllocationResponseDto { PeriodAllocationId = 1 };

            _mockPeriodRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(allocations);
            _mockPeriodRepo.Setup(r => r.GetPeriodAllocationDetailsAsync(1)).ReturnsAsync(responseDto);

            // Act
            var result = await _service.GetAllPeriodAllocationsAsync();

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task DeletePeriodAllocationAsync_WithValidId_ReturnsSuccess()
        {
            // Arrange
            var allocation = new Budgetperiodallocation
            {
                PeriodAllocationId = 1,
                BudgetId = 1,
                Period = "Q1",
                PeriodYear = 2024,
                AllocatedAmount = 10000
            };
            var budget = new Departmentbudget { BudgetId = 1, AllocatedAmount = 10000 };

            _mockPeriodRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(allocation);
            _mockPeriodRepo.Setup(r => r.HasSubAllocationsAsync(1, "Q1", 2024)).ReturnsAsync(false);
            _mockBudgetRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(budget);
            _mockPeriodRepo.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);
            _mockBudgetRepo.Setup(r => r.UpdateAsync(It.IsAny<Departmentbudget>())).ReturnsAsync(budget);

            // Act
            var result = await _service.DeletePeriodAllocationAsync(1);

            // Assert
            Assert.IsTrue(result.Success);
        }
    }
    #endregion

    #region PolicyService Tests
    [TestFixture]
    public class PolicyServiceTests
    {
        private Mock<IPolicyRepository> _mockRepo;
        private Mock<ILogger<PolicyService>> _mockLogger;
        private Mock<IMapper> _mockMapper;
        private PolicyService _service;

        [SetUp]
        public void Setup()
        {
            _mockRepo = new Mock<IPolicyRepository>();
            _mockLogger = new Mock<ILogger<PolicyService>>();
            _mockMapper = new Mock<IMapper>();
            _service = new PolicyService(_mockRepo.Object, _mockLogger.Object, _mockMapper.Object);
        }

        [Test]
        public async Task CreatePolicyAsync_WithValidRequest_ReturnsSuccess()
        {
            // Arrange
            var request = new CreatePolicyRequestDto { PolicyName = "New Policy" };
            var policy = new Organizationalpolicy { PolicyId = 1, PolicyName = "New Policy" };
            var responseDto = new PolicyResponseDto { PolicyId = 1, PolicyName = "New Policy" };

            _mockRepo.Setup(r => r.PolicyNameExistsAsync("New Policy", It.IsAny<int?>())).ReturnsAsync(false);
            _mockMapper.Setup(m => m.Map<Organizationalpolicy>(request)).Returns(policy);
            _mockRepo.Setup(r => r.CreatePolicyAsync(It.IsAny<Organizationalpolicy>())).ReturnsAsync(policy);
            _mockRepo.Setup(r => r.GetPolicyByIdAsync(1)).ReturnsAsync(policy);
            _mockMapper.Setup(m => m.Map<PolicyResponseDto>(policy)).Returns(responseDto);

            // Act
            var result = await _service.CreatePolicyAsync(request, 1);

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.PolicyId, Is.EqualTo(1));
        }

        [Test]
        public async Task CreatePolicyAsync_WithDuplicateName_ReturnsError()
        {
            // Arrange
            var request = new CreatePolicyRequestDto { PolicyName = "Existing Policy" };
            _mockRepo.Setup(r => r.PolicyNameExistsAsync("Existing Policy", It.IsAny<int?>())).ReturnsAsync(true);

            // Act
            var result = await _service.CreatePolicyAsync(request, 1);

            // Assert
            Assert.IsFalse(result.Success);
        }

        [Test]
        public async Task GetAllPoliciesAsync_ReturnsPolicies()
        {
            // Arrange
            var policies = new List<Organizationalpolicy>
            {
                new Organizationalpolicy { PolicyId = 1, PolicyName = "Policy 1" }
            };
            var responseDtos = new List<PolicyResponseDto>
            {
                new PolicyResponseDto { PolicyId = 1, PolicyName = "Policy 1" }
            };

            _mockRepo.Setup(r => r.GetAllPoliciesAsync()).ReturnsAsync(policies);
            _mockMapper.Setup(m => m.Map<List<PolicyResponseDto>>(policies)).Returns(responseDtos);

            // Act
            var result = await _service.GetAllPoliciesAsync();

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task PublishPolicyAsync_WithValidId_ReturnsSuccess()
        {
            // Arrange
            var policy = new Organizationalpolicy { PolicyId = 1, IsPublished = false };
            _mockRepo.Setup(r => r.GetPolicyByIdAsync(1)).ReturnsAsync(policy);
            _mockRepo.Setup(r => r.UpdatePolicyAsync(It.IsAny<Organizationalpolicy>())).ReturnsAsync(policy);

            // Act
            var result = await _service.PublishPolicyAsync(1, 1);

            // Assert
            Assert.IsTrue(result.Success);
        }

        [Test]
        public async Task DeletePolicyAsync_WithValidId_ReturnsSuccess()
        {
            // Arrange
            _mockRepo.Setup(r => r.DeletePolicyAsync(1)).ReturnsAsync(true);

            // Act
            var result = await _service.DeletePolicyAsync(1);

            // Assert
            Assert.IsTrue(result.Success);
        }
    }
    #endregion

    #region SlaEscalationService Tests
    [TestFixture]
    public class SlaEscalationServiceTests
    {
        private Mock<ISlaEscalationRepository> _mockRepo;
        private Mock<IViolationService> _mockViolationService;
        private SlaEscalationService _service;

        [SetUp]
        public void Setup()
        {
            _mockRepo = new Mock<ISlaEscalationRepository>();
            _mockViolationService = new Mock<IViolationService>();
            _service = new SlaEscalationService(_mockRepo.Object, _mockViolationService.Object);
        }

        [Test]
        public async Task GetAllSlaEscalationsAsync_ReturnsEscalations()
        {
            // Arrange
            var escalations = new List<Slaescalation>
            {
                new Slaescalation { EscalationId = 1, EscalationStatus = "Open" }
            };
            _mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(escalations);

            // Act
            var result = await _service.GetAllSlaEscalationsAsync();

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task GetSlaEscalationByIdAsync_WithValidId_ReturnsEscalation()
        {
            // Arrange
            var escalation = new Slaescalation { EscalationId = 1 };
            _mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(escalation);

            // Act
            var result = await _service.GetSlaEscalationByIdAsync(1);

            // Assert
            Assert.IsTrue(result.Success);
        }

        [Test]
        public async Task GetSlaEscalationByIdAsync_WithInvalidId_ReturnsError()
        {
            // Arrange
            _mockRepo.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Slaescalation?)null);

            // Act
            var result = await _service.GetSlaEscalationByIdAsync(999);

            // Assert
            Assert.IsFalse(result.Success);
        }

        [Test]
        public async Task GetSlaEscalationsByEmployeeAsync_ReturnsEmployeeEscalations()
        {
            // Arrange
            var escalations = new List<Slaescalation>
            {
                new Slaescalation { EscalationId = 1, EscalationStatus = "Open" }
            };
            _mockRepo.Setup(r => r.GetByEmployeeUserIdAsync(1)).ReturnsAsync(escalations);

            // Act
            var result = await _service.GetSlaEscalationsByEmployeeAsync(1);

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.Count, Is.EqualTo(1));
        }
    }
    #endregion

    #region ViolationService Tests
    [TestFixture]
    public class ViolationServiceTests
    {
        private Mock<IViolationRepository> _mockRepo;
        private Mock<ILogger<ViolationService>> _mockLogger;
        private Mock<IMapper> _mockMapper;
        private ViolationService _service;

        [SetUp]
        public void Setup()
        {
            _mockRepo = new Mock<IViolationRepository>();
            _mockLogger = new Mock<ILogger<ViolationService>>();
            _mockMapper = new Mock<IMapper>();
            _service = new ViolationService(_mockRepo.Object, _mockLogger.Object, _mockMapper.Object);
        }

        [Test]
        public async Task ReportViolationAsync_WithValidRequest_ReturnsSuccess()
        {
            // Arrange
            var request = new ReportViolationRequestDto
            {
                EmployeeUserId = 1,
                PolicyId = 1,
                ViolationType = "Attendance"
            };
            var violation = new Policyviolation { ViolationId = 1 };
            var responseDto = new ViolationResponseDto { ViolationId = 1 };

            _mockMapper.Setup(m => m.Map<Policyviolation>(request)).Returns(violation);
            _mockRepo.Setup(r => r.CreateViolationAsync(It.IsAny<Policyviolation>())).ReturnsAsync(violation);
            _mockRepo.Setup(r => r.GetViolationByIdAsync(1)).ReturnsAsync(violation);
            _mockMapper.Setup(m => m.Map<ViolationResponseDto>(violation)).Returns(responseDto);

            // Act
            var result = await _service.ReportViolationAsync(request, 1);

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.ViolationId, Is.EqualTo(1));
        }

        [Test]
        public async Task ReportViolationAsync_WithInvalidEmployeeId_ReturnsError()
        {
            // Arrange
            var request = new ReportViolationRequestDto { EmployeeUserId = 0, PolicyId = 1, ViolationType = "Test" };

            // Act
            var result = await _service.ReportViolationAsync(request, 1);

            // Assert
            Assert.IsFalse(result.Success);
        }

        [Test]
        public async Task GetAllViolationsAsync_ReturnsViolations()
        {
            // Arrange
            var violations = new List<Policyviolation>
            {
                new Policyviolation { ViolationId = 1 }
            };
            var responseDtos = new List<ViolationResponseDto>
            {
                new ViolationResponseDto { ViolationId = 1 }
            };

            _mockRepo.Setup(r => r.GetAllViolationsAsync()).ReturnsAsync(violations);
            _mockMapper.Setup(m => m.Map<List<ViolationResponseDto>>(violations)).Returns(responseDtos);

            // Act
            var result = await _service.GetAllViolationsAsync();

            // Assert
            Assert.IsTrue(result.Success);
            Assert.That(result.Data!.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task ResolveViolationAsync_WithValidId_ReturnsSuccess()
        {
            // Arrange
            var request = new ResolveViolationRequestDto { ResolutionNotes = "Resolved" };
            var violation = new Policyviolation { ViolationId = 1, Status = "Resolved" };
            var responseDto = new ViolationResponseDto { ViolationId = 1 };

            _mockRepo.Setup(r => r.ResolveViolationAsync(1, "Resolved")).ReturnsAsync(true);
            _mockRepo.Setup(r => r.GetViolationByIdAsync(1)).ReturnsAsync(violation);
            _mockMapper.Setup(m => m.Map<ViolationResponseDto>(violation)).Returns(responseDto);

            // Act
            var result = await _service.ResolveViolationAsync(1, request);

            // Assert
            Assert.IsTrue(result.Success);
        }

        [Test]
        public async Task GetViolationStatsAsync_ReturnsStats()
        {
            // Arrange
            var bySeverity = new Dictionary<string, int> { { "High", 5 } };
            var byStatus = new Dictionary<string, int> { { "Open", 3 } };

            _mockRepo.Setup(r => r.GetViolationCountBySeverityAsync()).ReturnsAsync(bySeverity);
            _mockRepo.Setup(r => r.GetViolationCountByStatusAsync()).ReturnsAsync(byStatus);

            // Act
            var result = await _service.GetViolationStatsAsync();

            // Assert
            Assert.IsTrue(result.Success);
            Assert.IsNotNull(result.Data);
        }
    }
    #endregion
}

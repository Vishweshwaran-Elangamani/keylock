using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common;
using eepzbackend.Controllers;
using System.Security.Claims;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace Relevantz.EEPZ.Tests.Controllers
{
    [TestFixture]
    public class SlaControllerTests
    {
        #region Setup

        private Mock<ISlaService> _mockSlaService;
        private Mock<ILogger<SlaController>> _mockLogger;
        private SlaController _controller;
        private const int TestUserId = 123;

        [SetUp]
        public void Setup()
        {
            _mockSlaService = new Mock<ISlaService>();
            _mockLogger = new Mock<ILogger<SlaController>>();
            _controller = new SlaController(_mockSlaService.Object, _mockLogger.Object);

            // Setup HttpContext with authenticated user
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, TestUserId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal,
                    TraceIdentifier = "test-correlation-id"
                }
            };
        }

        #endregion

        #region GetSlas Tests (3 tests)

        [Test]
        public async Task GetSlas_WithValidRequest_ReturnsOkWithData()
        {
            // Arrange
            var slas = new List<SlaResponse>
            {
                new SlaResponse { Slaid = 1, EmployeeId = 100 },
                new SlaResponse { Slaid = 2, EmployeeId = 200 }
            };
            _mockSlaService.Setup(s => s.GetAllSlas()).ReturnsAsync(slas);

            // Act
            var result = await _controller.GetSlas();

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            Assert.That(okResult!.StatusCode, Is.EqualTo(200));

            var response = okResult.Value as ApiResponse<object>;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Success, Is.True);
            Assert.That(response.Data, Is.Not.Null);
        }

        [Test]
        public async Task GetSlas_WithEmptyResult_ReturnsOkWithEmptyList()
        {
            // Arrange
            _mockSlaService.Setup(s => s.GetAllSlas()).ReturnsAsync(new List<SlaResponse>());

            // Act
            var result = await _controller.GetSlas();

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            Assert.That(okResult!.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task GetSlas_CallsServiceOnce()
        {
            // Arrange
            _mockSlaService.Setup(s => s.GetAllSlas()).ReturnsAsync(new List<SlaResponse>());

            // Act
            await _controller.GetSlas();

            // Assert
            _mockSlaService.Verify(s => s.GetAllSlas(), Times.Once);
        }

        #endregion

        #region CreateSla Tests (3 tests)

        
        [Test]
        public async Task CreateSla_WithInvalidModel_ReturnsBadRequest()
        {
            // Arrange
            var request = new CreateSlaRequest();
            _controller.ModelState.AddModelError("EmployeeId", "Required");

            // Act
            var result = await _controller.CreateSla(request);

            // Assert
            var badResult = result as BadRequestObjectResult;
            Assert.That(badResult, Is.Not.Null);
            Assert.That(badResult!.StatusCode, Is.EqualTo(400));

            var response = badResult.Value as ApiResponse<object>;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Success, Is.False);
            Assert.That(response.Message, Is.EqualTo(ApiMessages.ValidationFailed));
        }

        [Test]
        public async Task CreateSla_PassesCorrectUserId()
        {
            // Arrange
            var request = new CreateSlaRequest { EmployeeId = 100 };
            _mockSlaService.Setup(s => s.CreateSla(request, TestUserId))
                .ReturnsAsync(new CreateSlaResponse());

            // Act
            await _controller.CreateSla(request);

            // Assert
            _mockSlaService.Verify(s => s.CreateSla(request, TestUserId), Times.Once);
        }

        #endregion

        #region BulkCreateSla Tests (4 tests)

        [Test]
        public async Task BulkCreateSla_WithEmptyList_ReturnsBadRequest()
        {
            // Arrange
            var requests = new List<CreateSlaRequest>();

            // Act
            var result = await _controller.BulkCreateSla(requests);

            // Assert
            var badResult = result as BadRequestObjectResult;
            Assert.That(badResult, Is.Not.Null);

            var response = badResult!.Value as ApiResponse<object>;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Message, Is.EqualTo(ApiMessages.NoRecords));
        }

        [Test]
        public async Task BulkCreateSla_WithTooManyRequests_ReturnsBadRequest()
        {
            // Arrange
            var requests = Enumerable.Range(1, 10001)
                .Select(i => new CreateSlaRequest { EmployeeId = i })
                .ToList();

            // Act
            var result = await _controller.BulkCreateSla(requests);

            // Assert
            var badResult = result as BadRequestObjectResult;
            Assert.That(badResult, Is.Not.Null);

            var response = badResult!.Value as ApiResponse<object>;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Message, Is.EqualTo(ApiMessages.BulkLimitExceeded));
        }

        [Test]
        public async Task BulkCreateSla_WithNullList_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.BulkCreateSla(null!);

            // Assert
            var badResult = result as BadRequestObjectResult;
            Assert.That(badResult, Is.Not.Null);
        }

        #endregion

        #region GetSlaById Tests (2 tests)

        [Test]
        public async Task GetSlaById_WithExistingSla_ReturnsOk()
        {
            // Arrange
            var slaId = 1;
            var sla = new SlaResponse { Slaid = slaId, EmployeeId = 100 };
            _mockSlaService.Setup(s => s.GetSlaById(slaId)).ReturnsAsync(sla);

            // Act
            var result = await _controller.GetSlaById(slaId);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            Assert.That(okResult!.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task GetSlaById_WithNonExistingSla_ReturnsNotFound()
        {
            // Arrange
            var slaId = 999;
            _mockSlaService.Setup(s => s.GetSlaById(slaId)).ReturnsAsync((SlaResponse?)null);

            // Act
            var result = await _controller.GetSlaById(slaId);

            // Assert
            var notFoundResult = result as NotFoundObjectResult;
            Assert.That(notFoundResult, Is.Not.Null);
            Assert.That(notFoundResult!.StatusCode, Is.EqualTo(404));

            var response = notFoundResult.Value as ApiResponse<object>;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Message, Is.EqualTo(ApiMessages.NotFound));
        }

        #endregion

        #region UpdateSla Tests (2 tests)

        [Test]
        public async Task UpdateSla_WithValidRequest_ReturnsOk()
        {
            // Arrange
            var slaId = 1;
            var request = new UpdateSlaRequest();
            _mockSlaService.Setup(s => s.UpdateSla(slaId, request, TestUserId))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.UpdateSla(slaId, request);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var response = okResult!.Value as ApiResponse<object>;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Message, Is.EqualTo(ApiMessages.Updated));
        }

        [Test]
        public async Task UpdateSla_CallsServiceWithCorrectParameters()
        {
            // Arrange
            var slaId = 1;
            var request = new UpdateSlaRequest();

            // Act
            await _controller.UpdateSla(slaId, request);

            // Assert
            _mockSlaService.Verify(s => s.UpdateSla(slaId, request, TestUserId), Times.Once);
        }

        #endregion

        #region CloseSla Tests (2 tests)

        [Test]
        public async Task CloseSla_WithValidSlaId_ReturnsOk()
        {
            // Arrange
            var slaId = 1;
            _mockSlaService.Setup(s => s.CloseSla(slaId, TestUserId))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.CloseSla(slaId);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var response = okResult!.Value as ApiResponse<object>;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Message, Is.EqualTo(ApiMessages.Closed));
        }

        [Test]
        public async Task CloseSla_CallsServiceOnce()
        {
            // Arrange
            var slaId = 1;

            // Act
            await _controller.CloseSla(slaId);

            // Assert
            _mockSlaService.Verify(s => s.CloseSla(slaId, TestUserId), Times.Once);
        }

        #endregion

        #region ReopenSla Tests (2 tests)

        [Test]
        public async Task ReopenSla_WithValidRequest_ReturnsOk()
        {
            // Arrange
            var slaId = 1;
            var request = new ReopenSlaRequest
            {
                ExtensionDays = 7,
                ReopenReason = "Test reason"
            };

            var response = new ReopenSlaResponse();

            _mockSlaService.Setup(s => s.ReopenSla(slaId, request.ExtensionDays, request.ReopenReason, TestUserId))
                .ReturnsAsync(response);

            // Act
            var result = await _controller.ReopenSla(slaId, request);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var apiResponse = okResult!.Value as ApiResponse<ReopenSlaResponse>;
            Assert.That(apiResponse, Is.Not.Null);
            Assert.That(apiResponse!.Message, Is.EqualTo(ApiMessages.Reopened));
        }

        [Test]
        public async Task ReopenSla_PassesCorrectParameters()
        {
            // Arrange
            var slaId = 1;
            var request = new ReopenSlaRequest { ExtensionDays = 5, ReopenReason = "Reason" };

            _mockSlaService.Setup(s => s.ReopenSla(slaId, 5, "Reason", TestUserId))
                .ReturnsAsync(new ReopenSlaResponse());

            // Act
            await _controller.ReopenSla(slaId, request);

            // Assert
            _mockSlaService.Verify(s => s.ReopenSla(slaId, 5, "Reason", TestUserId), Times.Once);
        }

        #endregion

        #region GetSlaHistory Tests (2 tests)

        [Test]
        public async Task GetSlaHistory_WithValidSlaId_ReturnsOk()
        {
            // Arrange
            var slaId = 1;
            var history = new List<SlaHistoryResponse>
            {
                new SlaHistoryResponse { Slaid = slaId }
            };

            _mockSlaService.Setup(s => s.GetSlaHistory(slaId)).ReturnsAsync(history);

            // Act
            var result = await _controller.GetSlaHistory(slaId);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var response = okResult!.Value as ApiResponse<List<SlaHistoryResponse>>;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Data.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task GetSlaHistory_WithNoHistory_ReturnsEmptyList()
        {
            // Arrange
            var slaId = 1;
            _mockSlaService.Setup(s => s.GetSlaHistory(slaId))
                .ReturnsAsync(new List<SlaHistoryResponse>());

            // Act
            var result = await _controller.GetSlaHistory(slaId);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
        }

        #endregion

        #region GetEmployeeSlas Tests (2 tests)

        [Test]
        public async Task GetEmployeeSlas_WithValidEmployeeId_ReturnsOk()
        {
            // Arrange
            var employeeId = 100;
            var slas = new List<SlaResponse>
            {
                new SlaResponse { Slaid = 1, EmployeeId = employeeId }
            };

            _mockSlaService.Setup(s => s.GetEmployeeSlas(employeeId)).ReturnsAsync(slas);

            // Act
            var result = await _controller.GetEmployeeSlas(employeeId);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var response = okResult!.Value as ApiResponse<List<SlaResponse>>;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Data.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task GetEmployeeSlas_CallsServiceWithCorrectId()
        {
            // Arrange
            var employeeId = 100;
            _mockSlaService.Setup(s => s.GetEmployeeSlas(employeeId))
                .ReturnsAsync(new List<SlaResponse>());

            // Act
            await _controller.GetEmployeeSlas(employeeId);

            // Assert
            _mockSlaService.Verify(s => s.GetEmployeeSlas(employeeId), Times.Once);
        }

        #endregion

        #region GetDepartmentCompliance Tests (3 tests)

        [Test]
        public async Task GetDepartmentCompliance_WithDepartmentId_ReturnsDepartmentCompliance()
        {
            // Arrange
            var departmentId = 10;
            var compliance = new DepartmentComplianceResponse { DepartmentId = departmentId };

            _mockSlaService.Setup(s => s.GetDepartmentCompliance(departmentId, null))
                .ReturnsAsync(compliance);

            // Act
            var result = await _controller.GetDepartmentCompliance(departmentId, null, "dept");

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
        }

        [Test]
        public async Task GetDepartmentCompliance_WithoutDepartmentId_ReturnsAllCompliance()
        {
            // Arrange
            var allCompliance = new List<DepartmentComplianceResponse>
            {
                new DepartmentComplianceResponse { DepartmentId = 1 }
            };

            _mockSlaService.Setup(s => s.GetAllDepartmentCompliance(null))
                .ReturnsAsync(allCompliance);

            // Act
            var result = await _controller.GetDepartmentCompliance(null, null, "all");

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
        }

        [Test]
        public async Task GetDepartmentCompliance_WithPeriod_PassesPeriodToService()
        {
            // Arrange
            var period = "2024-Q1";
            _mockSlaService.Setup(s => s.GetAllDepartmentCompliance(period))
                .ReturnsAsync(new List<DepartmentComplianceResponse>());

            // Act
            await _controller.GetDepartmentCompliance(null, period, "all");

            // Assert
            _mockSlaService.Verify(s => s.GetAllDepartmentCompliance(period), Times.Once);
        }

        #endregion

        #region CalculateCompliance Tests (2 tests)

        [Test]
        public async Task CalculateCompliance_WithValidRequest_ReturnsOk()
        {
            // Arrange
            var request = new CalculateComplianceRequest
            {
                DepartmentId = 10,
                Period = "2024-Q1"
            };

            var response = new DepartmentComplianceResponse { DepartmentId = 10 };
            _mockSlaService.Setup(s => s.CalculateCompliance(request)).ReturnsAsync(response);

            // Act
            var result = await _controller.CalculateCompliance(request);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var apiResponse = okResult!.Value as ApiResponse<DepartmentComplianceResponse>;
            Assert.That(apiResponse, Is.Not.Null);
            Assert.That(apiResponse!.Message, Is.EqualTo(ApiMessages.ComplianceCalculated));
        }

        [Test]
        public async Task CalculateCompliance_CallsServiceOnce()
        {
            // Arrange
            var request = new CalculateComplianceRequest { DepartmentId = 10 };
            _mockSlaService.Setup(s => s.CalculateCompliance(request))
                .ReturnsAsync(new DepartmentComplianceResponse());

            // Act
            await _controller.CalculateCompliance(request);

            // Assert
            _mockSlaService.Verify(s => s.CalculateCompliance(request), Times.Once);
        }

        #endregion

        #region SubmitEscalation Tests (3 tests)

        [Test]
        public async Task SubmitEscalation_WithValidRequest_ReturnsOk()
        {
            // Arrange
            var slaId = 1;
            var request = new SubmitSlaEscalationRequest();

            var response = new EscalationResponse { EscalationId = 1, Slaid = slaId };
            _mockSlaService.Setup(s => s.SubmitEscalation(It.IsAny<SubmitSlaEscalationRequest>(), TestUserId, null))
                .ReturnsAsync(response);

            // Act
            var result = await _controller.SubmitEscalation(slaId, null, request);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var apiResponse = okResult!.Value as ApiResponse<EscalationResponse>;
            Assert.That(apiResponse, Is.Not.Null);
            Assert.That(apiResponse!.Data.EscalationId, Is.EqualTo(1));
        }

        [Test]
        public async Task SubmitEscalation_WithDeptHeadLevel_SetsCorrectLevel()
        {
            // Arrange
            var slaId = 1;
            var request = new SubmitSlaEscalationRequest();

            _mockSlaService.Setup(s => s.SubmitEscalation(It.IsAny<SubmitSlaEscalationRequest>(), TestUserId, "dept-head"))
                .ReturnsAsync(new EscalationResponse());

            // Act
            await _controller.SubmitEscalation(slaId, "dept-head", request);

            // Assert
            Assert.That(request.EscalationLevel, Is.EqualTo("DeptHead"));
            Assert.That(request.Slaid, Is.EqualTo(slaId));
            Assert.That(request.SubmittedByEmployeeId, Is.EqualTo(TestUserId));
        }

        [Test]
        public async Task SubmitEscalation_SetsSlaidAndUserId()
        {
            // Arrange
            var slaId = 5;
            var request = new SubmitSlaEscalationRequest();

            _mockSlaService.Setup(s => s.SubmitEscalation(It.IsAny<SubmitSlaEscalationRequest>(), TestUserId, null))
                .ReturnsAsync(new EscalationResponse());

            // Act
            await _controller.SubmitEscalation(slaId, null, request);

            // Assert
            Assert.That(request.Slaid, Is.EqualTo(slaId));
            Assert.That(request.SubmittedByEmployeeId, Is.EqualTo(TestUserId));
        }

        #endregion

        #region EscalateToDeptHead Tests (2 tests)

        [Test]
        public async Task EscalateToDeptHead_WithValidRequest_ReturnsOk()
        {
            // Arrange
            var request = new SubmitSlaEscalationRequest { Slaid = 1 };
            var response = new EscalationResponse { EscalationId = 1 };

            _mockSlaService.Setup(s => s.EscalateToDeptHead(request, TestUserId))
                .ReturnsAsync(response);

            // Act
            var result = await _controller.EscalateToDeptHead(request);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var apiResponse = okResult!.Value as ApiResponse<EscalationResponse>;
            Assert.That(apiResponse, Is.Not.Null);
            Assert.That(apiResponse!.Message, Does.Contain("Department Head"));
        }

        [Test]
        public async Task EscalateToDeptHead_CallsServiceOnce()
        {
            // Arrange
            var request = new SubmitSlaEscalationRequest { Slaid = 1 };
            _mockSlaService.Setup(s => s.EscalateToDeptHead(request, TestUserId))
                .ReturnsAsync(new EscalationResponse());

            // Act
            await _controller.EscalateToDeptHead(request);

            // Assert
            _mockSlaService.Verify(s => s.EscalateToDeptHead(request, TestUserId), Times.Once);
        }

        #endregion

        #region GetSlaEscalations Tests (2 tests)

        [Test]
        public async Task GetSlaEscalations_WithValidSlaId_ReturnsOk()
        {
            // Arrange
            var slaId = 1;
            var escalations = new List<EscalationResponse>
            {
                new EscalationResponse { EscalationId = 1, Slaid = slaId }
            };

            _mockSlaService.Setup(s => s.GetSlaEscalations(slaId)).ReturnsAsync(escalations);

            // Act
            var result = await _controller.GetSlaEscalations(slaId);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var response = okResult!.Value as ApiResponse<List<EscalationResponse>>;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Data.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task GetSlaEscalations_WithNoEscalations_ReturnsEmptyList()
        {
            // Arrange
            var slaId = 1;
            _mockSlaService.Setup(s => s.GetSlaEscalations(slaId))
                .ReturnsAsync(new List<EscalationResponse>());

            // Act
            var result = await _controller.GetSlaEscalations(slaId);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
        }

        #endregion

        #region ResolveEscalation Tests (2 tests)

        [Test]
        public async Task ResolveEscalation_WithValidRequest_ReturnsOk()
        {
            // Arrange
            var request = new ResolveEscalationRequest
            {
                EscalationId = 1
            };

            _mockSlaService.Setup(s => s.ResolveEscalation(request, TestUserId))
                .ReturnsAsync("Success");

            // Act
            var result = await _controller.ResolveEscalation(request);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
        }

        [Test]
        public async Task ResolveEscalation_CallsServiceOnce()
        {
            // Arrange
            var request = new ResolveEscalationRequest { EscalationId = 1 };
            _mockSlaService.Setup(s => s.ResolveEscalation(request, TestUserId))
                .ReturnsAsync("Success");

            // Act
            await _controller.ResolveEscalation(request);

            // Assert
            _mockSlaService.Verify(s => s.ResolveEscalation(request, TestUserId), Times.Once);
        }

        #endregion

        #region GetManagerEscalations Tests (2 tests)

        [Test]
        public async Task GetManagerEscalations_WithValidManager_ReturnsOk()
        {
            // Arrange
            var escalations = new List<EscalationResponse>
            {
                new EscalationResponse { EscalationId = 1 }
            };

            _mockSlaService.Setup(s => s.GetManagerEscalations(TestUserId))
                .ReturnsAsync(escalations);

            // Act
            var result = await _controller.GetManagerEscalations();

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var response = okResult!.Value as ApiResponse<List<EscalationResponse>>;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Data.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task GetManagerEscalations_UsesCorrectManagerId()
        {
            // Arrange
            _mockSlaService.Setup(s => s.GetManagerEscalations(TestUserId))
                .ReturnsAsync(new List<EscalationResponse>());

            // Act
            await _controller.GetManagerEscalations();

            // Assert
            _mockSlaService.Verify(s => s.GetManagerEscalations(TestUserId), Times.Once);
        }

        #endregion

        #region DeleteSla Tests (2 tests)

        [Test]
        public async Task DeleteSla_WithValidSlaId_ReturnsOk()
        {
            // Arrange
            var slaId = 1;
            _mockSlaService.Setup(s => s.DeleteSla(slaId)).Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeleteSla(slaId);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var response = okResult!.Value as ApiResponse<object>;
            Assert.That(response, Is.Not.Null);
            Assert.That(response!.Message, Is.EqualTo(ApiMessages.Deleted));
        }

        [Test]
        public async Task DeleteSla_CallsServiceOnce()
        {
            // Arrange
            var slaId = 1;

            // Act
            await _controller.DeleteSla(slaId);

            // Assert
            _mockSlaService.Verify(s => s.DeleteSla(slaId), Times.Once);
        }

        #endregion
    }

    [TestFixture]
    public class SlaAutomationControllerTests
    {
        #region Setup

        private Mock<ISlaAutomationService> _mockAutomationService;
        private Mock<ILogger<SlaAutomationController>> _mockLogger;
        private SlaAutomationController _controller;

        [SetUp]
        public void Setup()
        {
            _mockAutomationService = new Mock<ISlaAutomationService>();
            _mockLogger = new Mock<ILogger<SlaAutomationController>>();
            _controller = new SlaAutomationController(_mockAutomationService.Object, _mockLogger.Object);
        }

        #endregion

        #region SendReminders Tests (2 tests)

        [Test]
        public async Task SendReminders_WithValidDayOffset_ReturnsSuccess()
        {
            // Arrange
            var dayOffset = 2;
            var response = new ApiResponse<SlaReminderSummaryResponse>
            {
                Success = true,
                Data = new SlaReminderSummaryResponse
                {
                    EmailsSent = 5,
                    EmailsFailed = 0
                }
            };

            _mockAutomationService.Setup(s => s.SendReminders(dayOffset)).ReturnsAsync(response);

            // Act
            var result = await _controller.SendReminders(dayOffset);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data!.EmailsSent, Is.EqualTo(5));
        }

        [Test]
        public async Task SendReminders_CallsServiceWithCorrectOffset()
        {
            // Arrange
            var dayOffset = 1;
            _mockAutomationService.Setup(s => s.SendReminders(dayOffset))
                .ReturnsAsync(new ApiResponse<SlaReminderSummaryResponse>());

            // Act
            await _controller.SendReminders(dayOffset);

            // Assert
            _mockAutomationService.Verify(s => s.SendReminders(dayOffset), Times.Once);
        }

        #endregion

        #region SendAllReminders Tests (2 tests)

        [Test]
        public async Task SendAllReminders_ReturnsSuccess()
        {
            // Arrange
            var response = new ApiResponse<SlaReminderSummaryResponse>
            {
                Success = true,
                Data = new SlaReminderSummaryResponse { TotalSlas = 10 }
            };

            _mockAutomationService.Setup(s => s.RunReminderCycle()).ReturnsAsync(response);

            // Act
            var result = await _controller.SendAllReminders();

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data!.TotalSlas, Is.EqualTo(10));
        }

        [Test]
        public async Task SendAllReminders_CallsServiceOnce()
        {
            // Arrange
            _mockAutomationService.Setup(s => s.RunReminderCycle())
                .ReturnsAsync(new ApiResponse<SlaReminderSummaryResponse>());

            // Act
            await _controller.SendAllReminders();

            // Assert
            _mockAutomationService.Verify(s => s.RunReminderCycle(), Times.Once);
        }

        #endregion

        #region AutoCloseSlas Tests (2 tests)

        [Test]
        public async Task AutoCloseSlas_ReturnsSuccess()
        {
            // Arrange
            var response = new ApiResponse<SlaClosureSummaryResponse>
            {
                Success = true,
                Data = new SlaClosureSummaryResponse { SlasClosed = 3 }
            };

            _mockAutomationService.Setup(s => s.AutoCloseSlas()).ReturnsAsync(response);

            // Act
            var result = await _controller.AutoCloseSlas();

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data!.SlasClosed, Is.EqualTo(3));
        }

        [Test]
        public async Task AutoCloseSlas_CallsServiceOnce()
        {
            // Arrange
            _mockAutomationService.Setup(s => s.AutoCloseSlas())
                .ReturnsAsync(new ApiResponse<SlaClosureSummaryResponse>());

            // Act
            await _controller.AutoCloseSlas();

            // Assert
            _mockAutomationService.Verify(s => s.AutoCloseSlas(), Times.Once);
        }

        #endregion

        #region RunFullAutomationCycle Tests (2 tests)

        [Test]
        public async Task RunFullAutomationCycle_ReturnsSuccess()
        {
            // Arrange
            var response = new ApiResponse<int>
            {
                Success = true,
                Data = 15
            };

            _mockAutomationService.Setup(s => s.RunFullAutomationCycle()).ReturnsAsync(response);

            // Act
            var result = await _controller.RunFullAutomationCycle();

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.EqualTo(15));
        }

        [Test]
        public async Task RunFullAutomationCycle_CallsServiceOnce()
        {
            // Arrange
            _mockAutomationService.Setup(s => s.RunFullAutomationCycle())
                .ReturnsAsync(new ApiResponse<int>());

            // Act
            await _controller.RunFullAutomationCycle();

            // Assert
            _mockAutomationService.Verify(s => s.RunFullAutomationCycle(), Times.Once);
        }

        #endregion

        #region GetAutomationStatus Tests (2 tests)

        [Test]
        public async Task GetAutomationStatus_ReturnsStatus()
        {
            // Arrange
            var response = new ApiResponse<AutomationStatusResponse>
            {
                Success = true,
                Data = new AutomationStatusResponse()
            };

            _mockAutomationService.Setup(s => s.GetAutomationStatus()).ReturnsAsync(response);

            // Act
            var result = await _controller.GetAutomationStatus();

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.Not.Null);
        }

        [Test]
        public async Task GetAutomationStatus_CallsServiceOnce()
        {
            // Arrange
            _mockAutomationService.Setup(s => s.GetAutomationStatus())
                .ReturnsAsync(new ApiResponse<AutomationStatusResponse>());

            // Act
            await _controller.GetAutomationStatus();

            // Assert
            _mockAutomationService.Verify(s => s.GetAutomationStatus(), Times.Once);
        }

        #endregion

        #region GetAutomationLogs Tests (3 tests)

        [Test]
        public async Task GetAutomationLogs_WithDefaultDays_ReturnsLogs()
        {
            // Arrange
            var response = new ApiResponse<AutomationLogResponse>
            {
                Success = true,
                Data = new AutomationLogResponse()
            };

            _mockAutomationService.Setup(s => s.GetAutomationLogs(7)).ReturnsAsync(response);

            // Act
            var result = await _controller.GetAutomationLogs();

            // Assert
            Assert.That(result.Success, Is.True);
        }

        [Test]
        public async Task GetAutomationLogs_WithCustomDays_PassesToService()
        {
            // Arrange
            var days = 30;
            _mockAutomationService.Setup(s => s.GetAutomationLogs(days))
                .ReturnsAsync(new ApiResponse<AutomationLogResponse>());

            // Act
            await _controller.GetAutomationLogs(days);

            // Assert
            _mockAutomationService.Verify(s => s.GetAutomationLogs(days), Times.Once);
        }

        [Test]
        public async Task GetAutomationLogs_CallsServiceOnce()
        {
            // Arrange
            _mockAutomationService.Setup(s => s.GetAutomationLogs(It.IsAny<int>()))
                .ReturnsAsync(new ApiResponse<AutomationLogResponse>());

            // Act
            await _controller.GetAutomationLogs();

            // Assert
            _mockAutomationService.Verify(s => s.GetAutomationLogs(It.IsAny<int>()), Times.Once);
        }

        #endregion
    }
}

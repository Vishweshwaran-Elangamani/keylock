#pragma warning disable CS8604 // Possible null reference argument (by design in these tests)
#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type (tests intentionally pass null)

using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
// Controllers / Services
using Relevantz.EEPZ.Api.Controllers;
// Use the actual DTOs + response models from the Common project
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;

namespace Relevantz.EEPZ.Api.Tests.Controllers
{
    [TestFixture]
    public class LnDControllerTests
    {
        private LnDController _controller;
        private Mock<ILnDService> _mockService;
        private ClaimsPrincipal _employeeUser;
        private ClaimsPrincipal _hrUser;

        [SetUp]
        public void Setup()
        {
            // Arrange (test fixture): controller + mocks + identities
            _mockService = new Mock<ILnDService>();
            _controller = new LnDController(_mockService.Object);

            _employeeUser = new ClaimsPrincipal(
                new ClaimsIdentity(
                    new List<Claim>
                    {
                        new Claim("empId", "1"),
                        new Claim(ClaimTypes.Role, "Employee"),
                    },
                    "TestAuth"
                )
            );

            _hrUser = new ClaimsPrincipal(
                new ClaimsIdentity(
                    new List<Claim> { new Claim("empId", "2"), new Claim(ClaimTypes.Role, "HR") },
                    "TestAuth"
                )
            );

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = _employeeUser },
            };
        }

        #region Employee Skills Management Tests (20 tests)

        [Test]
        [Category("EmployeeSkills")]
        public async Task GetSubordinateEmployees_WithValidData_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<SubordinateEmployeeDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetSubordinateEmployees(
                        It.IsAny<int>(),
                        It.IsAny<string>(),
                        It.IsAny<int>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetSubordinateEmployees("test", 1, 9);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task GetSubordinateEmployees_WithNullSearchTerm_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<SubordinateEmployeeDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetSubordinateEmployees(
                        It.IsAny<int>(),
                        It.IsAny<string>(),
                        It.IsAny<int>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetSubordinateEmployees(null, 1, 9);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task GetSubordinateEmployees_WithPaginationPage2_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<SubordinateEmployeeDto>>(default!);
            _mockService
                .Setup(s => s.GetSubordinateEmployees(It.IsAny<int>(), It.IsAny<string>(), 2, 15))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetSubordinateEmployees("test", 2, 15);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task GetSubordinateEmployees_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var response = TestHelper.Fail<PaginatedResponse<SubordinateEmployeeDto>>(
                "Service error"
            );
            _mockService
                .Setup(s =>
                    s.GetSubordinateEmployees(
                        It.IsAny<int>(),
                        It.IsAny<string>(),
                        It.IsAny<int>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetSubordinateEmployees("test", 1, 9);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task GetAllSkills_WithValidRequest_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<List<SkillDto>>(new List<SkillDto>());
            _mockService.Setup(s => s.GetAllSkills()).Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAllSkills();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task GetAllSkills_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var response = TestHelper.Fail<List<SkillDto>>("Failed to fetch skills");
            _mockService.Setup(s => s.GetAllSkills()).Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAllSkills();

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task GetSubordinateSkills_WithAllParameters_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<EmployeeSkillDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetSubordinateSkills(
                        It.IsAny<int>(),
                        It.IsAny<int?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetSubordinateSkills(10, "search", "employeename", 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task GetSubordinateSkills_WithNullOptionalParams_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<EmployeeSkillDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetSubordinateSkills(
                        It.IsAny<int>(),
                        It.IsAny<int?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetSubordinateSkills(null, null, "employeename", 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task GetSubordinateSkills_SortBySkillName_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<EmployeeSkillDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetSubordinateSkills(
                        It.IsAny<int>(),
                        It.IsAny<int?>(),
                        It.IsAny<string?>(),
                        "skillname",
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetSubordinateSkills(10, "search", "skillname", 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task GetSubordinateSkills_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var response = TestHelper.Fail<PaginatedResponse<EmployeeSkillDto>>("Failed");
            _mockService
                .Setup(s =>
                    s.GetSubordinateSkills(
                        It.IsAny<int>(),
                        It.IsAny<int?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetSubordinateSkills(10, "search", "employeename", 1);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task RecordEmployeeSkill_WithValidData_ReturnsOk()
        {
            // Arrange
            var request = new RecordSkillRequest();
            var response = TestHelper.Success<EmployeeSkillDto>(default!);
            _mockService
                .Setup(s => s.RecordEmployeeSkill(It.IsAny<int>(), It.IsAny<RecordSkillRequest>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.RecordEmployeeSkill(request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task RecordEmployeeSkill_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var request = new RecordSkillRequest();
            var response = TestHelper.Fail<EmployeeSkillDto>("Failed to record skill");
            _mockService
                .Setup(s => s.RecordEmployeeSkill(It.IsAny<int>(), It.IsAny<RecordSkillRequest>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.RecordEmployeeSkill(request);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task BulkRecordEmployeeSkills_WithValidData_ReturnsOk()
        {
            // Arrange
            var request = new BulkRecordSkillRequest();
            var response = TestHelper.Success<List<EmployeeSkillDto>>(new List<EmployeeSkillDto>());
            _mockService
                .Setup(s =>
                    s.BulkRecordEmployeeSkills(It.IsAny<int>(), It.IsAny<BulkRecordSkillRequest>())
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.BulkRecordEmployeeSkills(request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task BulkRecordEmployeeSkills_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var request = new BulkRecordSkillRequest();
            var response = TestHelper.Fail<List<EmployeeSkillDto>>("Bulk operation failed");
            _mockService
                .Setup(s =>
                    s.BulkRecordEmployeeSkills(It.IsAny<int>(), It.IsAny<BulkRecordSkillRequest>())
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.BulkRecordEmployeeSkills(request);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task UpdateEmployeeSkillRating_WithValidData_ReturnsOk()
        {
            // Arrange
            var request = new UpdateSkillRatingRequest();
            var response = TestHelper.Success<EmployeeSkillDto>(default!);
            _mockService
                .Setup(s =>
                    s.UpdateEmployeeSkillRating(
                        It.IsAny<int>(),
                        It.IsAny<UpdateSkillRatingRequest>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.UpdateEmployeeSkillRating(request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task UpdateEmployeeSkillRating_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var request = new UpdateSkillRatingRequest();
            var response = TestHelper.Fail<EmployeeSkillDto>("Update failed");
            _mockService
                .Setup(s =>
                    s.UpdateEmployeeSkillRating(
                        It.IsAny<int>(),
                        It.IsAny<UpdateSkillRatingRequest>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.UpdateEmployeeSkillRating(request);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task DeleteEmployeeSkill_WithValidMapperId_ReturnsOk()
        {
            // Arrange
            var mapperId = 1;
            var response = TestHelper.Success<bool>(true);
            _mockService
                .Setup(s => s.DeleteEmployeeSkill(It.IsAny<int>(), mapperId))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.DeleteEmployeeSkill(mapperId);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task DeleteEmployeeSkill_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var mapperId = 1;
            var response = TestHelper.Fail<bool>("Delete failed");
            _mockService
                .Setup(s => s.DeleteEmployeeSkill(It.IsAny<int>(), mapperId))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.DeleteEmployeeSkill(mapperId);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task GetMySkills_WithSearchTerm_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<EmployeeSkillDto>>(default!);
            _mockService
                .Setup(s => s.GetMySkills(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetMySkills("test", 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("EmployeeSkills")]
        public async Task GetMySkills_WithNullSearchTerm_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<EmployeeSkillDto>>(default!);
            _mockService
                .Setup(s => s.GetMySkills(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetMySkills(null, 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        #endregion

        #region SME Management Tests (10 tests)

        [Test]
        [Category("SMEManagement")]
        public async Task CheckIfEmployeeIsSme_ReturnsTrueWhenSme_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<bool>(true);
            _mockService
                .Setup(s => s.CheckIfEmployeeIsSme(It.IsAny<int>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.CheckIfEmployeeIsSme();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("SMEManagement")]
        public async Task CheckIfEmployeeIsSme_ReturnsFalseWhenNotSme_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<bool>(false);
            _mockService
                .Setup(s => s.CheckIfEmployeeIsSme(It.IsAny<int>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.CheckIfEmployeeIsSme();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("SMEManagement")]
        public async Task CheckIfEmployeeIsSme_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var response = TestHelper.Fail<bool>("Check failed");
            _mockService
                .Setup(s => s.CheckIfEmployeeIsSme(It.IsAny<int>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.CheckIfEmployeeIsSme();

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("SMEManagement")]
        public async Task ApplyToBecomeSme_WithValidRequest_ReturnsOk()
        {
            // Arrange
            var request = new BecomeSmeRequest();
            var response = TestHelper.Success<int>(1); // application/request id
            _mockService
                .Setup(s => s.ApplyToBecomeSme(It.IsAny<int>(), It.IsAny<BecomeSmeRequest>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.ApplyToBecomeSme(request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("SMEManagement")]
        public async Task ApplyToBecomeSme_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var request = new BecomeSmeRequest();
            var response = TestHelper.Fail<int>("Application failed");
            _mockService
                .Setup(s => s.ApplyToBecomeSme(It.IsAny<int>(), It.IsAny<BecomeSmeRequest>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.ApplyToBecomeSme(request);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("SMEManagement")]
        public async Task GetAvailableSmes_WithSkillId_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<SmeDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetAvailableSmes(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>())
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAvailableSmes(1, "test", 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("SMEManagement")]
        public async Task GetAvailableSmes_WithNullSearchTerm_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<SmeDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetAvailableSmes(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>())
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAvailableSmes(1, null, 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("SMEManagement")]
        public async Task GetAvailableSmes_Page2_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<SmeDto>>(default!);
            _mockService
                .Setup(s => s.GetAvailableSmes(It.IsAny<int>(), It.IsAny<string>(), 2))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAvailableSmes(1, "test", 2);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("SMEManagement")]
        public async Task GetAvailableSmes_DifferentSkillId_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<SmeDto>>(default!);
            _mockService
                .Setup(s => s.GetAvailableSmes(5, It.IsAny<string>(), It.IsAny<int>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAvailableSmes(5, "test", 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("SMEManagement")]
        public async Task GetAvailableSmes_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var response = TestHelper.Fail<PaginatedResponse<SmeDto>>("Failed");
            _mockService
                .Setup(s =>
                    s.GetAvailableSmes(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>())
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAvailableSmes(1, "test", 1);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        #endregion

        #region HR Management Tests (10 tests)

        [Test]
        [Category("HRManagement")]
        public async Task GetAllOrganizationEmployees_AsHR_ReturnsOk()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = _hrUser;
            var response = TestHelper.Success<PaginatedResponse<SubordinateEmployeeDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetAllOrganizationEmployees(
                        It.IsAny<string>(),
                        It.IsAny<int>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAllOrganizationEmployees("test", 1, 9);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("HRManagement")]
        public async Task GetAllOrganizationEmployees_WithNullSearchTerm_ReturnsOk()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = _hrUser;
            var response = TestHelper.Success<PaginatedResponse<SubordinateEmployeeDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetAllOrganizationEmployees(
                        It.IsAny<string>(),
                        It.IsAny<int>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAllOrganizationEmployees(null, 1, 9);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("HRManagement")]
        public async Task GetAllOrganizationEmployees_CustomPageSize_ReturnsOk()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = _hrUser;
            var response = TestHelper.Success<PaginatedResponse<SubordinateEmployeeDto>>(default!);
            _mockService
                .Setup(s => s.GetAllOrganizationEmployees(It.IsAny<string>(), It.IsAny<int>(), 20))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAllOrganizationEmployees("test", 1, 20);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("HRManagement")]
        public async Task GetAllOrganizationEmployees_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = _hrUser;
            var response = TestHelper.Fail<PaginatedResponse<SubordinateEmployeeDto>>("Failed");
            _mockService
                .Setup(s =>
                    s.GetAllOrganizationEmployees(
                        It.IsAny<string>(),
                        It.IsAny<int>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAllOrganizationEmployees("test", 1, 9);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("HRManagement")]
        public async Task GetAllOrganizationAssignments_AsHR_ReturnsOk()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = _hrUser;
            var response = TestHelper.Success<PaginatedResponse<AssignmentDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetAllOrganizationAssignments(
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<int>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAllOrganizationAssignments(
                "active",
                "test",
                "field",
                "asc",
                1,
                10
            );

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("HRManagement")]
        public async Task GetAllOrganizationAssignments_WithNullFilters_ReturnsOk()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = _hrUser;
            var response = TestHelper.Success<PaginatedResponse<AssignmentDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetAllOrganizationAssignments(
                        null,
                        null,
                        null,
                        null,
                        It.IsAny<int>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAllOrganizationAssignments(
                null,
                null,
                null,
                null,
                1,
                10
            );

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("HRManagement")]
        public async Task GetAllOrganizationAssignments_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = _hrUser;
            var response = TestHelper.Fail<PaginatedResponse<AssignmentDto>>("Failed");
            _mockService
                .Setup(s =>
                    s.GetAllOrganizationAssignments(
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<int>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAllOrganizationAssignments(
                "active",
                "test",
                "field",
                "asc",
                1,
                10
            );

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("HRManagement")]
        public async Task GetAllActiveSmes_AsHR_ReturnsOk()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = _hrUser;
            var response = TestHelper.Success<PaginatedResponse<SmeDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetAllActiveSmes(It.IsAny<string?>(), It.IsAny<int>(), It.IsAny<int>())
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAllActiveSmes("test", 1, 10);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("HRManagement")]
        public async Task GetAllActiveSmes_WithNullSearchTerm_ReturnsOk()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = _hrUser;
            var response = TestHelper.Success<PaginatedResponse<SmeDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetAllActiveSmes(It.IsAny<string?>(), It.IsAny<int>(), It.IsAny<int>())
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetAllActiveSmes(null, 1, 10);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("HRManagement")]
        public async Task GetEmployeeSkillsById_AsHR_ReturnsOk()
        {
            // Arrange
            _controller.ControllerContext.HttpContext.User = _hrUser;
            var response = TestHelper.Success<PaginatedResponse<EmployeeSkillDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetEmployeeSkillsById(
                        It.IsAny<int>(),
                        It.IsAny<int>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetEmployeeSkillsById(5, 1, "", "skillname");

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        #endregion

        #region Assignment Management Tests (10 tests)

        [Test]
        [Category("AssignmentManagement")]
        public async Task RequestSmeAssignment_WithValidRequest_ReturnsOk()
        {
            // Arrange
            var request = new SmeRequestDto();
            var response = TestHelper.Success<int>(1); // new request id
            _mockService
                .Setup(s => s.RequestSmeAssignment(It.IsAny<int>(), It.IsAny<SmeRequestDto>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.RequestSmeAssignment(request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("AssignmentManagement")]
        public async Task RequestSmeAssignment_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var request = new SmeRequestDto();
            var response = TestHelper.Fail<int>("Request failed");
            _mockService
                .Setup(s => s.RequestSmeAssignment(It.IsAny<int>(), It.IsAny<SmeRequestDto>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.RequestSmeAssignment(request);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("AssignmentManagement")]
        public async Task GetMyAssignments_WithFilters_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<AssignmentDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetMyAssignments(
                        It.IsAny<int>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetMyAssignments("active", "test", "field", "asc", 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("AssignmentManagement")]
        public async Task GetMyAssignments_WithNullFilters_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<AssignmentDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetMyAssignments(It.IsAny<int>(), null, null, null, null, It.IsAny<int>())
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetMyAssignments(null, null, null, null, 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("AssignmentManagement")]
        public async Task GetMyAssignments_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var response = TestHelper.Fail<PaginatedResponse<AssignmentDto>>("Failed");
            _mockService
                .Setup(s =>
                    s.GetMyAssignments(
                        It.IsAny<int>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetMyAssignments("active", "test", "field", "asc", 1);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("AssignmentManagement")]
        public async Task GetTeamAssignments_WithFilters_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<AssignmentDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetTeamAssignments(
                        It.IsAny<int>(),
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetTeamAssignments("active", "test", "field", "asc", 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("AssignmentManagement")]
        public async Task GetTeamAssignments_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var response = TestHelper.Fail<PaginatedResponse<AssignmentDto>>("Failed");
            _mockService
                .Setup(s =>
                    s.GetTeamAssignments(
                        It.IsAny<int>(),
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetTeamAssignments("active", "test", "field", "asc", 1);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("AssignmentManagement")]
        public async Task GetSmeAssignments_WithFilters_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<AssignmentDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetSmeAssignments(
                        It.IsAny<int>(),
                        It.IsAny<string>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetSmeAssignments("active", "test", "field", "asc", 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("AssignmentManagement")]
        public async Task UploadCompletionProof_WithValidRequest_ReturnsOk()
        {
            // Arrange
            var request = new UploadCompletionProofRequest();
            var response = TestHelper.Success<bool>(true);
            _mockService
                .Setup(s =>
                    s.UploadCompletionProof(
                        It.IsAny<int>(),
                        It.IsAny<UploadCompletionProofRequest>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.UploadCompletionProof(request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("AssignmentManagement")]
        public async Task CompleteAssignment_WithValidRequest_ReturnsOk()
        {
            // Arrange
            var request = new CompleteAssignmentRequest();
            var response = TestHelper.Success<bool>(true);
            _mockService
                .Setup(s =>
                    s.CompleteAssignment(It.IsAny<int>(), It.IsAny<CompleteAssignmentRequest>())
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.CompleteAssignment(request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        #endregion

        #region Approvals Management Tests (5 tests)

        [Test]
        [Category("ApprovalsManagement")]
        public async Task GetMyApprovals_WithFilters_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<ApprovalDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetMyApprovals(
                        It.IsAny<int>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetMyApprovals("sme", "pending", "field", "asc", 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("ApprovalsManagement")]
        public async Task GetMyApprovals_WithNullFilters_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<ApprovalDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetMyApprovals(It.IsAny<int>(), null, null, null, null, It.IsAny<int>())
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetMyApprovals(null, null, null, null, 1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("ApprovalsManagement")]
        public async Task ProcessApproval_WithApproveDecision_ReturnsOk()
        {
            // Arrange
            var request = new ApprovalDecisionRequest();
            var response = TestHelper.Success<bool>(true);
            _mockService
                .Setup(s => s.ProcessApproval(It.IsAny<int>(), It.IsAny<ApprovalDecisionRequest>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.ProcessApproval(request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("ApprovalsManagement")]
        public async Task ProcessApproval_WithRejectDecision_ReturnsOk()
        {
            // Arrange
            var request = new ApprovalDecisionRequest();
            var response = TestHelper.Success<bool>(true);
            _mockService
                .Setup(s => s.ProcessApproval(It.IsAny<int>(), It.IsAny<ApprovalDecisionRequest>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.ProcessApproval(request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("ApprovalsManagement")]
        public async Task ProcessApproval_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var request = new ApprovalDecisionRequest();
            var response = TestHelper.Fail<bool>("Processing failed");
            _mockService
                .Setup(s => s.ProcessApproval(It.IsAny<int>(), It.IsAny<ApprovalDecisionRequest>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.ProcessApproval(request);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        #endregion

        #region Approval History & File Downloads Tests (5 tests)

        [Test]
        [Category("ApprovalHistory")]
        public async Task GetApprovalHistory_WithAllFilters_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<PaginatedResponse<ApprovalDto>>(default!);
            _mockService
                .Setup(s =>
                    s.GetApprovalHistory(
                        It.IsAny<int>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<string?>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetApprovalHistory(
                "sme",
                "approved",
                "requester",
                "test",
                "field",
                "asc",
                1
            );

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("ApprovalHistory")]
        public async Task GetApprovalDetails_WithValidId_ReturnsOk()
        {
            // Arrange
            var response = TestHelper.Success<ApprovalDetailsDto>(default!);
            _mockService
                .Setup(s => s.GetApprovalDetails(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.GetApprovalDetails(1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        [Category("FileDownloads")]
        public async Task DownloadApprovalAttachment_WithValidId_ReturnsFile()
        {
            // Arrange
            var fileData = new FileDownloadDto
            {
                FileBytes = new byte[] { 1, 2, 3, 4, 5 },
                FileName = "approval.pdf",
                ContentType = "application/pdf",
            };
            var response = TestHelper.Success<FileDownloadDto>(fileData);
            _mockService
                .Setup(s => s.GetApprovalAttachment(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.DownloadApprovalAttachment(1);

            // Assert
            Assert.IsInstanceOf<FileContentResult>(result);
        }

        [Test]
        [Category("FileDownloads")]
        public async Task DownloadApprovalAttachment_ServiceFails_ReturnsBadRequest()
        {
            // Arrange
            var response = TestHelper.Fail<FileDownloadDto>("File not found");
            _mockService
                .Setup(s => s.GetApprovalAttachment(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.DownloadApprovalAttachment(1);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        [Category("FileDownloads")]
        public async Task DownloadAssignmentProof_WithValidId_ReturnsFile()
        {
            // Arrange
            var fileData = new FileDownloadDto
            {
                FileBytes = new byte[] { 10, 20, 30 },
                FileName = "proof.jpg",
                ContentType = "image/jpeg",
            };
            var response = TestHelper.Success<FileDownloadDto>(fileData);
            _mockService
                .Setup(s => s.GetAssignmentProof(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.FromResult(response));

            // Act
            var result = await _controller.DownloadAssignmentProof(1);

            // Assert
            Assert.IsInstanceOf<FileContentResult>(result);
        }

        #endregion

        [TearDown]
        public void TearDown()
        {
            // Arrange/Dispose (fixture)
            _controller = null!;
            _mockService = null!;
        }
    }

    // Strongly-typed Test Helper
    public static class TestHelper
    {
        public static ApiResponse<T> Success<T>(T data) =>
            new ApiResponse<T>
            {
                Success = true,
                Data = data,
                Message = string.Empty,
            };

        public static ApiResponse<T> Fail<T>(string message) =>
            new ApiResponse<T>
            {
                Success = false,
                Data = default!,
                Message = message,
            };
    }
}

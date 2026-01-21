using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PerformanceManagement.Controllers;
using Relevantz.EEPZ.API.Controllers;
using Relevantz.EEPZ.Api.Tests.Helpers;
using Relevantz.EEPZ.Business.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Api.Tests.Controllers
{
    internal static class AttributeAssertions
    {
        public static void ShouldHaveAttribute<TAttribute>(
            this MemberInfo member,
            Func<TAttribute, bool>? predicate = null
        )
            where TAttribute : Attribute
        {
            var attr = member.GetCustomAttribute<TAttribute>();
            attr.Should()
                .NotBeNull($"Expected attribute {typeof(TAttribute).Name} on {member.Name}");

            if (predicate != null)
                predicate(attr!)
                    .Should()
                    .BeTrue($"Attribute {typeof(TAttribute).Name} did not satisfy conditions.");
        }
    }

    [TestFixture]
    public class DepartmentHeadNominationControllerTests
    {
        private Mock<IDepartmentHeadNominationService> _serviceMock = null!;
        private Mock<ILogger<DepartmentHeadNominationController>> _loggerMock = null!;
        private DepartmentHeadNominationController _controller = null!;

        [SetUp]
        public void Setup()
        {
            _serviceMock = new Mock<IDepartmentHeadNominationService>(MockBehavior.Strict);
            _loggerMock = new Mock<ILogger<DepartmentHeadNominationController>>();
            _controller = new DepartmentHeadNominationController(
                _serviceMock.Object,
                _loggerMock.Object
            );
        }

        [Test]
        public async Task GetApprovedNominationsByDeptHead_ReturnsOk_WhenSuccessTrue()
        {
            var id = 100;
            var serviceResult = new TestResponse { success = true, data = new[] { 1, 2 } };

            _serviceMock
                .Setup(s => s.GetApprovedNominationsByDeptHeadAsync(id))
                .ReturnsAsync(serviceResult);

            var result = await _controller.GetApprovedNominationsByDeptHead(id);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(200);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }

        [Test]
        public async Task GetApprovedNominationsByDeptHead_ReturnsNotFound_WhenSuccessFalse()
        {
            var id = 100;
            var serviceResult = new TestResponse { success = false, message = "Not found" };

            _serviceMock
                .Setup(s => s.GetApprovedNominationsByDeptHeadAsync(id))
                .ReturnsAsync(serviceResult);

            var result = await _controller.GetApprovedNominationsByDeptHead(id);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(404);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }

        [Test]
        public async Task GetApprovedNominationsByDeptHead_Returns500_OnException()
        {
            var id = 100;
            var ex = new Exception("Boom");

            _serviceMock.Setup(s => s.GetApprovedNominationsByDeptHeadAsync(id)).ThrowsAsync(ex);

            var result = await _controller.GetApprovedNominationsByDeptHead(id);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should()
                .BeEquivalentTo(new { success = false, message = $"Error: {ex.Message}" });
        }

        [Test]
        public async Task GetNominationDetails_ReturnsOk_WhenSuccessTrue()
        {
            var resultDto = new TestResponse { success = true, data = new { Id = 10 } };

            _serviceMock.Setup(s => s.GetNominationDetailsAsync(10)).ReturnsAsync(resultDto);

            var result = await _controller.GetNominationDetails(10);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(200);
            obj.Value.Should().BeEquivalentTo(resultDto);
        }

        [Test]
        public async Task GetNominationDetails_ReturnsNotFound_WhenSuccessFalse()
        {
            var resultDto = new TestResponse { success = false, message = "Not found" };

            _serviceMock.Setup(s => s.GetNominationDetailsAsync(10)).ReturnsAsync(resultDto);

            var result = await _controller.GetNominationDetails(10);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(404);
            obj.Value.Should().BeEquivalentTo(resultDto);
        }

        [Test]
        public async Task GetNominationDetails_Returns500_OnException()
        {
            var ex = new Exception("Unexpected!");

            _serviceMock.Setup(s => s.GetNominationDetailsAsync(10)).ThrowsAsync(ex);

            var result = await _controller.GetNominationDetails(10);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should().BeEquivalentTo(new { success = false, message = ex.Message });
        }

        [Test]
        public async Task GetDepartmentStatistics_ReturnsOk_WhenSuccessTrue()
        {
            var resultDto = new TestResponse { success = true, data = new { total = 5 } };

            _serviceMock.Setup(s => s.GetDepartmentStatisticsAsync(50)).ReturnsAsync(resultDto);

            var result = await _controller.GetDepartmentStatistics(50);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(200);
            obj.Value.Should().BeEquivalentTo(resultDto);
        }

        [Test]
        public async Task GetDepartmentStatistics_ReturnsNotFound_WhenSuccessFalse()
        {
            var resultDto = new TestResponse { success = false, message = "Not found" };

            _serviceMock.Setup(s => s.GetDepartmentStatisticsAsync(50)).ReturnsAsync(resultDto);

            var result = await _controller.GetDepartmentStatistics(50);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(404);
            obj.Value.Should().BeEquivalentTo(resultDto);
        }

        [Test]
        public async Task GetDepartmentStatistics_Returns500_OnException()
        {
            var ex = new Exception("Oops");

            _serviceMock.Setup(s => s.GetDepartmentStatisticsAsync(50)).ThrowsAsync(ex);

            var result = await _controller.GetDepartmentStatistics(50);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should().BeEquivalentTo(new { success = false, message = ex.Message });
        }
    }

    //  EmployeeNominationController Tests
    [TestFixture]
    public class EmployeeNominationControllerTests
    {
        private Mock<IEmployeeNominationService> _serviceMock = null!;
        private Mock<ILogger<EmployeeNominationController>> _loggerMock = null!;
        private EmployeeNominationController _controller = null!;

        [SetUp]
        public void Setup()
        {
            _serviceMock = new Mock<IEmployeeNominationService>(MockBehavior.Strict);
            _loggerMock = new Mock<ILogger<EmployeeNominationController>>();
            _controller = new EmployeeNominationController(_serviceMock.Object, _loggerMock.Object);
        }

        [Test]
        public async Task SearchEmployeeNotifications_ReturnsOk_WhenSuccessTrue()
        {
            var employeeId = 42;

            var items = new List<EmployeeNotificationItemDto>
            {
                new EmployeeNotificationItemDto { NominationId = 1, RoleType = "Gold" },
                new EmployeeNotificationItemDto { NominationId = 2, RoleType = "Silver" },
            };

            var serviceResult = new EmployeeNotificationSearchResultDto
            {
                Success = true,
                Message = "Found",
                Data = items,
            };

            _serviceMock
                .Setup(s => s.SearchEmployeeNotificationsAsync(employeeId))
                .ReturnsAsync(serviceResult);

            var result = await _controller.SearchEmployeeNotifications(employeeId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(200);
            obj.Value.Should()
                .BeEquivalentTo(
                    new
                    {
                        success = true,
                        data = items,
                        count = items.Count,
                        message = "Found",
                    }
                );
        }

        [Test]
        public async Task SearchEmployeeNotifications_ReturnsBadRequest_WhenInvalidEmployeeIdMessage()
        {
            var employeeId = -1;

            var serviceResult = new EmployeeNotificationSearchResultDto
            {
                Success = false,
                Message = "Please enter a valid employee ID",
            };

            _serviceMock
                .Setup(s => s.SearchEmployeeNotificationsAsync(employeeId))
                .ReturnsAsync(serviceResult);

            var result = await _controller.SearchEmployeeNotifications(employeeId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(400);
            obj.Value.Should()
                .BeEquivalentTo(
                    new { success = false, message = "Please enter a valid employee ID" }
                );
        }

        [Test]
        public async Task SearchEmployeeNotifications_Returns500_WhenServiceFailure()
        {
            var employeeId = 77;

            var serviceResult = new EmployeeNotificationSearchResultDto
            {
                Success = false,
                Message = "Something failed",
            };

            _serviceMock
                .Setup(s => s.SearchEmployeeNotificationsAsync(employeeId))
                .ReturnsAsync(serviceResult);

            var result = await _controller.SearchEmployeeNotifications(employeeId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should()
                .BeEquivalentTo(new { success = false, message = "Something failed" });
        }

        [Test]
        public async Task SearchEmployeeNotifications_Returns500_OnException()
        {
            var employeeId = 100;
            var ex = new Exception("Unexpected!");

            _serviceMock.Setup(s => s.SearchEmployeeNotificationsAsync(employeeId)).ThrowsAsync(ex);

            var result = await _controller.SearchEmployeeNotifications(employeeId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should().BeEquivalentTo(new { success = false, message = ex.Message });
        }
    }
}

using System;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using Relevantz.EEPZ.Api.Controllers;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Models;

namespace Relevantz.EEPZ.Api.Tests.Controllers
{
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
            _controller = new DepartmentHeadNominationController(_serviceMock.Object, _loggerMock.Object);
        }

        [TearDown]
        public void Teardown()
        {
            _serviceMock.VerifyAll();
            _serviceMock.VerifyNoOtherCalls();
        }

        // -------------------------------
        // GET: /depthead/{id}/approved-nominations
        // -------------------------------

        [Test]
        public async Task GetApprovedNominationsByDeptHead_ReturnsOk_WhenSuccessTrue()
        {
            int id = 100;
            var serviceResult = new ApiResponse<object>
            {
                Success = true,
                Data = new[] { 1, 2 }
            };

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
            int id = 100;
            var serviceResult = new ApiResponse<object>
            {
                Success = false,
                Message = "Not found"
            };

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
            int id = 100;
            var ex = new Exception("Boom: DB password=secret123");

            _serviceMock
                .Setup(s => s.GetApprovedNominationsByDeptHeadAsync(id))
                .ThrowsAsync(ex);

            var result = await _controller.GetApprovedNominationsByDeptHead(id);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should().BeEquivalentTo(new
            {
                success = false,
                message = "Internal server error."
            });

            VerifyLoggerCalledWithException(_loggerMock, ex); // optional if controller logs
        }

        // -------------------------------
        // GET: /nomination-details/{nominationId}
        // -------------------------------

        [Test]
        public async Task GetNominationDetails_ReturnsOk_WhenSuccessTrue()
        {
            int nominationId = 10;
            var serviceResult = new ApiResponse<object>
            {
                Success = true,
                Data = new { Id = 10 }
            };

            _serviceMock
                .Setup(s => s.GetNominationDetailsAsync(nominationId))
                .ReturnsAsync(serviceResult);

            var result = await _controller.GetNominationDetails(nominationId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(200);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }

        [Test]
        public async Task GetNominationDetails_ReturnsNotFound_WhenSuccessFalse()
        {
            int nominationId = 10;
            var serviceResult = new ApiResponse<object>
            {
                Success = false,
                Message = "Not found"
            };

            _serviceMock
                .Setup(s => s.GetNominationDetailsAsync(nominationId))
                .ReturnsAsync(serviceResult);

            var result = await _controller.GetNominationDetails(nominationId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(404);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }

        [Test]
        public async Task GetNominationDetails_Returns500_OnException()
        {
            int nominationId = 10;
            var ex = new Exception("Unexpected internal error trace…");

            _serviceMock
                .Setup(s => s.GetNominationDetailsAsync(nominationId))
                .ThrowsAsync(ex);

            var result = await _controller.GetNominationDetails(nominationId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should().BeEquivalentTo(new
            {
                success = false,
                message = "Internal server error."
            });

            VerifyLoggerCalledWithException(_loggerMock, ex); // optional if controller logs
        }

        // -------------------------------
        // GET: /depthead/{id}/statistics
        // -------------------------------

        [Test]
        public async Task GetDepartmentStatistics_ReturnsOk_WhenSuccessTrue()
        {
            int id = 50;
            var serviceResult = new ApiResponse<object>
            {
                Success = true,
                Data = new { total = 5 }
            };

            _serviceMock
                .Setup(s => s.GetDepartmentStatisticsAsync(id))
                .ReturnsAsync(serviceResult);

            var result = await _controller.GetDepartmentStatistics(id);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(200);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }

        [Test]
        public async Task GetDepartmentStatistics_ReturnsNotFound_WhenSuccessFalse()
        {
            int id = 50;
            var serviceResult = new ApiResponse<object>
            {
                Success = false,
                Message = "Not found"
            };

            _serviceMock
                .Setup(s => s.GetDepartmentStatisticsAsync(id))
                .ReturnsAsync(serviceResult);

            var result = await _controller.GetDepartmentStatistics(id);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(404);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }

        [Test]
        public async Task GetDepartmentStatistics_Returns500_OnException()
        {
            int id = 50;
            var ex = new Exception("Oops stack trace here");

            _serviceMock
                .Setup(s => s.GetDepartmentStatisticsAsync(id))
                .ThrowsAsync(ex);

            var result = await _controller.GetDepartmentStatistics(id);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should().BeEquivalentTo(new
            {
                success = false,
                message = "Internal server error."
            });

            VerifyLoggerCalledWithException(_loggerMock, ex); // optional if controller logs
        }

        // =========================================================================
        //                               SECURITY TESTS
        // =========================================================================

        /// <summary>
        /// Security: Ensure the controller is protected by [Authorize] at the class level.
        /// Prevents accidental public exposure of endpoints (Broken Access Control).
        /// </summary>
        [Test]
        public void Controller_Should_Have_Authorize_Attribute()
        {
            var hasAuthorize =
                typeof(DepartmentHeadNominationController)
                    .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
                    .Any();

            hasAuthorize.Should().BeTrue(
                "DepartmentHeadNominationController must be protected by [Authorize] at class level");
        }

        /// <summary>
        /// Security: Ensure no public action method is accidentally marked [AllowAnonymous].
        /// Tightens the access surface; explicit anonymous should be rare and intentional.
        /// </summary>
        [Test]
        public void Public_Actions_Should_Not_Allow_Anonymous_By_Default()
        {
            var publicActions = typeof(DepartmentHeadNominationController)
                .GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);

            foreach (var method in publicActions)
            {
                var hasAllowAnonymous =
                    method.GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).Any();

                hasAllowAnonymous.Should().BeFalse(
                    $"{method.Name} should not allow anonymous access unless strictly required");
            }
        }

        /// <summary>
        /// Security: Ensure exceptions do not leak sensitive/internal details to clients.
        /// Response is generic; logs carry details (verified separately).
        /// </summary>
        [Test]
        public async Task Error_Response_Should_Not_Expose_Internal_Details()
        {
            int id = 999;
            var ex = new Exception("SqlException: Login failed for user 'root' at 10.0.0.1");

            _serviceMock
                .Setup(s => s.GetApprovedNominationsByDeptHeadAsync(id))
                .ThrowsAsync(ex);

            var result = await _controller.GetApprovedNominationsByDeptHead(id);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);

            obj.Value.Should().BeEquivalentTo(new
            {
                success = false,
                message = "Internal server error."
            }, options => options.RespectingRuntimeTypes());

            VerifyLoggerCalledWithException(_loggerMock, ex); // optional if controller logs
        }

        /// <summary>
        /// Security: Validate invalid inputs produce safe, predictable outcomes and do not crash.
        /// Given current controller behavior, invalid IDs are treated as "not found".
        /// </summary>
        [TestCase(0)]
        [TestCase(-1)]
        public async Task Invalid_Id_Should_Return_NotFound_And_Not_Leak_Details(int invalidId)
        {
            var serviceResult = new ApiResponse<object>
            {
                Success = false,
                Message = "Not found"
            };

            _serviceMock
                .Setup(s => s.GetApprovedNominationsByDeptHeadAsync(invalidId))
                .ReturnsAsync(serviceResult);

            var result = await _controller.GetApprovedNominationsByDeptHead(invalidId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(404);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }

        // -------------------------------
        // Helpers
        // -------------------------------

        private static void VerifyLoggerCalledWithException(
            Mock<ILogger<DepartmentHeadNominationController>> loggerMock,
            Exception ex)
        {
            loggerMock.Verify(
                x => x.Log(
                    It.Is<LogLevel>(l => l == LogLevel.Error || l == LogLevel.Warning),
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v != null),
                    It.Is<Exception>(e => e == ex),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.AtLeastOnce,
                "exceptions should be logged for diagnostics and auditability");
        }
    }
}

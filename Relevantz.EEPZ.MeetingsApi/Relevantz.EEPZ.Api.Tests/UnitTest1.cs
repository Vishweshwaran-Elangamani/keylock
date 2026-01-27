// File: ControllersTests.cs

using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using eepzbackend.Controllers;

#region Test Helpers

internal static class ControllerTestHelper
{
    public static T WithHttpContext<T>(this T controller, string role = null) where T : ControllerBase
    {
        var httpContext = new DefaultHttpContext
        {
            TraceIdentifier = "test-correlation-id-123"
        };

        var claims = new List<Claim>
        {
            // Provide common claim keys so ClaimsUtility can pick any one it expects.
            new Claim(ClaimTypes.NameIdentifier, "123"),
            new Claim("userId", "123"),
            new Claim("uid", "123"),
        };

        if (!string.IsNullOrWhiteSpace(role))
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return controller;
    }

    public static void AssertCorrelationIdHeader(HttpResponse response)
    {
        Assert.IsTrue(response.Headers.ContainsKey("X-Correlation-Id"), "X-Correlation-Id header missing.");
        Assert.AreEqual("test-correlation-id-123", response.Headers["X-Correlation-Id"].ToString(), "Unexpected correlation id value.");
    }
}

#endregion

namespace EEPZ.Tests.Controllers
{
    #region RsvpController Tests

    [TestFixture]
    public class RsvpControllerTests
    {
        private Mock<IMeetingService> _meetingService;
        private Mock<IUserAuthenticationRepository> _userAuthRepo;
        private Mock<ILogger<RsvpController>> _logger;

        [SetUp]
        public void SetUp()
        {
            _meetingService = new Mock<IMeetingService>(MockBehavior.Strict);
            _userAuthRepo = new Mock<IUserAuthenticationRepository>(MockBehavior.Strict);
            _logger = new Mock<ILogger<RsvpController>>();
        }

        private RsvpController CreateController(string role = null)
        {
            _userAuthRepo
                .Setup(r => r.GetEmployeeIdByUserIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(999); // Stable employee id for tests

            var controller = new RsvpController(_meetingService.Object, _userAuthRepo.Object, _logger.Object)
                .WithHttpContext(role);

            return controller;
        }

        [Test]
        public async Task GetMyMeetingInvitationsAsync_ReturnsOk_AndSetsCorrelationHeader()
        {
            // Arrange
            var controller = CreateController();
            var invitations = new List<MeetingInvitationDto> { new MeetingInvitationDto() };

            _meetingService
                .Setup(s => s.GetMyMeetingInvitationsAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync(invitations);

            // Act
            var result = await controller.GetMyMeetingInvitationsAsync();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result.Result);
            ControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _meetingService.VerifyAll();
            _userAuthRepo.VerifyAll();
        }

        [Test]
        public async Task SubmitRsvpAsync_NullBody_ReturnsBadRequest()
        {
            // Arrange
            var controller = CreateController();

            // Act
            var result = await controller.SubmitRsvpAsync(null);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
        }

        [Test]
        public async Task SubmitRsvpAsync_InvalidModel_ReturnsBadRequest()
        {
            // Arrange
            var controller = CreateController();
            controller.ModelState.AddModelError("RsvpStatus", "Required");
            var dto = new RsvpResponseDto();

            // Act
            var result = await controller.SubmitRsvpAsync(dto);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
        }

        [Test]
        public async Task UpdateRsvpAsync_InvalidMeetingId_ReturnsBadRequest()
        {
            // Arrange
            var controller = CreateController();

            // Act
            var result = await controller.UpdateRsvpAsync(0, new RsvpResponseDto());

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
        }

        [Test]
        public async Task UpdateRsvpAsync_InvalidModel_ReturnsBadRequest()
        {
            // Arrange
            var controller = CreateController();
            controller.ModelState.AddModelError("RsvpStatus", "Required");

            // Act
            var result = await controller.UpdateRsvpAsync(10, new RsvpResponseDto());

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
        }

        [Test]
        public async Task UpdateRsvpAsync_Valid_UsesRouteMeetingId_AndReturnsOk()
        {
            // Arrange
            var controller = CreateController();
            var routeMeetingId = 42;
            var body = new RsvpResponseDto { MeetingId = 999, RsvpStatus = RsvpStatus.Accepted, RsvpComments = "ok" };
            var serviceReturn = new MeetingInvitationDto();

            _meetingService
                .Setup(s => s.SubmitRsvpAsync(
                    It.Is<RsvpResponseDto>(d =>
                        d.MeetingId == routeMeetingId &&
                        d.RsvpStatus == RsvpStatus.Accepted &&
                        d.RsvpComments == "ok"),
                    999,
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(serviceReturn);

            // Act
            var result = await controller.UpdateRsvpAsync(routeMeetingId, body);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result.Result);
            ControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _meetingService.VerifyAll();
        }

        [Test]
        public async Task GetPendingRsvpCountAsync_ReturnsOkWithHeader()
        {
            // Arrange
            var controller = CreateController();
            _meetingService
                .Setup(s => s.GetPendingRsvpCountAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync(3);

            // Act
            var result = await controller.GetPendingRsvpCountAsync();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result.Result);
            ControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _meetingService.VerifyAll();
        }

        [Test]
        public async Task GetMeetingRsvpSummaryAsync_InvalidMeetingId_ReturnsBadRequest()
        {
            // Arrange
            var controller = CreateController(AppConstants.Roles.Manager);

            // Act
            var result = await controller.GetMeetingRsvpSummaryAsync(0);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
        }

        [Test]
        public async Task GetMeetingRsvpSummaryAsync_ManagerRole_ReturnsOk()
        {
            // Arrange
            var controller = CreateController(AppConstants.Roles.Manager);
            var summary = new MeetingRsvpSummaryDto();

            _meetingService
                .Setup(s => s.GetMeetingRsvpSummaryAsync(
                    7,
                    999,
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(summary);

            // Act
            var result = await controller.GetMeetingRsvpSummaryAsync(7);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result.Result);
            ControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _meetingService.VerifyAll();
        }
    }

    #endregion

    #region MeetingController Tests

    [TestFixture]
    public class MeetingControllerTests
    {
        private Mock<IMeetingService> _meetingService;
        private Mock<IUserAuthenticationRepository> _userAuthRepo;
        private Mock<ILogger<MeetingController>> _logger;

        [SetUp]
        public void SetUp()
        {
            _meetingService = new Mock<IMeetingService>(MockBehavior.Strict);
            _userAuthRepo = new Mock<IUserAuthenticationRepository>(MockBehavior.Strict);
            _logger = new Mock<ILogger<MeetingController>>();
        }

        private MeetingController CreateController(string role = null)
        {
            _userAuthRepo
                .Setup(r => r.GetEmployeeIdByUserIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(999);

            var controller = new MeetingController(_meetingService.Object, _userAuthRepo.Object, _logger.Object)
                .WithHttpContext(role);

            return controller;
        }

        [Test]
        public async Task ScheduleMeeting_InvalidModel_ReturnsBadRequest()
        {
            // Arrange
            var controller = CreateController(AppConstants.Roles.Manager);
            controller.ModelState.AddModelError("MeetingTitle", "Required");
            var dto = new ScheduleMeetingDto();

            // Act
            var result = await controller.ScheduleMeeting(dto);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
        }

        [Test]
        public async Task ScheduleMeeting_Valid_ManagerRole_ReturnsOk_AndHeader()
        {
            // Arrange
            var controller = CreateController(AppConstants.Roles.Manager);
            var dto = new ScheduleMeetingDto { MeetingTitle = "Q1 Sync" };
            var serviceReturn = new MeetingResponseDto();

            _meetingService
                .Setup(s => s.ScheduleMeetingAsync(
                    dto,
                    999,
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(serviceReturn);

            // Act
            var result = await controller.ScheduleMeeting(dto);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result.Result);
            ControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _meetingService.VerifyAll();
            _userAuthRepo.VerifyAll();
        }

        [Test]
        public async Task GetMyMeetings_InvalidPagination_ReturnsBadRequest()
        {
            // Arrange
            var controller = CreateController();

            // Act
            var result = await controller.GetMyMeetings(pageNumber: 0, pageSize: 10);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
        }

        [Test]
        public async Task GetMyMeetings_Valid_ReturnsOk_AndHeader()
        {
            // Arrange
            var controller = CreateController();
            var paged = new PaginatedMeetingResponseDto();

            _meetingService
                .Setup(s => s.GetMeetingsByManagerIdAsync(999, 1, 20, It.IsAny<CancellationToken>()))
                .ReturnsAsync(paged);

            // Act
            var result = await controller.GetMyMeetings();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result.Result);
            ControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _meetingService.VerifyAll();
        }

        [Test]
        public async Task GetMeetingById_InvalidId_ReturnsBadRequest()
        {
            // Arrange
            var controller = CreateController();

            // Act
            var result = await controller.GetMeetingById(0);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
        }

        [Test]
        public async Task GetMeetingById_NotFound_ReturnsNotFound()
        {
            // Arrange
            var controller = CreateController();

            _meetingService
                .Setup(s => s.GetMeetingByIdAsync(44, It.IsAny<CancellationToken>()))
                .ReturnsAsync((MeetingResponseDto)null);

            // Act
            var result = await controller.GetMeetingById(44);

            // Assert
            Assert.IsInstanceOf<NotFoundObjectResult>(result.Result);
            _meetingService.VerifyAll();
        }

        [Test]
        public async Task GetMeetingById_Found_ReturnsOk_AndHeader()
        {
            // Arrange
            var controller = CreateController();

            _meetingService
                .Setup(s => s.GetMeetingByIdAsync(44, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new MeetingResponseDto());

            // Act
            var result = await controller.GetMeetingById(44);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result.Result);
            ControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _meetingService.VerifyAll();
        }

        [Test]
        public async Task SubmitRsvp_InvalidModel_ReturnsBadRequest()
        {
            // Arrange
            var controller = CreateController();
            controller.ModelState.AddModelError("RsvpStatus", "Required");

            // Act
            var result = await controller.SubmitRsvp(new RsvpResponseDto());

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result.Result);
        }

        [Test]
        public async Task SubmitRsvp_Valid_ReturnsOk_AndHeader()
        {
            // Arrange
            var controller = CreateController();
            var dto = new RsvpResponseDto { MeetingId = 7, RsvpStatus = RsvpStatus.Accepted };

            _meetingService
                .Setup(s => s.SubmitRsvpAsync(dto, 999, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new MeetingInvitationDto());

            // Act
            var result = await controller.SubmitRsvp(dto);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result.Result);
            ControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _meetingService.VerifyAll();
        }

        [Test]
        public async Task GetMyInvitations_ReturnsOk_AndHeader()
        {
            // Arrange
            var controller = CreateController();

            _meetingService
                .Setup(s => s.GetMyMeetingInvitationsAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<MeetingInvitationDto>());

            // Act
            var result = await controller.GetMyInvitations();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result.Result);
            ControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _meetingService.VerifyAll();
        }
    }

    #endregion
}
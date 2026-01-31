using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Api.Controllers;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Request;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Response;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Response;
using Relevantz.EEPZ.Common.ViewModels.Common;

namespace Relevantz.EEPZ.Api.Tests.Controllers
{
    [TestFixture]
    public class InternalOpportunityControllerTests
    {
        private Mock<IInternalOpportunityService> _mockService;
        private InternalOpportunityController _controller;

        [SetUp]
        public void Setup()
        {
            _mockService = new Mock<IInternalOpportunityService>();
            _controller = new InternalOpportunityController(_mockService.Object);
        }

        private void SetupUserClaims(int userId, string role = "HR")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        private void SetupEmptyUserContext()
        {
            var identity = new ClaimsIdentity();
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        [Test]
        public async Task GetAllOpportunities_ReturnsOk()
        {
            // Arrange
            var opportunities = new List<InternalOpportunityResponseDto>
            {
                new InternalOpportunityResponseDto { OpportunityId = 1, OpportunityName = "Test" }
            };
            _mockService.Setup(s => s.GetAllOpportunitiesSimpleAsync()).ReturnsAsync(opportunities);

            // Act
            var result = await _controller.GetAllOpportunities();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task CreateOpportunity_WithValidRequest_ReturnsCreated()
        {
            // Arrange
            SetupUserClaims(1, "HR");
            var request = new CreateInternalOpportunityRequestDto { OpportunityName = "New" };
            var response = new InternalOpportunityResponseDto { OpportunityId = 1 };
            _mockService.Setup(s => s.CreateOpportunityAsync(request, 1)).ReturnsAsync(response);

            // Act
            var result = await _controller.CreateOpportunity(request);

            // Assert
            Assert.IsInstanceOf<CreatedAtActionResult>(result);
        }

        [Test]
        public async Task CreateOpportunity_WithoutUserId_ReturnsUnauthorized()
        {
            // Arrange
            SetupEmptyUserContext();
            var request = new CreateInternalOpportunityRequestDto();

            // Act
            var result = await _controller.CreateOpportunity(request);

            // Assert
            Assert.IsInstanceOf<UnauthorizedObjectResult>(result);
        }

        [Test]
        public async Task UpdateOpportunity_ReturnsOk()
        {
            // Arrange
            SetupUserClaims(1, "HR");
            var request = new UpdateInternalOpportunityRequestDto();
            var response = new InternalOpportunityResponseDto { OpportunityId = 1 };
            _mockService.Setup(s => s.UpdateOpportunityAsync(1, request)).ReturnsAsync(response);

            // Act
            var result = await _controller.UpdateOpportunity(1, request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task GetOpportunityById_ReturnsOk()
        {
            // Arrange
            var response = new InternalOpportunityDetailResponseDto { OpportunityId = 1 };
            _mockService.Setup(s => s.GetOpportunityByIdAsync(1)).ReturnsAsync(response);

            // Act
            var result = await _controller.GetOpportunityById(1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task GetActiveOpportunities_ReturnsOk()
        {
            // Arrange
            var opportunities = new List<InternalOpportunityResponseDto>();
            _mockService.Setup(s => s.GetActiveOpportunitiesSimpleAsync()).ReturnsAsync(opportunities);

            // Act
            var result = await _controller.GetActiveOpportunities();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task GetStatistics_ReturnsOk()
        {
            // Arrange
            SetupUserClaims(1, "HR");
            var stats = new InternalOpportunityStatisticsResponseDto();
            _mockService.Setup(s => s.GetStatisticsAsync()).ReturnsAsync(stats);

            // Act
            var result = await _controller.GetStatistics();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task DeleteOpportunity_ReturnsOk()
        {
            // Arrange
            SetupUserClaims(1, "HR");
            _mockService.Setup(s => s.DeleteOpportunityAsync(1)).ReturnsAsync(true);

            // Act
            var result = await _controller.DeleteOpportunity(1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }
    }

    [TestFixture]
    public class NominationControllerTests
    {
        private Mock<INominationService> _mockService;
        private NominationController _controller;

        [SetUp]
        public void Setup()
        {
            _mockService = new Mock<INominationService>();
            _controller = new NominationController(_mockService.Object);
        }

        private void SetupUserClaims(int userId, string role = "Employee")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        private void SetupEmptyUserContext()
        {
            var identity = new ClaimsIdentity();
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        [Test]
        public async Task SelfNominate_WithValidRequest_ReturnsCreated()
        {
            // Arrange
            SetupUserClaims(1, "Employee");
            var request = new CreateSelfNominationRequestDto { OpportunityId = 1, Justification = "Test" };
            var response = new NominationResponseDto { NominationId = 1 };
            _mockService.Setup(s => s.CreateSelfNominationAsync(1, request)).ReturnsAsync(response);

            // Act
            var result = await _controller.SelfNominate(request);

            // Assert
            Assert.IsInstanceOf<CreatedAtActionResult>(result);
        }

        [Test]
        public async Task SelfNominate_WithoutUserId_ReturnsUnauthorized()
        {
            // Arrange
            SetupEmptyUserContext();
            var request = new CreateSelfNominationRequestDto();

            // Act
            var result = await _controller.SelfNominate(request);

            // Assert
            Assert.IsInstanceOf<UnauthorizedObjectResult>(result);
        }

        [Test]
        public async Task ManagerNominate_WithValidRequest_ReturnsCreated()
        {
            // Arrange
            SetupUserClaims(1, "Manager");
            var request = new CreateManagerNominationRequestDto { OpportunityId = 1, NomineeEmployeeId = 2, Justification = "Test" };
            var response = new NominationResponseDto { NominationId = 1 };
            _mockService.Setup(s => s.CreateManagerNominationAsync(1, request)).ReturnsAsync(response);

            // Act
            var result = await _controller.ManagerNominate(request);

            // Assert
            Assert.IsInstanceOf<CreatedAtActionResult>(result);
        }

        [Test]
        public async Task GetAllNominations_ReturnsOk()
        {
            // Arrange
            SetupUserClaims(1, "HR");
            var nominations = new NominationListResponseDto { Nominations = new List<NominationResponseDto>() };
            _mockService.Setup(s => s.GetAllNominationsAsync(null)).ReturnsAsync(nominations);

            // Act
            var result = await _controller.GetAllNominations(null);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task GetMyNominations_WithValidUserId_ReturnsOk()
        {
            // Arrange
            SetupUserClaims(1, "Employee");
            var nominations = new List<NominationResponseDto>();
            _mockService.Setup(s => s.GetMyNominationsAsync(1)).ReturnsAsync(nominations);

            // Act
            var result = await _controller.GetMyNominations();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task GetNominationById_ReturnsOk()
        {
            // Arrange
            SetupUserClaims(1);
            var nomination = new NominationDetailResponseDto { NominationId = 1 };
            _mockService.Setup(s => s.GetNominationByIdAsync(1)).ReturnsAsync(nomination);

            // Act
            var result = await _controller.GetNominationById(1);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task ManagerReview_WithValidRequest_ReturnsOk()
        {
            // Arrange
            SetupUserClaims(1, "Manager");
            var request = new ManagerReviewRequestDto { ActionTaken = "Approved", Remarks = "Good" };
            var response = new NominationResponseDto { NominationId = 1 };
            _mockService.Setup(s => s.ManagerReviewNominationAsync(1, 1, request)).ReturnsAsync(response);

            // Act
            var result = await _controller.ManagerReview(1, request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task DepartmentHeadReview_WithValidRequest_ReturnsOk()
        {
            // Arrange
            SetupUserClaims(1, "Department Head");
            var request = new DepartmentHeadReviewRequestDto { Action = "Approved" };
            var response = new NominationResponseDto { NominationId = 1 };
            _mockService.Setup(s => s.DepartmentHeadReviewAsync(1, 1, request)).ReturnsAsync(response);

            // Act
            var result = await _controller.DepartmentHeadReview(1, request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task DepartmentHeadReview_WithInvalidAction_ReturnsBadRequest()
        {
            // Arrange
            SetupUserClaims(1, "Department Head");
            var request = new DepartmentHeadReviewRequestDto { Action = "Invalid" };

            // Act
            var result = await _controller.DepartmentHeadReview(1, request);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        public async Task CheckEligibility_WithValidRequest_ReturnsOk()
        {
            // Arrange
            SetupUserClaims(1, "Employee");
            var request = new EligibilityCheckRequestDto { OpportunityId = 1 };
            var response = new EligibilityCheckResponseDto { IsEligible = true };
            _mockService.Setup(s => s.CheckEligibilityAsync(1, 1)).ReturnsAsync(response);

            // Act
            var result = await _controller.CheckEligibility(request);

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }
    }

    [TestFixture]
    public class OpportunityAnalyticControllerTests
    {
        private Mock<IInternalOpportunityService> _mockService;
        private OpportunityAnalyticController _controller;

        [SetUp]
        public void Setup()
        {
            _mockService = new Mock<IInternalOpportunityService>();
            _controller = new OpportunityAnalyticController(_mockService.Object);
        }

        [Test]
        public async Task GetOpportunityStatistics_ReturnsOk()
        {
            // Arrange
            var stats = new InternalOpportunityStatisticsResponseDto();
            _mockService.Setup(s => s.GetStatisticsAsync()).ReturnsAsync(stats);

            // Act
            var result = await _controller.GetOpportunityStatistics();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task GetGraphData_ReturnsOk()
        {
            // Arrange
            var stats = new InternalOpportunityStatisticsResponseDto();
            _mockService.Setup(s => s.GetStatisticsAsync()).ReturnsAsync(stats);

            // Act
            var result = await _controller.GetGraphData();

            // Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }
    }
}

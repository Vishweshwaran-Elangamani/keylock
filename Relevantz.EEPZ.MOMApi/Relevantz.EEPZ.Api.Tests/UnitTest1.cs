using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;
using eepzbackend.Controllers;

namespace EEPZ.Tests.Controllers
{
    internal static class MomControllerTestHelper
    {
        public static T WithHttpContext<T>(this T controller, string? role = null, int employeeId = 999)
            where T : ControllerBase
        {
            var httpContext = new DefaultHttpContext
            {
                TraceIdentifier = "test-correlation-id-123"
            };

            var claims = new List<Claim>
            {
                new(AppConstants.ClaimTypes.EmployeeId, employeeId.ToString()),
                new(AppConstants.ClaimTypes.Sub, employeeId.ToString()),
                new(ClaimTypes.NameIdentifier, employeeId.ToString())
            };

            if (!string.IsNullOrEmpty(role))
            {
                claims.Add(new(ClaimTypes.Role, role));
            }

            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            return controller;
        }

        public static void AssertCorrelationIdHeader(HttpResponse response)
        {
            Assert.IsTrue(response.Headers.ContainsKey("X-Correlation-Id"), "X-Correlation-Id header missing.");
            Assert.AreEqual("test-correlation-id-123", response.Headers["X-Correlation-Id"].FirstOrDefault());
        }
    }

    [TestFixture]
    public class MomControllerTests
    {
        private Mock<IMomService> _momService;

        [SetUp]
        public void SetUp()
        {
            _momService = new(MockBehavior.Strict);
        }

        private MomController CreateController(string? role = AppConstants.Roles.Employee, int employeeId = 999)
        {
            return new MomController(_momService.Object)
                .WithHttpContext(role, employeeId);
        }

        // ---------- CreateMom ----------

        [Test]
        public async Task CreateMom_Valid_ReturnsCreatedAtAction_AndHeader()
        {
            var controller = CreateController(AppConstants.Roles.Manager);
            var dto = new CreateMomDto();
            var serviceResult = new MomResponseDto { MomId = 10 };

            _momService
                .Setup(s => s.CreateMomAsync(dto, 999, AppConstants.Roles.Manager))
                .ReturnsAsync(serviceResult);

            var result = await controller.CreateMom(dto);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        [Test]
        public async Task CreateMom_UsesEmployeeIdFromClaims()
        {
            var controller = CreateController(AppConstants.Roles.Manager, employeeId: 1234);
            var dto = new CreateMomDto();
            var serviceResult = new MomResponseDto { MomId = 20 };

            _momService
                .Setup(s => s.CreateMomAsync(dto, 1234, AppConstants.Roles.Manager))
                .ReturnsAsync(serviceResult);

            var result = await controller.CreateMom(dto);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            _momService.VerifyAll();
        }

        [Test]
        public async Task CreateMom_UsesDefaultRole_WhenNoRoleClaim()
        {
            var controller = CreateController(role: null, employeeId: 999);
            var dto = new CreateMomDto();
            var serviceResult = new MomResponseDto { MomId = 30 };

            _momService
                .Setup(s => s.CreateMomAsync(dto, 999, AppConstants.Roles.Employee))
                .ReturnsAsync(serviceResult);

            var result = await controller.CreateMom(dto);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            _momService.VerifyAll();
        }

        // ---------- UpdateMom ----------

        [Test]
        public async Task UpdateMom_Valid_ReturnsOk_AndHeader()
        {
            var controller = CreateController(AppConstants.Roles.Manager);
            var dto = new UpdateMomDto();
            var serviceResult = new MomResponseDto();

            _momService
                .Setup(s => s.UpdateMomAsync(dto, 999, AppConstants.Roles.Manager))
                .ReturnsAsync(serviceResult);

            var result = await controller.UpdateMom(dto);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        [Test]
        public async Task UpdateMom_UsesEmployeeIdAndRoleFromClaims()
        {
            var controller = CreateController(AppConstants.Roles.HR, employeeId: 555);
            var dto = new UpdateMomDto();
            var serviceResult = new MomResponseDto();

            _momService
                .Setup(s => s.UpdateMomAsync(dto, 555, AppConstants.Roles.HR))
                .ReturnsAsync(serviceResult);

            var result = await controller.UpdateMom(dto);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            _momService.VerifyAll();
        }

        // ---------- GetMyMoms ----------

        [Test]
        public async Task GetMyMoms_ReturnsOk_AndHeader()
        {
            var controller = CreateController(AppConstants.Roles.Manager);
            var list = new List<MomResponseDto>();

            _momService
                .Setup(s => s.GetMomsSubmittedByEmployeeAsync(999))
                .ReturnsAsync(list);

            var result = await controller.GetMyMoms();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        [Test]
        public async Task GetMyMoms_UsesEmployeeIdFromClaims()
        {
            var controller = CreateController(AppConstants.Roles.Employee, employeeId: 321);
            var list = new List<MomResponseDto>();

            _momService
                .Setup(s => s.GetMomsSubmittedByEmployeeAsync(321))
                .ReturnsAsync(list);

            var result = await controller.GetMyMoms();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            _momService.VerifyAll();
        }

        // ---------- GetMomById ----------

        [Test]
        public async Task GetMomById_InvalidId_ReturnsBadRequest()
        {
            var controller = CreateController();
            var result = await controller.GetMomById(0);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetMomById_NotFound_ReturnsNotFound()
        {
            var controller = CreateController();
            _momService
                .Setup(s => s.GetMomByIdAsync(5))
                .ReturnsAsync((MomResponseDto)null!);

            var result = await controller.GetMomById(5);

            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
            _momService.VerifyAll();
        }

        [Test]
        public async Task GetMomById_Found_ReturnsOk_AndHeader()
        {
            var controller = CreateController();
            var mom = new MomResponseDto { MomId = 5 };

            _momService
                .Setup(s => s.GetMomByIdAsync(5))
                .ReturnsAsync(mom);

            var result = await controller.GetMomById(5);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        // ---------- DeleteMom ----------

        [Test]
        public async Task DeleteMom_InvalidId_ReturnsBadRequest()
        {
            var controller = CreateController();
            var result = await controller.DeleteMom(0);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task DeleteMom_NotFound_ReturnsNotFound()
        {
            var controller = CreateController(AppConstants.Roles.Manager);
            _momService
                .Setup(s => s.DeleteMomAsync(10, 999, AppConstants.Roles.Manager))
                .ReturnsAsync(false);

            var result = await controller.DeleteMom(10);

            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
            _momService.VerifyAll();
        }

        [Test]
        public async Task DeleteMom_Success_ReturnsOk_AndHeader()
        {
            var controller = CreateController(AppConstants.Roles.Manager);
            _momService
                .Setup(s => s.DeleteMomAsync(10, 999, AppConstants.Roles.Manager))
                .ReturnsAsync(true);

            var result = await controller.DeleteMom(10);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        // ---------- Action Items ----------

        [Test]
        public async Task UpdateActionItemStatus_NotFound_ReturnsNotFound()
        {
            var controller = CreateController();
            _momService
                .Setup(s => s.UpdateActionItemStatusAsync(5, "Done", 999))
                .ReturnsAsync(false);

            var result = await controller.UpdateActionItemStatus(5, "Done");

            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        [Test]
        public async Task UpdateActionItemStatus_Success_ReturnsOk_AndHeader()
        {
            var controller = CreateController();
            _momService
                .Setup(s => s.UpdateActionItemStatusAsync(5, "Done", 999))
                .ReturnsAsync(true);

            var result = await controller.UpdateActionItemStatus(5, "Done");

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        [Test]
        public async Task GetMyActionItems_ReturnsOk_AndHeader()
        {
            var controller = CreateController();
            var list = new List<ActionItemResponseDto>();

            _momService
                .Setup(s => s.GetMyActionItemsAsync(999))
                .ReturnsAsync(list);

            var result = await controller.GetMyActionItems();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        [Test]
        public async Task GetActionItemsAssignedByMe_ReturnsOk_AndHeader()
        {
            var controller = CreateController();
            var list = new List<ActionItemResponseDto>();

            _momService
                .Setup(s => s.GetActionItemsAssignedByMeAsync(999))
                .ReturnsAsync(list);

            var result = await controller.GetActionItemsAssignedByMe();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        [Test]
        public async Task GetOverdueActionItems_ReturnsOk_AndHeader()
        {
            var controller = CreateController();
            var list = new List<ActionItemResponseDto>();

            _momService
                .Setup(s => s.GetOverdueActionItemsAsync(999))
                .ReturnsAsync(list);

            var result = await controller.GetOverdueActionItems();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        // ---------- HR endpoint ----------

        [Test]
        public async Task GetAllMomsForHR_InvalidPagination_ReturnsBadRequest()
        {
            var controller = CreateController(AppConstants.Roles.HR);
            var result = await controller.GetAllMomsForHR(pageNumber: 0, pageSize: 10);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetAllMomsForHR_InvalidDateRange_ReturnsBadRequest()
        {
            var controller = CreateController(AppConstants.Roles.HR);
            var start = new DateTime(2025, 2, 1);
            var end = new DateTime(2025, 1, 1);

            var result = await controller.GetAllMomsForHR(startDate: start, endDate: end);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetAllMomsForHR_Valid_ReturnsOk_AndHeader()
        {
            var controller = CreateController(AppConstants.Roles.HR, employeeId: 999);
            var paged = new PaginatedMomResponseDto();

            _momService
                .Setup(s => s.GetAllMomsForHRAsync(
                    999,
                    AppConstants.Roles.HR,
                    null,
                    null,
                    null,
                    null,
                    null,
                    1,
                    20))
                .ReturnsAsync(paged);

            var result = await controller.GetAllMomsForHR();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        // ---------- Sharing ----------

        [Test]
        public async Task ShareMom_ReturnsOk_AndHeader()
        {
            var controller = CreateController();
            var dto = new ShareMomDto();
            var list = new List<MomSharingResponseDto>();

            _momService
                .Setup(s => s.ShareMomAsync(dto, 999))
                .ReturnsAsync(list);

            var result = await controller.ShareMom(dto);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        [Test]
        public async Task GetMomsSharedByMe_ReturnsOk_AndHeader()
        {
            var controller = CreateController();
            var list = new List<MomSharingResponseDto>();

            _momService
                .Setup(s => s.GetMomsSharedByEmployeeAsync(999))
                .ReturnsAsync(list);

            var result = await controller.GetMomsSharedByMe();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }

        [Test]
        public async Task GetMomsSharedWithMe_ReturnsOk_AndHeader()
        {
            var controller = CreateController();
            var list = new List<MomResponseDto>();

            _momService
                .Setup(s => s.GetMomsSharedWithEmployeeAsync(999))
                .ReturnsAsync(list);

            var result = await controller.GetMomsSharedWithMe();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            MomControllerTestHelper.AssertCorrelationIdHeader(controller.Response);
            _momService.VerifyAll();
        }
    }
}

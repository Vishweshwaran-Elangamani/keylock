using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using Relevantz.EEPZ.Api.Controllers; // Ensure this matches your actual controller namespace
using Relevantz.EEPZ.Api.Tests.Helpers;
using Relevantz.EEPZ.Business.Services.Interfaces;
 
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
 
        // ========================================================
        // APPROVED NOMINATIONS
        // ========================================================
        [Test]
        public async Task GetApprovedNominationsByDeptHead_ReturnsOk_WhenSuccessTrue()
        {
            int id = 100;
            var serviceResult = new TestResponse { success = true, data = new[] { 1, 2 } };
 
            _serviceMock.Setup(s => s.GetApprovedNominationsByDeptHeadAsync(id))
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
            var serviceResult = new TestResponse { success = false, message = "Not found" };
 
            _serviceMock.Setup(s => s.GetApprovedNominationsByDeptHeadAsync(id))
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
            var ex = new Exception("Boom");
 
            _serviceMock.Setup(s => s.GetApprovedNominationsByDeptHeadAsync(id))
                        .ThrowsAsync(ex);
 
            var result = await _controller.GetApprovedNominationsByDeptHead(id);
 
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should().BeEquivalentTo(new
            {
                success = false,
                message = "Internal server error."
            });
        }
 
        // ========================================================
        // NOMINATION DETAILS
        // ========================================================
        [Test]
        public async Task GetNominationDetails_ReturnsOk_WhenSuccessTrue()
        {
            int nominationId = 10;
            var serviceResult = new TestResponse { success = true, data = new { Id = 10 } };
 
            _serviceMock.Setup(s => s.GetNominationDetailsAsync(nominationId))
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
            var serviceResult = new TestResponse { success = false, message = "Not found" };
 
            _serviceMock.Setup(s => s.GetNominationDetailsAsync(nominationId))
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
            var ex = new Exception("Unexpected!");
 
            _serviceMock.Setup(s => s.GetNominationDetailsAsync(nominationId))
                        .ThrowsAsync(ex);
 
            var result = await _controller.GetNominationDetails(nominationId);
 
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should().BeEquivalentTo(new
            {
                success = false,
                message = "Internal server error."
            });
        }
 
        // ========================================================
        // DEPARTMENT STATISTICS
        // ========================================================
        [Test]
        public async Task GetDepartmentStatistics_ReturnsOk_WhenSuccessTrue()
        {
            int id = 50;
            var serviceResult = new TestResponse { success = true, data = new { total = 5 } };
 
            _serviceMock.Setup(s => s.GetDepartmentStatisticsAsync(id))
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
            var serviceResult = new TestResponse { success = false, message = "Not found" };
 
            _serviceMock.Setup(s => s.GetDepartmentStatisticsAsync(id))
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
            var ex = new Exception("Oops");
 
            _serviceMock.Setup(s => s.GetDepartmentStatisticsAsync(id))
                        .ThrowsAsync(ex);
 
            var result = await _controller.GetDepartmentStatistics(id);
 
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should().BeEquivalentTo(new
            {
                success = false,
                message = "Internal server error."
            });
        }
    }
}
 
 
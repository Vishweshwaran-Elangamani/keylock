using System;
using System.Threading.Tasks;
using FluentAssertions;
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
            // Arrange
            int id = 100;
            var serviceResult = new ApiResponse<object>
            {
                Success = true,
                Data = new[] { 1, 2 }
            };
 
            _serviceMock
                .Setup(s => s.GetApprovedNominationsByDeptHeadAsync(id))
                .ReturnsAsync(serviceResult);
 
            // Act
            var result = await _controller.GetApprovedNominationsByDeptHead(id);
 
            // Assert
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(200);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }
 
        [Test]
        public async Task GetApprovedNominationsByDeptHead_ReturnsNotFound_WhenSuccessFalse()
        {
            // Arrange
            int id = 100;
            var serviceResult = new ApiResponse<object>
            {
                Success = false,
                Message = "Not found"
            };
 
            _serviceMock
                .Setup(s => s.GetApprovedNominationsByDeptHeadAsync(id))
                .ReturnsAsync(serviceResult);
 
            // Act
            var result = await _controller.GetApprovedNominationsByDeptHead(id);
 
            // Assert
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(404);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }
 
        [Test]
        public async Task GetApprovedNominationsByDeptHead_Returns500_OnException()
        {
            // Arrange
            int id = 100;
            var ex = new Exception("Boom");
 
            _serviceMock
                .Setup(s => s.GetApprovedNominationsByDeptHeadAsync(id))
                .ThrowsAsync(ex);
 
            // Act
            var result = await _controller.GetApprovedNominationsByDeptHead(id);
 
            // Assert
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should().BeEquivalentTo(new
            {
                success = false,
                message = "Internal server error."
            });
        }
 
        // -------------------------------
        // GET: /nomination-details/{nominationId}
        // -------------------------------
 
        [Test]
        public async Task GetNominationDetails_ReturnsOk_WhenSuccessTrue()
        {
            // Arrange
            int nominationId = 10;
            var serviceResult = new ApiResponse<object>
            {
                Success = true,
                Data = new { Id = 10 }
            };
 
            _serviceMock
                .Setup(s => s.GetNominationDetailsAsync(nominationId))
                .ReturnsAsync(serviceResult);
 
            // Act
            var result = await _controller.GetNominationDetails(nominationId);
 
            // Assert
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(200);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }
 
        [Test]
        public async Task GetNominationDetails_ReturnsNotFound_WhenSuccessFalse()
        {
            // Arrange
            int nominationId = 10;
            var serviceResult = new ApiResponse<object>
            {
                Success = false,
                Message = "Not found"
            };
 
            _serviceMock
                .Setup(s => s.GetNominationDetailsAsync(nominationId))
                .ReturnsAsync(serviceResult);
 
            // Act
            var result = await _controller.GetNominationDetails(nominationId);
 
            // Assert
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(404);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }
 
        [Test]
        public async Task GetNominationDetails_Returns500_OnException()
        {
            // Arrange
            int nominationId = 10;
            var ex = new Exception("Unexpected!");
 
            _serviceMock
                .Setup(s => s.GetNominationDetailsAsync(nominationId))
                .ThrowsAsync(ex);
 
            // Act
            var result = await _controller.GetNominationDetails(nominationId);
 
            // Assert
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);
            obj.Value.Should().BeEquivalentTo(new
            {
                success = false,
                message = "Internal server error."
            });
        }
 
        // -------------------------------
        // GET: /depthead/{id}/statistics
        // -------------------------------
 
        [Test]
        public async Task GetDepartmentStatistics_ReturnsOk_WhenSuccessTrue()
        {
            // Arrange
            int id = 50;
            var serviceResult = new ApiResponse<object>
            {
                Success = true,
                Data = new { total = 5 }
            };
 
            _serviceMock
                .Setup(s => s.GetDepartmentStatisticsAsync(id))
                .ReturnsAsync(serviceResult);
 
            // Act
            var result = await _controller.GetDepartmentStatistics(id);
 
            // Assert
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(200);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }
 
        [Test]
        public async Task GetDepartmentStatistics_ReturnsNotFound_WhenSuccessFalse()
        {
            // Arrange
            int id = 50;
            var serviceResult = new ApiResponse<object>
            {
                Success = false,
                Message = "Not found"
            };
 
            _serviceMock
                .Setup(s => s.GetDepartmentStatisticsAsync(id))
                .ReturnsAsync(serviceResult);
 
            // Act
            var result = await _controller.GetDepartmentStatistics(id);
 
            // Assert
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(404);
            obj.Value.Should().BeEquivalentTo(serviceResult);
        }
 
        [Test]
        public async Task GetDepartmentStatistics_Returns500_OnException()
        {
            // Arrange
            int id = 50;
            var ex = new Exception("Oops");
 
            _serviceMock
                .Setup(s => s.GetDepartmentStatisticsAsync(id))
                .ThrowsAsync(ex);
 
            // Act
            var result = await _controller.GetDepartmentStatistics(id);
 
            // Assert
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
 
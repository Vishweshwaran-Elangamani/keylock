using NUnit.Framework;
using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using EepzBackend.Controllers;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Api.Tests.Controllers
{
    [TestFixture]
    public class ManagerReviewControllerTests
    {
        private Mock<IManagerReviewService> _serviceMock;
        private ManagerReviewController _controller;

        [SetUp]
        public void Setup()
        {
            _serviceMock = new Mock<IManagerReviewService>();
            _controller = new ManagerReviewController(_serviceMock.Object);
        }

        [Test]
        public async Task CreateManagerReview_ReturnsOk()
        {
            var dto = new CreateManagerReviewRequestDto();
            var response = new ManagerReviewResponseDto();

            _serviceMock.Setup(s => s.CreateReviewAsync(dto)).ReturnsAsync(response);

            var result = await _controller.CreateManagerReview(dto);

            result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task GetManagerReview_ReturnsOk()
        {
            var response = new ManagerReviewResponseDto();

            _serviceMock.Setup(s => s.GetReviewByIdAsync(1)).ReturnsAsync(response);

            var result = await _controller.GetManagerReview(1);

            result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task GetReviewsByManager_ReturnsOk()
        {
            var list = new List<ManagerReviewResponseDto>();

            _serviceMock.Setup(s => s.GetMyReviewsAsync(10)).ReturnsAsync(list);

            var result = await _controller.GetReviewsByManager(10);

            result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task GetReviewsForTarget_ReturnsOk()
        {
            var list = new List<ManagerReviewResponseDto>();

            _serviceMock.Setup(s => s.GetReviewsForMeAsync(5)).ReturnsAsync(list);

            var result = await _controller.GetReviewsForTarget(5);

            result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task UpdateManagerReview_ReturnsOk()
        {
            var dto = new UpdateManagerReviewRequestDto();
            var response = new ManagerReviewResponseDto();

            _serviceMock.Setup(s => s.UpdateReviewAsync(1, dto)).ReturnsAsync(response);

            var result = await _controller.UpdateManagerReview(1, dto);

            result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task DeleteManagerReview_ReturnsOk()
        {
            _serviceMock.Setup(s => s.DeleteReviewAsync(1)).ReturnsAsync(true);

            var result = await _controller.DeleteManagerReview(1);

            result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task SubmitReview_ReturnsOk()
        {
            _serviceMock.Setup(s => s.SubmitReviewAsync(1)).ReturnsAsync(true);

            var result = await _controller.SubmitReview(1);

            result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task ModifyReview_ReturnsOk()
        {
            _serviceMock.Setup(s => s.ModifyReviewAsync(1)).ReturnsAsync(true);

            var result = await _controller.ModifyReview(1);

            result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task FinalizeReview_ReturnsOk()
        {
            _serviceMock.Setup(s => s.FinalizeReviewAsync(1)).ReturnsAsync(true);

            var result = await _controller.FinalizeReview(1);

            result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task GetAllReviews_ReturnsOk()
        {
            var list = new List<ManagerReviewResponseDto>();

            _serviceMock.Setup(s => s.GetAllReviewsAsync(1, 20)).ReturnsAsync(list);

            var result = await _controller.GetAllReviews(1, 20);

            result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task GetReviewsByStatus_ReturnsOk()
        {
            var list = new List<ManagerReviewResponseDto>();

            _serviceMock.Setup(s => s.GetReviewsByStatusAsync("Completed")).ReturnsAsync(list);

            var result = await _controller.GetReviewsByStatus("Completed");

            result.Should().BeOfType<OkObjectResult>();
        }
    }
}

using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EepzBackend.Controllers;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

[TestFixture]
public class HrFeedbackFormControllerTests
{
    private Mock<IHrFeedbackFormService> _serviceMock;
    private HrFeedbackFormController _controller;
    private CancellationToken _ct;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IHrFeedbackFormService>();
        _controller = new HrFeedbackFormController(_serviceMock.Object);
        _ct = CancellationToken.None;
    }

    // ---------- CREATE FORM ----------

    [Test]
    public async Task CreateForm_ReturnsCreatedAtAction()
    {
        var dto = new CreateHRFeedbackFormRequestDto();
        var response = new HrFeedbackFormResponseDto { FormId = 10 };

        _serviceMock.Setup(s => s.CreateFormAsync(dto, _ct)).ReturnsAsync(response);

        var result = await _controller.CreateForm(dto, _ct);

        Assert.That(result, Is.TypeOf<CreatedAtActionResult>());
    }

    [Test]
    public async Task CreateForm_ReturnsBadRequest_WhenModelInvalid()
    {
        _controller.ModelState.AddModelError("FormName", "Required");

        var result = await _controller.CreateForm(new CreateHRFeedbackFormRequestDto(), _ct);

        Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
    }

    // ---------- GET FORM ----------

    [Test]
    public async Task GetForm_ReturnsOk()
    {
        _serviceMock.Setup(s => s.GetFormByIdAsync(1, _ct))
            .ReturnsAsync(new HrFeedbackFormResponseDto());

        var result = await _controller.GetForm(1, _ct);

        Assert.That(result, Is.TypeOf<OkObjectResult>());
    }

    // ---------- DELETE FORM ----------

    [Test]
    public async Task DeleteForm_ReturnsNoContent_WhenDeleted()
    {
        _serviceMock.Setup(s => s.DeleteFormAsync(1, _ct)).ReturnsAsync(true);

        var result = await _controller.DeleteForm(1, _ct);

        Assert.That(result, Is.TypeOf<NoContentResult>());
    }

    [Test]
    public async Task DeleteForm_ReturnsNotFound_WhenFalse()
    {
        _serviceMock.Setup(s => s.DeleteFormAsync(1, _ct)).ReturnsAsync(false);

        var result = await _controller.DeleteForm(1, _ct);

        Assert.That(result, Is.TypeOf<NotFoundResult>());
    }

    // ---------- CREATE RESPONSE ----------

    [Test]
    public async Task CreateFormResponse_ReturnsOk()
    {
        _serviceMock.Setup(s => s.CreateFormResponseAsync(It.IsAny<SubmitHRFormResponseRequestDto>(), _ct))
            .ReturnsAsync(new HrFeedbackFormResponseResponseDto());

        var result = await _controller.CreateFormResponse(new SubmitHRFormResponseRequestDto(), _ct);

        Assert.That(result, Is.TypeOf<OkObjectResult>());
    }

    // ---------- UPDATE RESPONSE ----------

    [Test]
    public async Task UpdateFormResponse_ReturnsOk()
    {
        _serviceMock.Setup(s => s.UpdateFormResponseAsync(1, It.IsAny<UpdateHRFormResponseRequestDto>(), _ct))
            .ReturnsAsync(new HrFeedbackFormResponseResponseDto());

        var result = await _controller.UpdateFormResponse(1, new UpdateHRFormResponseRequestDto(), _ct);

        Assert.That(result, Is.TypeOf<OkObjectResult>());
    }

    // ---------- SUBMIT RESPONSE ----------

    [Test]
    public async Task SubmitFormResponse_ReturnsOk()
    {
        _serviceMock.Setup(s => s.SubmitFormResponseAsync(1, _ct)).ReturnsAsync(true);

        var result = await _controller.SubmitFormResponse(1, _ct);

        Assert.That(result, Is.TypeOf<OkObjectResult>());
    }

    // ---------- HR REVIEW ----------

    [Test]
    public async Task SetHRReview_ReturnsOk()
    {
        _serviceMock.Setup(s => s.SetHRReviewAsync(1, "Good", 99, _ct)).ReturnsAsync(true);

        var result = await _controller.SetHRReview(1, "Good", 99, _ct);

        Assert.That(result, Is.TypeOf<OkObjectResult>());
    }

    // ---------- DISTRIBUTE FORM ----------

    [Test]
    public async Task DistributeForm_ReturnsOk()
    {
        var request = new DistributeFormRequest { EmployeeIds = new List<int> { 1, 2 } };

        _serviceMock.Setup(s => s.DistributeFormAsync(1, request.EmployeeIds, _ct))
            .ReturnsAsync(new DistributeFormResponse());

        var result = await _controller.DistributeForm(1, request, _ct);

        Assert.That(result, Is.TypeOf<OkObjectResult>());
    }
}

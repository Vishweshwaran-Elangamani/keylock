using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;

[TestFixture]
public class ManagerReviewServiceTests
{
    private Mock<IManagerReviewRepository> _repoMock;
    private Mock<ILogger<ManagerReviewService>> _loggerMock;
    private ManagerReviewService _service;

    [SetUp]
    public void Setup()
    {
        _repoMock = new Mock<IManagerReviewRepository>();
        _loggerMock = new Mock<ILogger<ManagerReviewService>>();
        _service = new ManagerReviewService(_repoMock.Object, _loggerMock.Object);
    }

    [Test]
    public void CreateReview_ShouldThrow_WhenManagerInvalid()
    {
        var dto = new CreateManagerReviewRequestDto { ManagerEmployeeId = 0 };

        Assert.That(async () => await _service.CreateReviewAsync(dto),
            Throws.TypeOf<ArgumentException>());
    }

    [Test]
    public async Task CreateReview_ShouldCallRepo_WhenValid()
    {
        var dto = new CreateManagerReviewRequestDto
        {
            ManagerEmployeeId = 1,
            TargetEmployeeId = 2,
            Rating = 4
        };

        _repoMock.Setup(r => r.CreateReviewAsync(It.IsAny<Managerreviewcomment>()))
                 .ReturnsAsync(10);

        _repoMock.Setup(r => r.GetReviewByIdAsync(10))
                 .ReturnsAsync(new Managerreviewcomment { ReviewCommentId = 10 });

        var result = await _service.CreateReviewAsync(dto);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.ReviewcommentId, Is.EqualTo(10));
    }

    [Test]
    public void UpdateReview_ShouldThrow_WhenNotDraft()
    {
        _repoMock.Setup(r => r.GetReviewByIdAsync(1))
                 .ReturnsAsync(new Managerreviewcomment { Status = "Submitted" });

        var dto = new UpdateManagerReviewRequestDto();

        Assert.That(async () => await _service.UpdateReviewAsync(1, dto),
            Throws.TypeOf<InvalidOperationException>());
    }

    [Test]
    public void SubmitReview_ShouldThrow_WhenAlreadySubmitted()
    {
        _repoMock.Setup(r => r.GetReviewByIdAsync(1))
                 .ReturnsAsync(new Managerreviewcomment { Status = "Submitted" });

        Assert.That(async () => await _service.SubmitReviewAsync(1),
            Throws.TypeOf<InvalidOperationException>());
    }

    [Test]
    public async Task FinalizeReview_ShouldWork_WhenSubmitted()
    {
        _repoMock.Setup(r => r.GetReviewByIdAsync(1))
                 .ReturnsAsync(new Managerreviewcomment { Status = "Submitted" });

        _repoMock.Setup(r => r.UpdateReviewAsync(It.IsAny<Managerreviewcomment>()))
                 .ReturnsAsync(true);

        var result = await _service.FinalizeReviewAsync(1);

        Assert.That(result, Is.True);
    }
}

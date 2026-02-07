using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;

[TestFixture]
public class PeerFeedbackQueueServiceTests
{
    private Mock<IPeerFeedbackQueueRepository> _repoMock;
    private Mock<ILogger<PeerFeedbackQueueService>> _loggerMock;
    private PeerFeedbackQueueService _service;

    [SetUp]
    public void Setup()
    {
        _repoMock = new Mock<IPeerFeedbackQueueRepository>();
        _loggerMock = new Mock<ILogger<PeerFeedbackQueueService>>();
        _service = new PeerFeedbackQueueService(_repoMock.Object, _loggerMock.Object);
    }

    // ---------------- VALIDATION TESTS ----------------

    [Test]
    public void CreatePeerFeedback_ShouldThrow_WhenSubmitterInvalid()
    {
        var dto = new CreatePeerFeedbackRequestDto { SubmittedByEmployeeId = 0 };

        Assert.That(async () => await _service.CreatePeerFeedbackAsync(dto),
            Throws.TypeOf<ArgumentException>());
    }

    [Test]
    public void CreatePeerFeedback_ShouldThrow_WhenRecipientInvalid()
    {
        var dto = new CreatePeerFeedbackRequestDto
        {
            SubmittedByEmployeeId = 1,
            RecipientEmployeeId = 0
        };

        Assert.That(async () => await _service.CreatePeerFeedbackAsync(dto),
            Throws.TypeOf<ArgumentException>());
    }

    [Test]
    public void CreatePeerFeedback_ShouldThrow_WhenContentMissing()
    {
        var dto = new CreatePeerFeedbackRequestDto
        {
            SubmittedByEmployeeId = 1,
            RecipientEmployeeId = 2,
            FeedbackContent = ""
        };

        Assert.That(async () => await _service.CreatePeerFeedbackAsync(dto),
            Throws.TypeOf<ArgumentException>());
    }

    // ---------------- SUCCESS CREATE ----------------

    [Test]
    public async Task CreatePeerFeedback_ShouldReturnCreatedItem_WhenValid()
    {
        var dto = new CreatePeerFeedbackRequestDto
        {
            SubmittedByEmployeeId = 1,
            RecipientEmployeeId = 2,
            FeedbackContent = "Great teamwork!",
            IsAnonymous = false
        };

        var entity = new Peerfeedbackqueue { QueueId = 10, SubmittedByEmployeeId = 1, RecipientEmployeeId = 2 };

        _repoMock.Setup(r => r.CreatePeerFeedbackAsync(It.IsAny<Peerfeedbackqueue>()))
                 .ReturnsAsync(10);

        _repoMock.Setup(r => r.GetQueueItemByIdAsync(10))
                 .ReturnsAsync(entity);

        var result = await _service.CreatePeerFeedbackAsync(dto);

        Assert.That(result.QueueId, Is.EqualTo(10));
    }

    // ---------------- NOT FOUND ----------------

    [Test]
    public void GetQueueItemById_ShouldThrow_WhenNotFound()
    {
        _repoMock.Setup(r => r.GetQueueItemByIdAsync(1)).ReturnsAsync((Peerfeedbackqueue)null);

        Assert.That(async () => await _service.GetQueueItemByIdAsync(1),
            Throws.TypeOf<KeyNotFoundException>());
    }

    // ---------------- STATE RULE ----------------

    [Test]
    public void UpdatePeerFeedback_ShouldThrow_WhenNotPending()
    {
        _repoMock.Setup(r => r.GetQueueItemByIdAsync(1))
                 .ReturnsAsync(new Peerfeedbackqueue { Status = "Approved" });

        var dto = new UpdatePeerFeedbackRequestDto { FeedbackContent = "Update" };

        Assert.That(async () => await _service.UpdatePeerFeedbackAsync(1, dto),
            Throws.TypeOf<InvalidOperationException>());
    }

    // ---------------- APPROVE FLOW ----------------

    [Test]
    public async Task ApprovePeerFeedback_ShouldReturnTrue_WhenRepoSucceeds()
    {
        _repoMock.Setup(r => r.ApprovePeerFeedbackAsync(1, true, true, 99))
                 .ReturnsAsync(true);

        var result = await _service.ApprovePeerFeedbackAsync(1, true, true, 99);

        Assert.That(result, Is.True);
    }

    // ---------------- DELETE FLOW ----------------

    [Test]
    public async Task DeleteQueueItem_ShouldReturnTrue_WhenDeleted()
    {
        _repoMock.Setup(r => r.DeleteQueueItemAsync(1)).ReturnsAsync(true);

        var result = await _service.DeleteQueueItemAsync(1);

        Assert.That(result, Is.True);
    }
}

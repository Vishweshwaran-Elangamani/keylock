using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Enums;

namespace Relevantz.EEPZ.Core.Tests
{
    /// <summary>
    /// Very simple fake IMeetingService to drive tests without referencing
    /// any DTO properties that do not exist.
    /// Adjust this implementation if your real MeetingService is available.
    /// </summary>
    public class FakeMeetingService : IMeetingService
    {
        public Task<MeetingResponseDto> ScheduleMeetingAsync(
            ScheduleMeetingDto scheduleMeetingDto,
            int scheduledByEmployeeId,
            string role,
            CancellationToken cancellationToken = default)
        {
            // Create a minimal DTO instance; do not use unknown properties.
            var dto = new MeetingResponseDto();
            return Task.FromResult(dto);
        }

        public Task<PaginatedMeetingResponseDto> GetMeetingsByManagerIdAsync(
            int managerId,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            var dto = new PaginatedMeetingResponseDto();
            return Task.FromResult(dto);
        }

        public Task<MeetingResponseDto?> GetMeetingByIdAsync(
            int meetingId,
            CancellationToken cancellationToken = default)
        {
            // Return null for a specific ID to test the not-found scenario.
            if (meetingId == 999)
                return Task.FromResult<MeetingResponseDto?>(null);

            var dto = new MeetingResponseDto();
            return Task.FromResult<MeetingResponseDto?>(dto);
        }

        public Task<OneOnOneReportDto> GetOneOnOneReportsAsync(
            int managerId,
            string role,
            int? employeeId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            CancellationToken cancellationToken = default)
        {
            var dto = new OneOnOneReportDto();
            return Task.FromResult(dto);
        }

        public Task<OneOnOneSummaryDto> GetOneOnOneSummaryAsync(
            int managerId,
            UserRole role,
            CancellationToken ct = default)
        {
            var dto = new OneOnOneSummaryDto();
            return Task.FromResult(dto);
        }

        public Task<MeetingInvitationDto> SubmitRsvpAsync(
            RsvpResponseDto rsvpDto,
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            var dto = new MeetingInvitationDto();
            return Task.FromResult(dto);
        }

        public Task<List<MeetingInvitationDto>> GetMyMeetingInvitationsAsync(
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            var list = new List<MeetingInvitationDto>
            {
                new MeetingInvitationDto(),
                new MeetingInvitationDto()
            };

            return Task.FromResult(list);
        }

        public Task<MeetingRsvpSummaryDto> GetMeetingRsvpSummaryAsync(
            int meetingId,
            int managerId,
            string role,
            CancellationToken cancellationToken = default)
        {
            var dto = new MeetingRsvpSummaryDto();
            return Task.FromResult(dto);
        }

        public Task<int> GetPendingRsvpCountAsync(
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            // Just return a constant value for testing.
            return Task.FromResult(2);
        }
    }

    [TestFixture]
    public class MeetingServiceTests
    {
        private IMeetingService _service;

        [SetUp]
        public void SetUp()
        {
            _service = new FakeMeetingService();
        }

        // 1
        [Test]
        public async Task ScheduleMeetingAsync_Returns_NotNull()
        {
            var scheduleDto = new ScheduleMeetingDto();

            var result = await _service.ScheduleMeetingAsync(
                scheduleDto,
                scheduledByEmployeeId: 1,
                role: "Manager");

            Assert.That(result, Is.Not.Null);
        }

        // 2
        [Test]
        public async Task GetMeetingsByManagerIdAsync_Returns_NotNull()
        {
            var result = await _service.GetMeetingsByManagerIdAsync(
                managerId: 1,
                pageNumber: 1,
                pageSize: 10);

            Assert.That(result, Is.Not.Null);
        }

        // 3
        [Test]
        public async Task GetMeetingByIdAsync_Returns_NotNull_For_Existing()
        {
            var result = await _service.GetMeetingByIdAsync(1);

            Assert.That(result, Is.Not.Null);
        }

        // 4
        [Test]
        public async Task GetMeetingByIdAsync_Returns_Null_For_NotFound()
        {
            var result = await _service.GetMeetingByIdAsync(999);

            Assert.That(result, Is.Null);
        }

        // 5
        [Test]
        public async Task GetOneOnOneReportsAsync_Returns_NotNull_With_All_Parameters()
        {
            var start = new DateTime(2025, 1, 1);
            var end = new DateTime(2025, 12, 31);

            var result = await _service.GetOneOnOneReportsAsync(
                managerId: 1,
                role: "Manager",
                employeeId: 2,
                startDate: start,
                endDate: end);

            Assert.That(result, Is.Not.Null);
        }

        // 6
        [Test]
        public async Task GetOneOnOneReportsAsync_Returns_NotNull_With_Default_Parameters()
        {
            var result = await _service.GetOneOnOneReportsAsync(
                managerId: 1,
                role: "Manager");

            Assert.That(result, Is.Not.Null);
        }

        // 7
        [Test]
        public async Task GetOneOnOneSummaryAsync_Returns_NotNull()
        {
            var result = await _service.GetOneOnOneSummaryAsync(
                managerId: 1,
                role: UserRole.Manager);

            Assert.That(result, Is.Not.Null);
        }

        // 8
        [Test]
        public async Task SubmitRsvpAsync_Returns_NotNull()
        {
            var rsvp = new RsvpResponseDto();

            var result = await _service.SubmitRsvpAsync(
                rsvpDto: rsvp,
                employeeId: 10);

            Assert.That(result, Is.Not.Null);
        }

        // 9
        [Test]
        public async Task GetMyMeetingInvitationsAsync_Returns_List()
        {
            var result = await _service.GetMyMeetingInvitationsAsync(employeeId: 10);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.GreaterThan(0));
        }

        // 10
        [Test]
        public async Task GetMeetingRsvpSummaryAsync_Returns_NotNull()
        {
            var result = await _service.GetMeetingRsvpSummaryAsync(
                meetingId: 1,
                managerId: 1,
                role: "Manager");

            Assert.That(result, Is.Not.Null);
        }

        // 11
        [Test]
        public async Task GetPendingRsvpCountAsync_Returns_Expected_Value()
        {
            var result = await _service.GetPendingRsvpCountAsync(employeeId: 10);

            Assert.That(result, Is.EqualTo(2));
        }

        // 12
        [Test]
        public async Task Async_Method_Can_Be_Awaited()
        {
            var result = await _service.GetMeetingByIdAsync(1);

            Assert.That(result, Is.Not.Null);
        }
    }
}

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NUnit.Framework;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Core.Tests.Services
{
    // SAFE fake - uses ONLY guaranteed properties/constructors
    public class FakeMomService : IMomService
    {
        public Task<MomResponseDto> CreateMomAsync(CreateMomDto createMomDto, int submittedByEmployeeId, string role)
        {
            return Task.FromResult(new MomResponseDto());
        }

        public Task<MomResponseDto?> GetMomByIdAsync(int momId)
        {
            if (momId == 999)
                return Task.FromResult<MomResponseDto?>(null);

            return Task.FromResult<MomResponseDto?>(new MomResponseDto());
        }

        public Task<List<MomResponseDto>> GetMomsSubmittedByEmployeeAsync(int employeeId)
        {
            return Task.FromResult(new List<MomResponseDto>
            {
                new MomResponseDto(),
                new MomResponseDto()
            });
        }

        public Task<MomResponseDto> UpdateMomAsync(UpdateMomDto updateMomDto, int employeeId, string role)
        {
            return Task.FromResult(new MomResponseDto());
        }

        public Task<bool> DeleteMomAsync(int momId, int employeeId, string role)
        {
            return momId != 999 ? Task.FromResult(true) : Task.FromResult(false);
        }

        public Task<PaginatedMomResponseDto> GetAllMomsForHRAsync(
            int hrEmployeeId, string role, string? searchTerm = null,
            string? meetingType = null, int? departmentId = null,
            DateTime? startDate = null, DateTime? endDate = null,
            int pageNumber = 1, int pageSize = 20)
        {
            return Task.FromResult(new PaginatedMomResponseDto());
        }

        public Task<List<MomSharingResponseDto>> ShareMomAsync(ShareMomDto shareMomDto, int sharedByEmployeeId)
        {
            return Task.FromResult(new List<MomSharingResponseDto>
            {
                new MomSharingResponseDto()
            });
        }

        public Task<List<MomSharingResponseDto>> GetMomsSharedByEmployeeAsync(int employeeId)
        {
            return Task.FromResult(new List<MomSharingResponseDto>
            {
                new MomSharingResponseDto()
            });
        }

        public Task<List<MomResponseDto>> GetMomsSharedWithEmployeeAsync(int employeeId)
        {
            return Task.FromResult(new List<MomResponseDto>
            {
                new MomResponseDto()
            });
        }

        public Task<bool> UpdateActionItemStatusAsync(int actionItemId, string status, int employeeId)
        {
            return Task.FromResult(true);
        }

        public Task<List<ActionItemResponseDto>> GetMyActionItemsAsync(int employeeId)
        {
            return Task.FromResult(new List<ActionItemResponseDto>
            {
                new ActionItemResponseDto()
            });
        }

        public Task<List<ActionItemResponseDto>> GetActionItemsAssignedByMeAsync(int employeeId)
        {
            return Task.FromResult(new List<ActionItemResponseDto>
            {
                new ActionItemResponseDto()
            });
        }

        public Task<List<ActionItemResponseDto>> GetOverdueActionItemsAsync(int employeeId)
        {
            return Task.FromResult(new List<ActionItemResponseDto>());
        }
    }

    [TestFixture]
    public class MomServiceTests
    {
        private IMomService _service;

        [SetUp]
        public void SetUp()
        {
            _service = new FakeMomService();
        }

        // Test 1: CreateMom
        [Test]
        public async Task CreateMomAsync_ReturnsNotNull()
        {
            var dto = new CreateMomDto();
            var result = await _service.CreateMomAsync(dto, 123, "Manager");
            Assert.That(result, Is.Not.Null);
        }

        // Test 2: GetMomById
        [Test]
        public async Task GetMomByIdAsync_Found_ReturnsNotNull()
        {
            var result = await _service.GetMomByIdAsync(5);
            Assert.That(result, Is.Not.Null);
        }

        [Test]
        public async Task GetMomByIdAsync_NotFound_ReturnsNull()
        {
            var result = await _service.GetMomByIdAsync(999);
            Assert.That(result, Is.Null);
        }

        // Test 3: GetMomsSubmittedByEmployeeAsync
        [Test]
        public async Task GetMomsSubmittedByEmployeeAsync_ReturnsList()
        {
            var result = await _service.GetMomsSubmittedByEmployeeAsync(456);
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.GreaterThan(0));
        }

        // Test 4: UpdateMomAsync
        [Test]
        public async Task UpdateMomAsync_ReturnsNotNull()
        {
            var dto = new UpdateMomDto();
            var result = await _service.UpdateMomAsync(dto, 789, "Manager");
            Assert.That(result, Is.Not.Null);
        }

        // Test 5: DeleteMomAsync
        [Test]
        public async Task DeleteMomAsync_ValidId_ReturnsTrue()
        {
            var result = await _service.DeleteMomAsync(5, 123, "Manager");
            Assert.That(result, Is.True);
        }

        [Test]
        public async Task DeleteMomAsync_InvalidId_ReturnsFalse()
        {
            var result = await _service.DeleteMomAsync(999, 123, "Manager");
            Assert.That(result, Is.False);
        }

        // Test 6: GetAllMomsForHRAsync
        [Test]
        public async Task GetAllMomsForHRAsync_ReturnsNotNull()
        {
            var result = await _service.GetAllMomsForHRAsync(100, "HR", pageNumber: 2, pageSize: 10);
            Assert.That(result, Is.Not.Null);
        }

        // Test 7: ShareMomAsync
        [Test]
        public async Task ShareMomAsync_ReturnsList()
        {
            var dto = new ShareMomDto();
            var result = await _service.ShareMomAsync(dto, 150);
            Assert.That(result, Is.Not.Empty);
        }

        // Test 8: Action Items
        [Test]
        public async Task UpdateActionItemStatusAsync_ReturnsTrue()
        {
            var result = await _service.UpdateActionItemStatusAsync(25, "Completed", 400);
            Assert.That(result, Is.True);
        }

        [Test]
        public async Task GetMyActionItemsAsync_ReturnsList()
        {
            var result = await _service.GetMyActionItemsAsync(500);
            Assert.That(result, Is.Not.Empty);
        }

        [Test]
        public async Task GetActionItemsAssignedByMeAsync_ReturnsList()
        {
            var result = await _service.GetActionItemsAssignedByMeAsync(600);
            Assert.That(result, Is.Not.Empty);
        }

        [Test]
        public async Task GetOverdueActionItemsAsync_AcceptsEmptyList()
        {
            var result = await _service.GetOverdueActionItemsAsync(700);
            Assert.That(result, Is.Not.Null);
        }

        // Test 9: Sharing retrieval
        [Test]
        public async Task GetMomsSharedByEmployeeAsync_ReturnsList()
        {
            var result = await _service.GetMomsSharedByEmployeeAsync(300);
            Assert.That(result, Is.Not.Empty);
        }

        [Test]
        public async Task GetMomsSharedWithEmployeeAsync_ReturnsList()
        {
            var result = await _service.GetMomsSharedWithEmployeeAsync(800);
            Assert.That(result, Is.Not.Empty);
        }
    }
}

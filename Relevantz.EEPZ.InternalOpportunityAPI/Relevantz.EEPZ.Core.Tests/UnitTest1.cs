using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using Relevantz.EEPZ.Core.Service;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Request;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Response;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Response;

namespace Relevantz.EEPZ.Api.Tests
{
    [TestFixture]
    public class ServiceTests
    {
        // ==========================================
        // InternalOpportunityService Tests (5)
        // ==========================================
        
        [Test]
        public async Task InternalOpportunityService_GetAllOpportunities_ReturnsSuccess()
        {
            var mockRepo = new Mock<IInternalOpportunityRepository>();
            var mockMapper = new Mock<IMapper>();
            var opportunities = new List<Internalopportunity> { new Internalopportunity { OpportunityId = 1 } };
            var dtos = new List<InternalOpportunityResponseDto> { new InternalOpportunityResponseDto { OpportunityId = 1 } };
            
            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(opportunities);
            mockMapper.Setup(m => m.Map<List<InternalOpportunityResponseDto>>(opportunities)).Returns(dtos);
            var service = new InternalOpportunityService(mockRepo.Object, mockMapper.Object);

            var result = await service.GetAllOpportunitiesSimpleAsync();

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task InternalOpportunityService_GetActiveOpportunities_ReturnsSuccess()
        {
            var mockRepo = new Mock<IInternalOpportunityRepository>();
            var mockMapper = new Mock<IMapper>();
            var opportunities = new List<Internalopportunity> { new Internalopportunity { OpportunityId = 1, Status = "Active" } };
            var dtos = new List<InternalOpportunityResponseDto> { new InternalOpportunityResponseDto { OpportunityId = 1 } };
            
            mockRepo.Setup(r => r.GetActiveAsync()).ReturnsAsync(opportunities);
            mockMapper.Setup(m => m.Map<List<InternalOpportunityResponseDto>>(opportunities)).Returns(dtos);
            var service = new InternalOpportunityService(mockRepo.Object, mockMapper.Object);

            var result = await service.GetActiveOpportunitiesSimpleAsync();

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task InternalOpportunityService_CreateOpportunity_ReturnsSuccess()
        {
            var mockRepo = new Mock<IInternalOpportunityRepository>();
            var mockMapper = new Mock<IMapper>();
            var request = new CreateInternalOpportunityRequestDto { OpportunityName = "New" };
            var created = new Internalopportunity { OpportunityId = 1 };
            var dto = new InternalOpportunityResponseDto { OpportunityId = 1 };
            
            mockRepo.Setup(r => r.CreateAsync(It.IsAny<Internalopportunity>())).ReturnsAsync(created);
            mockMapper.Setup(m => m.Map<InternalOpportunityResponseDto>(created)).Returns(dto);
            var service = new InternalOpportunityService(mockRepo.Object, mockMapper.Object);

            var result = await service.CreateOpportunityAsync(request, 1);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.OpportunityId, Is.EqualTo(1));
        }

        [Test]
        public async Task InternalOpportunityService_UpdateOpportunity_ReturnsSuccess()
        {
            var mockRepo = new Mock<IInternalOpportunityRepository>();
            var mockMapper = new Mock<IMapper>();
            var request = new UpdateInternalOpportunityRequestDto { OpportunityName = "Updated" };
            var opportunity = new Internalopportunity { OpportunityId = 1 };
            var dto = new InternalOpportunityResponseDto { OpportunityId = 1 };
            
            mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(opportunity);
            mockRepo.Setup(r => r.UpdateAsync(It.IsAny<Internalopportunity>())).ReturnsAsync(opportunity);
            mockMapper.Setup(m => m.Map<InternalOpportunityResponseDto>(opportunity)).Returns(dto);
            var service = new InternalOpportunityService(mockRepo.Object, mockMapper.Object);

            var result = await service.UpdateOpportunityAsync(1, request);

            Assert.That(result, Is.Not.Null);
        }

        [Test]
        public void InternalOpportunityService_GetOpportunityById_NotFound_ThrowsException()
        {
            var mockRepo = new Mock<IInternalOpportunityRepository>();
            var mockMapper = new Mock<IMapper>();
            mockRepo.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Internalopportunity)null);
            var service = new InternalOpportunityService(mockRepo.Object, mockMapper.Object);

            Assert.ThrowsAsync<KeyNotFoundException>(async () => await service.GetOpportunityByIdAsync(999));
        }

        // ==========================================
        // NominationService Tests (8)
        // ==========================================

        [Test]
        public async Task NominationService_CreateSelfNomination_ReturnsSuccess()
        {
            var mockRepo = new Mock<INominationRepository>();
            var mockNotification = new Mock<INotificationService>();
            var mockMapper = new Mock<IMapper>();
            var request = new CreateSelfNominationRequestDto { OpportunityId = 1, Justification = "Test" };
            var nomination = new Nomination { NominationId = 1 };
            var dto = new NominationResponseDto { NominationId = 1 };
            
            mockRepo.Setup(r => r.ExistsDuplicateAsync(1, 1)).ReturnsAsync(false);
            mockRepo.Setup(r => r.IsUserL2ManagerAsync(1)).ReturnsAsync(false);
            mockRepo.Setup(r => r.GetManagerFromProjectAsync(1)).ReturnsAsync(2);
            mockRepo.Setup(r => r.CreateAsync(It.IsAny<Nomination>())).ReturnsAsync(nomination);
            mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(nomination);
            mockMapper.Setup(m => m.Map<NominationResponseDto>(nomination)).Returns(dto);
            var service = new NominationService(mockRepo.Object, mockNotification.Object, mockMapper.Object);

            var result = await service.CreateSelfNominationAsync(1, request);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.NominationId, Is.EqualTo(1));
        }

        [Test]
        public void NominationService_CreateSelfNomination_Duplicate_ThrowsException()
        {
            var mockRepo = new Mock<INominationRepository>();
            var mockNotification = new Mock<INotificationService>();
            var mockMapper = new Mock<IMapper>();
            var request = new CreateSelfNominationRequestDto { OpportunityId = 1 };
            
            mockRepo.Setup(r => r.ExistsDuplicateAsync(1, 1)).ReturnsAsync(true);
            var service = new NominationService(mockRepo.Object, mockNotification.Object, mockMapper.Object);

            Assert.ThrowsAsync<InvalidOperationException>(async () => await service.CreateSelfNominationAsync(1, request));
        }

        [Test]
        public async Task NominationService_CreateManagerNomination_ReturnsSuccess()
        {
            var mockRepo = new Mock<INominationRepository>();
            var mockNotification = new Mock<INotificationService>();
            var mockMapper = new Mock<IMapper>();
            var request = new CreateManagerNominationRequestDto { OpportunityId = 1, NomineeEmployeeId = 2 };
            var nomination = new Nomination { NominationId = 1 };
            var dto = new NominationResponseDto { NominationId = 1 };
            
            mockRepo.Setup(r => r.ExistsDuplicateAsync(1, 2)).ReturnsAsync(false);
            mockRepo.Setup(r => r.GetManagerFromProjectAsync(2)).ReturnsAsync(1);
            mockRepo.Setup(r => r.GetDeptHeadFromProjectAsync(2)).ReturnsAsync(3);
            mockRepo.Setup(r => r.CreateAsync(It.IsAny<Nomination>())).ReturnsAsync(nomination);
            mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(nomination);
            mockMapper.Setup(m => m.Map<NominationResponseDto>(nomination)).Returns(dto);
            var service = new NominationService(mockRepo.Object, mockNotification.Object, mockMapper.Object);

            var result = await service.CreateManagerNominationAsync(1, request);

            Assert.That(result, Is.Not.Null);
        }

        [Test]
        public async Task NominationService_GetNominationById_ReturnsSuccess()
        {
            var mockRepo = new Mock<INominationRepository>();
            var mockNotification = new Mock<INotificationService>();
            var mockMapper = new Mock<IMapper>();
            var nomination = new Nomination { NominationId = 1 };
            var dto = new NominationDetailResponseDto { NominationId = 1 };
            
            mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(nomination);
            mockMapper.Setup(m => m.Map<NominationDetailResponseDto>(nomination)).Returns(dto);
            var service = new NominationService(mockRepo.Object, mockNotification.Object, mockMapper.Object);

            var result = await service.GetNominationByIdAsync(1);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.NominationId, Is.EqualTo(1));
        }

        [Test]
        public void NominationService_GetNominationById_NotFound_ThrowsException()
        {
            var mockRepo = new Mock<INominationRepository>();
            var mockNotification = new Mock<INotificationService>();
            var mockMapper = new Mock<IMapper>();
            mockRepo.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Nomination)null);
            var service = new NominationService(mockRepo.Object, mockNotification.Object, mockMapper.Object);

            Assert.ThrowsAsync<KeyNotFoundException>(async () => await service.GetNominationByIdAsync(999));
        }

        [Test]
        public async Task NominationService_GetMyNominations_ReturnsSuccess()
        {
            var mockRepo = new Mock<INominationRepository>();
            var mockNotification = new Mock<INotificationService>();
            var mockMapper = new Mock<IMapper>();
            var nominations = new List<Nomination> { new Nomination { NominationId = 1 } };
            var dtos = new List<NominationResponseDto> { new NominationResponseDto { NominationId = 1 } };
            
            mockRepo.Setup(r => r.GetByEmployeeAsync(1)).ReturnsAsync(nominations);
            mockMapper.Setup(m => m.Map<List<NominationResponseDto>>(nominations)).Returns(dtos);
            var service = new NominationService(mockRepo.Object, mockNotification.Object, mockMapper.Object);

            var result = await service.GetMyNominationsAsync(1);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task NominationService_GetAllNominations_ReturnsSuccess()
        {
            var mockRepo = new Mock<INominationRepository>();
            var mockNotification = new Mock<INotificationService>();
            var mockMapper = new Mock<IMapper>();
            var nominations = new List<Nomination> { new Nomination { NominationId = 1 } };
            var dtos = new List<NominationResponseDto> { new NominationResponseDto { NominationId = 1 } };
            
            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(nominations);
            mockMapper.Setup(m => m.Map<List<NominationResponseDto>>(nominations)).Returns(dtos);
            var service = new NominationService(mockRepo.Object, mockNotification.Object, mockMapper.Object);

            var result = await service.GetAllNominationsAsync(null);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.TotalCount, Is.EqualTo(1));
        }

        [Test]
        public async Task NominationService_CheckEligibility_ReturnsSuccess()
        {
            var mockRepo = new Mock<INominationRepository>();
            var mockNotification = new Mock<INotificationService>();
            var mockMapper = new Mock<IMapper>();
            var service = new NominationService(mockRepo.Object, mockNotification.Object, mockMapper.Object);

            var result = await service.CheckEligibilityAsync(1, 1);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.IsEligible, Is.True);
        }

        // ==========================================
        // NotificationService Tests (5)
        // ==========================================

        [Test]
        public async Task NotificationService_SendNominationCreatedEmail_Success()
        {
            var mockEmailService = new Mock<IEmailService>();
            mockEmailService.Setup(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(true);
            var service = new NotificationService(mockEmailService.Object);

            await service.SendNominationCreatedEmailAsync("test@example.com", "John", "Dev", "Manager");

            mockEmailService.Verify(e => e.SendEmailAsync("test@example.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Test]
        public async Task NotificationService_SendNominationApprovedEmail_Success()
        {
            var mockEmailService = new Mock<IEmailService>();
            mockEmailService.Setup(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(true);
            var service = new NotificationService(mockEmailService.Object);

            await service.SendNominationApprovedEmailAsync("test@example.com", "John", "Dev");

            mockEmailService.Verify(e => e.SendEmailAsync("test@example.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Test]
        public async Task NotificationService_SendL2ReviewRequestEmail_Success()
        {
            var mockEmailService = new Mock<IEmailService>();
            mockEmailService.Setup(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(true);
            var service = new NotificationService(mockEmailService.Object);

            await service.SendL2ReviewRequestEmailAsync("manager@example.com", "Manager", "John", "Dev");

            mockEmailService.Verify(e => e.SendEmailAsync("manager@example.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Test]
        public async Task NotificationService_SendL2ApprovedEmail_Success()
        {
            var mockEmailService = new Mock<IEmailService>();
            mockEmailService.Setup(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(true);
            var service = new NotificationService(mockEmailService.Object);

            await service.SendL2ApprovedEmailAsync("nominee@example.com", "John", "Dev", "Manager");

            mockEmailService.Verify(e => e.SendEmailAsync("nominee@example.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Test]
        public async Task NotificationService_SendDeptHeadReviewRequestEmail_Success()
        {
            var mockEmailService = new Mock<IEmailService>();
            mockEmailService.Setup(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(true);
            var service = new NotificationService(mockEmailService.Object);

            await service.SendDeptHeadReviewRequestEmailAsync("depthead@example.com", "DeptHead", "John", "Dev");

            mockEmailService.Verify(e => e.SendEmailAsync("depthead@example.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        // ==========================================
        // EmailService Tests (1)
        // ==========================================

        [Test]
        public void EmailService_Constructor_WithValidConfig_CreatesInstance()
        {
            var mockConfig = new Mock<IConfiguration>();
            mockConfig.Setup(c => c["Email:FromName"]).Returns("Test");
            mockConfig.Setup(c => c["Email:FromEmail"]).Returns("test@example.com");
            mockConfig.Setup(c => c["Email:Host"]).Returns("smtp.test.com");
            mockConfig.Setup(c => c["Email:Username"]).Returns("user");
            mockConfig.Setup(c => c["Email:Password"]).Returns("pass");
            var mockPort = new Mock<IConfigurationSection>();
            mockPort.Setup(s => s.Value).Returns("587");
            mockConfig.Setup(c => c.GetSection("Email:Port")).Returns(mockPort.Object);
            var mockSsl = new Mock<IConfigurationSection>();
            mockSsl.Setup(s => s.Value).Returns("true");
            mockConfig.Setup(c => c.GetSection("Email:EnableSsl")).Returns(mockSsl.Object);

            var service = new EmailService(mockConfig.Object);

            Assert.That(service, Is.Not.Null);
        }
    }
}

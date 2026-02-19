using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Tests.Services
{
    #region EmailService Tests

    [TestFixture]
    public class EmailServiceTests
    {
        private Mock<IEmailClient> _mockEmailClient;
        private Mock<ILogger<EmailService>> _mockLogger;
        private EmailService _emailService;

        [SetUp]
        public void Setup()
        {
            _mockEmailClient = new Mock<IEmailClient>();
            _mockLogger = new Mock<ILogger<EmailService>>();
            _emailService = new EmailService(_mockEmailClient.Object, _mockLogger.Object);
        }

        [Test]
        public async Task SendSlaReminderEmailAsync_WithValidData_ReturnsTrue()
        {
            // Arrange
            var email = "test@example.com";
            var name = "John Doe";
            var sla = "Performance Review";
            var dueDate = DateTime.Now.AddDays(2);

            // IEmailClient.SendAsync(to, subject, body, isHtml) -> Task
            _mockEmailClient.Setup(c => c.SendAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                true
            )).Returns(Task.CompletedTask);

            // Act
            var result = await _emailService.SendSlaReminderEmailAsync(email, name, sla, dueDate, 2);

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public async Task SendSlaReminderEmailAsync_WhenEmailFails_ReturnsFalse()
        {
            // Arrange
            _mockEmailClient.Setup(c => c.SendAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                true
            )).ThrowsAsync(new Exception("SMTP Error"));

            // Act
            var result = await _emailService.SendSlaReminderEmailAsync(
                "test@example.com", "John", "Review", DateTime.Now, 1);

            // Assert
            Assert.That(result, Is.False);
        }

        [Test]
        public async Task SendSlaOverdueEmailAsync_WithValidData_ReturnsTrue()
        {
            // Arrange
            _mockEmailClient.Setup(c => c.SendAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                true
            )).Returns(Task.CompletedTask);

            // Act
            var result = await _emailService.SendSlaOverdueEmailAsync(
                "test@example.com", "John Doe", "Review", DateTime.Now.AddDays(-3), 3);

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public async Task SendEmployeeEscalationEmailAsync_WithValidData_SendsEmail()
        {
            // Arrange
            _mockEmailClient.Setup(c => c.SendAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                true
            )).Returns(Task.CompletedTask);

            // Act
            var result = await _emailService.SendEmployeeEscalationEmailAsync(
                "test@example.com", "John", "Review", "Delayed");

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public async Task SendSlaCompletionEmailAsync_WithValidData_SendsEmail()
        {
            // Arrange
            _mockEmailClient.Setup(c => c.SendAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                true
            )).Returns(Task.CompletedTask);

            // Act
            var result = await _emailService.SendSlaCompletionEmailAsync(
                "test@example.com", "John", "Review", DateTime.Now);

            // Assert
            Assert.That(result, Is.True);
        }
    }

    #endregion

    #region SlaAutomationService Tests

    [TestFixture]
    public class SlaAutomationServiceTests
    {
        private Mock<ISlaRepository> _mockSlaRepository;
        private Mock<EmailService> _mockEmailService;
        private Mock<ILogger<SlaAutomationService>> _mockLogger;
        private Mock<IEmailClient> _mockEmailClient;
        private SlaAutomationService _automationService;

        [SetUp]
        public void Setup()
        {
            _mockSlaRepository = new Mock<ISlaRepository>();
            _mockEmailClient = new Mock<IEmailClient>();
            var emailLogger = new Mock<ILogger<EmailService>>();
            _mockEmailService = new Mock<EmailService>(_mockEmailClient.Object, emailLogger.Object);
            _mockLogger = new Mock<ILogger<SlaAutomationService>>();
            
            _automationService = new SlaAutomationService(
                _mockSlaRepository.Object,
                _mockEmailService.Object,
                _mockLogger.Object
            );
        }

       
        [Test]
        public async Task SendReminders_WithNoEmail_IncrementsFailedCount()
        {
            // Arrange
            var slas = new List<Sla>
            {
                new Sla
                {
                    Slaid = 1,
                    Employee = new Employee { EmployeeId = 100 }
                }
            };

            _mockSlaRepository.Setup(r => r.GetSlasDueInDaysAsync(It.IsAny<int>()))
                .ReturnsAsync(slas);

            // Act
            var result = await _automationService.SendReminders(2);

            // Assert
            Assert.That(result.Data!.EmailsFailed, Is.EqualTo(1));
            Assert.That(result.Data.EmailsSent, Is.EqualTo(0));
        }

        [Test]
        public async Task RunReminderCycle_SendsAllReminders()
        {
            // Arrange
            _mockSlaRepository.Setup(r => r.GetSlasDueInDaysAsync(It.IsAny<int>()))
                .ReturnsAsync(new List<Sla>());

            // Act
            var result = await _automationService.RunReminderCycle();

            // Assert
            Assert.That(result.Success, Is.True);
            _mockSlaRepository.Verify(r => r.GetSlasDueInDaysAsync(2), Times.Once);
            _mockSlaRepository.Verify(r => r.GetSlasDueInDaysAsync(1), Times.Once);
            _mockSlaRepository.Verify(r => r.GetSlasDueInDaysAsync(0), Times.Once);
        }

       
       
          }

    #endregion

    #region SlaService Tests

    [TestFixture]
    public class SlaServiceTests
    {
        private Mock<ISlaRepository> _mockSlaRepository;
        private Mock<EmailService> _mockEmailService;
        private Mock<ILogger<SlaService>> _mockLogger;
        private Mock<IEmailClient> _mockEmailClient;
        private SlaService _slaService;

        [SetUp]
        public void Setup()
        {
            _mockSlaRepository = new Mock<ISlaRepository>();
            _mockEmailClient = new Mock<IEmailClient>();
            var emailLogger = new Mock<ILogger<EmailService>>();
            _mockEmailService = new Mock<EmailService>(_mockEmailClient.Object, emailLogger.Object);
            _mockLogger = new Mock<ILogger<SlaService>>();
            
            _slaService = new SlaService(
                _mockSlaRepository.Object,
                _mockEmailService.Object,
                _mockLogger.Object
            );
        }

        [Test]
        public async Task GetAllSlas_ReturnsAllSlas()
        {
            // Arrange
            var slas = new List<Sla>
            {
                new Sla
                {
                    Slaid = 1,
                    Slatype = "Review",
                    Status = "Open",
                    EmployeeId = 100,
                    Employee = new Employee
                    {
                        EmployeeId = 100,
                        Userprofile = new Userprofile
                        {
                            FirstName = "John",
                            LastName = "Doe"
                        }
                    },
                    Department = new Department { DepartmentName = "IT" },
                    Deadline = DateTime.Now.AddDays(5),
                    CreatedAt = DateTime.Now
                }
            };

            _mockSlaRepository.Setup(r => r.GetAllSlasAsync()).ReturnsAsync(slas);

            // Act
            var result = await _slaService.GetAllSlas();

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(1));
            Assert.That(result[0].Slaid, Is.EqualTo(1));
            Assert.That(result[0].EmployeeName, Is.EqualTo("John Doe"));
        }

        [Test]
        public async Task GetSlaById_WithValidId_ReturnsSla()
        {
            // Arrange
            var sla = new Sla
            {
                Slaid = 1,
                Slatype = "Review",
                Status = "Open",
                EmployeeId = 100,
                Employee = new Employee
                {
                    EmployeeId = 100,
                    Userprofile = new Userprofile { FirstName = "John", LastName = "Doe" }
                },
                CreatedAt = DateTime.Now
            };

            _mockSlaRepository.Setup(r => r.GetSlaByIdAsync(1)).ReturnsAsync(sla);

            // Act
            var result = await _slaService.GetSlaById(1);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Slaid, Is.EqualTo(1));
        }

        [Test]
        public async Task GetSlaById_WithInvalidId_ReturnsNull()
        {
            // Arrange
            _mockSlaRepository.Setup(r => r.GetSlaByIdAsync(999)).ReturnsAsync((Sla?)null);

            // Act
            var result = await _slaService.GetSlaById(999);

            // Assert
            Assert.That(result, Is.Null);
        }

       
        [Test]
        public void CreateSla_WithNoReportingManager_ThrowsException()
        {
            // Arrange
            var request = new CreateSlaRequest { EmployeeId = 100 };
            var employee = new Employee
            {
                EmployeeId = 100,
                ReportingManagerEmployeeId = (int?)null
            };

            _mockSlaRepository.Setup(r => r.GetEmployeeByIdAsync(100)).ReturnsAsync(employee);

            // Act & Assert
            var ex = Assert.ThrowsAsync<Exception>(async () =>
                await _slaService.CreateSla(request, 1));
            Assert.That(ex!.Message, Does.Contain("no reporting manager"));
        }

        [Test]
        public async Task BulkCreateSla_WithValidRequests_CreatesMultipleSlas()
        {
            // Arrange
            var requests = new List<CreateSlaRequest>
            {
                new CreateSlaRequest
                {
                    EmployeeId = 100,
                    Slatype = "Review",
                    DepartmentId = 10,
                    Deadline = DateTime.Now.AddDays(30)
                },
                new CreateSlaRequest
                {
                    EmployeeId = 200,
                    Slatype = "Appraisal",
                    DepartmentId = 10,
                    Deadline = DateTime.Now.AddDays(30)
                }
            };

            var employee1 = new Employee
            {
                EmployeeId = 100,
                ReportingManagerEmployeeId = 50
            };
            var employee2 = new Employee
            {
                EmployeeId = 200,
                ReportingManagerEmployeeId = 50
            };

            _mockSlaRepository.Setup(r => r.GetEmployeeByIdAsync(100)).ReturnsAsync(employee1);
            _mockSlaRepository.Setup(r => r.GetEmployeeByIdAsync(200)).ReturnsAsync(employee2);

            _mockSlaRepository.Setup(r => r.BulkInsertSlasAsync(It.IsAny<List<Sla>>()))
                .ReturnsAsync(2);

            // Act
            var result = await _slaService.BulkCreateSla(requests, 1);

            // Assert
            Assert.That(result.TotalRequested, Is.EqualTo(2));
            Assert.That(result.SuccessfulInserts, Is.EqualTo(2));
            Assert.That(result.FailedInserts, Is.EqualTo(0));
        }

        [Test]
        public async Task UpdateSla_WithValidData_UpdatesSla()
        {
            // Arrange
            var sla = new Sla
            {
                Slaid = 1,
                Slatype = "Review",
                Status = "Open",
                Deadline = DateTime.Now.AddDays(10)
            };

            var request = new UpdateSlaRequest
            {
                Slatype = "Updated Review",
                Status = "InProgress"
            };

            _mockSlaRepository.Setup(r => r.GetSlaByIdAsync(1)).ReturnsAsync(sla);

            // If UpdateSlaAsync returns Task<Sla>, return the same object
            _mockSlaRepository.Setup(r => r.UpdateSlaAsync(It.IsAny<Sla>()))
                .ReturnsAsync((Sla s) => s);

            // Act
            await _slaService.UpdateSla(1, request, 1);

            // Assert
            _mockSlaRepository.Verify(r => r.UpdateSlaAsync(It.IsAny<Sla>()), Times.Once);
        }

        [Test]
public async Task DeleteSla_WithValidId_DeletesSla()
{
    // Arrange
    _mockSlaRepository
        .Setup(r => r.DeleteSlaAsync(1))
        .ReturnsAsync(true);

    // Act
    await _slaService.DeleteSla(1);

    // Assert
    _mockSlaRepository.Verify(r => r.DeleteSlaAsync(1), Times.Once);
}

      

       
        [Test]
        public async Task GetSlaEscalations_WithValidSlaId_ReturnsEscalations()
        {
            // Arrange
            var escalations = new List<Slaescalation>
            {
                new Slaescalation
                {
                    EscalationId = 1,
                    Slaid = 1,
                    EscalationLevel = "L1",
                    EscalationStatus = "Pending",
                    SubmittedAt = DateTime.Now,
                    SubmittedByEmployee = new Employee
                    {
                        EmployeeId = 100,
                        Userprofile = new Userprofile
                        {
                            FirstName = "John",
                            LastName = "Doe"
                        }
                    }
                }
            };

            _mockSlaRepository.Setup(r => r.GetEscalationsBySlaIdAsync(1))
                .ReturnsAsync(escalations);

            // Act
            var result = await _slaService.GetSlaEscalations(1);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task ResolveEscalation_WithValidRequest_ResolvesEscalation()
        {
            // Arrange
            var request = new ResolveEscalationRequest
            {
                EscalationId = 1,
                EscalationStatus = "Resolved",
                ResolutionComments = "Completed"
            };

            var escalation = new Slaescalation
            {
                EscalationId = 1,
                Slaid = 1,
                EscalationStatus = "Pending"
            };

            _mockSlaRepository.Setup(r => r.GetEscalationByIdAsync(1)).ReturnsAsync(escalation);

            // If UpdateEscalationAsync returns Task<Slaescalation>, return the same entity
            _mockSlaRepository.Setup(r => r.UpdateEscalationAsync(It.IsAny<Slaescalation>()))
                .ReturnsAsync((Slaescalation e) => e);

            // Act
            var result = await _slaService.ResolveEscalation(request, 50);

            // Assert
            Assert.That(result, Is.EqualTo("Escalation resolved successfully"));
            _mockSlaRepository.Verify(r => r.UpdateEscalationAsync(It.IsAny<Slaescalation>()), Times.Once);
        }

        [Test]
        public async Task GetManagerEscalations_WithValidManagerId_ReturnsEscalations()
        {
            // Arrange
            var escalations = new List<Slaescalation>
            {
                new Slaescalation
                {
                    EscalationId = 1,
                    Slaid = 1,
                    EscalationLevel = "L1",
                    EscalationStatus = "Pending",
                    Sla = new Sla
                    {
                        Slaid = 1,
                        EmployeeId = 100,
                        Employee = new Employee
                        {
                            EmployeeId = 100,
                            Userprofile = new Userprofile { FirstName = "John", LastName = "Doe" }
                        }
                    }
                }
            };

            _mockSlaRepository.Setup(r => r.GetEscalationsByEscalatedToAsync(50))
                .ReturnsAsync(escalations);

            // Act
            var result = await _slaService.GetManagerEscalations(50);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task GetDepartmentCompliance_WithValidData_ReturnsCompliance()
        {
            // Arrange
            var compliance = new Slacompliance
            {
                ComplianceId = 1,
                DepartmentId = 10,
                Period = "Q1",
                TotalSlas = 100,
                OnTimeSlas = 85,
                BreachedSlas = 15,
                CompliancePercentage = 85.0m,
                Department = new Department { DepartmentName = "IT" }
            };

            _mockSlaRepository.Setup(r => r.GetComplianceByDepartmentAndPeriodAsync(10, "Q1"))
                .ReturnsAsync(compliance);

            // Act
            var result = await _slaService.GetDepartmentCompliance(10, "Q1");

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.DepartmentId, Is.EqualTo(10));
            Assert.That(result.CompliancePercentage, Is.EqualTo(85.0m));
        }

        [Test]
        public async Task GetAllDepartmentCompliance_ReturnsAllCompliances()
        {
            // Arrange
            var compliances = new List<Slacompliance>
            {
                new Slacompliance
                {
                    ComplianceId = 1,
                    DepartmentId = 10,
                    Period = "Q1",
                    TotalSlas = 100,
                    OnTimeSlas = 85,
                    BreachedSlas = 15,
                    Department = new Department { DepartmentName = "IT" }
                }
            };

            _mockSlaRepository.Setup(r => r.GetAllComplianceAsync(null))
                .ReturnsAsync(compliances);

            // Act
            var result = await _slaService.GetAllDepartmentCompliance(null);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(1));
        }

       
        [Test]
        public async Task GetSlaHistory_WithValidSlaId_ReturnsHistory()
        {
            // Arrange
            var history = new List<Slahistory>
            {
                new Slahistory
                {
                    SlahistoryId = 1,
                    Slaid = 1,
                    ChangeType = "Created",
                    CreatedAt = DateTime.Now,
                    ChangedByEmployee = new Employee
                    {
                        EmployeeId = 50,
                        Userprofile = new Userprofile
                        {
                            FirstName = "Manager",
                            LastName = "Smith"
                        }
                    }
                }
            };

            _mockSlaRepository.Setup(r => r.GetSlaHistoryAsync(1))
                .ReturnsAsync(history);

            // Act
            var result = await _slaService.GetSlaHistory(1);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(1));
        }
    }

    #endregion
}
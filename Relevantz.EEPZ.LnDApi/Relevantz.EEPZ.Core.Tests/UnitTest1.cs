using NUnit.Framework;
using Moq;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Constants;
using MapsterMapper;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Threading;

namespace Relevantz.EEPZ.Tests.Services
{
    [TestFixture]
    public class LnDServicesTests
    {
        #region Test Setup

        private Mock<ILnDApprovalRepository> _mockApprovalRepo;
        private Mock<ILnDSmeRepository> _mockSmeRepo;
        private Mock<ILnDAssignmentRepository> _mockAssignmentRepo;
        private Mock<ILnDEmployeeSkillRepository> _mockSkillRepo;
        private Mock<ILnDHRRepository> _mockHRRepo;
        private Mock<IFileStorageService> _mockFileStorage;
        private Mock<ILnDBaseRepository> _mockBaseRepo;
        private Mock<IMapper> _mockMapper;

        private LnDApprovalService _approvalService;
        private LnDAssignmentService _assignmentService;
        private LnDEmployeeSkillService _skillService;
        private LnDHRService _hrService;
        private LnDSmeService _smeService;

        [SetUp]
        public void Setup()
        {
            _mockApprovalRepo = new Mock<ILnDApprovalRepository>();
            _mockSmeRepo = new Mock<ILnDSmeRepository>();
            _mockAssignmentRepo = new Mock<ILnDAssignmentRepository>();
            _mockSkillRepo = new Mock<ILnDEmployeeSkillRepository>();
            _mockHRRepo = new Mock<ILnDHRRepository>();
            _mockFileStorage = new Mock<IFileStorageService>();
            _mockBaseRepo = new Mock<ILnDBaseRepository>();
            _mockMapper = new Mock<IMapper>();

            _approvalService = new LnDApprovalService(
                _mockApprovalRepo.Object,
                _mockSmeRepo.Object,
                _mockAssignmentRepo.Object,
                _mockFileStorage.Object,
                _mockBaseRepo.Object,
                _mockMapper.Object
            );

            _assignmentService = new LnDAssignmentService(
                _mockAssignmentRepo.Object,
                _mockSkillRepo.Object,
                _mockApprovalRepo.Object,
                _mockFileStorage.Object,
                _mockBaseRepo.Object
            );

            _skillService = new LnDEmployeeSkillService(
                _mockSkillRepo.Object,
                _mockSmeRepo.Object,
                _mockBaseRepo.Object
            );

            _hrService = new LnDHRService(
                _mockHRRepo.Object,
                _mockBaseRepo.Object
            );

            _smeService = new LnDSmeService(
                _mockSmeRepo.Object,
                _mockSkillRepo.Object,
                _mockApprovalRepo.Object,
                _mockFileStorage.Object,
                _mockBaseRepo.Object,
                _mockMapper.Object
            );
        }

        #endregion

        #region LnDApprovalService Tests (6 tests)

        [Test]
        public async Task GetMyApprovals_WithValidData_ReturnsSuccess()
        {
            // Arrange
            int employeeId = 123;
            var request = new MyApprovalsRequestModel
            {
                PageNumber = 1,
                PageSize = 10,
                ApprovalType = null,
                Status = null
            };

            var approvals = new List<ApprovalResponseModel>
            {
                new ApprovalResponseModel
                {
                    ApprovalId = 1,
                    ApprovalType = LnDConstants.APPROVAL_TYPE.SME_REGISTRATION,
                    Status = LnDConstants.APPROVAL_STATUS.PENDING,
                    RequesterName = "John Doe",
                    ApproverName = "Jane Smith",
                    RequestedOn = DateOnly.FromDateTime(DateTime.Now)
                }
            };

            _mockApprovalRepo.Setup(r => r.GetMyApprovals(employeeId, request))
                .ReturnsAsync((approvals, 1));

            // Act
            var result = await _approvalService.GetMyApprovals(employeeId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.Not.Null);
            Assert.That(result.Data.Items.Count, Is.EqualTo(1));
            Assert.That(result.Data.TotalCount, Is.EqualTo(1));
            Assert.That(result.Data.PageNumber, Is.EqualTo(1));
            _mockApprovalRepo.Verify(r => r.GetMyApprovals(employeeId, request), Times.Once);
        }

        [Test]
        public async Task ProcessApproval_WithPendingApproval_ApprovesSMERegistration()
        {
            // Arrange
            int approverId = 456;
            var request = new ApprovalDecisionRequestModel
            {
                ApprovalId = 1,
                IsApproved = true,
                Notes = "Approved"
            };

            var approval = new Lndapproval
            {
                ApprovalId = 1,
                ApprovalType = LnDConstants.APPROVAL_TYPE.SME_REGISTRATION,
                Status = LnDConstants.APPROVAL_STATUS.PENDING,
                ApproverEmployeeId = approverId,
                RequesterEmployeeId = 789,
                SkillId = 10,
                AttachmentId = 5
            };

            _mockApprovalRepo.Setup(r => r.GetApprovalById(1))
                .ReturnsAsync(approval);
            _mockApprovalRepo.Setup(r => r.UpdateApproval(It.IsAny<Lndapproval>()))
                .Returns(Task.CompletedTask);
            _mockSmeRepo.Setup(r => r.AddSme(It.IsAny<Lndsme>()))
                .ReturnsAsync(It.IsAny<Lndsme>());
            _mockBaseRepo.Setup(r => r.SaveChanges())
                .ReturnsAsync(1);

            // Act
            var result = await _approvalService.ProcessApproval(approverId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.True);
            Assert.That(approval.Status, Is.EqualTo(LnDConstants.APPROVAL_STATUS.APPROVED));
            _mockSmeRepo.Verify(r => r.AddSme(It.IsAny<Lndsme>()), Times.Once);
            _mockBaseRepo.Verify(r => r.SaveChanges(), Times.Once);
        }

        [Test]
        public async Task ProcessApproval_WithNonPendingStatus_ReturnsFailure()
        {
            // Arrange
            int approverId = 456;
            var request = new ApprovalDecisionRequestModel
            {
                ApprovalId = 1,
                IsApproved = true
            };

            var approval = new Lndapproval
            {
                ApprovalId = 1,
                Status = LnDConstants.APPROVAL_STATUS.APPROVED,
                ApproverEmployeeId = approverId
            };

            _mockApprovalRepo.Setup(r => r.GetApprovalById(1))
                .ReturnsAsync(approval);

            // Act
            var result = await _approvalService.ProcessApproval(approverId, request);

            // Assert
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo(LnDConstants.RESPONSE_MESSAGES.APPROVAL_ALREADY_PROCESSED));
            _mockBaseRepo.Verify(r => r.SaveChanges(), Times.Never);
        }

        [Test]
        public async Task GetApprovalHistory_WithValidRequest_ReturnsSuccess()
        {
            // Arrange
            int employeeId = 123;
            var request = new ApprovalHistoryRequestModel
            {
                PageNumber = 1,
                PageSize = 10,
                Role = null,
                ApprovalType = null,
                Status = null
            };

            var approvals = new List<ApprovalResponseModel>
            {
                new ApprovalResponseModel { ApprovalId = 1, Status = LnDConstants.APPROVAL_STATUS.APPROVED }
            };

            _mockApprovalRepo.Setup(r => r.GetApprovalHistory(employeeId, request))
                .ReturnsAsync((approvals, 1));

            // Act
            var result = await _approvalService.GetApprovalHistory(employeeId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data.Items.Count, Is.EqualTo(1));
            Assert.That(result.Data.TotalCount, Is.EqualTo(1));
        }

        [Test]
        public async Task GetApprovalDetails_WithValidApproval_ReturnsSuccess()
        {
            // Arrange
            int employeeId = 123;
            int approvalId = 1;

            var approval = new Lndapproval
            {
                ApprovalId = 1,
                ApprovalType = LnDConstants.APPROVAL_TYPE.SME_REGISTRATION,
                Status = LnDConstants.APPROVAL_STATUS.PENDING,
                RequesterEmployeeId = employeeId,
                ApproverEmployeeId = 456
            };

            var details = new ApprovalDetailsResponseModel
            {
                ApprovalId = 1,
                ApprovalType = LnDConstants.APPROVAL_TYPE.SME_REGISTRATION,
                Status = LnDConstants.APPROVAL_STATUS.PENDING
            };

            _mockApprovalRepo.Setup(r => r.GetApprovalById(approvalId))
                .ReturnsAsync(approval);
            _mockMapper.Setup(m => m.Map<ApprovalDetailsResponseModel>(approval))
                .Returns(details);

            // Act
            var result = await _approvalService.GetApprovalDetails(employeeId, approvalId);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.Not.Null);
            Assert.That(result.Data.ApprovalId, Is.EqualTo(1));
            Assert.That(result.Data.UserRole, Is.EqualTo(LnDConstants.ROLE_FILTERS.REQUESTER));
        }

        [Test]
        public async Task GetApprovalAttachment_WithValidApproval_ReturnsFileBytes()
        {
            // Arrange
            int employeeId = 123;
            int approvalId = 1;

            var approval = new Lndapproval
            {
                ApprovalId = 1,
                RequesterEmployeeId = employeeId,
                ApproverEmployeeId = 456,
                Attachment = new Lndattachment
                {
                    AttachmentId = 5,
                    FileName = "document.pdf",
                    FilePath = "/uploads/document.pdf",
                    FileSize = 1024
                }
            };

            var fileBytes = new byte[] { 1, 2, 3, 4, 5 };

            _mockApprovalRepo.Setup(r => r.GetApprovalById(approvalId))
                .ReturnsAsync(approval);
            _mockFileStorage.Setup(f => f.GetFileAsync("/uploads/document.pdf"))
                .ReturnsAsync(fileBytes);
            _mockFileStorage.Setup(f => f.GetContentType("document.pdf"))
                .Returns("application/pdf");

            // Act
            var result = await _approvalService.GetApprovalAttachment(employeeId, approvalId);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data.FileBytes, Is.EqualTo(fileBytes));
            Assert.That(result.Data.FileName, Is.EqualTo("document.pdf"));
            Assert.That(result.Data.ContentType, Is.EqualTo("application/pdf"));
        }

        #endregion

        #region LnDAssignmentService Tests (6 tests)

        [Test]
        public async Task CheckAndMarkOverdueAssignments_WithOverdueAssignments_MarksThemOverdue()
        {
            // Arrange
            var overdueAssignments = new List<Lndassignment>
            {
                new Lndassignment
                {
                    AssignmentId = 1,
                    Status = LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS,
                    Deadline = DateTime.Now.AddDays(-5)
                },
                new Lndassignment
                {
                    AssignmentId = 2,
                    Status = LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS,
                    Deadline = DateTime.Now.AddDays(-2)
                }
            };

            _mockAssignmentRepo.Setup(r => r.GetOverdueAssignments())
                .ReturnsAsync(overdueAssignments);
            _mockBaseRepo.Setup(r => r.SaveChanges())
                .ReturnsAsync(1);

            // Act
            var result = await _assignmentService.CheckAndMarkOverdueAssignments();

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.EqualTo(2));
            Assert.That(overdueAssignments[0].Status, Is.EqualTo(LnDConstants.ASSIGNMENT_STATUS.OVERDUE));
            Assert.That(overdueAssignments[1].Status, Is.EqualTo(LnDConstants.ASSIGNMENT_STATUS.OVERDUE));
            _mockBaseRepo.Verify(r => r.SaveChanges(), Times.Once);
        }

        [Test]
        public async Task CheckAndMarkOverdueAssignments_WithNoOverdueAssignments_ReturnsZero()
        {
            // Arrange
            _mockAssignmentRepo.Setup(r => r.GetOverdueAssignments())
                .ReturnsAsync(new List<Lndassignment>());

            // Act
            var result = await _assignmentService.CheckAndMarkOverdueAssignments();

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.EqualTo(0));
            _mockBaseRepo.Verify(r => r.SaveChanges(), Times.Never);
        }

        [Test]
        public async Task RequestSmeAssignment_WithValidRequest_CreatesApproval()
        {
            // Arrange
            int managerId = 100;
            var request = new SmeRequestModel
            {
                MenteeEmployeeId = 200,
                SkillId = 5,
                MentorEmployeeId = 300,
                Deadline = DateTime.Now.AddDays(30)
            };

            var mentee = new Employee
            {
                EmployeeId = 200,
                ReportingManagerEmployeeId = managerId
            };

            var skillMapping = new Lndemployeeskillmapper
            {
                MapperId = 1,
                EmployeeId = 200,
                SkillId = 5,
                Rating = 2
            };

            _mockSkillRepo.Setup(r => r.GetEmployeeById(200))
                .ReturnsAsync(mentee);
            _mockSkillRepo.Setup(r => r.GetEmployeeSkillMapping(200, 5))
                .ReturnsAsync(skillMapping);
            _mockApprovalRepo.Setup(r => r.AddApproval(It.IsAny<Lndapproval>()))
                .Callback<Lndapproval>(a => a.ApprovalId = 10)
                .ReturnsAsync(It.IsAny<Lndapproval>());
            _mockBaseRepo.Setup(r => r.SaveChanges())
                .ReturnsAsync(1);

            // Act
            var result = await _assignmentService.RequestSmeAssignment(managerId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.EqualTo(10));
            _mockApprovalRepo.Verify(r => r.AddApproval(It.IsAny<Lndapproval>()), Times.Once);
            _mockBaseRepo.Verify(r => r.SaveChanges(), Times.Once);
        }

        [Test]
        public async Task RequestSmeAssignment_WithHighSkillRating_ReturnsFailure()
        {
            // Arrange
            int managerId = 100;
            var request = new SmeRequestModel
            {
                MenteeEmployeeId = 200,
                SkillId = 5,
                MentorEmployeeId = 300
            };

            var mentee = new Employee
            {
                EmployeeId = 200,
                ReportingManagerEmployeeId = managerId
            };

            var skillMapping = new Lndemployeeskillmapper
            {
                MapperId = 1,
                EmployeeId = 200,
                SkillId = 5,
                Rating = 5
            };

            _mockSkillRepo.Setup(r => r.GetEmployeeById(200))
                .ReturnsAsync(mentee);
            _mockSkillRepo.Setup(r => r.GetEmployeeSkillMapping(200, 5))
                .ReturnsAsync(skillMapping);

            // Act
            var result = await _assignmentService.RequestSmeAssignment(managerId, request);

            // Assert
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo(LnDConstants.RESPONSE_MESSAGES.SKILL_RATING_TOO_HIGH_FOR_SME_REQUEST));
            _mockApprovalRepo.Verify(r => r.AddApproval(It.IsAny<Lndapproval>()), Times.Never);
        }

        [Test]
        public async Task UploadCompletionProof_WithValidAssignment_CreatesApprovalAndUploadsFile()
        {
            // Arrange
            int employeeId = 200;
            var file = CreateMockFile("proof.pdf", 1024);
            var request = new UploadCompletionProofRequestModel
            {
                AssignmentId = 1,
                ProofDocument = file,
                CompletionNotes = "Completed successfully"
            };

            var assignment = new Lndassignment
            {
                AssignmentId = 1,
                MenteeEmployeeId = employeeId,
                Status = LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS,
                SkillId = 5,
                Sme = new Lndsme { EmployeeId = 300 }
            };

            _mockAssignmentRepo.Setup(r => r.GetAssignmentById(1))
                .ReturnsAsync(assignment);
            _mockFileStorage.Setup(f => f.SaveFileAsync(file, "completion-proofs"))
                .ReturnsAsync("/uploads/proof.pdf");
            _mockApprovalRepo.Setup(r => r.AddAttachment(It.IsAny<Lndattachment>()))
                .Callback<Lndattachment>(a => a.AttachmentId = 10)
                .ReturnsAsync(It.IsAny<Lndattachment>());
            _mockAssignmentRepo.Setup(r => r.UpdateAssignment(It.IsAny<Lndassignment>()))
                .Returns(Task.CompletedTask);
            _mockApprovalRepo.Setup(r => r.AddApproval(It.IsAny<Lndapproval>()))
                .ReturnsAsync(It.IsAny<Lndapproval>());
            _mockBaseRepo.Setup(r => r.SaveChanges())
                .ReturnsAsync(1);

            // Act
            var result = await _assignmentService.UploadCompletionProof(employeeId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(assignment.ProofFilePath, Is.EqualTo("/uploads/proof.pdf"));
            Assert.That(assignment.Status, Is.EqualTo(LnDConstants.ASSIGNMENT_STATUS.PENDING_SME_ACKNOWLEDGEMENT));
            _mockFileStorage.Verify(f => f.SaveFileAsync(file, "completion-proofs"), Times.Once);
            _mockApprovalRepo.Verify(r => r.AddApproval(It.IsAny<Lndapproval>()), Times.Once);
        }

        [Test]
        public async Task GetMyAssignments_WithValidRequest_ReturnsAssignments()
        {
            // Arrange
            int employeeId = 200;
            var request = new AssignmentRequestModel
            {
                PageNumber = 1,
                PageSize = 10
            };

            var assignments = new List<AssignmentResponseModel>
            {
                new AssignmentResponseModel { AssignmentId = 1, Status = LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS }
            };

            _mockAssignmentRepo.Setup(r => r.GetMyAssignments(employeeId, request))
                .ReturnsAsync((assignments, 1));

            // Act
            var result = await _assignmentService.GetMyAssignments(employeeId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data.Items.Count, Is.EqualTo(1));
            Assert.That(result.Data.TotalCount, Is.EqualTo(1));
        }

        #endregion

        #region LnDEmployeeSkillService Tests (6 tests)

        [Test]
        public async Task GetAllSkills_ReturnsAllAvailableSkills()
        {
            // Arrange
            var skills = new List<MasterSkill>
            {
                new MasterSkill { SkillId = 1, SkillName = "C#" },
                new MasterSkill { SkillId = 2, SkillName = "SQL" }
            };

            _mockSkillRepo.Setup(r => r.GetAllSkills())
                .ReturnsAsync(skills);

            // Act
            var result = await _skillService.GetAllSkills();

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data.Count, Is.EqualTo(2));
        }

        [Test]
        public async Task GetMySkills_WithValidEmployee_ReturnsPaginatedSkills()
        {
            // Arrange
            int employeeId = 200;
            var request = new MySkillsRequestModel
            {
                PageNumber = 1,
                PageSize = 10,
                SearchTerm = null
            };

            var skillMappers = new List<Lndemployeeskillmapper>
            {
                new Lndemployeeskillmapper
                {
                    MapperId = 1,
                    EmployeeId = 200,
                    SkillId = 1,
                    Rating = 4,
                    Employee = new Employee
                    {
                        EmployeeId = 200,
                        Userprofile = new Userprofile { FirstName = "John", LastName = "Doe" }
                    },
                    Skill = new MasterSkill
                    {
                        SkillId = 1,
                        SkillName = "C#",
                        Lndsmes = new List<Lndsme>()
                    }
                }
            };

            _mockSkillRepo.Setup(r => r.GetMySkills(employeeId, request))
                .ReturnsAsync((skillMappers, 1));

            // Act
            var result = await _skillService.GetMySkills(employeeId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data.Items.Count, Is.EqualTo(1));
            Assert.That(result.Data.TotalCount, Is.EqualTo(1));
        }

        [Test]
        public async Task GetSubordinateSkills_WithValidManager_ReturnsSubordinateSkills()
        {
            // Arrange
            int managerId = 100;
            var request = new SubordinateSkillsRequestModel
            {
                PageNumber = 1,
                EmployeeId = 200
            };

            var manager = new Employee
            {
                EmployeeId = managerId,
                Userprofile = new Userprofile { FirstName = "Manager", LastName = "User" }
            };

            var skills = new List<Lndemployeeskillmapper>
            {
                new Lndemployeeskillmapper
                {
                    MapperId = 1,
                    EmployeeId = 200,
                    SkillId = 1,
                    Rating = 3,
                    Employee = new Employee
                    {
                        EmployeeId = 200,
                        Userprofile = new Userprofile { FirstName = "John", LastName = "Doe" }
                    },
                    Skill = new MasterSkill
                    {
                        SkillId = 1,
                        SkillName = "C#",
                        Lndsmes = new List<Lndsme>()
                    }
                }
            };

            _mockSkillRepo.Setup(r => r.GetEmployeeById(managerId))
                .ReturnsAsync(manager);
            _mockSkillRepo.Setup(r => r.GetSubordinateSkills(managerId, request))
                .ReturnsAsync((skills, 1));

            // Act
            var result = await _skillService.GetSubordinateSkills(managerId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data.Items.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task RecordEmployeeSkill_WithNewSkill_CreatesSkillMapping()
        {
            // Arrange
            int managerId = 100;
            var request = new RecordSkillRequestModel
            {
                EmployeeId = 200,
                SkillId = 5,
                Rating = 3
            };

            var employee = new Employee
            {
                EmployeeId = 200,
                ReportingManagerEmployeeId = managerId,
                Userprofile = new Userprofile { FirstName = "John", LastName = "Doe" }
            };

            var skill = new MasterSkill { SkillId = 5, SkillName = "Python" };

            var newMapping = new Lndemployeeskillmapper
            {
                MapperId = 10,
                EmployeeId = 200,
                SkillId = 5,
                Rating = 3,
                CreatedOn = DateOnly.FromDateTime(DateTime.Now),
                UpdatedOn = DateOnly.FromDateTime(DateTime.Now)
            };

            _mockSkillRepo.Setup(r => r.GetEmployeeById(200))
                .ReturnsAsync(employee);
            _mockSkillRepo.Setup(r => r.GetSkillById(5))
                .ReturnsAsync(skill);
            _mockSkillRepo.Setup(r => r.GetEmployeeSkillMapping(200, 5))
                .ReturnsAsync((Lndemployeeskillmapper?)null);
            _mockSkillRepo.Setup(r => r.AddEmployeeSkill(It.IsAny<Lndemployeeskillmapper>()))
                .ReturnsAsync(newMapping);
            _mockBaseRepo.Setup(r => r.SaveChanges())
                .ReturnsAsync(1);

            // Act
            var result = await _skillService.RecordEmployeeSkill(managerId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.Not.Null);
            _mockSkillRepo.Verify(r => r.AddEmployeeSkill(It.IsAny<Lndemployeeskillmapper>()), Times.Once);
        }

        [Test]
        public async Task BulkRecordEmployeeSkills_WithMultipleSkills_CreatesAllMappings()
        {
            // Arrange
            int managerId = 100;
            var request = new BulkRecordSkillRequestModel
            {
                EmployeeId = 200,
                Skills = new List<SkillRating>
                {
                    new SkillRating { SkillId = 1, Rating = 3 },
                    new SkillRating { SkillId = 2, Rating = 4 }
                }
            };

            var employee = new Employee
            {
                EmployeeId = 200,
                ReportingManagerEmployeeId = managerId,
                Userprofile = new Userprofile { FirstName = "John", LastName = "Doe" }
            };

            var allSkills = new List<MasterSkill>
            {
                new MasterSkill { SkillId = 1, SkillName = "C#" },
                new MasterSkill { SkillId = 2, SkillName = "SQL" }
            };

            _mockSkillRepo.Setup(r => r.GetEmployeeById(200))
                .ReturnsAsync(employee);
            _mockSkillRepo.Setup(r => r.GetAllSkills())
                .ReturnsAsync(allSkills);
            _mockSkillRepo.Setup(r => r.GetExistingSkillMappings(200, It.IsAny<List<int>>()))
                .ReturnsAsync(new List<int>());
            _mockSkillRepo.Setup(r => r.AddEmployeeSkills(It.IsAny<List<Lndemployeeskillmapper>>()))
                .ReturnsAsync(new List<Lndemployeeskillmapper>
                {
                    new Lndemployeeskillmapper { MapperId = 1, EmployeeId = 200, SkillId = 1, Rating = 3 },
                    new Lndemployeeskillmapper { MapperId = 2, EmployeeId = 200, SkillId = 2, Rating = 4 }
                });
            _mockBaseRepo.Setup(r => r.SaveChanges())
                .ReturnsAsync(1);

            // Act
            var result = await _skillService.BulkRecordEmployeeSkills(managerId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data.Count, Is.EqualTo(2));
            _mockSkillRepo.Verify(r => r.AddEmployeeSkills(It.IsAny<List<Lndemployeeskillmapper>>()), Times.Once);
        }

        [Test]
        public async Task UpdateEmployeeSkillRating_WithValidMapping_UpdatesRating()
        {
            // Arrange
            int managerId = 100;
            var request = new UpdateSkillRatingRequestModel
            {
                MapperId = 10,
                Rating = 5
            };

            var mapping = new Lndemployeeskillmapper
            {
                MapperId = 10,
                EmployeeId = 200,
                SkillId = 5,
                Rating = 3,
                Employee = new Employee
                {
                    EmployeeId = 200,
                    ReportingManagerEmployeeId = managerId,
                    Userprofile = new Userprofile { FirstName = "John", LastName = "Doe" }
                },
                Skill = new MasterSkill { SkillId = 5, SkillName = "Python" }
            };

            _mockSkillRepo.Setup(r => r.GetEmployeeSkillMappingById(10))
                .ReturnsAsync(mapping);
            _mockSmeRepo.Setup(r => r.GetActiveSme(200, 5))
                .ReturnsAsync((Lndsme?)null);
            _mockSkillRepo.Setup(r => r.UpdateEmployeeSkill(It.IsAny<Lndemployeeskillmapper>()))
                .Returns(Task.CompletedTask);
            _mockBaseRepo.Setup(r => r.SaveChanges())
                .ReturnsAsync(1);

            // Act
            var result = await _skillService.UpdateEmployeeSkillRating(managerId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(mapping.Rating, Is.EqualTo(5));
            _mockSkillRepo.Verify(r => r.UpdateEmployeeSkill(mapping), Times.Once);
        }

        #endregion

        #region LnDHRService Tests (4 tests)

        [Test]
        public async Task GetAllOrganizationEmployees_WithValidRequest_ReturnsEmployees()
        {
            // Arrange
            var request = new OrganizationEmployeesRequestModel
            {
                PageNumber = 1,
                PageSize = 10,
                SearchTerm = null
            };

            var employees = new List<SubordinateEmployeeResponseModel>
            {
                new SubordinateEmployeeResponseModel { EmployeeId = 1, EmployeeName = "John Doe" },
                new SubordinateEmployeeResponseModel { EmployeeId = 2, EmployeeName = "Jane Smith" }
            };

            _mockHRRepo.Setup(r => r.GetAllOrganizationEmployees(request))
                .ReturnsAsync((employees, 2));

            // Act
            var result = await _hrService.GetAllOrganizationEmployees(request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data.Items.Count, Is.EqualTo(2));
            Assert.That(result.Data.TotalCount, Is.EqualTo(2));
        }

        [Test]
        public async Task GetEmployeeSkillsById_WithValidEmployee_ReturnsSkills()
        {
            // Arrange
            int employeeId = 200;
            var request = new EmployeeSkillsByIdRequestModel
            {
                PageNumber = 1,
                SearchTerm = null,
                SortBy = null
            };

            var skills = new List<Lndemployeeskillmapper>
            {
                new Lndemployeeskillmapper
                {
                    MapperId = 1,
                    EmployeeId = 200,
                    SkillId = 1,
                    Rating = 4,
                    Skill = new MasterSkill { SkillId = 1, SkillName = "C#" }
                }
            };

            _mockHRRepo.Setup(r => r.GetEmployeeSkillsById(employeeId, request))
                .ReturnsAsync((skills, 1));

            // Act
            var result = await _hrService.GetEmployeeSkillsById(employeeId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data.Items.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task GetAllOrganizationAssignments_WithValidRequest_ReturnsAssignments()
        {
            // Arrange
            var request = new OrganizationAssignmentsRequestModel
            {
                PageNumber = 1,
                PageSize = 10,
                StatusFilter = null,
                SearchTerm = null
            };

            var assignments = new List<Lndassignment>
            {
                new Lndassignment
                {
                    AssignmentId = 1,
                    Status = LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS,
                    SkillId = 1,
                    Skill = new MasterSkill { SkillId = 1, SkillName = "C#" },
                    Sme = new Lndsme
                    {
                        SmeId = 1,
                        Employee = new Employee
                        {
                            EmployeeId = 300,
                            Userprofile = new Userprofile { FirstName = "SME", LastName = "Person" }
                        }
                    },
                    MenteeEmployee = new Employee
                    {
                        EmployeeId = 200,
                        Userprofile = new Userprofile { FirstName = "Mentee", LastName = "Person" }
                    }
                }
            };

            _mockHRRepo.Setup(r => r.GetAllOrganizationAssignments(request))
                .ReturnsAsync((assignments, 1));

            // Act
            var result = await _hrService.GetAllOrganizationAssignments(request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data.Items.Count, Is.EqualTo(1));
            Assert.That(result.Data.TotalCount, Is.EqualTo(1));
        }

        [Test]
        public async Task GetOrganizationAssignmentsForExport_WithValidRequest_ReturnsExcelBytes()
        {
            // Arrange
            var request = new ExportOrganizationAssignmentsRequestModel
            {
                StatusFilter = null,
                SearchTerm = null
            };

            var assignments = new List<Lndassignment>
            {
                new Lndassignment
                {
                    AssignmentId = 1,
                    Status = LnDConstants.ASSIGNMENT_STATUS.COMPLETED,
                    CreatedOn = DateOnly.FromDateTime(DateTime.Now),
                    CompletionRating = 5,
                    SkillId = 1,
                    Skill = new MasterSkill { SkillId = 1, SkillName = "C#" },
                    Sme = new Lndsme
                    {
                        Employee = new Employee
                        {
                            Userprofile = new Userprofile { FirstName = "SME", LastName = "User" }
                        }
                    },
                    MenteeEmployee = new Employee
                    {
                        EmployeeId = 200,
                        Userprofile = new Userprofile { FirstName = "Mentee", LastName = "User" },
                        Employeedetailsmasters = new List<Employeedetailsmaster>
                        {
                            new Employeedetailsmaster
                            {
                                Department = new Department { DepartmentName = "IT" }
                            }
                        }
                    }
                }
            };

            _mockHRRepo.Setup(r => r.GetAllOrganizationAssignmentsForExport(request))
                .ReturnsAsync(assignments);

            // Act
            var result = await _hrService.GetOrganizationAssignmentsForExport(request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.Not.Null);
            Assert.That(result.Data.Length, Is.GreaterThan(0));
        }

        #endregion

        #region LnDSmeService Tests (4 tests)

        [Test]
        public async Task GetAvailableSmes_WithValidRequest_ReturnsSmes()
        {
            // Arrange
            var request = new AvailableSmesRequestModel
            {
                SkillId = 5,
                PageNumber = 1,
                PageSize = 10,
                SearchTerm = null
            };

            var smes = new List<Lndsme>
            {
                new Lndsme
                {
                    SmeId = 1,
                    EmployeeId = 300,
                    SkillId = 5,
                    Employee = new Employee
                    {
                        EmployeeId = 300,
                        Userprofile = new Userprofile { FirstName = "SME", LastName = "User" }
                    },
                    Skill = new MasterSkill { SkillId = 5, SkillName = "C#" }
                }
            };

            var smeModels = new List<SmeResponseModel>
            {
                new SmeResponseModel { SmeId = 1, EmployeeId = 300, EmployeeName = "SME User" }
            };

            _mockSmeRepo.Setup(r => r.GetAvailableSmesWithAssignmentCounts(request, It.IsAny<int>()))
                .ReturnsAsync((smes, 1));
            _mockMapper.Setup(m => m.Map<List<SmeResponseModel>>(smes))
                .Returns(smeModels);
            _mockSmeRepo.Setup(r => r.GetSmeInProgressAssignmentCount(1))
                .ReturnsAsync(2);

            // Act
            var result = await _smeService.GetAvailableSmes(request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data.Items.Count, Is.EqualTo(1));
            Assert.That(result.Data.TotalCount, Is.EqualTo(1));
        }

        [Test]
        public async Task ApplyToBecomeSme_WithValidRequest_CreatesApproval()
        {
            // Arrange
            int employeeId = 200;
            var file = CreateMockFile("certificate.pdf", 2048);
            var request = new BecomeSmeRequestModel
            {
                SkillId = 5,
                ProofDocument = file
            };

            var skillMapping = new Lndemployeeskillmapper
            {
                EmployeeId = 200,
                SkillId = 5,
                Rating = 8,
                Employee = new Employee
                {
                    EmployeeId = 200,
                    ReportingManagerEmployeeId = 100,
                    Userprofile = new Userprofile { FirstName = "John", LastName = "Doe" }
                }
            };

            _mockSkillRepo.Setup(r => r.GetEmployeeSkillMapping(employeeId, 5))
                .ReturnsAsync(skillMapping);
            _mockSmeRepo.Setup(r => r.GetActiveSme(employeeId, 5))
                .ReturnsAsync((Lndsme?)null);
            _mockApprovalRepo.Setup(r => r.GetPendingSmeRegistration(employeeId, 5))
                .ReturnsAsync((Lndapproval?)null);
            _mockFileStorage.Setup(f => f.SaveFileAsync(file, LnDConstants.FILE_STORAGE.SME_PROOFS))
                .ReturnsAsync("/uploads/certificate.pdf");
            _mockApprovalRepo.Setup(r => r.AddAttachment(It.IsAny<Lndattachment>()))
                .Callback<Lndattachment>(a => a.AttachmentId = 10)
                .ReturnsAsync(It.IsAny<Lndattachment>());
            _mockApprovalRepo.Setup(r => r.AddApproval(It.IsAny<Lndapproval>()))
                .Callback<Lndapproval>(a => a.ApprovalId = 20)
                .ReturnsAsync(It.IsAny<Lndapproval>());
            _mockBaseRepo.Setup(r => r.SaveChanges())
                .ReturnsAsync(1);

            // Act
            var result = await _smeService.ApplyToBecomeSme(employeeId, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data, Is.EqualTo(20));
            _mockApprovalRepo.Verify(r => r.AddApproval(It.IsAny<Lndapproval>()), Times.Once);
        }

        [Test]
        public async Task ApplyToBecomeSme_WithExistingSme_ReturnsFailure()
        {
            // Arrange
            int employeeId = 200;
            var file = CreateMockFile("certificate.pdf", 2048);
            var request = new BecomeSmeRequestModel
            {
                SkillId = 5,
                ProofDocument = file
            };

            var skillMapping = new Lndemployeeskillmapper
            {
                EmployeeId = 200,
                SkillId = 5,
                Rating = 8
            };

            var existingSme = new Lndsme
            {
                SmeId = 1,
                EmployeeId = employeeId,
                SkillId = 5,
                IsActive = true
            };

            _mockSkillRepo.Setup(r => r.GetEmployeeSkillMapping(employeeId, 5))
                .ReturnsAsync(skillMapping);
            _mockSmeRepo.Setup(r => r.GetActiveSme(employeeId, 5))
                .ReturnsAsync(existingSme);

            // Act
            var result = await _smeService.ApplyToBecomeSme(employeeId, request);

            // Assert
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo(LnDConstants.RESPONSE_MESSAGES.ALREADY_ACTIVE_SME));
            _mockApprovalRepo.Verify(r => r.AddApproval(It.IsAny<Lndapproval>()), Times.Never);
        }

        [Test]
        public async Task GetAllActiveSmes_WithValidRequest_ReturnsActiveSmes()
        {
            // Arrange
            var request = new ActiveSmesRequestModel
            {
                PageNumber = 1,
                PageSize = 10,
                SearchTerm = null
            };

            var smes = new List<SmeResponseModel>
            {
                new SmeResponseModel { SmeId = 1, EmployeeId = 300, IsActive = true }
            };

            _mockSmeRepo.Setup(r => r.GetAllActiveSmes(request))
                .ReturnsAsync((smes, 1));

            // Act
            var result = await _smeService.GetAllActiveSmes(request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.Data.Items.Count, Is.EqualTo(1));
            Assert.That(result.Data.TotalCount, Is.EqualTo(1));
        }

        #endregion

        #region Helper Methods

        private IFormFile CreateMockFile(string fileName, long fileSize)
        {
            var fileMock = new Mock<IFormFile>();
            var content = new byte[fileSize];
            var ms = new MemoryStream(content);

            fileMock.Setup(f => f.FileName).Returns(fileName);
            fileMock.Setup(f => f.Length).Returns(fileSize);
            fileMock.Setup(f => f.OpenReadStream()).Returns(ms);
            fileMock.Setup(f => f.ContentType).Returns("application/pdf");
            fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
                .Returns((Stream stream, CancellationToken token) => ms.CopyToAsync(stream, token));

            return fileMock.Object;
        }

        #endregion
    }
}

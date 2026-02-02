using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Relevantz.EEPZ.Api.Controllers.LnD;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Constants;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace Relevantz.EEPZ.Tests.Controllers.LnD
{
    [TestFixture]
    public class LnDControllersTests
    {
        private Mock<ILnDApprovalService> _mockApprovalService;
        private Mock<ILnDAssignmentService> _mockAssignmentService;
        private Mock<ILnDEmployeeSkillService> _mockEmployeeSkillService;
        private Mock<ILnDHRService> _mockHRService;
        private Mock<ILnDSmeService> _mockSmeService;

        private LnDApprovalsController _approvalsController;
        private LnDAssignmentsController _assignmentsController;
        private LnDEmployeeSkillsController _employeeSkillsController;
        private LnDHRController _hrController;
        private LnDSmeController _smeController;

        private const int TestEmployeeId = 123;

        [SetUp]
        public void Setup()
        {
            _mockApprovalService = new Mock<ILnDApprovalService>();
            _mockAssignmentService = new Mock<ILnDAssignmentService>();
            _mockEmployeeSkillService = new Mock<ILnDEmployeeSkillService>();
            _mockHRService = new Mock<ILnDHRService>();
            _mockSmeService = new Mock<ILnDSmeService>();

            _approvalsController = new LnDApprovalsController(_mockApprovalService.Object);
            _assignmentsController = new LnDAssignmentsController(_mockAssignmentService.Object);
            _employeeSkillsController = new LnDEmployeeSkillsController(_mockEmployeeSkillService.Object);
            _hrController = new LnDHRController(_mockHRService.Object, _mockSmeService.Object);
            _smeController = new LnDSmeController(_mockSmeService.Object);

            SetupControllerContext(_approvalsController);
            SetupControllerContext(_assignmentsController);
            SetupControllerContext(_employeeSkillsController);
            SetupControllerContext(_hrController);
            SetupControllerContext(_smeController);
        }

        private void SetupControllerContext(ControllerBase controller)
        {
            var claims = new List<Claim>
            {
                new Claim(LnDConstants.CLAIM_TYPES.EMPLOYEE_ID, TestEmployeeId.ToString()),
                new Claim(ClaimTypes.Name, "Test User")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        #region LnDApprovalsController Tests (6 tests)

        [Test]
        public async Task GetMyApprovals_WithValidRequest_ReturnsOkResult()
        {
            var request = new MyApprovalsRequestModel { PageNumber = 1, PageSize = 10 };
            var expectedResult = new ApiResponse<PaginatedResponse<ApprovalResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<ApprovalResponseModel>
                {
                    TotalCount = 5,
                    Items = new List<ApprovalResponseModel>(),
                    PageNumber = 1,
                    PageSize = 10
                }
            };
            _mockApprovalService.Setup(s => s.GetMyApprovals(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _approvalsController.GetMyApprovals(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo(expectedResult));
        }

        [Test]
        public async Task GetMyApprovals_WithFailure_ReturnsBadRequest()
        {
            var request = new MyApprovalsRequestModel { PageNumber = 1, PageSize = 10 };
            var expectedResult = new ApiResponse<PaginatedResponse<ApprovalResponseModel>>
            {
                Success = false,
                Message = "Error retrieving approvals"
            };
            _mockApprovalService.Setup(s => s.GetMyApprovals(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _approvalsController.GetMyApprovals(request);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ProcessApproval_WithValidDecision_ReturnsOkResult()
        {
            var request = new ApprovalDecisionRequestModel
            {
                ApprovalId = 1,
                IsApproved = true,
                Notes = "Approved successfully"
            };
            var expectedResult = new ApiResponse<bool>
            {
                Success = true,
                Data = true
            };
            _mockApprovalService.Setup(s => s.ProcessApproval(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _approvalsController.ProcessApproval(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetApprovalHistory_WithValidRequest_ReturnsOkResult()
        {
            var request = new ApprovalHistoryRequestModel { PageNumber = 1, PageSize = 10 };
            var expectedResult = new ApiResponse<PaginatedResponse<ApprovalResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<ApprovalResponseModel>
                {
                    TotalCount = 10,
                    Items = new List<ApprovalResponseModel>(),
                    PageNumber = 1,
                    PageSize = 10
                }
            };
            _mockApprovalService.Setup(s => s.GetApprovalHistory(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _approvalsController.GetApprovalHistory(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetApprovalDetails_WithValidId_ReturnsOkResult()
        {
            int approvalId = 1;
            var expectedResult = new ApiResponse<ApprovalDetailsResponseModel>
            {
                Success = true,
                Data = new ApprovalDetailsResponseModel { ApprovalId = 1, Status = "Pending" }
            };
            _mockApprovalService.Setup(s => s.GetApprovalDetails(TestEmployeeId, approvalId))
                .Returns(Task.FromResult(expectedResult));

            var result = await _approvalsController.GetApprovalDetails(approvalId);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetApprovalAttachmentDownload_WithValidId_ReturnsFileResult()
        {
            int approvalId = 1;
            var expectedResult = new ApiResponse<FileDownloadResponseModel>
            {
                Success = true,
                Data = new FileDownloadResponseModel
                {
                    FileBytes = new byte[] { 1, 2, 3 },
                    FileName = "test.pdf",
                    ContentType = "application/pdf",
                    FileSize = 3
                }
            };
            _mockApprovalService.Setup(s => s.GetApprovalAttachment(TestEmployeeId, approvalId))
                .Returns(Task.FromResult(expectedResult));

            var result = await _approvalsController.GetApprovalAttachmentDownload(approvalId);

            Assert.That(result, Is.InstanceOf<FileContentResult>());
            var fileResult = result as FileContentResult;
            Assert.That(fileResult!.FileDownloadName, Is.EqualTo("test.pdf"));
            Assert.That(fileResult.ContentType, Is.EqualTo("application/pdf"));
        }

        #endregion

        #region LnDAssignmentsController Tests (6 tests)

        [Test]
        public async Task CheckOverdueAssignments_WhenCalled_ReturnsOkResult()
        {
            var expectedResult = new ApiResponse<int>
            {
                Success = true,
                Data = 5
            };
            _mockAssignmentService.Setup(s => s.CheckAndMarkOverdueAssignments())
                .Returns(Task.FromResult(expectedResult));

            var result = await _assignmentsController.CheckOverdueAssignments();

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task RequestSmeAssignment_WithValidRequest_ReturnsOkResult()
        {
            var request = new SmeRequestModel
            {
                MenteeEmployeeId = 456,
                SkillId = 10,
                MentorEmployeeId = 789
            };
            var expectedResult = new ApiResponse<int>
            {
                Success = true,
                Data = 100
            };
            _mockAssignmentService.Setup(s => s.RequestSmeAssignment(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _assignmentsController.RequestSmeAssignment(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task RequestSmeAssignment_WithFailure_ReturnsBadRequest()
        {
            var request = new SmeRequestModel
            {
                MenteeEmployeeId = 456,
                SkillId = 10,
                MentorEmployeeId = 789
            };
            var expectedResult = new ApiResponse<int>
            {
                Success = false,
                Message = "Invalid request"
            };
            _mockAssignmentService.Setup(s => s.RequestSmeAssignment(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _assignmentsController.RequestSmeAssignment(request);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task UploadCompletionProof_WithValidFile_ReturnsOkResult()
        {
            var request = new UploadCompletionProofRequestModel { AssignmentId = 1 };
            var expectedResult = new ApiResponse<bool>
            {
                Success = true,
                Data = true
            };
            _mockAssignmentService.Setup(s => s.UploadCompletionProof(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _assignmentsController.UploadCompletionProof(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task CompleteAssignment_WithValidRating_ReturnsOkResult()
        {
            var request = new CompleteAssignmentRequestModel
            {
                AssignmentId = 1,
                NewRating = 5,
                Notes = "Excellent work"
            };
            var expectedResult = new ApiResponse<bool>
            {
                Success = true,
                Data = true
            };
            _mockAssignmentService.Setup(s => s.CompleteAssignment(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _assignmentsController.CompleteAssignment(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetMyAssignments_WithPagination_ReturnsOkResult()
        {
            var request = new AssignmentRequestModel { PageNumber = 1, PageSize = 10 };
            var expectedResult = new ApiResponse<PaginatedResponse<AssignmentResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<AssignmentResponseModel>
                {
                    TotalCount = 8,
                    Items = new List<AssignmentResponseModel>(),
                    PageNumber = 1,
                    PageSize = 10
                }
            };
            _mockAssignmentService.Setup(s => s.GetMyAssignments(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _assignmentsController.GetMyAssignments(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        #endregion

        #region LnDEmployeeSkillsController Tests (7 tests)

        [Test]
        public async Task GetAllSkills_WhenCalled_ReturnsOkResult()
        {
            var expectedResult = new ApiResponse<List<SkillResponseModel>>
            {
                Success = true,
                Data = new List<SkillResponseModel>
                {
                    new SkillResponseModel { SkillId = 1, SkillName = "C#" },
                    new SkillResponseModel { SkillId = 2, SkillName = "SQL" }
                }
            };
            _mockEmployeeSkillService.Setup(s => s.GetAllSkills())
                .Returns(Task.FromResult(expectedResult));

            var result = await _employeeSkillsController.GetAllSkills();

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetAllSkills_WithError_ReturnsBadRequest()
        {
            var expectedResult = new ApiResponse<List<SkillResponseModel>>
            {
                Success = false,
                Message = "Database error"
            };
            _mockEmployeeSkillService.Setup(s => s.GetAllSkills())
                .Returns(Task.FromResult(expectedResult));

            var result = await _employeeSkillsController.GetAllSkills();

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetMySkills_WithSearchTerm_ReturnsOkResult()
        {
            var request = new MySkillsRequestModel
            {
                PageNumber = 1,
                PageSize = 10,
                SearchTerm = "Java"
            };
            var expectedResult = new ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<EmployeeSkillResponseModel>
                {
                    TotalCount = 5,
                    Items = new List<EmployeeSkillResponseModel>(),
                    PageNumber = 1,
                    PageSize = 10
                }
            };
            _mockEmployeeSkillService.Setup(s => s.GetMySkills(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _employeeSkillsController.GetMySkills(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetSubordinateSkills_WithFilters_ReturnsOkResult()
        {
            var request = new SubordinateSkillsRequestModel
            {
                PageNumber = 1,
                EmployeeId = 456
            };
            var expectedResult = new ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<EmployeeSkillResponseModel>
                {
                    TotalCount = 20,
                    Items = new List<EmployeeSkillResponseModel>(),
                    PageNumber = 1,
                    PageSize = 10
                }
            };
            _mockEmployeeSkillService.Setup(s => s.GetSubordinateSkills(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _employeeSkillsController.GetSubordinateSkills(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task RecordEmployeeSkill_WithValidData_ReturnsOkResult()
        {
            var request = new RecordSkillRequestModel
            {
                EmployeeId = 456,
                SkillId = 10,
                Rating = 4
            };
            var expectedResult = new ApiResponse<EmployeeSkillResponseModel>
            {
                Success = true,
                Data = new EmployeeSkillResponseModel
                {
                    MapperId = 1,
                    EmployeeId = 456,
                    SkillId = 10,
                    Rating = 4
                }
            };
            _mockEmployeeSkillService.Setup(s => s.RecordEmployeeSkill(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _employeeSkillsController.RecordEmployeeSkill(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task BulkRecordEmployeeSkills_WithMultipleSkills_ReturnsOkResult()
        {
            var request = new BulkRecordSkillRequestModel
            {
                EmployeeId = 456,
                Skills = new List<SkillRating>
                {
                    new SkillRating { SkillId = 1, Rating = 4 },
                    new SkillRating { SkillId = 2, Rating = 5 }
                }
            };
            var expectedResult = new ApiResponse<List<EmployeeSkillResponseModel>>
            {
                Success = true,
                Data = new List<EmployeeSkillResponseModel>()
            };
            _mockEmployeeSkillService.Setup(s => s.BulkRecordEmployeeSkills(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _employeeSkillsController.BulkRecordEmployeeSkills(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdateEmployeeSkillRating_WithNewRating_ReturnsOkResult()
        {
            var request = new UpdateSkillRatingRequestModel
            {
                MapperId = 100,
                Rating = 5
            };
            var expectedResult = new ApiResponse<EmployeeSkillResponseModel>
            {
                Success = true,
                Data = new EmployeeSkillResponseModel
                {
                    MapperId = 100,
                    Rating = 5
                }
            };
            _mockEmployeeSkillService.Setup(s => s.UpdateEmployeeSkillRating(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _employeeSkillsController.UpdateEmployeeSkillRating(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        #endregion

        #region LnDHRController Tests (5 tests)

        [Test]
        public async Task GetAllOrganizationAssignments_WithPagination_ReturnsOkResult()
        {
            var request = new OrganizationAssignmentsRequestModel { PageNumber = 1, PageSize = 10 };
            var expectedResult = new ApiResponse<PaginatedResponse<AssignmentResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<AssignmentResponseModel>
                {
                    TotalCount = 50,
                    Items = new List<AssignmentResponseModel>(),
                    PageNumber = 1,
                    PageSize = 10
                }
            };
            _mockHRService.Setup(s => s.GetAllOrganizationAssignments(request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _hrController.GetAllOrganizationAssignments(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetOrganizationAssignmentsForExport_WhenCalled_ReturnsFileResult()
        {
            var request = new ExportOrganizationAssignmentsRequestModel();
            var expectedResult = new ApiResponse<byte[]>
            {
                Success = true,
                Data = new byte[] { 1, 2, 3, 4, 5 }
            };
            _mockHRService.Setup(s => s.GetOrganizationAssignmentsForExport(request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _hrController.GetOrganizationAssignmentsForExport(request);

            Assert.That(result, Is.InstanceOf<FileContentResult>());
            var fileResult = result as FileContentResult;
            Assert.That(fileResult!.ContentType, Is.EqualTo("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        }

        [Test]
        public async Task GetAllOrganizationEmployees_WithSearch_ReturnsOkResult()
        {
            var request = new OrganizationEmployeesRequestModel
            {
                PageNumber = 1,
                PageSize = 10,
                SearchTerm = "John"
            };
            var expectedResult = new ApiResponse<PaginatedResponse<SubordinateEmployeeResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<SubordinateEmployeeResponseModel>
                {
                    TotalCount = 100,
                    Items = new List<SubordinateEmployeeResponseModel>(),
                    PageNumber = 1,
                    PageSize = 10
                }
            };
            _mockHRService.Setup(s => s.GetAllOrganizationEmployees(request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _hrController.GetAllOrganizationEmployees(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetEmployeeSkillsById_WithValidId_ReturnsOkResult()
        {
            int employeeId = 456;
            var request = new EmployeeSkillsByIdRequestModel { PageNumber = 1 };
            var expectedResult = new ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<EmployeeSkillResponseModel>
                {
                    TotalCount = 15,
                    Items = new List<EmployeeSkillResponseModel>(),
                    PageNumber = 1,
                    PageSize = 10
                }
            };
            _mockHRService.Setup(s => s.GetEmployeeSkillsById(employeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _hrController.GetEmployeeSkillsById(employeeId, request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetAllActiveSmes_WithPagination_ReturnsOkResult()
        {
            var request = new ActiveSmesRequestModel { PageNumber = 1, PageSize = 10 };
            var expectedResult = new ApiResponse<PaginatedResponse<SmeResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<SmeResponseModel>
                {
                    TotalCount = 25,
                    Items = new List<SmeResponseModel>(),
                    PageNumber = 1,
                    PageSize = 10
                }
            };
            _mockSmeService.Setup(s => s.GetAllActiveSmes(request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _hrController.GetAllActiveSmes(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        #endregion

        #region LnDSmeController Tests (6 tests)

        [Test]
        public async Task GetAvailableSmes_WithSkillId_ReturnsOkResult()
        {
            var request = new AvailableSmesRequestModel { SkillId = 5, PageNumber = 1, PageSize = 10 };
            var expectedResult = new ApiResponse<PaginatedResponse<SmeResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<SmeResponseModel>
                {
                    TotalCount = 7,
                    Items = new List<SmeResponseModel>(),
                    PageNumber = 1,
                    PageSize = 10
                }
            };
            _mockSmeService.Setup(s => s.GetAvailableSmes(request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _smeController.GetAvailableSmes(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetAvailableSmes_WithSearchTerm_ReturnsOkResult()
        {
            var request = new AvailableSmesRequestModel
            {
                SkillId = 5,
                SearchTerm = "John",
                PageNumber = 1,
                PageSize = 10
            };
            var expectedResult = new ApiResponse<PaginatedResponse<SmeResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<SmeResponseModel>
                {
                    TotalCount = 2,
                    Items = new List<SmeResponseModel>(),
                    PageNumber = 1,
                    PageSize = 10
                }
            };
            _mockSmeService.Setup(s => s.GetAvailableSmes(request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _smeController.GetAvailableSmes(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetAvailableSmes_WithFailure_ReturnsBadRequest()
        {
            var request = new AvailableSmesRequestModel { SkillId = 5, PageNumber = 1, PageSize = 10 };
            var expectedResult = new ApiResponse<PaginatedResponse<SmeResponseModel>>
            {
                Success = false,
                Message = "Error retrieving SMEs"
            };
            _mockSmeService.Setup(s => s.GetAvailableSmes(request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _smeController.GetAvailableSmes(request);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ApplyToBecomeSme_WithValidProof_ReturnsOkResult()
        {
            var request = new BecomeSmeRequestModel { SkillId = 10 };
            var expectedResult = new ApiResponse<int>
            {
                Success = true,
                Data = 123
            };
            _mockSmeService.Setup(s => s.ApplyToBecomeSme(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _smeController.ApplyToBecomeSme(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task ApplyToBecomeSme_WithFailure_ReturnsBadRequest()
        {
            var request = new BecomeSmeRequestModel { SkillId = 10 };
            var expectedResult = new ApiResponse<int>
            {
                Success = false,
                Message = "Invalid proof document"
            };
            _mockSmeService.Setup(s => s.ApplyToBecomeSme(TestEmployeeId, request))
                .Returns(Task.FromResult(expectedResult));

            var result = await _smeController.ApplyToBecomeSme(request);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task DeleteEmployeeSkill_WithValidMapperId_ReturnsOkResult()
        {
            int mapperId = 100;
            var expectedResult = new ApiResponse<bool>
            {
                Success = true,
                Data = true
            };
            _mockEmployeeSkillService.Setup(s => s.DeleteEmployeeSkill(TestEmployeeId, mapperId))
                .Returns(Task.FromResult(expectedResult));

            var result = await _employeeSkillsController.DeleteEmployeeSkill(mapperId);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }  

        #endregion
    }
}

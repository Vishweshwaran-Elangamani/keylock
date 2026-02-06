using NUnit.Framework;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Relevantz.EEPZ.Api.Controllers.Goals;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Exceptions;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Api.Tests.Controllers.Goals
{
    [TestFixture]
    public class GoalsControllersTests
    {
        private Mock<IBaseGoalService> _mockBaseService;
        private Mock<IGoalApprovalsService> _mockApprovalService;
        private Mock<IGoalAttachmentService> _mockAttachmentService;
        private Mock<IGoalInteractionService> _mockInteractionService;
        private Mock<IGoalProgressService> _mockProgressService;
        private Mock<IGoalService> _mockGoalService;
        
        // Separate logger mocks for each controller
        private Mock<ILogger<BaseGoalController>> _mockBaseLogger;
        private Mock<ILogger<GoalApprovalsController>> _mockApprovalLogger;
        private Mock<ILogger<GoalAttachmentsController>> _mockAttachmentLogger;
        private Mock<ILogger<GoalInteractionsController>> _mockInteractionLogger;
        private Mock<ILogger<GoalProgressController>> _mockProgressLogger;
        private Mock<ILogger<GoalsController>> _mockGoalLogger;
        
        private ControllerContext _controllerContext;
        private ClaimsPrincipal _userPrincipal;

        [SetUp]
        public void Setup()
        {
            _mockBaseService = new Mock<IBaseGoalService>();
            _mockApprovalService = new Mock<IGoalApprovalsService>();
            _mockAttachmentService = new Mock<IGoalAttachmentService>();
            _mockInteractionService = new Mock<IGoalInteractionService>();
            _mockProgressService = new Mock<IGoalProgressService>();
            _mockGoalService = new Mock<IGoalService>();
            
            // Initialize all logger mocks
            _mockBaseLogger = new Mock<ILogger<BaseGoalController>>();
            _mockApprovalLogger = new Mock<ILogger<GoalApprovalsController>>();
            _mockAttachmentLogger = new Mock<ILogger<GoalAttachmentsController>>();
            _mockInteractionLogger = new Mock<ILogger<GoalInteractionsController>>();
            _mockProgressLogger = new Mock<ILogger<GoalProgressController>>();
            _mockGoalLogger = new Mock<ILogger<GoalsController>>();

            _controllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            // Default authenticated user: Employee ID 123, Role "EMPLOYEE"
            SetupUserPrincipal(123, "EMPLOYEE");
        }

        private void SetupUserPrincipal(int empId, string role)
        {
            var claims = new List<Claim>
            {
                new Claim(CLAIM_TYPES.EMPLOYEE_MASTER_ID, empId.ToString()),
                new Claim("role", role),
                new Claim(ClaimTypes.NameIdentifier, empId.ToString())
            };

            _userPrincipal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
            _controllerContext.HttpContext.User = _userPrincipal;
        }

        #region BaseGoalController Tests (5 tests)

        [Test]
        public void GetUserRole_WithValidRole_ReturnsRole()
        {
            // Arrange
            var controller = new TestBaseGoalController(_mockBaseService.Object, _mockBaseLogger.Object);
            controller.ControllerContext = _controllerContext;

            // Act
            var result = controller.TestGetUserRole();

            // Assert
            Assert.That(result, Is.EqualTo("EMPLOYEE"));
        }

        [Test]
        public void GetUserRole_NoRoleClaim_ThrowsUnauthorizedException()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim(CLAIM_TYPES.EMPLOYEE_MASTER_ID, "123")
            };
            _userPrincipal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
            _controllerContext.HttpContext.User = _userPrincipal;

            var controller = new TestBaseGoalController(_mockBaseService.Object, _mockBaseLogger.Object);
            controller.ControllerContext = _controllerContext;

            // Act & Assert
            Assert.Throws<UnauthorizedException>(() => controller.TestGetUserRole());
        }

        [Test]
        public void GetEmpMasterId_WithValidClaim_ReturnsEmpId()
        {
            // Arrange
            var controller = new TestBaseGoalController(_mockBaseService.Object, _mockBaseLogger.Object);
            controller.ControllerContext = _controllerContext;

            // Act
            var result = controller.TestGetEmpMasterId();

            // Assert
            Assert.That(result, Is.EqualTo(123));
        }

        [Test]
        public void GetEmpMasterId_NoEmpClaim_ThrowsUnauthorizedException()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("role", "EMPLOYEE")
            };
            _userPrincipal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
            _controllerContext.HttpContext.User = _userPrincipal;

            var controller = new TestBaseGoalController(_mockBaseService.Object, _mockBaseLogger.Object);
            controller.ControllerContext = _controllerContext;

            // Act & Assert
            Assert.Throws<UnauthorizedException>(() => controller.TestGetEmpMasterId());
        }

        [Test]
        public void BaseController_Initialization_Succeeds()
        {
            // Act
            var controller = new TestBaseGoalController(_mockBaseService.Object, _mockBaseLogger.Object);

            // Assert
            Assert.That(controller, Is.Not.Null);
        }

        #endregion

        #region GoalApprovalsController Tests (4 tests)

        [Test]
        public async Task CreateApprovalRequest_ValidRequest_ReturnsOk()
        {
            // Arrange
            var mockResult = new ApiResponseModel<int> { Success = true, Data = 1 };
            _mockApprovalService.Setup(s => s.CreateApprovalRequest(
                It.IsAny<int>(), 
                It.IsAny<CreateApprovalRequestModel>(), 
                123, 
                "EMPLOYEE"))
                .ReturnsAsync(mockResult);

            var controller = new GoalApprovalsController(
                _mockApprovalService.Object, 
                _mockBaseService.Object, 
                _mockApprovalLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.CreateApprovalRequest(1, new CreateApprovalRequestModel()) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
            _mockApprovalService.Verify(s => s.CreateApprovalRequest(1, It.IsAny<CreateApprovalRequestModel>(), 123, "EMPLOYEE"), Times.Once);
        }

        [Test]
        public async Task ClosePendingApproval_ValidRequest_ReturnsOk()
        {
            // Arrange
            SetupUserPrincipal(123, "MANAGER");
            var mockResult = new ApiResponseModel { Success = true };
            _mockApprovalService.Setup(s => s.ClosePendingApproval(
                It.IsAny<int>(), 
                It.IsAny<ApprovalDesicionModel>(), 
                123, 
                "MANAGER"))
                .ReturnsAsync(mockResult);

            var controller = new GoalApprovalsController(
                _mockApprovalService.Object, 
                _mockBaseService.Object, 
                _mockApprovalLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.ClosePendingApproval(1, new ApprovalDesicionModel()) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task PendingApprovals_ValidUser_ReturnsOkWithList()
        {
            // Arrange
            SetupUserPrincipal(123, "MANAGER");
            var mockApprovals = new List<GoalApprovalModel>();
            _mockApprovalService.Setup(s => s.GetPendingApprovals(123))
                .ReturnsAsync(mockApprovals);

            var controller = new GoalApprovalsController(
                _mockApprovalService.Object, 
                _mockBaseService.Object, 
                _mockApprovalLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.PendingApprovals() as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
            var response = result.Value as ApiResponseModel<List<GoalApprovalModel>>;
            Assert.That(response, Is.Not.Null);
        }

        [Test]
        public async Task GetUserApprovals_ValidQuery_ReturnsOk()
        {
            // Arrange
            var mockPaged = new PagedApprovalsModel { TotalCount = 5 };
            _mockApprovalService.Setup(s => s.GetUserApprovals(
                It.IsAny<ApprovalQueryModel>(), 
                123, 
                "EMPLOYEE"))
                .ReturnsAsync(mockPaged);

            var controller = new GoalApprovalsController(
                _mockApprovalService.Object, 
                _mockBaseService.Object, 
                _mockApprovalLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetUserApprovals(new ApprovalQueryModel()) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        #endregion

        #region GoalAttachmentsController Tests (4 tests)

        [Test]
        public async Task UploadFile_ValidFile_ReturnsOk()
        {
            // Arrange
            var mockFile = new Mock<IFormFile>();
            var content = "Test file content";
            var fileName = "test.pdf";
            var ms = new MemoryStream();
            var writer = new StreamWriter(ms);
            writer.Write(content);
            writer.Flush();
            ms.Position = 0;

            mockFile.Setup(f => f.FileName).Returns(fileName);
            mockFile.Setup(f => f.Length).Returns(ms.Length);
            mockFile.Setup(f => f.OpenReadStream()).Returns(ms);

            var mockResult = new FileUploadResponseModel { FileName = fileName };
            _mockAttachmentService.Setup(s => s.UploadFile(
                It.IsAny<int>(), 
                It.IsAny<IFormFile>(), 
                It.IsAny<string>(), 
                123))
                .ReturnsAsync(mockResult);

            var controller = new GoalAttachmentsController(
                _mockAttachmentService.Object, 
                _mockBaseService.Object, 
                _mockAttachmentLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.UploadFile(1, mockFile.Object, "Test Title") as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task GetAttachmentFile_ValidId_ReturnsFile()
        {
            // Arrange
            var mockBytes = new byte[] { 1, 2, 3, 4, 5 };
            _mockAttachmentService.Setup(s => s.GetAttachmentFile(1, 123))
                .ReturnsAsync((mockBytes, "application/pdf", "test.pdf"));

            var controller = new GoalAttachmentsController(
                _mockAttachmentService.Object, 
                _mockBaseService.Object, 
                _mockAttachmentLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetAttachmentFile(1) as FileContentResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.ContentType, Is.EqualTo("application/pdf"));
            Assert.That(result.FileDownloadName, Is.EqualTo("test.pdf"));
        }

        [Test]
        public async Task GetAttachmentFilePreview_ValidId_ReturnsFile()
        {
            // Arrange
            var mockResult = new FilePreviewResult 
            { 
                FileBytes = new byte[10], 
                ContentType = "image/png", 
                FileName = "preview.png" 
            };
            _mockAttachmentService.Setup(s => s.GetAttachmentFilePreview(1, 123))
                .ReturnsAsync(mockResult);

            var controller = new GoalAttachmentsController(
                _mockAttachmentService.Object, 
                _mockBaseService.Object, 
                _mockAttachmentLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetAttachmentFilePreview(1) as FileContentResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.ContentType, Is.EqualTo("image/png"));
        }

        [Test]
        public async Task DeleteAttachment_ValidId_ReturnsOk()
        {
            // Arrange
            _mockAttachmentService.Setup(s => s.DeleteAttachment(1, 123))
                .ReturnsAsync(true);

            var controller = new GoalAttachmentsController(
                _mockAttachmentService.Object, 
                _mockBaseService.Object, 
                _mockAttachmentLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.DeleteAttachment(1) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        #endregion

        #region GoalInteractionsController Tests (6 tests)

        [Test]
        public async Task AddComment_ValidComment_ReturnsOk()
        {
            // Arrange
            var mockResult = new ApiResponseModel { Success = true };
            _mockInteractionService.Setup(s => s.AddComment(
                It.IsAny<int>(), 
                It.IsAny<CreateCommentModel>(), 
                123, 
                "EMPLOYEE"))
                .ReturnsAsync(mockResult);

            var controller = new GoalInteractionsController(
                _mockInteractionService.Object, 
                _mockBaseService.Object, 
                _mockInteractionLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.AddComment(1, new CreateCommentModel { Comment = "Test comment" }) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task GetAllComments_ValidId_ReturnsOk()
        {
            // Arrange
            var mockComments = new List<GoalCommentModel>();
            _mockInteractionService.Setup(s => s.GetAllComments(1))
                .ReturnsAsync(mockComments);

            var controller = new GoalInteractionsController(
                _mockInteractionService.Object, 
                _mockBaseService.Object, 
                _mockInteractionLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetAllComments(1) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task GetTimeline_ValidId_ReturnsOk()
        {
            // Arrange
            var mockTimeline = new List<TimelineEventModel>();
            _mockInteractionService.Setup(s => s.GetGoalTimeline(1, 123))
                .ReturnsAsync(mockTimeline);

            var controller = new GoalInteractionsController(
                _mockInteractionService.Object, 
                _mockBaseService.Object, 
                _mockInteractionLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetTimeline(1) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task GetDashboardStatistics_ValidUser_ReturnsOk()
        {
            // Arrange
            var mockSummary = new GoalDashboardSummaryModel();
            _mockInteractionService.Setup(s => s.GetDashboardDetails(123))
                .ReturnsAsync(mockSummary);

            var controller = new GoalInteractionsController(
                _mockInteractionService.Object, 
                _mockBaseService.Object, 
                _mockInteractionLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetDashboardStatistics() as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task GetMarkCompleteEligibility_Valid_ReturnsOk()
        {
            // Arrange
            var mockEligibility = new CanMarkCompleteModel { CanComplete = true };
            _mockBaseService.Setup(s => s.GetMarkCompleteEligibility(1, 123, "EMPLOYEE"))
                .ReturnsAsync(mockEligibility);

            var controller = new GoalInteractionsController(
                _mockInteractionService.Object, 
                _mockBaseService.Object, 
                _mockInteractionLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetMarkCompleteEligibility(1) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task FetchProjectTeam_ValidProject_ReturnsOk()
        {
            // Arrange
            var mockTeam = new List<ProjectEmployeeModel>();
            _mockInteractionService.Setup(s => s.FetchProjectTeam(1, 123))
                .ReturnsAsync(mockTeam);

            var controller = new GoalInteractionsController(
                _mockInteractionService.Object, 
                _mockBaseService.Object, 
                _mockInteractionLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.FetchProjectTeam(1) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        #endregion

        #region GoalProgressController Tests (5 tests)

        [Test]
        public async Task UpdateChecklistStatus_ValidUpdate_ReturnsOk()
        {
            // Arrange
            var mockResult = new ApiResponseModel { Success = true };
            _mockProgressService.Setup(s => s.UpdateChecklistStatus(
                It.IsAny<int>(), 
                It.IsAny<UpdateChecklistStatusModel>(), 
                123))
                .ReturnsAsync(mockResult);

            var controller = new GoalProgressController(
                _mockProgressService.Object, 
                _mockBaseService.Object, 
                _mockProgressLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.UpdateChecklistStatus(1, new UpdateChecklistStatusModel()) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task UpdateProgressPercentage_ValidUpdate_ReturnsOk()
        {
            // Arrange
            SetupUserPrincipal(123, "MANAGER");
            var mockResult = new ApiResponseModel { Success = true };
            _mockProgressService.Setup(s => s.UpdateProgressPercentage(
                It.IsAny<int>(), 
                It.IsAny<UpdateProgressPercentageModel>(), 
                123))
                .ReturnsAsync(mockResult);

            var controller = new GoalProgressController(
                _mockProgressService.Object, 
                _mockBaseService.Object, 
                _mockProgressLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.UpdateProgressPercentage(1, new UpdateProgressPercentageModel()) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task GetTeamProgressPercentage_ValidGoal_ReturnsOk()
        {
            // Arrange
            SetupUserPrincipal(123, "MANAGER");
            _mockProgressService.Setup(s => s.GetTeamGoalProgressForManager(1, 123))
                .ReturnsAsync(75);

            var controller = new GoalProgressController(
                _mockProgressService.Object, 
                _mockBaseService.Object, 
                _mockProgressLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetTeamProgressPercentage(1) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task GetDependentProgress_ValidGoal_ReturnsOk()
        {
            // Arrange
            _mockProgressService.Setup(s => s.GetDependentProgress(1, 123))
                .ReturnsAsync(50);

            var controller = new GoalProgressController(
                _mockProgressService.Object, 
                _mockBaseService.Object, 
                _mockProgressLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetDependentProgress(1) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task FetchGoalProgressTree_ValidGoal_ReturnsOk()
        {
            // Arrange
            var mockHierarchy = new GoalProgressHierarchyModel();
            _mockProgressService.Setup(s => s.FetchGoalProgressTree(1, 123))
                .ReturnsAsync(mockHierarchy);

            var controller = new GoalProgressController(
                _mockProgressService.Object, 
                _mockBaseService.Object, 
                _mockProgressLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.FetchGoalProgressTree(1) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        #endregion

        #region GoalsController Tests (8 tests)

        [Test]
        public async Task CreateGoal_ValidDto_ReturnsCreated()
        {
            // Arrange
            SetupUserPrincipal(123, "EMPLOYEE");
            var mockResult = new ApiResponseModel<int> { Success = true, Data = 999 };
            _mockGoalService.Setup(s => s.CreateGoal(
                It.IsAny<CreateGoalModel>(), 
                123, 
                "EMPLOYEE"))
                .ReturnsAsync(mockResult);

            var controller = new GoalsController(
                _mockGoalService.Object, 
                _mockBaseService.Object, 
                _mockGoalLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.Create(new CreateGoalModel()) as CreatedAtActionResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(201));
        }

        [Test]
        public async Task GetGoalDetailsById_ValidId_ReturnsOk()
        {
            // Arrange
            var mockGoal = new GoalDetailModel { GoalId = 1 };
            _mockBaseService.Setup(s => s.GetGoal(1, 123, "EMPLOYEE"))
                .ReturnsAsync(mockGoal);

            var controller = new GoalsController(
                _mockGoalService.Object, 
                _mockBaseService.Object, 
                _mockGoalLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetGoalDetailsById(1) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task QueryGoals_ValidQuery_ReturnsOk()
        {
            // Arrange
            var mockGoals = new List<GoalSummaryModel>();
            _mockGoalService.Setup(s => s.QueryGoals(
                It.IsAny<GoalQueryModel>(), 
                123, 
                "EMPLOYEE"))
                .ReturnsAsync(mockGoals);

            var controller = new GoalsController(
                _mockGoalService.Object, 
                _mockBaseService.Object, 
                _mockGoalLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.QueryGoals(new GoalQueryModel()) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task UpdateGoal_ValidUpdate_ReturnsOk()
        {
            // Arrange
            var mockResult = new ApiResponseModel { Success = true };
            _mockGoalService.Setup(s => s.UpdateGoal(
                It.IsAny<int>(), 
                It.IsAny<UpdateGoalModel>(), 
                123, 
                "EMPLOYEE"))
                .ReturnsAsync(mockResult);

            var controller = new GoalsController(
                _mockGoalService.Object, 
                _mockBaseService.Object, 
                _mockGoalLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.UpdateGoal(1, new UpdateGoalModel()) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task GetAssignees_ValidGoal_ReturnsOk()
        {
            // Arrange
            var mockAssignees = new List<AssigneeModel>();
            _mockGoalService.Setup(s => s.GetAssignees(1))
                .ReturnsAsync(mockAssignees);

            var controller = new GoalsController(
                _mockGoalService.Object, 
                _mockBaseService.Object, 
                _mockGoalLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetAssignees(1) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task AssignGoal_ValidAssign_ReturnsOk()
        {
            // Arrange
            SetupUserPrincipal(123, "MANAGER");
            var mockResult = new ApiResponseModel { Success = true };
            _mockGoalService.Setup(s => s.Assign(
                It.IsAny<int>(), 
                It.IsAny<AssignGoalModel>(), 
                123, 
                "MANAGER"))
                .ReturnsAsync(mockResult);

            var controller = new GoalsController(
                _mockGoalService.Object, 
                _mockBaseService.Object, 
                _mockGoalLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.Assign(1, new AssignGoalModel()) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task GetUserProjects_ValidUser_ReturnsOk()
        {
            // Arrange
            var mockProjects = new List<ProjectModel>();
            _mockGoalService.Setup(s => s.GetUserProjects(123))
                .ReturnsAsync(mockProjects);

            var controller = new GoalsController(
                _mockGoalService.Object, 
                _mockBaseService.Object, 
                _mockGoalLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetUserProjects() as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        [Test]
        public async Task GetAllProjects_AuthorizedUser_ReturnsOk()
        {
            // Arrange
            SetupUserPrincipal(123, "MANAGER");
            var mockProjects = new List<ProjectModel>();
            _mockGoalService.Setup(s => s.GetAllProjects())
                .ReturnsAsync(mockProjects);

            var controller = new GoalsController(
                _mockGoalService.Object, 
                _mockBaseService.Object, 
                _mockGoalLogger.Object)
            { ControllerContext = _controllerContext };

            // Act
            var result = await controller.GetAllProjects() as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.StatusCode, Is.EqualTo(200));
        }

        #endregion

        // Helper test controller to access protected methods
        private class TestBaseGoalController : BaseGoalController
        {
            public TestBaseGoalController(IBaseGoalService service, ILogger<BaseGoalController> logger) 
                : base(service, logger) { }

            public string TestGetUserRole() => GetUserRole();
            public int TestGetEmpMasterId() => GetEmpMasterId();
        }
    }
}

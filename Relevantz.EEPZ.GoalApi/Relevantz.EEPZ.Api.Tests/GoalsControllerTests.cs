using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using Relevantz.EEPZ.Api.Controllers;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;


namespace eepzbackend.Tests.Controllers
{
    [TestFixture]
    public class GoalsControllerTests
    {
        private GoalsController _controller;
        private Mock<IGoalModuleService> _mockService;
        private Mock<ILogger<GoalsController>> _mockLogger;
        private ControllerContext _controllerContext;


        [SetUp]
        public void Setup()
        {
            _mockService = new Mock<IGoalModuleService>();
            _mockLogger = new Mock<ILogger<GoalsController>>();
            _controller = new GoalsController(_mockService.Object, _mockLogger.Object);
        
            var user = new ClaimsPrincipal(
                new ClaimsIdentity(
                    new List<Claim>
                    {
                        new Claim("empMasterId", "1"),
                        new Claim("role", "Employee"),
                        new Claim(ClaimTypes.Role, "Employee"),
                    }
                )
            );


            _controllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user },
            };


            _controller.ControllerContext = _controllerContext;
        }


        [Test]
        [Category("GoalCreation")]
        public async Task Create_WithValidData_ReturnsCreatedResult()
        {
            //Arrange
            var createGoalDto = new CreateGoalDto
            {
                GoalType = "self",
                Title = "Test Goal",
                Description = "Test Description",
                Deadline = DateTime.Now.AddMonths(1),
                Checklist = new List<ChecklistItemDto>
                {
                    new ChecklistItemDto { Title = "Item 1", Description = "First item" },
                    new ChecklistItemDto { Title = "Item 2", Description = "Second item" },
                    new ChecklistItemDto { Title = "Item 3", Description = "Third item" },
                },
            };


            var responseDto = ApiResponseDto<int>.SuccessResponse("GOAL_CREATED_SUCCESS", 1);
            _mockService
                .Setup(s =>
                    s.CreateGoalAsync(
                        It.IsAny<CreateGoalDto>(),
                        It.IsAny<int>(),
                        It.IsAny<string>()
                    )
                )
                .Returns(Task.FromResult(responseDto));
                
            //Act
            var result = await _controller.Create(createGoalDto);
            
            //Assert
            Assert.IsInstanceOf<CreatedAtActionResult>(result);
            _mockService.Verify(
                s => s.CreateGoalAsync(It.IsAny<CreateGoalDto>(), 1, "Employee"),
                Times.Once
            );
        }


        [Test]
        [Category("GoalCreation")]
        public async Task Create_WithInsufficientChecklist_ReturnsBadRequest()
        {
            //Arrange
            var createGoalDto = new CreateGoalDto
            {
                GoalType = "self",
                Title = "Test Goal",
                Deadline = DateTime.Now.AddMonths(1),
                Checklist = new List<ChecklistItemDto>
                {
                    new ChecklistItemDto { Title = "Item 1" },
                },
            };
            
            var responseDto = ApiResponseDto<int>.ErrorResponse(
                "GOAL_CHECKLIST_INSUFFICIENT",
                "Goals must have at least 3 checklist items"
            );


            _mockService
                .Setup(s =>
                    s.CreateGoalAsync(
                        It.IsAny<CreateGoalDto>(),
                        It.IsAny<int>(),
                        It.IsAny<string>()
                    )
                )
                .Returns(Task.FromResult(responseDto));
                
            //Act
            var result = await _controller.Create(createGoalDto);
            
            //Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }


        [Test]
        [Category("GoalRetrieval")]
        public async Task GetById_WithValidId_ReturnsGoal()
        {
            //Arrange
            var goalId = 1;
            var goalDetail = new GoalDetailDto
            {
                GoalId = goalId,
                Title = "Test Goal",
                Status = "open",
                ProgressPercent = 50,
                CreatedByEmployeeMasterId = 1,
                GoalType = "self",
                CanEdit = true,
                CanComment = true,
                CanMarkComplete = false,
                IsOverdue = false,
            };


            _mockService
                .Setup(s => s.GetGoalAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>()))
                .Returns(Task.FromResult(goalDetail));
                
            //Act
            var result = await _controller.GetById(goalId);
            
            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            var okResult = result as OkObjectResult;
            var response = okResult.Value as ApiResponseDto<GoalDetailDto>;
            Assert.IsTrue(response.Success);
            Assert.AreEqual(goalDetail.Title, response.Data.Title);
        }


        [Test]
        [Category("GoalRetrieval")]
        public async Task GetById_WithNonExistentId_ReturnsNotFound()
        {
            //Arrange
            var goalId = 999;
            _mockService
                .Setup(s => s.GetGoalAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>()))
                .Throws(new KeyNotFoundException("Goal not found"));
                
            //Act
            var result = await _controller.GetById(goalId);
            
            //Assert
            Assert.IsInstanceOf<NotFoundObjectResult>(result);
        }


        [Test]
        [Category("GoalRetrieval")]
        public async Task GetById_WithoutPermission_ReturnsForbid()
        {
            //Arrange
            var goalId = 1;
            _mockService
                .Setup(s => s.GetGoalAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>()))
                .Throws(new UnauthorizedAccessException("Access denied"));

            //Act
            var result = await _controller.GetById(goalId);

            //Assert
            Assert.IsInstanceOf<ForbidResult>(result);
        }


        [Test]
        [Category("GoalQuery")]
        public async Task Query_WithValidFilter_ReturnsGoalList()
        {
            //Arrange
            var query = new GoalQueryDto
            {
                Type = "self",
                Status = "open",
                Page = 1,
                PageSize = 10,
            };


            var goals = new List<GoalSummaryDto>
            {
                new GoalSummaryDto
                {
                    GoalId = 1,
                    Title = "Goal 1",
                    Status = "open",
                    ProgressPercent = 50,
                    GoalType = "self",
                },
            };


            _mockService
                .Setup(s =>
                    s.QueryGoalsAsync(It.IsAny<GoalQueryDto>(), It.IsAny<int>(), It.IsAny<string>())
                )
                .Returns(Task.FromResult(goals));

            //Act
            var result = await _controller.Query(query);

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            var okResult = result as OkObjectResult;
            var response = okResult.Value as ApiResponseDto<List<GoalSummaryDto>>;
            Assert.IsTrue(response.Success);
            Assert.AreEqual(1, response.Data.Count);
        }


        [Test]
        [Category("GoalUpdate")]
        public async Task Update_WithValidData_ReturnsSuccess()
        {
            //Arrange
            var goalId = 1;
            var updateDto = new UpdateGoalDto
            {
                Title = "Updated Title",
                Description = "Updated Description",
                Deadline = DateTime.Now.AddMonths(2),
            };


            var responseDto = ApiResponseDto.SuccessResponse("GOAL_UPDATED_SUCCESS");
            _mockService
                .Setup(s =>
                    s.UpdateGoalAsync(
                        It.IsAny<int>(),
                        It.IsAny<UpdateGoalDto>(),
                        It.IsAny<int>(),
                        It.IsAny<string>()
                    )
                )
                .Returns(Task.FromResult(responseDto));

            //Act
            var result = await _controller.Update(goalId, updateDto);

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            _mockService.Verify(
                s => s.UpdateGoalAsync(goalId, updateDto, 1, "Employee"),
                Times.Once
            );
        }


        [Test]
        [Category("GoalAssignment")]
        public async Task Assign_WithValidAssignees_ReturnsSuccess()
        {
            //Arrange
            var goalId = 1;
            var assignDto = new AssignGoalDto
            {
                AssignedToEmployeeMasterIds = new List<int> { 2, 3 },
                AdditionalChecklist = new List<ChecklistItemDto>
                {
                    new ChecklistItemDto
                    {
                        Title = "Assigned Task 1",
                        AddedForEmployeeMasterId = 2,
                    },
                    new ChecklistItemDto
                    {
                        Title = "Assigned Task 2",
                        AddedForEmployeeMasterId = 3,
                    },
                },
            };


            var manager = new ClaimsPrincipal(
                new ClaimsIdentity(
                    new List<Claim> { new Claim("empMasterId", "1"), new Claim("role", "Manager") }
                )
            );


            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = manager },
            };


            var responseDto = ApiResponseDto.SuccessResponse("GOAL_ASSIGNED_SUCCESS");
            _mockService
                .Setup(s =>
                    s.AssignAsync(
                        It.IsAny<int>(),
                        It.IsAny<AssignGoalDto>(),
                        It.IsAny<int>(),
                        It.IsAny<string>()
                    )
                )
                .Returns(Task.FromResult(responseDto));

            //Act
            var result = await _controller.Assign(goalId, assignDto);

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }


        [Test]
        [Category("GoalApproval")]
        public async Task RequestApproval_WithFullProgress_ReturnsSuccess()
        {
            //Arrange
            var goalId = 1;
            var approvalDto = new CreateApprovalRequestDto
            {
                ApprovalType = "completion",
                ProofAttachmentIds = new List<int> { 1, 2 },
            };


            var responseDto = ApiResponseDto<int>.SuccessResponse("APPROVAL_REQUESTED_SUCCESS", 1);
            _mockService
                .Setup(s =>
                    s.RequestApprovalAsync(
                        It.IsAny<int>(),
                        It.IsAny<CreateApprovalRequestDto>(),
                        It.IsAny<int>(),
                        It.IsAny<string>()
                    )
                )
                .Returns(Task.FromResult(responseDto));

            //Act
            var result = await _controller.RequestApproval(goalId, approvalDto);

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }


        [Test]
        [Category("GoalApproval")]
        public async Task DecideApproval_WithApprove_ReturnsSuccess()
        {
            //Arrange
            var approvalId = 1;
            var decisionDto = new DecideApprovalDto { Decision = "approve" };


            var manager = new ClaimsPrincipal(
                new ClaimsIdentity(
                    new List<Claim> { new Claim("empMasterId", "1"), new Claim("role", "Manager") }
                )
            );


            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = manager },
            };


            var responseDto = ApiResponseDto.SuccessResponse("APPROVAL_DECIDED_SUCCESS");
            _mockService
                .Setup(s =>
                    s.DecideApprovalAsync(
                        It.IsAny<int>(),
                        It.IsAny<DecideApprovalDto>(),
                        It.IsAny<int>(),
                        It.IsAny<string>()
                    )
                )
                .Returns(Task.FromResult(responseDto));

            //Act
            var result = await _controller.DecideApproval(approvalId, decisionDto);

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }


        [Test]
        [Category("Checklist")]
        public async Task ToggleChecklist_MarkAsComplete_ReturnsSuccess()
        {
            //Arrange
            var goalId = 1;
            var toggleDto = new ToggleChecklistDto { ChecklistId = 1, IsCompleted = true };


            var responseDto = ApiResponseDto.SuccessResponse("CHECKLIST_TOGGLED_SUCCESS");
            _mockService
                .Setup(s =>
                    s.ToggleChecklistAsync(
                        It.IsAny<int>(),
                        It.IsAny<ToggleChecklistDto>(),
                        It.IsAny<int>()
                    )
                )
                .Returns(Task.FromResult(responseDto));

            //Act
            var result = await _controller.ToggleChecklist(goalId, toggleDto);

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }


        [Test]
        [Category("Progress")]
        public async Task GetProgress_ReturnsProgressPercentage()
        {
            //Arrange
            var goalId = 1;
            _mockService
                .Setup(s => s.GetGoalProgressPercentAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.FromResult(75));

            //Act
            var result = await _controller.GetProgress(goalId);

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }


        [Test]
        [Category("Comments")]
        public async Task AddComment_WithValidData_ReturnsSuccess()
        {
            //Arrange
            var goalId = 1;
            var commentDto = new CreateCommentDto { Comment = "This is a test comment" };


            var responseDto = ApiResponseDto.SuccessResponse("COMMENT_ADDED_SUCCESS");
            _mockService
                .Setup(s =>
                    s.AddCommentAsync(
                        It.IsAny<int>(),
                        It.IsAny<CreateCommentDto>(),
                        It.IsAny<int>(),
                        It.IsAny<string>()
                    )
                )
                .Returns(Task.FromResult(responseDto));

            //Act
            var result = await _controller.AddComment(goalId, commentDto);

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }


        [Test]
        [Category("Comments")]
        public async Task ListComments_ReturnsCommentList()
        {
            //Arrange
            var goalId = 1;
            var comments = new List<GoalCommentDto>
            {
                new GoalCommentDto
                {
                    GoalCommentId = 1,
                    GoalId = goalId,
                    Comment = "Test comment",
                    CommentedByEmployeeMasterId = 1,
                    CommentedByName = "John Doe",
                    CommentedOn = DateTime.Now,
                },
            };


            _mockService
                .Setup(s => s.ListCommentsAsync(It.IsAny<int>()))
                .Returns(Task.FromResult(comments));

            //Act
            var result = await _controller.ListComments(goalId);

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            var okResult = result as OkObjectResult;
            var response = okResult.Value as ApiResponseDto<List<GoalCommentDto>>;
            Assert.AreEqual(1, response.Data.Count);
        }


        [Test]
        [Category("Dashboard")]
        public async Task DashboardSummary_ReturnsSummary()
        {
            //Arrange
            var summary = new GoalDashboardSummaryDto
            {
                Completed = 5,
                Ongoing = 10,
                Pending = 2,
                Overdue = 1,
                PendingApprovals = 3,
            };


            _mockService
                .Setup(s => s.GetDashboardSummaryAsync(It.IsAny<int>()))
                .Returns(Task.FromResult(summary));

            //Act
            var result = await _controller.DashboardSummary();

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            var okResult = result as OkObjectResult;
            var response = okResult.Value as ApiResponseDto<GoalDashboardSummaryDto>;
            Assert.AreEqual(5, response.Data.Completed);
            Assert.AreEqual(3, response.Data.PendingApprovals);
        }


        [Test]
        [Category("Permissions")]
        public async Task CanViewGoal_WithValidPermission_ReturnsTrue()
        {
            //Arrange
            var goalId = 1;
            _mockService
                .Setup(s => s.CanViewGoalAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.FromResult(true));

            //Act
            var result = await _controller.CanViewGoal(goalId);

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }


        [Test]
        [Category("Permissions")]
        public async Task CanComment_OnOrgGoal_ReturnsFalseForNonLeadership()
        {
            //Arrange
            var goalId = 1;
            _mockService
                .Setup(s =>
                    s.CanCommentOnGoalAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>())
                )
                .Returns(Task.FromResult(false));

            //Act
            var result = await _controller.CanComment(goalId);

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
        }


        [Test]
        [Category("Projects")]
        public async Task GetUserProjects_ReturnsProjectList()
        {
            //Arrange
            var projects = new List<ProjectDto>
            {
                new ProjectDto
                {
                    ProjectId = 1,
                    ProjectName = "Project 1",
                    Status = "active",
                    StartDate = new DateOnly(2025, 1, 1),
                    EndDate = new DateOnly(2025, 12, 31),
                },
            };


            _mockService
                .Setup(s => s.GetUserProjectsAsync(It.IsAny<int>()))
                .Returns(Task.FromResult(projects));

            //Act
            var result = await _controller.GetUserProjects();

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            var okResult = result as OkObjectResult;
            var response = okResult.Value as ApiResponseDto<List<ProjectDto>>;
            Assert.AreEqual(1, response.Data.Count);
            Assert.AreEqual("Project 1", response.Data[0].ProjectName);
        }


        [Test]
        [Category("Timeline")]
        public async Task GetTimeline_ReturnsTimelineEvents()
        {
            //Arrange
            var goalId = 1;
            var timeline = new List<TimelineEventDto>
            {
                new TimelineEventDto
                {
                    Type = "created",
                    Timestamp = DateTime.Now,
                    Description = "Goal created",
                    UserId = 1,
                    UserName = "John Doe",
                    UserRole = "Employee",
                },
            };


            _mockService
                .Setup(s => s.GetGoalTimelineAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.FromResult(timeline));

            //Act
            var result = await _controller.GetTimeline(goalId);

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            var okResult = result as OkObjectResult;
            var response = okResult.Value as ApiResponseDto<List<TimelineEventDto>>;
            Assert.AreEqual(1, response.Data.Count);
            Assert.AreEqual("created", response.Data[0].Type);
        }


        [Test]
        [Category("ErrorHandling")]
        public async Task Create_WithException_ReturnsInternalServerError()
        {
            //Arrange
            var createGoalDto = new CreateGoalDto
            {
                GoalType = "self",
                Title = "Test Goal",
                Deadline = DateTime.Now.AddMonths(1),
            };


            _mockService
                .Setup(s =>
                    s.CreateGoalAsync(
                        It.IsAny<CreateGoalDto>(),
                        It.IsAny<int>(),
                        It.IsAny<string>()
                    )
                )
                .Throws(new Exception("Database error"));

            //Act
            var result = await _controller.Create(createGoalDto);

            //Assert
            Assert.IsInstanceOf<ObjectResult>(result);
            var objectResult = result as ObjectResult;
            Assert.AreEqual(500, objectResult.StatusCode);
        }


        [TearDown]
        public void TearDown()
        {
            _controller = null;
            _mockService = null;
            _mockLogger = null;
        }
    }
}

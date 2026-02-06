using NUnit.Framework;
using Moq;
using MapsterMapper;
using Microsoft.AspNetCore.Hosting;
using FluentValidation;
using FluentValidation.Results;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repository.Interface;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Exceptions;

namespace Relevantz.EEPZ.Core.Tests
{
    [TestFixture]
    public class GoalServicesTests
    {
        private Mock<IBaseGoalRepository> _mockBaseRepo;
        private Mock<IGoalRepository> _mockGoalRepo;
        private Mock<IGoalApprovalsRepository> _mockApprovalRepo;
        private Mock<IGoalProgressRepository> _mockProgressRepo;
        private Mock<IGoalInteractionRepository> _mockInteractionRepo;
        private Mock<IGoalAttachmentRepository> _mockAttachmentRepo;
        private Mock<IBaseGoalService> _mockBaseService;
        private Mock<IValidator<CreateGoalModel>> _mockCreateGoalValidator;
        private Mock<IValidator<UpdateGoalModel>> _mockUpdateGoalValidator;
        private Mock<IValidator<AssignGoalModel>> _mockAssignGoalValidator;
        private Mock<IValidator<GoalQueryModel>> _mockGoalQueryValidator;
        private Mock<IValidator<CreateApprovalRequestModel>> _mockCreateApprovalValidator;
        private Mock<IValidator<ApprovalDesicionModel>> _mockApprovalDecisionValidator;
        private Mock<IValidator<ApprovalQueryModel>> _mockApprovalQueryValidator;
        private Mock<IValidator<UpdateChecklistStatusModel>> _mockUpdateChecklistStatusValidator;
        private Mock<IValidator<UpdateProgressPercentageModel>> _mockUpdateProgressPercentageValidator;
        private Mock<IMapper> _mockMapper;
        private Mock<IWebHostEnvironment> _mockEnvironment;

        private BaseGoalService _baseGoalService;
        private GoalService _goalService;
        private GoalApprovalsService _approvalService;
        private GoalProgressService _progressService;

        [SetUp]
        public void Setup()
        {
            _mockBaseRepo = new Mock<IBaseGoalRepository>();
            _mockGoalRepo = new Mock<IGoalRepository>();
            _mockApprovalRepo = new Mock<IGoalApprovalsRepository>();
            _mockProgressRepo = new Mock<IGoalProgressRepository>();
            _mockInteractionRepo = new Mock<IGoalInteractionRepository>();
            _mockAttachmentRepo = new Mock<IGoalAttachmentRepository>();
            _mockBaseService = new Mock<IBaseGoalService>();
            _mockMapper = new Mock<IMapper>();
            _mockEnvironment = new Mock<IWebHostEnvironment>();

            _mockCreateGoalValidator = new Mock<IValidator<CreateGoalModel>>();
            _mockUpdateGoalValidator = new Mock<IValidator<UpdateGoalModel>>();
            _mockAssignGoalValidator = new Mock<IValidator<AssignGoalModel>>();
            _mockGoalQueryValidator = new Mock<IValidator<GoalQueryModel>>();
            _mockCreateApprovalValidator = new Mock<IValidator<CreateApprovalRequestModel>>();
            _mockApprovalDecisionValidator = new Mock<IValidator<ApprovalDesicionModel>>();
            _mockApprovalQueryValidator = new Mock<IValidator<ApprovalQueryModel>>();
            _mockUpdateChecklistStatusValidator = new Mock<IValidator<UpdateChecklistStatusModel>>();
            _mockUpdateProgressPercentageValidator = new Mock<IValidator<UpdateProgressPercentageModel>>();

            SetupValidValidators();

            _baseGoalService = new BaseGoalService(_mockBaseRepo.Object, _mockEnvironment.Object, _mockMapper.Object);

            _goalService = new GoalService(
                _mockGoalRepo.Object,
                _mockBaseRepo.Object,
                _mockProgressRepo.Object,
                _mockApprovalRepo.Object,
                _mockInteractionRepo.Object,
                _mockBaseService.Object,
                _mockEnvironment.Object,
                _mockCreateGoalValidator.Object,
                _mockUpdateGoalValidator.Object,
                _mockAssignGoalValidator.Object,
                _mockGoalQueryValidator.Object,
                _mockMapper.Object
            );

            _approvalService = new GoalApprovalsService(
                _mockApprovalRepo.Object,
                _mockBaseRepo.Object,
                _mockAttachmentRepo.Object,
                _mockGoalRepo.Object,
                _mockBaseService.Object,
                _mockEnvironment.Object,
                _mockCreateApprovalValidator.Object,
                _mockApprovalDecisionValidator.Object,
                _mockApprovalQueryValidator.Object,
                _mockMapper.Object
            );

            _progressService = new GoalProgressService(
                _mockProgressRepo.Object,
                _mockBaseRepo.Object,
                _mockGoalRepo.Object,
                _mockBaseService.Object,
                _mockEnvironment.Object,
                _mockUpdateChecklistStatusValidator.Object,
                _mockUpdateProgressPercentageValidator.Object,
                _mockMapper.Object
            );
        }

        private void SetupValidValidators()
        {
            _mockCreateGoalValidator.Setup(v => v.ValidateAsync(It.IsAny<CreateGoalModel>(), default))
                .ReturnsAsync(new ValidationResult());
            _mockUpdateGoalValidator.Setup(v => v.ValidateAsync(It.IsAny<UpdateGoalModel>(), default))
                .ReturnsAsync(new ValidationResult());
            _mockAssignGoalValidator.Setup(v => v.ValidateAsync(It.IsAny<AssignGoalModel>(), default))
                .ReturnsAsync(new ValidationResult());
            _mockGoalQueryValidator.Setup(v => v.ValidateAsync(It.IsAny<GoalQueryModel>(), default))
                .ReturnsAsync(new ValidationResult());
            _mockCreateApprovalValidator.Setup(v => v.ValidateAsync(It.IsAny<CreateApprovalRequestModel>(), default))
                .ReturnsAsync(new ValidationResult());
            _mockApprovalDecisionValidator.Setup(v => v.ValidateAsync(It.IsAny<ApprovalDesicionModel>(), default))
                .ReturnsAsync(new ValidationResult());
            _mockApprovalQueryValidator.Setup(v => v.ValidateAsync(It.IsAny<ApprovalQueryModel>(), default))
                .ReturnsAsync(new ValidationResult());
            _mockUpdateChecklistStatusValidator.Setup(v => v.ValidateAsync(It.IsAny<UpdateChecklistStatusModel>(), default))
                .ReturnsAsync(new ValidationResult());
            _mockUpdateProgressPercentageValidator.Setup(v => v.ValidateAsync(It.IsAny<UpdateProgressPercentageModel>(), default))
                .ReturnsAsync(new ValidationResult());
        }

        // TEST 1
        [Test]
        public void Test01_CanCreate_EmployeeWithSelfGoal_ReturnsTrue()
        {
            var result = _baseGoalService.CanCreate(USER_ROLE.EMPLOYEE, GOAL_TYPE.SELF);
            Assert.That(result, Is.True);
        }

        // TEST 2
        [Test]
        public void Test02_CanCreate_EmployeeWithTeamGoal_ReturnsFalse()
        {
            var result = _baseGoalService.CanCreate(USER_ROLE.EMPLOYEE, GOAL_TYPE.TEAM);
            Assert.That(result, Is.False);
        }

        // TEST 3 
        [Test]
        public void Test03_CanCreate_ManagerWithTeamGoal_ReturnsTrue()
        {
            var result = _baseGoalService.CanCreate(USER_ROLE.MANAGER, GOAL_TYPE.TEAM);
            Assert.That(result, Is.True);
        }

        // TEST 4
        [Test]
        public void Test04_CanCreate_DepartmentHeadWithTeamGoal_ReturnsTrue()
        {
            var result = _baseGoalService.CanCreate(USER_ROLE.DEPARTMENT_HEAD, GOAL_TYPE.TEAM);
            Assert.That(result, Is.True);
        }

        // TEST 5
        [Test]
        public void Test05_CanCreate_LeadershipWithOrgGoal_ReturnsTrue()
        {
            var result = _baseGoalService.CanCreate(USER_ROLE.LEADERSHIP, GOAL_TYPE.ORG);
            Assert.That(result, Is.True);
        }

        // TEST 6
        [Test]
        public void Test06_GetCreationApprovalType_SelfGoal_ReturnsCorrectType()
        {
            var result = _baseGoalService.GetCreationApprovalType(GOAL_TYPE.SELF);
            Assert.That(result, Is.EqualTo(APPROVAL_TYPE.SELF_GOAL_ACTIVATION));
        }

        // TEST 7
        [Test]
        public void Test07_GetCreationApprovalType_TeamGoal_ReturnsCreationType()
        {
            var result = _baseGoalService.GetCreationApprovalType(GOAL_TYPE.TEAM);
            Assert.That(result, Is.EqualTo(APPROVAL_TYPE.CREATION));
        }

        // TEST 8
        [Test]
        public void Test08_GetCreationApprovalType_OrgGoal_ReturnsNull()
        {
            var result = _baseGoalService.GetCreationApprovalType(GOAL_TYPE.ORG);
            Assert.That(result, Is.Null);
        }

        // TEST 9
        [Test]
        public async Task Test09_GetApproverForUser_ValidUser_ReturnsManagerId()
        {
            _mockBaseRepo.Setup(r => r.GetReportingManagerEmployeeMasterId(123))
                .ReturnsAsync(456);

            var result = await _baseGoalService.GetApproverForUser(123, APPROVAL_TYPE.CREATION);

            Assert.That(result, Is.EqualTo(456));
        }

        // TEST 10
        [Test]
        public async Task Test10_GetEmployeeName_NullEmployeeMasterId_ReturnsUnknown()
        {
            var result = await _baseGoalService.GetEmployeeName(null);
            Assert.That(result, Is.EqualTo(PROJECT_STATUS.UNKNOWN));
        }

        // TEST 11
        [Test]
        public async Task Test11_CreateGoal_ValidSelfGoal_ReturnsSuccessResponse()
        {
            var goalModel = new CreateGoalModel
            {
                Title = "My Goal",
                Description = "Test",
                GoalType = GOAL_TYPE.SELF,
                Checklist = new List<ChecklistItemModel>
                {
                    new ChecklistItemModel { Title = "Task 1", AddedForEmployeeMasterId = 123 }
                },
                AssignedToEmployeeMasterIds = new List<int> { 123 }
            };

            _mockBaseService.Setup(s => s.CanCreate(USER_ROLE.EMPLOYEE, GOAL_TYPE.SELF)).Returns(true);
            _mockBaseService.Setup(s => s.GetCreationApprovalType(GOAL_TYPE.SELF))
                .Returns(APPROVAL_TYPE.SELF_GOAL_ACTIVATION);
            _mockBaseRepo.Setup(r => r.GetReportingManagerEmployeeMasterId(123)).ReturnsAsync(456);
            _mockGoalRepo.Setup(r => r.AddGoal(It.IsAny<Goal>()))
                .Callback<Goal>(g => g.GoalId = 999);
            _mockBaseRepo.Setup(r => r.SaveChanges()).Returns(Task.CompletedTask);

            var result = await _goalService.CreateGoal(goalModel, 123, USER_ROLE.EMPLOYEE);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.True);
        }

        // TEST 12
        [Test]
        public void Test12_CreateGoal_InvalidRole_ThrowsForbiddenException()
        {
            var goalModel = new CreateGoalModel
            {
                Title = "Team Goal",
                GoalType = GOAL_TYPE.TEAM,
                Checklist = new List<ChecklistItemModel>(),
                AssignedToEmployeeMasterIds = new List<int>()
            };

            _mockBaseService.Setup(s => s.CanCreate(USER_ROLE.EMPLOYEE, GOAL_TYPE.TEAM)).Returns(false);

            Assert.ThrowsAsync<ForbiddenException>(async () =>
                await _goalService.CreateGoal(goalModel, 123, USER_ROLE.EMPLOYEE));
        }

        // TEST 13
        [Test]
        public async Task Test13_QueryGoals_ValidQuery_ReturnsGoalList()
        {
            var query = new GoalQueryModel { Page = 1, PageSize = 10 };
            var goals = new List<Goal>
            {
                new Goal
                {
                    GoalId = 1,
                    GoalTitle = "Test Goal",
                    GoalType = GOAL_TYPE.SELF,
                    GoalChecklists = new List<GoalChecklist>(),
                    GoalAssignments = new List<GoalAssignment>(),
                    GoalApprovals = new List<GoalApproval>()
                }
            };

            _mockGoalRepo.Setup(r => r.QueryGoals(It.IsAny<GoalQueryModel>())).ReturnsAsync(goals);
            _mockMapper.Setup(m => m.Map<GoalSummaryModel>(It.IsAny<Goal>()))
                .Returns(new GoalSummaryModel { GoalId = 1 });
            _mockBaseService.Setup(s => s.GetEmployeeName(It.IsAny<int?>())).ReturnsAsync("John Doe");

            var result = await _goalService.QueryGoals(query, 123, USER_ROLE.EMPLOYEE);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.GreaterThan(0));
        }

        // TEST 14
        [Test]
        public async Task Test14_UpdateGoal_ValidUpdate_ReturnsSuccess()
        {
            var updateModel = new UpdateGoalModel { Title = "Updated Title" };
            var goal = new Goal { GoalId = 1, GoalType = GOAL_TYPE.SELF, CreatedBy = 123, Goalstatus = GOAL_STATUS.OPEN };

            _mockBaseRepo.Setup(r => r.GetGoalById(1)).ReturnsAsync(goal);
            _mockBaseRepo.Setup(r => r.SaveChanges()).Returns(Task.CompletedTask);

            var result = await _goalService.UpdateGoal(1, updateModel, 123, USER_ROLE.EMPLOYEE);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.True);
        }

        // TEST 15
        [Test]
        public void Test15_UpdateGoal_GoalNotFound_ThrowsGoalNotFoundException()
        {
            _mockBaseRepo.Setup(r => r.GetGoalById(999)).ReturnsAsync((Goal?)null);

            Assert.ThrowsAsync<GoalNotFoundException>(async () =>
                await _goalService.UpdateGoal(999, new UpdateGoalModel(), 123, USER_ROLE.EMPLOYEE));
        }

        // TEST 16
        [Test]
        public void Test16_UpdateGoal_NotCreator_ThrowsGoalAccessDeniedException()
        {
            var goal = new Goal { GoalId = 1, GoalType = GOAL_TYPE.SELF, CreatedBy = 456 };
            _mockBaseRepo.Setup(r => r.GetGoalById(1)).ReturnsAsync(goal);

            Assert.ThrowsAsync<GoalAccessDeniedException>(async () =>
                await _goalService.UpdateGoal(1, new UpdateGoalModel(), 123, USER_ROLE.EMPLOYEE));
        }

        // TEST 17
        [Test]
        public async Task Test17_GetAssignees_ValidGoal_ReturnsAssigneeList()
        {
            var assignments = new List<GoalAssignment> { new GoalAssignment { AssignedTo = 123 } };
            var edm = new Employeedetailsmaster
            {
                Employee = new Employee
                {
                    Userprofile = new Userprofile { FirstName = "John", LastName = "Doe" }
                },
                Role = new Role { RoleName = USER_ROLE.EMPLOYEE }
            };

            _mockBaseRepo.Setup(r => r.GetAssignees(1)).ReturnsAsync(assignments);
            _mockBaseRepo.Setup(r => r.GetEmployeeDetailsByMasterId(123)).ReturnsAsync(edm);
            _mockMapper.Setup(m => m.Map<AssigneeModel>(It.IsAny<GoalAssignment>()))
                .Returns(new AssigneeModel());

            var result = await _goalService.GetAssignees(1);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(1));
        }

        // TEST 18
        [Test]
        public async Task Test18_GetUserProjects_Employee_ReturnsUserProjects()
        {
            var edm = new Employeedetailsmaster { EmployeeId = 10 };
            var projects = new List<Project> { new Project { ProjectId = 1 } };

            _mockBaseRepo.Setup(r => r.GetUserRole(123)).ReturnsAsync(USER_ROLE.EMPLOYEE);
            _mockBaseRepo.Setup(r => r.GetEmployeeDetailsByMasterId(123)).ReturnsAsync(edm);
            _mockGoalRepo.Setup(r => r.GetUserProjectsByEmployeeId(10)).ReturnsAsync(projects);
            _mockMapper.Setup(m => m.Map<List<ProjectModel>>(projects))
                .Returns(new List<ProjectModel> { new ProjectModel() });

            var result = await _goalService.GetUserProjects(123);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(1));
        }

        // TEST 19
        [Test]
        public async Task Test19_GetAllProjects_ReturnsAllProjects()
        {
            var projects = new List<Project> { new Project { ProjectId = 1 }, new Project { ProjectId = 2 } };

            _mockGoalRepo.Setup(r => r.GetAllProjects()).ReturnsAsync(projects);
            _mockMapper.Setup(m => m.Map<List<ProjectModel>>(projects))
                .Returns(new List<ProjectModel> { new ProjectModel(), new ProjectModel() });

            var result = await _goalService.GetAllProjects();

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(2));
        }

        // TEST 20
        [Test]
        public void Test20_GetProject_ProjectNotFound_ThrowsProjectNotFoundException()
        {
            _mockGoalRepo.Setup(r => r.GetProject(999)).ReturnsAsync((Project?)null);

            Assert.ThrowsAsync<ProjectNotFoundException>(async () => await _goalService.GetProject(999));
        }

        // TEST 21
        [Test]
        public async Task Test21_CreateApprovalRequest_CompletionByLeadership_AutoApproves()
        {
            var request = new CreateApprovalRequestModel { ApprovalType = APPROVAL_TYPE.COMPLETION };
            var goal = new Goal { GoalId = 1, GoalType = GOAL_TYPE.ORG, Goalstatus = GOAL_STATUS.OPEN };

            _mockBaseRepo.Setup(r => r.GetGoalById(1)).ReturnsAsync(goal);
            _mockApprovalRepo.Setup(r => r.AddApproval(It.IsAny<GoalApproval>()))
                .Callback<GoalApproval>(a => a.ApprovalId = 100);
            _mockBaseRepo.Setup(r => r.SaveChanges()).Returns(Task.CompletedTask);

            var result = await _approvalService.CreateApprovalRequest(1, request, 123, USER_ROLE.LEADERSHIP);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.True);
            Assert.That(goal.Goalstatus, Is.EqualTo(GOAL_STATUS.COMPLETED));
        }

        // TEST 22
        [Test]
        public void Test22_CreateApprovalRequest_GoalNotFound_ThrowsGoalNotFoundException()
        {
            _mockBaseRepo.Setup(r => r.GetGoalById(999)).ReturnsAsync((Goal?)null);

            Assert.ThrowsAsync<GoalNotFoundException>(async () =>
                await _approvalService.CreateApprovalRequest(999, new CreateApprovalRequestModel { ApprovalType = APPROVAL_TYPE.COMPLETION }, 123, USER_ROLE.EMPLOYEE));
        }

        // TEST 23
        [Test]
        public async Task Test23_ClosePendingApproval_ValidApproval_ReturnsSuccess()
        {
            var approval = new GoalApproval
            {
                ApprovalId = 1,
                ApprovalType = APPROVAL_TYPE.COMPLETION,
                ApprovalStatus = APPROVAL_STATUS.PENDING,
                ApprovedBy = 456,
                RequestedBy = 123,
                Goal = new Goal { GoalId = 10, GoalType = GOAL_TYPE.SELF, Goalstatus = GOAL_STATUS.OPEN }
            };
            var decision = new ApprovalDesicionModel { Decision = APPROVAL_STATUS.APPROVED };

            _mockApprovalRepo.Setup(r => r.GetApprovalById(1)).ReturnsAsync(approval);
            _mockBaseRepo.Setup(r => r.SaveChanges()).Returns(Task.CompletedTask);

            var result = await _approvalService.ClosePendingApproval(1, decision, 456, USER_ROLE.MANAGER);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.True);
        }

        // TEST 24
        [Test]
        public void Test24_ClosePendingApproval_ApprovalNotFound_ThrowsApprovalNotFoundException()
        {
            _mockApprovalRepo.Setup(r => r.GetApprovalById(999)).ReturnsAsync((GoalApproval?)null);

            Assert.ThrowsAsync<ApprovalNotFoundException>(async () =>
                await _approvalService.ClosePendingApproval(999, new ApprovalDesicionModel { Decision = APPROVAL_STATUS.APPROVED }, 456, USER_ROLE.MANAGER));
        } 

        // TEST 25
        [Test]
        public async Task Test25_GetPendingApprovals_ValidApprover_ReturnsApprovalList()
        {
            var approvals = new List<GoalApproval>
            {
                new GoalApproval
                {
                    ApprovalId = 1,
                    RequestedBy = 123,
                    Goal = new Goal { GoalId = 10, GoalAttachments = new List<GoalAttachment>() }
                }
            };

            _mockApprovalRepo.Setup(r => r.GetPendingApprovalsForApprover(456)).ReturnsAsync(approvals);
            _mockBaseService.Setup(s => s.GetEmployeeName(123)).ReturnsAsync("John Doe");
            _mockMapper.Setup(m => m.Map<GoalApprovalModel>(It.IsAny<GoalApproval>()))
                .Returns(new GoalApprovalModel { ApprovalId = 1 });

            var result = await _approvalService.GetPendingApprovals(456);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(1));
        }

        // TEST 26 
        [Test]
        public async Task Test26_GetGoalProgressPercent_ManualSource_ReturnsManualPercent()
        {
            var progressLog = new Goalprogresslog { Source = PROGRESS_SOURCE.MANUAL, ProgressPercent = 80 };

            _mockBaseRepo.Setup(r => r.GetLatestProgressLog(1)).ReturnsAsync(progressLog);

            var result = await _progressService.GetGoalProgressPercent(1, 123);

            Assert.That(result, Is.EqualTo(80));
        }

        // TEST 27 
        [Test]
        public async Task Test27_GetGoalProgressPercent_AutoSource_CalculatesFromChecklist()
        {
            _mockBaseRepo.Setup(r => r.GetLatestProgressLog(1)).ReturnsAsync((Goalprogresslog?)null);
            _mockBaseRepo.Setup(r => r.CountCompletedForUser(1, 123)).ReturnsAsync(5);
            _mockBaseRepo.Setup(r => r.CountTotalForUser(1, 123)).ReturnsAsync(10);

            var result = await _progressService.GetGoalProgressPercent(1, 123);

            Assert.That(result, Is.EqualTo(50));
        }

        // TEST 28 - FIXED: Uses IBaseGoalRepository.GetLatestProgressLog
        [Test]
        public async Task Test28_GetGoalProgressPercent_NoItems_ReturnsZero()
        {
            _mockBaseRepo.Setup(r => r.GetLatestProgressLog(1)).ReturnsAsync((Goalprogresslog?)null);
            _mockBaseRepo.Setup(r => r.CountCompletedForUser(1, 123)).ReturnsAsync(0);
            _mockBaseRepo.Setup(r => r.CountTotalForUser(1, 123)).ReturnsAsync(0);

            var result = await _progressService.GetGoalProgressPercent(1, 123);

            Assert.That(result, Is.EqualTo(0));
        }

        // TEST 29 - FIXED: Uses IBaseGoalRepository.GetLatestProgressLog
        [Test]
        public async Task Test29_GetGoalProgressPercent_AllCompleted_ReturnsHundred()
        {
            _mockBaseRepo.Setup(r => r.GetLatestProgressLog(1)).ReturnsAsync((Goalprogresslog?)null);
            _mockBaseRepo.Setup(r => r.CountCompletedForUser(1, 123)).ReturnsAsync(10);
            _mockBaseRepo.Setup(r => r.CountTotalForUser(1, 123)).ReturnsAsync(10);

            var result = await _progressService.GetGoalProgressPercent(1, 123);

            Assert.That(result, Is.EqualTo(100));
        }

        // TEST 30
        [Test]
        public async Task Test30_GetEmployeeName_ValidEmployee_ReturnsFullName()
        {
            var edm = new Employeedetailsmaster
            {
                Employee = new Employee
                {
                    Userprofile = new Userprofile { FirstName = "Jane", LastName = "Smith" }
                }
            };  

            _mockBaseRepo.Setup(r => r.GetEmployeeDetailsByMasterId(456)).ReturnsAsync(edm);

            var result = await _baseGoalService.GetEmployeeName(456);

            Assert.That(result, Is.EqualTo("Jane Smith"));
        }
    }
}                      





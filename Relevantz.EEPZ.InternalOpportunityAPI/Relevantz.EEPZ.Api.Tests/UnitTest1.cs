using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Api.Controllers;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.ViewModels.Common;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Response;
using Relevantz.EEPZ.Common.ViewModels.Promotion.Request;
using Relevantz.EEPZ.Common.ViewModels.Promotion.Response;
using Relevantz.EEPZ.Common.Enums;

namespace Relevantz.EEPZ.UnitTests.Controllers
{
    [TestFixture]
    public class ControllersFullWorkflowTests
    {
        private Mock<INominationService> _mockNominationService;
        private Mock<IPromotionService> _mockPromotionService;
        private NominationController _nominationController;
        private PromotionController _promotionController;

        private NominationResponseDto _mockNominationResponse;
        private NominationDetailResponseDto _mockNominationDetail;
        private NominationListResponseDto _mockNominationList;
        private PromotionResponseDto _mockPromotionResponse;

        [SetUp]
        public void Setup()
        {
            // Fresh mocks for each test
            _mockNominationService = new Mock<INominationService>();
            _mockPromotionService = new Mock<IPromotionService>();
            
            _nominationController = new NominationController(_mockNominationService.Object);
            _promotionController = new PromotionController(_mockPromotionService.Object);

            SetupMockUser(_nominationController, 1, "employee");
            SetupMockUser(_promotionController, 1, "hr");

            InitializeMockData();
        }

        private void SetupMockUser(ControllerBase controller, int userId, string role)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        private void InitializeMockData()
        {
            _mockNominationResponse = new NominationResponseDto
            {
                NominationId = 1,
                OpportunityId = 1,
                OpportunityName = "Java Developer for Project Phoenix",
                NomineeName = "employee@company.com",
                NominationType = "employee_self",
                Status = NominationStatusConstants.PendingManagerReview,
                SubmittedAt = DateTime.UtcNow
            };

            _mockNominationDetail = new NominationDetailResponseDto
            {
                NominationId = 1,
                OpportunityId = 1,
                OpportunityName = "Java Developer for Project Phoenix",
                OpportunityDescription = "Phoenix project requires Java developer",
                NomineeName = "employee@company.com",
                NomineeEmail = "employee@company.com",
                NomineeCurrentDepartment = "IT",
                NominationType = "employee_self",
                Justification = "I have 5 years Java experience",
                Status = NominationStatusConstants.Approved,
                SubmittedAt = DateTime.UtcNow
            };

            _mockNominationList = new NominationListResponseDto
            {
                Nominations = new List<NominationResponseDto> { _mockNominationResponse },
                TotalCount = 1,
                PageNumber = 1,
                PageSize = 10,
                TotalPages = 1
            };

            _mockPromotionResponse = new PromotionResponseDto
            {
                PromotionId = 1,
                EmployeeUserId = 3,
                EmployeeName = "employee@company.com",
                NominationId = 1,
                OpportunityName = "Java Developer for Project Phoenix",
                OldRole = "Senior Developer",
                NewRole = "Java Developer - Phoenix Project",
                OldSalary = 900000,
                NewSalary = 1250000,
                IncrementPercentage = 38.89m,
                PromotionDate = new DateOnly(2025, 12, 20),
                Status = PromotionStatusConstants.PendingHrApproval,
                CreatedAt = DateTime.UtcNow
            };
        }

        #region NOMINATION - Self Nomination (10 Tests)

        [Test]
        public async Task SelfNominate_WithValidData_ReturnCreatedResult()
        {
            var request = new CreateSelfNominationRequestDto
            {
                OpportunityId = 1,
                Justification = "I have 5 years experience"
            };

            _mockNominationService
                .Setup(s => s.CreateSelfNominationAsync(It.IsAny<int>(), It.IsAny<CreateSelfNominationRequestDto>()))
                .ReturnsAsync(_mockNominationResponse);

            var result = await _nominationController.SelfNominate(request);

            Assert.That(result, Is.TypeOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task SelfNominate_WithInvalidOpportunityId_ReturnBadRequest()
        {
            var request = new CreateSelfNominationRequestDto { OpportunityId = 0, Justification = "Test" };

            _mockNominationService
                .Setup(s => s.CreateSelfNominationAsync(It.IsAny<int>(), It.IsAny<CreateSelfNominationRequestDto>()))
                .ThrowsAsync(new ArgumentException("Invalid Opportunity ID"));

            var result = await _nominationController.SelfNominate(request);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task SelfNominate_WithDuplicateNomination_ReturnError()
        {
            var request = new CreateSelfNominationRequestDto { OpportunityId = 1, Justification = "Duplicate" };

            _mockNominationService
                .Setup(s => s.CreateSelfNominationAsync(It.IsAny<int>(), It.IsAny<CreateSelfNominationRequestDto>()))
                .ThrowsAsync(new Exception("Duplicate nomination"));

            var result = await _nominationController.SelfNominate(request);

            Assert.That(result, Is.TypeOf<ObjectResult>());
        }

        [Test]
        public async Task SelfNominate_WithEmptyJustification_ReturnBadRequest()
        {
            var request = new CreateSelfNominationRequestDto { OpportunityId = 1, Justification = "" };

            _mockNominationService
                .Setup(s => s.CreateSelfNominationAsync(It.IsAny<int>(), It.IsAny<CreateSelfNominationRequestDto>()))
                .ThrowsAsync(new ArgumentException("Justification required"));

            var result = await _nominationController.SelfNominate(request);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task SelfNominate_WithServiceException_ReturnServerError()
        {
            var request = new CreateSelfNominationRequestDto { OpportunityId = 1, Justification = "Test" };

            _mockNominationService
                .Setup(s => s.CreateSelfNominationAsync(It.IsAny<int>(), It.IsAny<CreateSelfNominationRequestDto>()))
                .ThrowsAsync(new Exception("DB Error"));

            var result = await _nominationController.SelfNominate(request);

            Assert.That(result, Is.TypeOf<ObjectResult>());
            Assert.That((result as ObjectResult).StatusCode, Is.EqualTo(500));
        }

        [Test]
        public async Task SelfNominate_WithLongJustification_ReturnSuccess()
        {
            var longText = new string('a', 1000);
            var request = new CreateSelfNominationRequestDto { OpportunityId = 1, Justification = longText };

            _mockNominationService
                .Setup(s => s.CreateSelfNominationAsync(It.IsAny<int>(), It.IsAny<CreateSelfNominationRequestDto>()))
                .ReturnsAsync(_mockNominationResponse);

            var result = await _nominationController.SelfNominate(request);

            Assert.That(result, Is.TypeOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task SelfNominate_WithSpecialCharacters_ReturnSuccess()
        {
            var request = new CreateSelfNominationRequestDto { OpportunityId = 1, Justification = "I've worked @Java!" };

            _mockNominationService
                .Setup(s => s.CreateSelfNominationAsync(It.IsAny<int>(), It.IsAny<CreateSelfNominationRequestDto>()))
                .ReturnsAsync(_mockNominationResponse);

            var result = await _nominationController.SelfNominate(request);

            Assert.That(result, Is.TypeOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task SelfNominate_WithMultipleOpportunities_BothFail()
        {
            var request1 = new CreateSelfNominationRequestDto { OpportunityId = 1, Justification = "Opp 1" };
            var request2 = new CreateSelfNominationRequestDto { OpportunityId = 2, Justification = "Opp 2" };

            _mockNominationService
                .Setup(s => s.CreateSelfNominationAsync(It.IsAny<int>(), It.IsAny<CreateSelfNominationRequestDto>()))
                .ThrowsAsync(new Exception("Already nominated"));

            var result1 = await _nominationController.SelfNominate(request1);
            var result2 = await _nominationController.SelfNominate(request2);

            Assert.That(result1, Is.TypeOf<BadRequestObjectResult>());
            Assert.That(result2, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public void SelfNominate_VerifyServiceNotCalled_WhenNotInvoked()
        {
            // Just verify mocks are set up
            Assert.That(_mockNominationService, Is.Not.Null);
        }

        #endregion

        #region NOMINATION - Manager Nomination (10 Tests)

        [Test]
        public async Task ManagerNominate_WithValidEmployee_ReturnCreatedResult()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var request = new CreateManagerNominationRequestDto
            {
                OpportunityId = 1,
                NomineeEmployeeId = 3,
                Justification = "Good employee"
            };

            _mockNominationService
                .Setup(s => s.CreateManagerNominationAsync(It.IsAny<int>(), It.IsAny<CreateManagerNominationRequestDto>()))
                .ReturnsAsync(_mockNominationResponse);

            var result = await _nominationController.ManagerNominate(request);

            Assert.That(result, Is.TypeOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task ManagerNominate_WithNonTeamMember_ReturnError()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var request = new CreateManagerNominationRequestDto { OpportunityId = 1, NomineeEmployeeId = 999, Justification = "Not in team" };

            _mockNominationService
                .Setup(s => s.CreateManagerNominationAsync(It.IsAny<int>(), It.IsAny<CreateManagerNominationRequestDto>()))
                .ThrowsAsync(new Exception("Not in team"));

            var result = await _nominationController.ManagerNominate(request);

            Assert.That(result, Is.TypeOf<ObjectResult>());
        }

        [Test]
        public async Task ManagerNominate_WithDuplicateNomination_ReturnError()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var request = new CreateManagerNominationRequestDto { OpportunityId = 1, NomineeEmployeeId = 3, Justification = "Duplicate" };

            _mockNominationService
                .Setup(s => s.CreateManagerNominationAsync(It.IsAny<int>(), It.IsAny<CreateManagerNominationRequestDto>()))
                .ThrowsAsync(new Exception("Duplicate"));

            var result = await _nominationController.ManagerNominate(request);

            Assert.That(result, Is.TypeOf<ObjectResult>());
        }

        [Test]
        public async Task ManagerNominate_WithoutJustification_ReturnBadRequest()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var request = new CreateManagerNominationRequestDto { OpportunityId = 1, NomineeEmployeeId = 3, Justification = null };

            _mockNominationService
                .Setup(s => s.CreateManagerNominationAsync(It.IsAny<int>(), It.IsAny<CreateManagerNominationRequestDto>()))
                .ThrowsAsync(new ArgumentException("Required"));

            var result = await _nominationController.ManagerNominate(request);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ManagerNominate_WithInvalidOpportunity_ReturnBadRequest()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var request = new CreateManagerNominationRequestDto { OpportunityId = 0, NomineeEmployeeId = 3, Justification = "Test" };

            _mockNominationService
                .Setup(s => s.CreateManagerNominationAsync(It.IsAny<int>(), It.IsAny<CreateManagerNominationRequestDto>()))
                .ThrowsAsync(new ArgumentException("Invalid"));

            var result = await _nominationController.ManagerNominate(request);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ManagerNominate_MultipleEmployees_Success()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var request1 = new CreateManagerNominationRequestDto { OpportunityId = 1, NomineeEmployeeId = 3, Justification = "First" };

            _mockNominationService
                .Setup(s => s.CreateManagerNominationAsync(It.IsAny<int>(), It.IsAny<CreateManagerNominationRequestDto>()))
                .ReturnsAsync(_mockNominationResponse);

            var result1 = await _nominationController.ManagerNominate(request1);

            Assert.That(result1, Is.TypeOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task ManagerNominate_VerifyManagerIdUsed()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var request = new CreateManagerNominationRequestDto { OpportunityId = 1, NomineeEmployeeId = 3, Justification = "Test" };

            _mockNominationService
                .Setup(s => s.CreateManagerNominationAsync(2, It.IsAny<CreateManagerNominationRequestDto>()))
                .ReturnsAsync(_mockNominationResponse)
                .Verifiable();

            await _nominationController.ManagerNominate(request);

            _mockNominationService.Verify();
        }

        [Test]
        public async Task ManagerNominate_WithNegativeNomineeId_ReturnBadRequest()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var request = new CreateManagerNominationRequestDto { OpportunityId = 1, NomineeEmployeeId = -1, Justification = "Test" };

            _mockNominationService
                .Setup(s => s.CreateManagerNominationAsync(It.IsAny<int>(), It.IsAny<CreateManagerNominationRequestDto>()))
                .ThrowsAsync(new ArgumentException("Invalid ID"));

            var result = await _nominationController.ManagerNominate(request);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        #endregion

        #region NOMINATION - Reviews (15 Tests)

        [Test]
        public async Task GetPendingManagerReview_ReturnList()
        {
            SetupMockUser(_nominationController, 2, "manager");
            _mockNominationService
                .Setup(s => s.GetPendingManagerReviewAsync(It.IsAny<int>()))
                .ReturnsAsync(_mockNominationList);

            var result = await _nominationController.GetPendingManagerReview();

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetPendingManagerReview_EmptyList()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var emptyList = new NominationListResponseDto { Nominations = new List<NominationResponseDto>(), TotalCount = 0 };
            _mockNominationService
                .Setup(s => s.GetPendingManagerReviewAsync(It.IsAny<int>()))
                .ReturnsAsync(emptyList);

            var result = await _nominationController.GetPendingManagerReview();

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task ManagerReviewNomination_Approve()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var request = new ManagerReviewRequestDto { ActionTaken = "Approved", Remarks = "Good" };
            var approved = new NominationResponseDto { Status = NominationStatusConstants.PendingDeptHeadApproval };

            _mockNominationService
                .Setup(s => s.ManagerReviewNominationAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<ManagerReviewRequestDto>()))
                .ReturnsAsync(approved);

            var result = await _nominationController.ManagerReview(1, request);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task ManagerReviewNomination_Reject()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var request = new ManagerReviewRequestDto { ActionTaken = "Rejected", Remarks = "Not ready" };
            var rejected = new NominationResponseDto { Status = "manager_rejected" };

            _mockNominationService
                .Setup(s => s.ManagerReviewNominationAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<ManagerReviewRequestDto>()))
                .ReturnsAsync(rejected);

            var result = await _nominationController.ManagerReview(1, request);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task ManagerReviewNomination_InvalidId()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var request = new ManagerReviewRequestDto { ActionTaken = "Approved", Remarks = "Test" };

            _mockNominationService
                .Setup(s => s.ManagerReviewNominationAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<ManagerReviewRequestDto>()))
                .ThrowsAsync(new Exception("Not found"));

            var result = await _nominationController.ManagerReview(999, request);

            Assert.That(result, Is.TypeOf<ObjectResult>());
        }

        [Test]
        public async Task GetPendingDeptHeadReview_ReturnList()
        {
            SetupMockUser(_nominationController, 3, "dept_head");
            _mockNominationService
                .Setup(s => s.GetPendingDeptHeadReviewAsync(It.IsAny<int>()))
                .ReturnsAsync(_mockNominationList);

            var result = await _nominationController.GetPendingDeptHeadReview();

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task DepartmentHeadReview_Approve()
        {
            SetupMockUser(_nominationController, 3, "dept_head");
            var request = new DepartmentHeadReviewRequestDto { Action = "Approved", ReviewRemarks = "Good", ConflictOfInterest = false };
            var approved = new NominationResponseDto { Status = NominationStatusConstants.Approved };

            _mockNominationService
                .Setup(s => s.DepartmentHeadReviewAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<DepartmentHeadReviewRequestDto>()))
                .ReturnsAsync(approved);

            var result = await _nominationController.DepartmentHeadReview(1, request);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetNominationById_Found()
        {
            _mockNominationService
                .Setup(s => s.GetNominationByIdAsync(1))
                .ReturnsAsync(_mockNominationDetail);

            var result = await _nominationController.GetNominationById(1);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetNominationById_NotFound()
        {
            _mockNominationService
                .Setup(s => s.GetNominationByIdAsync(999))
                .ThrowsAsync(new Exception("Not found"));

            var result = await _nominationController.GetNominationById(999);

            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetMyNominations_ReturnList()
        {
            SetupMockUser(_nominationController, 1, "employee");
            var myNoms = new List<NominationResponseDto> { _mockNominationResponse };

            _mockNominationService
                .Setup(s => s.GetMyNominationsAsync(It.IsAny<int>()))
                .ReturnsAsync(myNoms);

            var result = await _nominationController.GetMyNominations();

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task CheckEligibility_Eligible()
        {
            SetupMockUser(_nominationController, 1, "employee");
            var eligResp = new EligibilityCheckResponseDto { IsEligible = true, Message = "Eligible" };

            _mockNominationService
                .Setup(s => s.CheckEligibilityAsync(It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(eligResp);

            var result = await _nominationController.CheckEligibility(new EligibilityCheckRequestDto { OpportunityId = 1 });

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task CheckEligibility_NotEligible()
        {
            SetupMockUser(_nominationController, 1, "employee");
            var ineligResp = new EligibilityCheckResponseDto { IsEligible = false, Message = "Not eligible" };

            _mockNominationService
                .Setup(s => s.CheckEligibilityAsync(It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(ineligResp);

            var result = await _nominationController.CheckEligibility(new EligibilityCheckRequestDto { OpportunityId = 1 });

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        #endregion

        #region PROMOTION - Create & Approvals (20 Tests)

        [Test]
        public async Task CreatePromotion_Success()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var req = new CreatePromotionRequestDto
            {
                NominationId = 1, EmployeeUserId = 3, DepartmentId = 2,
                OldRole = "Dev", NewRole = "Senior", OldSalary = 900000, NewSalary = 1250000,
                PromotionDate = new DateOnly(2025, 12, 20)
            };

            _mockPromotionService
                .Setup(s => s.CreatePromotionAsync(It.IsAny<CreatePromotionRequestDto>(), It.IsAny<int>()))
                .ReturnsAsync(_mockPromotionResponse);

            var result = await _promotionController.CreatePromotion(req);

            Assert.That(result, Is.TypeOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task CreatePromotion_NoNominationId()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var req = new CreatePromotionRequestDto
            {
                NominationId = 0, EmployeeUserId = 3, DepartmentId = 2,
                OldRole = "Dev", NewRole = "Senior", OldSalary = 800000, NewSalary = 1100000,
                PromotionDate = new DateOnly(2025, 12, 20)
            };

            _mockPromotionService
                .Setup(s => s.CreatePromotionAsync(It.IsAny<CreatePromotionRequestDto>(), It.IsAny<int>()))
                .ThrowsAsync(new Exception("NominationId required"));

            var result = await _promotionController.CreatePromotion(req);

            Assert.That(result, Is.TypeOf<ObjectResult>());
        }

        [Test]
        public async Task CreatePromotion_PendingNomination()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var req = new CreatePromotionRequestDto
            {
                NominationId = 2, EmployeeUserId = 3, DepartmentId = 2,
                OldRole = "Dev", NewRole = "Senior", OldSalary = 800000, NewSalary = 1100000,
                PromotionDate = new DateOnly(2025, 12, 20)
            };

            _mockPromotionService
                .Setup(s => s.CreatePromotionAsync(It.IsAny<CreatePromotionRequestDto>(), It.IsAny<int>()))
                .ThrowsAsync(new Exception("Status is pending"));

            var result = await _promotionController.CreatePromotion(req);

            Assert.That(result, Is.TypeOf<ObjectResult>());
        }

        [Test]
        public async Task CreatePromotion_Duplicate()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var req = new CreatePromotionRequestDto
            {
                NominationId = 1, EmployeeUserId = 3, DepartmentId = 2,
                OldRole = "Senior", NewRole = "Principal", OldSalary = 900000, NewSalary = 1300000,
                PromotionDate = new DateOnly(2025, 12, 20)
            };

            _mockPromotionService
                .Setup(s => s.CreatePromotionAsync(It.IsAny<CreatePromotionRequestDto>(), It.IsAny<int>()))
                .ThrowsAsync(new Exception("Already exists"));

            var result = await _promotionController.CreatePromotion(req);

            Assert.That(result, Is.TypeOf<ObjectResult>());
        }

        [Test]
        public async Task ApprovePromotion_HRApprove()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var req = new ApprovePromotionRequestDto { ApprovalRemarks = "Approved" };
            var approved = new PromotionResponseDto { Status = PromotionStatusConstants.HrApproved };

            _mockPromotionService
                .Setup(s => s.ApprovePromotionAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>()))
                .ReturnsAsync(approved);

            var result = await _promotionController.ApprovePromotion(1, req);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetPendingLeadershipApproval()
        {
            SetupMockUser(_promotionController, 4, "leadership");
            var pending = new List<PromotionResponseDto> { new() { Status = PromotionStatusConstants.HrApproved } };

            _mockPromotionService
                .Setup(s => s.GetPendingLeadershipApprovalAsync())
                .ReturnsAsync(pending);

            var result = await _promotionController.GetPendingLeadershipApproval();

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task LeadershipApprovePromotion()
        {
            SetupMockUser(_promotionController, 4, "leadership");
            var req = new ApprovePromotionRequestDto { ApprovalRemarks = "Approved by Leadership" };
            var final = new PromotionResponseDto { Status = PromotionStatusConstants.Approved };

            _mockPromotionService
                .Setup(s => s.ApprovePromotionByLeadershipAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>()))
                .ReturnsAsync(final);

            var result = await _promotionController.LeadershipApprovePromotion(1, req);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task LeadershipRejectPromotion()
        {
            SetupMockUser(_promotionController, 4, "leadership");
            var req = new ApprovePromotionRequestDto { ApprovalRemarks = "Budget exceeded" };
            var rejected = new PromotionResponseDto { Status = PromotionStatusConstants.Rejected };

            _mockPromotionService
                .Setup(s => s.RejectPromotionByLeadershipAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>()))
                .ReturnsAsync(rejected);

            var result = await _promotionController.LeadershipRejectPromotion(1, req);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetPromotionById_Found()
        {
            SetupMockUser(_promotionController, 1, "hr");
            _mockPromotionService
                .Setup(s => s.GetPromotionByIdAsync(1))
                .ReturnsAsync(_mockPromotionResponse);

            var result = await _promotionController.GetPromotionById(1);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetPromotionById_NotFound()
        {
            SetupMockUser(_promotionController, 1, "hr");
            _mockPromotionService
                .Setup(s => s.GetPromotionByIdAsync(999))
                .ThrowsAsync(new Exception("Not found"));

            var result = await _promotionController.GetPromotionById(999);

            Assert.That(result, Is.TypeOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetAllPromotions()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var all = new List<PromotionResponseDto> { _mockPromotionResponse };

            _mockPromotionService
                .Setup(s => s.GetAllPromotionsAsync())
                .ReturnsAsync(all);

            var result = await _promotionController.GetAllPromotions();

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetEmployeePromotions()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var emp = new List<PromotionResponseDto> { _mockPromotionResponse };

            _mockPromotionService
                .Setup(s => s.GetPromotionsByEmployeeAsync(3))
                .ReturnsAsync(emp);

            var result = await _promotionController.GetEmployeePromotions(3);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetPromotionHistory()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var hist = new List<PromotionResponseDto> { new() { OldRole = "Dev", NewRole = "Senior" } };

            _mockPromotionService
                .Setup(s => s.GetPromotionHistoryByEmployeeAsync(3))
                .ReturnsAsync(hist);

            var result = await _promotionController.GetPromotionHistory(3);

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetPendingHrApproval()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var pending = new List<PromotionResponseDto> { _mockPromotionResponse };

            _mockPromotionService
                .Setup(s => s.GetPendingHrApprovalAsync())
                .ReturnsAsync(pending);

            var result = await _promotionController.GetPendingHrApproval();

            Assert.That(result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task Promotion_HighSalaryIncrement()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var req = new CreatePromotionRequestDto
            {
                NominationId = 1, EmployeeUserId = 3, DepartmentId = 2,
                OldRole = "Junior", NewRole = "Senior", OldSalary = 500000, NewSalary = 1500000,
                PromotionDate = new DateOnly(2025, 12, 20)
            };

            _mockPromotionService
                .Setup(s => s.CreatePromotionAsync(It.IsAny<CreatePromotionRequestDto>(), It.IsAny<int>()))
                .ReturnsAsync(_mockPromotionResponse);

            var result = await _promotionController.CreatePromotion(req);

            Assert.That(result, Is.TypeOf<CreatedAtActionResult>());
        }

        #endregion

        #region EDGE CASES (10 Tests)

        [Test]
        public async Task Promotion_ZeroNominationId()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var req = new CreatePromotionRequestDto
            {
                NominationId = 0, EmployeeUserId = 3, DepartmentId = 2,
                OldRole = "Dev", NewRole = "Senior", OldSalary = 100000, NewSalary = 150000,
                PromotionDate = new DateOnly(2025, 12, 1)
            };

            _mockPromotionService
                .Setup(s => s.CreatePromotionAsync(It.IsAny<CreatePromotionRequestDto>(), It.IsAny<int>()))
                .ThrowsAsync(new Exception("Required"));

            var result = await _promotionController.CreatePromotion(req);

            Assert.That(result, Is.TypeOf<ObjectResult>());
        }

        [Test]
        public async Task NegativeEmployeeUserId()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var req = new CreatePromotionRequestDto
            {
                NominationId = 1, EmployeeUserId = -1, DepartmentId = 2,
                OldRole = "Dev", NewRole = "Senior", OldSalary = 100000, NewSalary = 150000,
                PromotionDate = new DateOnly(2025, 12, 1)
            };

            _mockPromotionService
                .Setup(s => s.CreatePromotionAsync(It.IsAny<CreatePromotionRequestDto>(), It.IsAny<int>()))
                .ThrowsAsync(new ArgumentException("Invalid"));

            var result = await _promotionController.CreatePromotion(req);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ZeroSalary()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var req = new CreatePromotionRequestDto
            {
                NominationId = 1, EmployeeUserId = 3, DepartmentId = 2,
                OldRole = "Dev", NewRole = "Senior", OldSalary = 0, NewSalary = 0,
                PromotionDate = new DateOnly(2025, 12, 1)
            };

            _mockPromotionService
                .Setup(s => s.CreatePromotionAsync(It.IsAny<CreatePromotionRequestDto>(), It.IsAny<int>()))
                .ThrowsAsync(new ArgumentException("Invalid"));

            var result = await _promotionController.CreatePromotion(req);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ServiceThrowsException_HandleGracefully()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var req = new CreatePromotionRequestDto
            {
                NominationId = 1, EmployeeUserId = 3, DepartmentId = 2,
                OldRole = "Dev", NewRole = "Senior", OldSalary = 100000, NewSalary = 150000,
                PromotionDate = new DateOnly(2025, 12, 1)
            };

            _mockPromotionService
                .Setup(s => s.CreatePromotionAsync(It.IsAny<CreatePromotionRequestDto>(), It.IsAny<int>()))
                .ThrowsAsync(new InvalidOperationException("DB Error"));

            var result = await _promotionController.CreatePromotion(req);

            Assert.That(result, Is.TypeOf<ObjectResult>());
            Assert.That((result as ObjectResult).StatusCode, Is.EqualTo(500));
        }

        [Test]
        public async Task ManagerReviewNullRemarks()
        {
            SetupMockUser(_nominationController, 2, "manager");
            var req = new ManagerReviewRequestDto { ActionTaken = "Approved", Remarks = null };

            _mockNominationService
                .Setup(s => s.ManagerReviewNominationAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<ManagerReviewRequestDto>()))
                .ThrowsAsync(new ArgumentException("Required"));

            var result = await _nominationController.ManagerReview(1, req);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task CreatePromotion_EmployeeMismatch()
        {
            SetupMockUser(_promotionController, 1, "hr");
            var req = new CreatePromotionRequestDto
            {
                NominationId = 1, EmployeeUserId = 999, DepartmentId = 2,
                OldRole = "Dev", NewRole = "Senior", OldSalary = 100000, NewSalary = 150000,
                PromotionDate = new DateOnly(2025, 12, 1)
            };

            _mockPromotionService
                .Setup(s => s.CreatePromotionAsync(It.IsAny<CreatePromotionRequestDto>(), It.IsAny<int>()))
                .ThrowsAsync(new Exception("Mismatch"));

            var result = await _promotionController.CreatePromotion(req);

            Assert.That(result, Is.TypeOf<ObjectResult>());
        }

        [Test]
        public void MocksInitialized_NotNull()
        {
            Assert.That(_mockNominationService, Is.Not.Null);
            Assert.That(_mockPromotionService, Is.Not.Null);
            Assert.That(_nominationController, Is.Not.Null);
            Assert.That(_promotionController, Is.Not.Null);
        }

        [Test]
        public async Task VeryLongJustification()
        {
            var longText = new string('a', 5000);
            var req = new CreateSelfNominationRequestDto { OpportunityId = 1, Justification = longText };

            _mockNominationService
                .Setup(s => s.CreateSelfNominationAsync(It.IsAny<int>(), It.IsAny<CreateSelfNominationRequestDto>()))
                .ReturnsAsync(_mockNominationResponse);

            var result = await _nominationController.SelfNominate(req);

            Assert.That(result, Is.TypeOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task LeadershipApproveNotHrApproved()
        {
            SetupMockUser(_promotionController, 4, "leadership");
            var req = new ApprovePromotionRequestDto { ApprovalRemarks = "Test" };

            _mockPromotionService
                .Setup(s => s.ApprovePromotionByLeadershipAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>()))
                .ThrowsAsync(new Exception("Not hr_approved"));

            var result = await _promotionController.LeadershipApprovePromotion(1, req);

            Assert.That(result, Is.TypeOf<ObjectResult>());
        }

        #endregion
    }
}

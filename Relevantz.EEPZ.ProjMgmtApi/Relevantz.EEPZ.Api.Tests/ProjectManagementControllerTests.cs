using NUnit.Framework;
using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using eepzbackend.Controllers;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Api.Tests
{
    public class ProjectManagementControllerTests
    {
        private Mock<IProjectService> _projectServiceMock;
        private ProjectManagementController _controller;

        [SetUp]
        public void Setup()
        {
            _projectServiceMock = new Mock<IProjectService>();
            _controller = new ProjectManagementController(_projectServiceMock.Object);
        }

        // ================= GET ALL PROJECTS =================

        [Test]
        public async Task GetAllProjects_Returns200_WhenSuccess()
        {
            var response = new ApiResponse<List<ProjectResponse>> { Success = true };

            _projectServiceMock.Setup(x => x.GetAllProjectsAsync())
                .Returns(() => Task.FromResult(response));

            var result = await _controller.GetAllProjects();

            result.Should().BeOfType<OkObjectResult>();
        }

        [Test]
        public async Task GetAllProjects_Returns500_WhenFailure()
        {
            var response = new ApiResponse<List<ProjectResponse>> { Success = false };

            _projectServiceMock.Setup(x => x.GetAllProjectsAsync())
                .Returns(() => Task.FromResult(response));

            var result = await _controller.GetAllProjects();

            result.Should().BeOfType<ObjectResult>()
                  .Which.StatusCode.Should().Be(500);
        }

        // ================= GET PROJECT BY ID =================

        [Test]
        public async Task GetProjectById_Returns404_WhenNotFound()
        {
            var response = new ApiResponse<ProjectDetailResponse>
            {
                Success = false,
                Message = "not found"
            };

            _projectServiceMock.Setup(x => x.GetProjectByIdAsync(1))
                .Returns(() => Task.FromResult(response));

            var result = await _controller.GetProjectById(1);

            result.Should().BeOfType<NotFoundObjectResult>();
        }

        // ================= CREATE PROJECT =================

        [Test]
        public async Task CreateProject_Returns201_WhenCreated()
        {
            var request = new CreateProjectRequest();
            var response = new ApiResponse<ProjectResponse>
            {
                Success = true,
                Data = new ProjectResponse { ProjectId = 10 }
            };

            _projectServiceMock.Setup(x => x.CreateProjectAsync(request))
                .Returns(() => Task.FromResult(response));

            var result = await _controller.CreateProject(request);

            result.Should().BeOfType<CreatedAtActionResult>();
        }

        [Test]
        public async Task CreateProject_Returns400_WhenModelInvalid()
        {
            _controller.ModelState.AddModelError("Name", "Required");

            var result = await _controller.CreateProject(new CreateProjectRequest());

            result.Should().BeOfType<BadRequestObjectResult>();
        }

        // ================= UPDATE PROJECT =================

        [Test]
        public async Task UpdateProject_Returns400_WhenIdMismatch()
        {
            var request = new UpdateProjectRequest { ProjectId = 2 };

            var result = await _controller.UpdateProject(1, request);

            result.Should().BeOfType<BadRequestObjectResult>();
        }

        // ================= DELETE PROJECT =================

        [Test]
        public async Task DeleteProject_Returns400_WhenEmployeesMapped()
        {
            var response = new ApiResponse<bool>
            {
                Success = false,
                Message = "employees are still mapped"
            };

            _projectServiceMock.Setup(x => x.DeleteProjectAsync(1))
                .Returns(() => Task.FromResult(response));

            var result = await _controller.DeleteProject(1);

            result.Should().BeOfType<BadRequestObjectResult>();
        }

        // ================= UPDATE REPORTING MANAGERS =================

        [Test]
        public async Task UpdateReportingManagers_Returns200_WhenSuccess()
        {
            var request = new UpdateReportingManagersRequest { ProjectId = 1 };
            var response = new ApiResponse<bool> { Success = true };

            _projectServiceMock.Setup(x => x.UpdateReportingManagersAsync(request))
                .Returns(() => Task.FromResult(response));

            var result = await _controller.UpdateReportingManagers(1, request);

            result.Should().BeOfType<OkObjectResult>();
        }

        // ================= MAP EMPLOYEES =================

        [Test]
        public async Task MapEmployees_Returns404_WhenProjectNotFound()
        {
            var request = new MapEmployeesToProjectRequest { ProjectId = 1 };
            var response = new ApiResponse<bool> { Success = false, Message = "not found" };

            _projectServiceMock.Setup(x => x.MapEmployeesToProjectAsync(request))
                .Returns(() => Task.FromResult(response));

            var result = await _controller.MapEmployeesToProject(1, request);

            result.Should().BeOfType<NotFoundObjectResult>();
        }

        // ================= UNMAP EMPLOYEES =================

        [Test]
        public async Task UnmapEmployees_Returns200_WhenSuccess()
        {
            var request = new UnmapEmployeesFromProjectRequest { ProjectId = 1 };
            var response = new ApiResponse<bool> { Success = true };

            _projectServiceMock.Setup(x => x.UnmapEmployeesFromProjectAsync(request))
                .Returns(() => Task.FromResult(response));

            var result = await _controller.UnmapEmployeesFromProject(1, request);

            result.Should().BeOfType<OkObjectResult>();
        }

        // ================= GET AVAILABLE EMPLOYEES =================

        [Test]
        public async Task GetAvailableEmployees_Returns200_WhenSuccess()
        {
            var response = new ApiResponse<List<EmployeeBasicInfo>> { Success = true };

            _projectServiceMock.Setup(x => x.GetAvailableEmployeesAsync())
                .Returns(() => Task.FromResult(response));

            var result = await _controller.GetAvailableEmployees();

            result.Should().BeOfType<OkObjectResult>();
        }

        // ================= GET EMPLOYEE PRIMARY PROJECT =================

        [Test]
        public async Task GetAllEmployeesWithPrimaryProject_Returns200_WhenSuccess()
        {
            var response = new ApiResponse<Dictionary<int, EmployeePrimaryProjectInfo>> { Success = true };

            _projectServiceMock.Setup(x => x.GetAllEmployeesWithPrimaryProjectAsync())
                .Returns(() => Task.FromResult(response));

            var result = await _controller.GetAllEmployeesWithPrimaryProject();

            result.Should().BeOfType<OkObjectResult>();
        }
    }
}

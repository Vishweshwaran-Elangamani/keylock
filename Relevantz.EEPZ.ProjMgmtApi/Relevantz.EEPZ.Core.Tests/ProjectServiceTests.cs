using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Core.Tests
{
    public class ProjectServiceTests
    {
        private Mock<IProjectRepository> _repoMock;
        private Mock<ILogger<ProjectService>> _loggerMock;
        private ProjectService _service;

        [SetUp]
        public void Setup()
        {
            _repoMock = new Mock<IProjectRepository>();
            _loggerMock = new Mock<ILogger<ProjectService>>();
            _service = new ProjectService(_repoMock.Object, _loggerMock.Object);
        }

        // ================= CREATE PROJECT =================

        [Test]
        public async Task CreateProject_ReturnsError_WhenProjectNameExists()
        {
            var request = new CreateProjectRequest { ProjectName = "Test" };

            _repoMock.Setup(x => x.ProjectNameExistsAsync("Test", null))
                .Returns(() => Task.FromResult(true));

            var result = await _service.CreateProjectAsync(request);

            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo("Project name already exists."));
        }

        [Test]
        public async Task CreateProject_ReturnsSuccess_WhenValid()
        {
            var request = new CreateProjectRequest
            {
                ProjectName = "New Project",
                StartDate = DateTime.Now
            };

            _repoMock.Setup(x => x.ProjectNameExistsAsync(request.ProjectName, null))
                .Returns(() => Task.FromResult(false));

            _repoMock.Setup(x => x.EmployeeMasterExistsAsync(It.IsAny<int>()))
                .Returns(() => Task.FromResult(true));

            var createdProject = new Project
            {
                ProjectId = 1,
                ProjectName = "New Project",
                StartDate = DateOnly.FromDateTime(DateTime.Now)
            };

            _repoMock.Setup(x => x.CreateProjectAsync(It.IsAny<Project>()))
                .Returns(() => Task.FromResult(createdProject));

            _repoMock.Setup(x => x.GetProjectByIdAsync(1))
                .Returns(() => Task.FromResult(createdProject));

            var result = await _service.CreateProjectAsync(request);

            Assert.That(result.Success, Is.True);
        }

        // ================= UPDATE PROJECT =================

        [Test]
        public async Task UpdateProject_ReturnsError_WhenNotFound()
        {
            _repoMock.Setup(x => x.GetProjectByIdAsync(1))
                .Returns(() => Task.FromResult<Project?>(null));

            var result = await _service.UpdateProjectAsync(new UpdateProjectRequest { ProjectId = 1 });

            Assert.That(result.Success, Is.False);
        }

        // ================= DELETE PROJECT =================

        [Test]
        public async Task DeleteProject_ReturnsError_WhenNotExists()
        {
            _repoMock.Setup(x => x.ProjectExistsAsync(1))
                .Returns(() => Task.FromResult(false));

            var result = await _service.DeleteProjectAsync(1);

            Assert.That(result.Success, Is.False);
        }

        [Test]
        public async Task DeleteProject_ReturnsSuccess_WhenDeleted()
        {
            _repoMock.Setup(x => x.ProjectExistsAsync(1))
                .Returns(() => Task.FromResult(true));

            _repoMock.Setup(x => x.DeleteProjectAsync(1))
                .Returns(() => Task.FromResult(true));

            var result = await _service.DeleteProjectAsync(1);

            Assert.That(result.Success, Is.True);
        }

        // ================= GET PROJECT BY ID =================

        [Test]
        public async Task GetProjectById_ReturnsError_WhenNotFound()
        {
            _repoMock.Setup(x => x.GetProjectByIdAsync(1))
                .Returns(() => Task.FromResult<Project?>(null));

            var result = await _service.GetProjectByIdAsync(1);

            Assert.That(result.Success, Is.False);
        }

        // ================= MAP EMPLOYEES =================

        [Test]
        public async Task MapEmployees_ReturnsError_WhenProjectNotExists()
        {
            var request = new MapEmployeesToProjectRequest { ProjectId = 1 };

            _repoMock.Setup(x => x.ProjectExistsAsync(1))
                .Returns(() => Task.FromResult(false));

            var result = await _service.MapEmployeesToProjectAsync(request);

            Assert.That(result.Success, Is.False);
        }

        // ================= UNMAP EMPLOYEES =================

        [Test]
        public async Task UnmapEmployees_ReturnsError_WhenProjectNotExists()
        {
            var request = new UnmapEmployeesFromProjectRequest { ProjectId = 1 };

            _repoMock.Setup(x => x.ProjectExistsAsync(1))
                .Returns(() => Task.FromResult(false));

            var result = await _service.UnmapEmployeesFromProjectAsync(request);

            Assert.That(result.Success, Is.False);
        }

        // ================= GET ALL PROJECTS =================

        [Test]
        public async Task GetAllProjects_ReturnsSuccess()
        {
            _repoMock.Setup(x => x.GetAllProjectsAsync())
                .Returns(() => Task.FromResult(new List<Project>()));

            var result = await _service.GetAllProjectsAsync();

            Assert.That(result.Success, Is.True);
        }
    }
}

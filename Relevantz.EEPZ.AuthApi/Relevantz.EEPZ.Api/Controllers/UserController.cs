using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IProfileService _profileService;
        private readonly IUserManagementService _userManagementService;
        private readonly ICurrentUserService _currentUser;
        private readonly IValidator<UpdateProfileRequestDto> _updateProfileValidator;
        private readonly IValidator<CreateUserRequestDto> _createUserValidator;
        private readonly IValidator<UpdateUserRequestDto> _updateUserValidator;
        private readonly IValidator<AssignRoleDepartmentRequestDto> _assignRoleDepartmentValidator;

        // ✅ ONE constructor only — all dependencies injected properly
        public UserController(
            IProfileService profileService,
            IUserManagementService userManagementService,
            ICurrentUserService currentUser,
            IValidator<UpdateProfileRequestDto> updateProfileValidator,
            IValidator<CreateUserRequestDto> createUserValidator,
            IValidator<UpdateUserRequestDto> updateUserValidator,
            IValidator<AssignRoleDepartmentRequestDto> assignRoleDepartmentValidator)
        {
            _profileService                  = profileService;
            _userManagementService           = userManagementService;
            _currentUser                     = currentUser;
            _updateProfileValidator          = updateProfileValidator;
            _createUserValidator             = createUserValidator;
            _updateUserValidator             = updateUserValidator;
            _assignRoleDepartmentValidator   = assignRoleDepartmentValidator;
        }

        // GET api/user/profile
        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = await _currentUser.GetEmployeeIdAsync();
            if (userId is null)
                return Unauthorized(ApiResponseDto<ProfileResponseDto>.FailureResponse(MessageConstants.InvalidUserToken));

            var profile = await _profileService.GetProfileByUserIdAsync(userId.Value);
            return Ok(ApiResponseDto<ProfileResponseDto>.SuccessResponse(profile, MessageConstants.ProfileRetrievedSuccess));
        }

        // GET api/user/profile/{id}
        [HttpGet("profile/{id}")]
        public async Task<IActionResult> GetProfileById(int id)
        {
            var profile = await _profileService.GetProfileByUserIdAsync(id);
            return Ok(ApiResponseDto<ProfileResponseDto>.SuccessResponse(profile, MessageConstants.ProfileRetrievedSuccess));
        }

        // PUT api/user/profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequestDto request)
        {
            var validationResult = await _updateProfileValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
                return BadRequest(new { success = false, message = "Validation failed", errors = validationResult.Errors.Select(e => new { property = e.PropertyName, error = e.ErrorMessage }) });

            var userId = await _currentUser.GetEmployeeIdAsync();
            if (userId is null)
                return Unauthorized(ApiResponseDto<ProfileResponseDto>.FailureResponse(MessageConstants.InvalidUserToken));

            var updatedProfile = await _profileService.UpdateProfileAsync(userId.Value, request);
            return Ok(ApiResponseDto<ProfileResponseDto>.SuccessResponse(updatedProfile, MessageConstants.ProfileUpdatedSuccess));
        }

        // PUT api/user/profile/upload-photo
        [HttpPut("profile/upload-photo")]
        public async Task<IActionResult> UploadProfilePhoto([FromForm] IFormFile ProfilePhoto)
        {
            var userId = await _currentUser.GetEmployeeIdAsync();
            if (userId is null)
                return Unauthorized(ApiResponseDto<ProfileResponseDto>.FailureResponse(MessageConstants.InvalidUserToken));

            if (ProfilePhoto == null || ProfilePhoto.Length == 0)
                return BadRequest(ApiResponseDto<ProfileResponseDto>.FailureResponse(MessageConstants.NoPhotoProvided));

            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(ProfilePhoto.ContentType.ToLower()))
                return BadRequest(ApiResponseDto<ProfileResponseDto>.FailureResponse(MessageConstants.InvalidPhotoType));

            const long maxFileSize = 5 * 1024 * 1024;
            if (ProfilePhoto.Length > maxFileSize)
                return BadRequest(ApiResponseDto<ProfileResponseDto>.FailureResponse(MessageConstants.PhotoTooLarge));

            var request = new UpdateProfileRequestDto { ProfilePhoto = ProfilePhoto };
            var updatedProfile = await _profileService.UpdateProfileAsync(userId.Value, request);
            return Ok(ApiResponseDto<ProfileResponseDto>.SuccessResponse(updatedProfile, MessageConstants.PhotoUploadedSuccess));
        }

        // POST api/user/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequestDto request)
        {
            // ✅ _createUserValidator is now guaranteed non-null (single constructor)
            var validationResult = await _createUserValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
                return BadRequest(new { success = false, message = "Validation failed", errors = validationResult.Errors.Select(e => new { property = e.PropertyName, error = e.ErrorMessage }) });

            var createdByUserId = await _currentUser.GetEmployeeIdAsync();
            if (createdByUserId is null)
                return Unauthorized(ApiResponseDto<UserResponseDto>.FailureResponse(MessageConstants.InvalidUserToken));

            var user = await _userManagementService.CreateUserAsync(request, createdByUserId.Value);
            return Ok(ApiResponseDto<UserResponseDto>.SuccessResponse(user, MessageConstants.UserCreatedSuccess));
        }

        // PUT api/user/update
        [HttpPut("update")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequestDto request)
        {
            var validationResult = await _updateUserValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
                return BadRequest(new { success = false, message = "Validation failed", errors = validationResult.Errors.Select(e => new { property = e.PropertyName, error = e.ErrorMessage }) });

            var updatedByUserId = await _currentUser.GetEmployeeIdAsync();
            if (updatedByUserId is null)
                return Unauthorized(ApiResponseDto<UserResponseDto>.FailureResponse(MessageConstants.InvalidUserToken));

            var user = await _userManagementService.UpdateUserAsync(request, updatedByUserId.Value);
            return Ok(ApiResponseDto<UserResponseDto>.SuccessResponse(user, MessageConstants.UserUpdatedSuccess));
        }

        // GET api/user/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _userManagementService.GetUserByIdAsync(id);
            return Ok(ApiResponseDto<UserResponseDto>.SuccessResponse(user, MessageConstants.UserRetrievedSuccess));
        }

        // GET api/user/all
        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManagementService.GetAllUsersAsync();
            return Ok(ApiResponseDto<List<UserResponseDto>>.SuccessResponse(users, MessageConstants.UsersRetrievedSuccess));
        }

        // POST api/user/deactivate/{id}
        [HttpPost("deactivate/{id}")]
        public async Task<IActionResult> DeactivateUser(int id)
        {
            var callerEmpId = await _currentUser.GetEmployeeIdAsync() ?? 0;
            await _userManagementService.DeactivateUserAsync(id, callerEmpId);
            return Ok(ApiResponseDto<object>.SuccessResponse(null, MessageConstants.UserDeactivatedSuccess));
        }

        // POST api/user/activate/{id}
        [HttpPost("activate/{id}")]
        public async Task<IActionResult> ActivateUser(int id)
        {
            var callerEmpId = await _currentUser.GetEmployeeIdAsync() ?? 0;
            await _userManagementService.ActivateUserAsync(id, callerEmpId);
            return Ok(ApiResponseDto<object>.SuccessResponse(null, MessageConstants.UserActivatedSuccess));
        }

        // GET api/user/manager/{id}/employees
        [HttpGet("manager/{id}/employees")]
        public async Task<IActionResult> GetEmployeesByManager(int id)
        {
            var currentUserId = await _currentUser.GetEmployeeIdAsync();
            if (currentUserId is null)
                return Unauthorized();

            if (!_currentUser.IsHR && !_currentUser.IsAdmin && currentUserId.Value != id)
                return StatusCode(403, ApiResponseDto<List<UserResponseDto>>.FailureResponse(MessageConstants.ManagerForbidden));

            var employees = await _userManagementService.GetEmployeesByManagerAsync(id);
            return Ok(ApiResponseDto<List<UserResponseDto>>.SuccessResponse(employees, MessageConstants.EmployeesRetrievedSuccess));
        }

        // POST api/user/assign-role-department
        [HttpPost("assign-role-department")]
        public async Task<IActionResult> AssignRoleAndDepartment([FromBody] AssignRoleDepartmentRequestDto request)
        {
            var validationResult = await _assignRoleDepartmentValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
                return BadRequest(new { success = false, message = "Validation failed", errors = validationResult.Errors.Select(e => new { property = e.PropertyName, error = e.ErrorMessage }) });

            await _userManagementService.AssignRoleAndDepartmentAsync(request);
            return Ok(ApiResponseDto<object>.SuccessResponse(null, MessageConstants.RoleDepartmentAssignedSuccess));
        }

        // GET api/user/next-employee-id
        [HttpGet("next-employee-id")]
        public async Task<IActionResult> GetNextEmployeeCompanyId()
        {
            var nextId = await _userManagementService.GetNextEmployeeCompanyIdAsync();
            return Ok(ApiResponseDto<string>.SuccessResponse(nextId, MessageConstants.NextEmpIdSuccess));
        }
    }
}

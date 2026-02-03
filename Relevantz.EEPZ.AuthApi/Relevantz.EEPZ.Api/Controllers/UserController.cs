using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Relevantz.EEPZ.Common.Constants;
using FluentValidation;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Provides endpoints for user profile management and user administration,
    /// including profile retrieval/update, photo upload, user CRUD, activation,
    /// manager-employee queries, and role/department assignments.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IProfileService _profileService;
        private readonly IUserManagementService _userManagementService;
        private readonly IValidator<UpdateProfileRequestDto> _updateProfileValidator;
        private readonly IValidator<CreateUserRequestDto> _createUserValidator;
        private readonly IValidator<UpdateUserRequestDto> _updateUserValidator;
        private readonly IValidator<AssignRoleDepartmentRequestDto> _assignRoleDepartmentValidator;

        public UserController(
            IProfileService profileService,
            IUserManagementService userManagementService,
            IValidator<UpdateProfileRequestDto> updateProfileValidator,
            IValidator<CreateUserRequestDto> createUserValidator,
            IValidator<UpdateUserRequestDto> updateUserValidator,
            IValidator<AssignRoleDepartmentRequestDto> assignRoleDepartmentValidator)
        {
            _profileService = profileService;
            _userManagementService = userManagementService;
            _updateProfileValidator = updateProfileValidator;
            _createUserValidator = createUserValidator;
            _updateUserValidator = updateUserValidator;
            _assignRoleDepartmentValidator = assignRoleDepartmentValidator;
        }

        /// <summary>
        /// Gets the current logged-in user's profile.
        /// </summary>
        /// <returns>200 OK with profile, 400/401/500 on error</returns>
        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(
                    ApiResponseDto<ProfileResponseDto>.FailureResponse(
                        MessageConstants.InvalidUserToken));
            }
            var profile = await _profileService.GetProfileByUserIdAsync(userId);
            return Ok(
                ApiResponseDto<ProfileResponseDto>.SuccessResponse(
                    profile,
                    MessageConstants.ProfileRetrievedSuccess));
        }

        /// <summary>
        /// Gets profile for specific user by ID (Admin/HR only).
        /// </summary>
        /// <param name="Id">User identifier</param>
        /// <returns>200 OK with profile, 400/500 on error</returns>
        [HttpGet("profile/{Id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetProfileById(int Id)
        {
            var profile = await _profileService.GetProfileByUserIdAsync(Id);
            return Ok(
                ApiResponseDto<ProfileResponseDto>.SuccessResponse(
                    profile,
                    MessageConstants.ProfileRetrievedSuccess));
        }

        /// <summary>
        /// Updates current user's profile.
        /// </summary>
        /// <param name="request">Profile update data</param>
        /// <returns>200 OK on success, 400/401/500 on error</returns>
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequestDto request)
        {
            var validationResult = await _updateProfileValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Validation failed",
                    errors = validationResult.Errors.Select(e => new
                    {
                        property = e.PropertyName,
                        error = e.ErrorMessage
                    })
                });
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(
                    ApiResponseDto<ProfileResponseDto>.FailureResponse(
                        MessageConstants.InvalidUserToken));
            }

            var updatedProfile = await _profileService.UpdateProfileAsync(userId, request);
            return Ok(
                ApiResponseDto<ProfileResponseDto>.SuccessResponse(
                    updatedProfile,
                    MessageConstants.ProfileUpdatedSuccess));
        }

        /// <summary>
        /// Uploads/updates current user's profile photo (JPEG/PNG/GIF/WEBP, 5MB max).
        /// </summary>
        /// <param name="ProfilePhoto">Image file</param>
        /// <returns>200 OK on success, 400/401/500 on error</returns>
        [HttpPut("profile/upload-photo")]
        public async Task<IActionResult> UploadProfilePhoto([FromForm] IFormFile ProfilePhoto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(
                    ApiResponseDto<ProfileResponseDto>.FailureResponse(
                        MessageConstants.InvalidUserToken));
            }

            if (ProfilePhoto == null || ProfilePhoto.Length == 0)
            {
                return BadRequest(
                    ApiResponseDto<ProfileResponseDto>.FailureResponse(
                        MessageConstants.NoPhotoProvided));
            }

            var allowedTypes = new[]
            {
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "image/webp"
            };
            if (!allowedTypes.Contains(ProfilePhoto.ContentType.ToLower()))
            {
                return BadRequest(
                    ApiResponseDto<ProfileResponseDto>.FailureResponse(
                        MessageConstants.InvalidPhotoType));
            }

            const long maxFileSize = 5 * 1024 * 1024;
            if (ProfilePhoto.Length > maxFileSize)
            {
                return BadRequest(
                    ApiResponseDto<ProfileResponseDto>.FailureResponse(
                        $"{MessageConstants.PhotoTooLarge} Your file is {ProfilePhoto.Length / 1024 / 1024:F2}MB."));
            }

            var request = new UpdateProfileRequestDto
            {
                ProfilePhoto = ProfilePhoto
            };
            var updatedProfile = await _profileService.UpdateProfileAsync(userId, request);
            return Ok(
                ApiResponseDto<ProfileResponseDto>.SuccessResponse(
                    updatedProfile,
                    MessageConstants.PhotoUploadedSuccess));
        }

        /// <summary>
        /// Creates new user (Admin operation).
        /// </summary>
        /// <param name="request">User creation data</param>
        /// <returns>200 OK on success, 400 on error</returns>
        [HttpPost("create")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequestDto request)
        {
            var validationResult = await _createUserValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Validation failed",
                    errors = validationResult.Errors.Select(e => new
                    {
                        property = e.PropertyName,
                        error = e.ErrorMessage
                    })
                });
            }

            var createdByUserId =
                int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _userManagementService.CreateUserAsync(
                request,
                createdByUserId);
            return Ok(
                ApiResponseDto<UserResponseDto>.SuccessResponse(
                    user,
                    MessageConstants.UserCreatedSuccess));
        }

        /// <summary>
        /// Updates existing user (Admin operation).
        /// </summary>
        /// <param name="request">User update data</param>
        /// <returns>200 OK on success, 400 on error</returns>
        [HttpPut("update")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequestDto request)
        {
            var validationResult = await _updateUserValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Validation failed",
                    errors = validationResult.Errors.Select(e => new
                    {
                        property = e.PropertyName,
                        error = e.ErrorMessage
                    })
                });
            }

            var updatedByUserId =
                int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _userManagementService.UpdateUserAsync(
                request,
                updatedByUserId);
            return Ok(
                ApiResponseDto<UserResponseDto>.SuccessResponse(
                    user,
                    MessageConstants.UserUpdatedSuccess));
        }

        /// <summary>
        /// Gets user by identifier.
        /// </summary>
        /// <param name="id">User ID</param>
        /// <returns>200 OK with user, 404 if not found</returns>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _userManagementService.GetUserByIdAsync(id);
            return Ok(
                ApiResponseDto<UserResponseDto>.SuccessResponse(
                    user,
                    MessageConstants.UserRetrievedSuccess));
        }

        /// <summary>
        /// Gets all users.
        /// </summary>
        /// <returns>200 OK with users list</returns>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManagementService.GetAllUsersAsync();
            return Ok(
                ApiResponseDto<List<UserResponseDto>>.SuccessResponse(
                    users,
                    MessageConstants.UsersRetrievedSuccess));
        }

        /// <summary>
        /// Deactivates a user.
        /// </summary>
        /// <param name="Id">User ID to deactivate</param>
        /// <returns>200 OK on success, 400 on error</returns>
        [HttpPost("deactivate/{Id}")]
        public async Task<IActionResult> DeactivateUser(int Id)
        {
            await _userManagementService.DeactivateUserAsync(Id);
            return Ok(
                ApiResponseDto<object>.SuccessResponse(
                    null,
                    MessageConstants.UserDeactivatedSuccess));
        }

        /// <summary>
        /// Activates a deactivated user.
        /// </summary>
        /// <param name="Id">User ID to activate</param>
        /// <returns>200 OK on success, 400 on error</returns>
        [HttpPost("activate/{Id}")]
        public async Task<IActionResult> ActivateUser(int Id)
        {
            await _userManagementService.ActivateUserAsync(Id);
            return Ok(
                ApiResponseDto<object>.SuccessResponse(
                    null,
                    MessageConstants.UserActivatedSuccess));
        }

        /// <summary>
        /// Gets employees reporting to manager (Manager/HR/Admin only).
        /// </summary>
        /// <param name="managerId">Manager user ID</param>
        /// <returns>200 OK with employees, 403/404/500 on error</returns>
        [HttpGet("manager/{id}/employees")]
        public async Task<IActionResult> GetEmployeesByManager(int id)
        {
            var currentUserId =
                int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (userRole != "HR" &&
                userRole != "Admin" &&
                currentUserId != id)
            {
                return StatusCode(
                    403,
                    ApiResponseDto<List<UserResponseDto>>.FailureResponse(
                        MessageConstants.ManagerForbidden));
            }

            var employees =
                await _userManagementService.GetEmployeesByManagerAsync(id);
            return Ok(
                ApiResponseDto<List<UserResponseDto>>.SuccessResponse(
                    employees,
                    MessageConstants.EmployeesRetrievedSuccess));
        }

        /// <summary>
        /// Assigns role and department to user.
        /// </summary>
        /// <param name="request">Assignment data</param>
        /// <returns>200 OK on success, 400 on error</returns>
        [HttpPost("assign-role-department")]
        public async Task<IActionResult> AssignRoleAndDepartment(
            [FromBody] AssignRoleDepartmentRequestDto request)
        {
            var validationResult = await _assignRoleDepartmentValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Validation failed",
                    errors = validationResult.Errors.Select(e => new
                    {
                        property = e.PropertyName,
                        error = e.ErrorMessage
                    })
                });
            }

            await _userManagementService.AssignRoleAndDepartmentAsync(request);
            return Ok(
                ApiResponseDto<object>.SuccessResponse(
                    null,
                    MessageConstants.RoleDepartmentAssignedSuccess));
        }

        /// <summary>
        /// Gets next available employee company ID (Admin/HR only).
        /// </summary>
        /// <returns>200 OK with next ID, 500 on error</returns>
        [HttpGet("next-employee-id")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetNextEmployeeCompanyId()
        {
            var nextId =
                await _userManagementService.GetNextEmployeeCompanyIdAsync();
            return Ok(
                ApiResponseDto<string>.SuccessResponse(
                    nextId,
                    MessageConstants.NextEmpIdSuccess));
        }
    }
}

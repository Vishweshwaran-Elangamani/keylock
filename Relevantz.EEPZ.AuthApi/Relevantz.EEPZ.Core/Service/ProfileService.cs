using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Core.Service
{
    public class ProfileService : IProfileService
    {
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IUserAuthenticationRepository _userAuthRepository;
        private readonly IProfileImageRepository _profileImageRepository;
        private readonly EEPZDbContext _context;

        public ProfileService(
            IUserProfileRepository userProfileRepository,
            IUserAuthenticationRepository userAuthRepository,
            IProfileImageRepository profileImageRepository,
            EEPZDbContext context)
        {
            _userProfileRepository = userProfileRepository;
            _userAuthRepository = userAuthRepository;
            _profileImageRepository = profileImageRepository;
            _context = context;
        }

        public async Task<ApiResponseDto<ProfileResponseDto>> GetProfileByUserIdAsync(int userId)
        {
            var user = await _context.Userauthentications
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(ed => ed.Department)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(ed => ed.Role)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Addresses)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return ApiResponseDto<ProfileResponseDto>.FailureResponse(Constants.Messages.UserNotFound);
            }

            var employee = user.Employee;
            var profile = employee?.Userprofile;

            if (profile == null)
            {
                return ApiResponseDto<ProfileResponseDto>.FailureResponse("Profile not found");
            }

            var employeeDetails = employee.Employeedetailsmasters?.FirstOrDefault();
            var currentAddress = employee.Addresses?.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Current);
            var permanentAddress = employee.Addresses?.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Permanent);

            // Retrieve profile photo from MongoDB
            string profilePhotoBase64 = null;
            var profileImage = await _profileImageRepository.GetImageAsync(employee.EmployeeId);
            if (profileImage != null && profileImage.ImageData != null)
            {
                profilePhotoBase64 = Convert.ToBase64String(profileImage.ImageData);
                EEPZBusinessLog.Information($"Profile image retrieved from MongoDB for EmployeeId: {employee.EmployeeId}");
            }

            var response = MapToProfileResponse(profile, user.Email, employee, employeeDetails, currentAddress, permanentAddress, profilePhotoBase64);

            return ApiResponseDto<ProfileResponseDto>.SuccessResponse(response, "Profile retrieved successfully");
        }

        public async Task<ApiResponseDto<ProfileResponseDto>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request)
        {
            EEPZBusinessLog.Information($"Updating profile for UserId: {userId}");

            var user = await _context.Userauthentications
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(ed => ed.Department)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(ed => ed.Role)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Addresses)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return ApiResponseDto<ProfileResponseDto>.FailureResponse(Constants.Messages.UserNotFound);
            }

            var employee = user.Employee;
            var profile = employee?.Userprofile;

            if (profile == null)
            {
                return ApiResponseDto<ProfileResponseDto>.FailureResponse("Profile not found");
            }

            // Update profile information - only if values are provided
            if (!string.IsNullOrEmpty(request.FirstName)) profile.FirstName = request.FirstName;
            if (request.MiddleName != null) profile.MiddleName = request.MiddleName;
            if (!string.IsNullOrEmpty(request.LastName)) profile.LastName = request.LastName;
            if (request.CallingName != null) profile.CallingName = request.CallingName;
            if (!string.IsNullOrEmpty(request.Gender)) profile.Gender = request.Gender;
            if (request.DateOfBirthOfficial.HasValue) profile.DateOfBirthOfficial = request.DateOfBirthOfficial;
            if (request.DateOfBirthActual.HasValue) profile.DateOfBirthActual = request.DateOfBirthActual;
            if (request.MobileNumber != null) profile.MobileNumber = request.MobileNumber;
            if (request.AlternateNumber != null) profile.AlternateNumber = request.AlternateNumber;
            if (request.PersonalEmail != null) profile.PersonalEmail = request.PersonalEmail;
            if (request.MaritalStatus != null) profile.MaritalStatus = request.MaritalStatus;
            if (request.Nationality != null) profile.Nationality = request.Nationality;

            // Profile photo upload with optimization and MongoDB storage
            if (request.ProfilePhoto != null && request.ProfilePhoto.Length > 0)
            {
                EEPZBusinessLog.Information($"Processing profile photo upload for UserId: {userId}, EmployeeId: {employee.EmployeeId}");

                using var imageStream = request.ProfilePhoto.OpenReadStream();
                using var image = await Image.LoadAsync(imageStream);

                if (image.Width > 300 || image.Height > 300)
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Size = new Size(300, 300),
                        Mode = ResizeMode.Max
                    }));
                }

                using var ms = new MemoryStream();
                await image.SaveAsJpegAsync(ms, new JpegEncoder { Quality = 85 });
                byte[] compressedImageData = ms.ToArray();

                await _profileImageRepository.UploadImageAsync(employee.EmployeeId, compressedImageData, request.ProfilePhoto.FileName ?? $"profile_{employee.EmployeeId}.jpg", "image/jpeg");

                if (profile.ProfilePhoto != null && profile.ProfilePhoto.Length > 0)
                {
                    profile.ProfilePhoto = null;
                    EEPZBusinessLog.Information($"Removed profile photo from MySQL for EmployeeId: {employee.EmployeeId}");
                }
            }

            await _userProfileRepository.UpdateAsync(profile);

            // Update Current Address - only if provided
            if (request.CurrentAddress != null)
            {
                var currentAddress = employee.Addresses?.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Current);

                if (currentAddress != null)
                {
                    currentAddress.DoorNumber = request.CurrentAddress.DoorNumber;
                    currentAddress.Street = request.CurrentAddress.Street;
                    currentAddress.Landmark = request.CurrentAddress.Landmark;
                    currentAddress.Area = request.CurrentAddress.Area;
                    currentAddress.City = request.CurrentAddress.City;
                    currentAddress.State = request.CurrentAddress.State;
                    currentAddress.Country = request.CurrentAddress.Country ?? "India";
                    currentAddress.PinCode = request.CurrentAddress.PinCode;
                    currentAddress.UpdatedAt = DateTime.UtcNow;

                    _context.Addresses.Update(currentAddress);
                }
                else
                {
                    var newCurrentAddress = new Address
                    {
                        EmployeeId = employee.EmployeeId,
                        AddressType = Constants.AddressTypes.Current,
                        DoorNumber = request.CurrentAddress.DoorNumber,
                        Street = request.CurrentAddress.Street,
                        Landmark = request.CurrentAddress.Landmark,
                        Area = request.CurrentAddress.Area,
                        City = request.CurrentAddress.City,
                        State = request.CurrentAddress.State,
                        Country = request.CurrentAddress.Country ?? "India",
                        PinCode = request.CurrentAddress.PinCode,
                        CreatedAt = DateTime.UtcNow
                    };

                    await _context.Addresses.AddAsync(newCurrentAddress);
                }
            }

            // Update Permanent Address - only if provided
            if (request.PermanentAddress != null)
            {
                var permanentAddress = employee.Addresses?.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Permanent);

                if (permanentAddress != null)
                {
                    permanentAddress.DoorNumber = request.PermanentAddress.DoorNumber;
                    permanentAddress.Street = request.PermanentAddress.Street;
                    permanentAddress.Landmark = request.PermanentAddress.Landmark;
                    permanentAddress.Area = request.PermanentAddress.Area;
                    permanentAddress.City = request.PermanentAddress.City;
                    permanentAddress.State = request.PermanentAddress.State;
                    permanentAddress.Country = request.PermanentAddress.Country ?? "India";
                    permanentAddress.PinCode = request.PermanentAddress.PinCode;
                    permanentAddress.UpdatedAt = DateTime.UtcNow;

                    _context.Addresses.Update(permanentAddress);
                }
                else
                {
                    var newPermanentAddress = new Address
                    {
                        EmployeeId = employee.EmployeeId,
                        AddressType = Constants.AddressTypes.Permanent,
                        DoorNumber = request.PermanentAddress.DoorNumber,
                        Street = request.PermanentAddress.Street,
                        Landmark = request.PermanentAddress.Landmark,
                        Area = request.PermanentAddress.Area,
                        City = request.PermanentAddress.City,
                        State = request.PermanentAddress.State,
                        Country = request.PermanentAddress.Country ?? "India",
                        PinCode = request.PermanentAddress.PinCode,
                        CreatedAt = DateTime.UtcNow
                    };

                    await _context.Addresses.AddAsync(newPermanentAddress);
                }
            }

            await _context.SaveChangesAsync();

            await _context.Entry(employee).Collection(e => e.Addresses).LoadAsync();

            var employeeDetails = employee.Employeedetailsmasters?.FirstOrDefault();
            var updatedCurrentAddress = employee.Addresses?.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Current);
            var updatedPermanentAddress = employee.Addresses?.FirstOrDefault(a => a.AddressType == Constants.AddressTypes.Permanent);

            string profilePhotoBase64 = null;
            var profileImage = await _profileImageRepository.GetImageAsync(employee.EmployeeId);
            if (profileImage != null && profileImage.ImageData != null)
            {
                profilePhotoBase64 = Convert.ToBase64String(profileImage.ImageData);
            }

            var response = MapToProfileResponse(profile, user.Email, employee, employeeDetails, updatedCurrentAddress, updatedPermanentAddress, profilePhotoBase64);

            EEPZBusinessLog.Information($"Profile updated successfully for UserId: {userId}");

            return ApiResponseDto<ProfileResponseDto>.SuccessResponse(response, Constants.Messages.ProfileUpdatedSuccess);
        }

        private ProfileResponseDto MapToProfileResponse(
            Userprofile profile,
            string email,
            Employee employee,
            Employeedetailsmaster employeeDetails,
            Address currentAddress,
            Address permanentAddress,
            string profilePhotoBase64 = null)
        {
            return new ProfileResponseDto
            {
                ProfileId = profile.ProfileId,
                EmployeeId = profile.EmployeeId,
                EmployeeCompanyId = employee.EmployeeCompanyId,
                FirstName = profile.FirstName,
                MiddleName = profile.MiddleName,
                LastName = profile.LastName,
                CallingName = profile.CallingName,
                ReferredBy = profile.ReferredBy,
                Gender = profile.Gender,
                DateOfBirthOfficial = profile.DateOfBirthOfficial,
                DateOfBirthActual = profile.DateOfBirthActual,
                MobileNumber = profile.MobileNumber,
                AlternateNumber = profile.AlternateNumber,
                PersonalEmail = profile.PersonalEmail,
                Email = email,

                DepartmentName = employeeDetails?.Department?.DepartmentName,
                RoleName = employeeDetails?.Role?.RoleName,
                EmploymentType = employee?.EmploymentType,
                EmploymentStatus = employee?.EmploymentStatus,
                JoiningDate = employee?.JoiningDate,
                WorkLocation = employee?.WorkLocation,
                EmployeeType = employee?.EmployeeType,

                MaritalStatus = profile.MaritalStatus,
                Nationality = profile.Nationality,

                // Profile photo from MongoDB as Base64
                ProfilePhotoBase64 = profilePhotoBase64,

                CurrentAddress = currentAddress != null ? new AddressDto
                {
                    AddressId = currentAddress.AddressId,
                    AddressType = currentAddress.AddressType,
                    DoorNumber = currentAddress.DoorNumber,
                    Street = currentAddress.Street,
                    Landmark = currentAddress.Landmark,
                    Area = currentAddress.Area,
                    City = currentAddress.City,
                    State = currentAddress.State,
                    Country = currentAddress.Country,
                    PinCode = currentAddress.PinCode
                } : null,

                PermanentAddress = permanentAddress != null ? new AddressDto
                {
                    AddressId = permanentAddress.AddressId,
                    AddressType = permanentAddress.AddressType,
                    DoorNumber = permanentAddress.DoorNumber,
                    Street = permanentAddress.Street,
                    Landmark = permanentAddress.Landmark,
                    Area = permanentAddress.Area,
                    City = permanentAddress.City,
                    State = permanentAddress.State,
                    Country = permanentAddress.Country,
                    PinCode = permanentAddress.PinCode
                } : null
            };
        }
    }
}

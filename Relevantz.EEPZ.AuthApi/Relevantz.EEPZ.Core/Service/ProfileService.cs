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

namespace Relevantz.EEPZ.Core.Service
{
    public class ProfileService : IProfileService
    {
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IUserAuthenticationRepository _userAuthRepository;
        private readonly EEPZDbContext _context;

        public ProfileService(
            IUserProfileRepository userProfileRepository,
            IUserAuthenticationRepository userAuthRepository,
            EEPZDbContext context)
        {
            _userProfileRepository = userProfileRepository;
            _userAuthRepository = userAuthRepository;
            _context = context;
        }

        public async Task<ApiResponseDto<ProfileResponseDto>> GetProfileByUserIdAsync(int userId)
        {
            try
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

                var response = MapToProfileResponse(profile, user.Email, employee, employeeDetails, currentAddress, permanentAddress);

                return ApiResponseDto<ProfileResponseDto>.SuccessResponse(response, "Profile retrieved successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error retrieving profile for UserId: {userId}", ex);
                return ApiResponseDto<ProfileResponseDto>.FailureResponse("An error occurred while retrieving profile");
            }
        }

        public async Task<ApiResponseDto<ProfileResponseDto>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request)
        {
            try
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
                if (!string.IsNullOrEmpty(request.FirstName))
                    profile.FirstName = request.FirstName;

                if (request.MiddleName != null)
                    profile.MiddleName = request.MiddleName;

                if (!string.IsNullOrEmpty(request.LastName))
                    profile.LastName = request.LastName;

                if (request.CallingName != null)
                    profile.CallingName = request.CallingName;

                if (!string.IsNullOrEmpty(request.Gender))
                    profile.Gender = request.Gender;

                if (request.DateOfBirthOfficial.HasValue)
                    profile.DateOfBirthOfficial = request.DateOfBirthOfficial;

                if (request.DateOfBirthActual.HasValue)
                    profile.DateOfBirthActual = request.DateOfBirthActual;

                if (request.MobileNumber != null)
                    profile.MobileNumber = request.MobileNumber;

                if (request.AlternateNumber != null)
                    profile.AlternateNumber = request.AlternateNumber;

                if (request.PersonalEmail != null)
                    profile.PersonalEmail = request.PersonalEmail;

                if (request.MaritalStatus != null)
                    profile.MaritalStatus = request.MaritalStatus;

                if (request.Nationality != null)
                    profile.Nationality = request.Nationality;

                // Profile photo upload with optimization
                if (request.ProfilePhoto != null && request.ProfilePhoto.Length > 0)
                {
                    EEPZBusinessLog.Information($"Processing profile photo upload for UserId: {userId}");
                    EEPZBusinessLog.Information($"Original file size: {request.ProfilePhoto.Length} bytes ({request.ProfilePhoto.Length / 1024.0:F2} KB)");

                    try
                    {
                        using var imageStream = request.ProfilePhoto.OpenReadStream();
                        using var image = await Image.LoadAsync(imageStream);

                        EEPZBusinessLog.Information($"Original image dimensions: {image.Width}x{image.Height}");

                        // Resize to max 300x300 for profile photos
                        if (image.Width > 300 || image.Height > 300)
                        {
                            image.Mutate(x => x.Resize(new ResizeOptions
                            {
                                Size = new Size(300, 300),
                                Mode = ResizeMode.Max
                            }));

                            EEPZBusinessLog.Information($"Resized image dimensions: {image.Width}x{image.Height}");
                        }

                        // Compress as JPEG with quality 85
                        using var ms = new MemoryStream();
                        await image.SaveAsJpegAsync(ms, new JpegEncoder { Quality = 85 });
                        profile.ProfilePhoto = ms.ToArray();

                        EEPZBusinessLog.Information($"Profile photo optimized successfully");
                        EEPZBusinessLog.Information($"Original size: {request.ProfilePhoto.Length} bytes ({request.ProfilePhoto.Length / 1024.0:F2} KB)");
                        EEPZBusinessLog.Information($"Compressed size: {ms.Length} bytes ({ms.Length / 1024.0:F2} KB)");
                        EEPZBusinessLog.Information($"Compression ratio: {(1 - (double)ms.Length / request.ProfilePhoto.Length) * 100:F2}%");
                    }
                    catch (Exception photoEx)
                    {
                        EEPZBusinessLog.Error($"Error processing profile photo for UserId: {userId}", photoEx);
                        return ApiResponseDto<ProfileResponseDto>.FailureResponse("Failed to process profile photo. Please ensure the file is a valid image.");
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

                var response = MapToProfileResponse(profile, user.Email, employee, employeeDetails, updatedCurrentAddress, updatedPermanentAddress);

                EEPZBusinessLog.Information($"Profile updated successfully for UserId: {userId}");

                return ApiResponseDto<ProfileResponseDto>.SuccessResponse(response, Constants.Messages.ProfileUpdatedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error updating profile for UserId: {userId}", ex);
                return ApiResponseDto<ProfileResponseDto>.FailureResponse("An error occurred while updating profile");
            }
        }

        private ProfileResponseDto MapToProfileResponse(
            Userprofile profile,
            string email,
            Employee employee,
            Employeedetailsmaster employeeDetails,
            Address currentAddress,
            Address permanentAddress)
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

                // Profile photo as Base64
                ProfilePhotoBase64 = profile.ProfilePhoto != null
                    ? Convert.ToBase64String(profile.ProfilePhoto)
                    : null,

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

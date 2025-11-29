using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;

using Relevantz.EEPZ.Data.DBContexts;

namespace eepzbackend.Controllers

{

    [ApiController]

    [Route("api/[controller]")]

    public class UserProfilesController : ControllerBase

    {

        private readonly EEPZDbContext _context;

        public UserProfilesController(EEPZDbContext context)

        {

            _context = context;

        }

        [HttpGet("all")]

        public async Task<IActionResult> GetAllUserProfiles()

        {

            var users = await _context.Userprofiles

                .Select(u => new

                {

                    u.ProfileId,

                    u.EmployeeId,

                    u.FirstName,

                    u.LastName,

                    u.PersonalEmail,

                    u.Gender,

                    u.MobileNumber

                })

                .ToListAsync();

            return Ok(new { success = true, data = users });

        }

    }

}


using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.DBContexts;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class RecognitionRewardRepository : IRecognitionRewardRepository
    {
        private readonly EEPZDbContext _context;

        public RecognitionRewardRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<List<RecognitionRewardDto>> GetRecognitionRewardsAsync()
        {
            var query = from reward in _context.Recognitionrewards
                        join employee in _context.Employees on reward.EmployeeId equals employee.EmployeeId
                        join userAuth in _context.Userauthentications on reward.SubmittedBy equals userAuth.UserId
                        join userProfile in _context.Userprofiles on userAuth.EmployeeId equals userProfile.EmployeeId
                        select new RecognitionRewardDto
                        {
                            EmployeeId = employee.EmployeeId,
                            EmployeeCompanyId = employee.EmployeeCompanyId,
                            EmployeeName = userProfile.FirstName + " " + userProfile.LastName,
                            RewardType = reward.RewardType,
                            AmountGrade = reward.AmountGrade,
                            Reason = reward.Reason,
                            RewardDate = reward.RewardDate,
                            SubmittedByName = userProfile.FirstName + " " + userProfile.LastName
                        };

            return await query.OrderByDescending(r => r.RewardDate).ToListAsync();
        }
    }
}

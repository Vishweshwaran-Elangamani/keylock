using System;
using System.Text.RegularExpressions;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Common.Validators
{
    public static class EligibilityValidator
    {
        public static bool ValidateEligibility(Employee employee, Internalopportunity opportunity, decimal? performanceRating, DateTime? currentRoleStartDate)
        {
            if (opportunity.EligibilityCriteria == null)
                return true;

            var criteria = opportunity.EligibilityCriteria.ToLower();

            // 1. Minimum years as developer
            var yearsRegex = new Regex(@"minimum (\d+) years as");
            var yearsMatch = yearsRegex.Match(criteria);
            if (yearsMatch.Success)
            {
                int minYears = int.Parse(yearsMatch.Groups[1].Value);
                int employeeYears = DateTime.Now.Year - employee.JoiningDate.Year;
                if (employeeYears < minYears)
                    return false;
            }

            // 2. Performance Rating
            var perfRegex = new Regex(@"performance rating (\d+(?:\.\d+)?)\+");
            var perfMatch = perfRegex.Match(criteria);
            if (perfMatch.Success && performanceRating.HasValue)
            {
                decimal minRating = decimal.Parse(perfMatch.Groups[1].Value);
                if (performanceRating.Value < minRating)
                    return false;
            }

            // 3. Tenure in current role
            var tenureRegex = new Regex(@"tenure in current role (\d+)\+ year");
            var tenureMatch = tenureRegex.Match(criteria);
            if (tenureMatch.Success && currentRoleStartDate.HasValue)
            {
                int minYears = int.Parse(tenureMatch.Groups[1].Value);
                int tenureYears = (DateTime.Now.Year - currentRoleStartDate.Value.Year);
                if (tenureYears < minYears)
                    return false;
            }

            return true;
        }
    }
}

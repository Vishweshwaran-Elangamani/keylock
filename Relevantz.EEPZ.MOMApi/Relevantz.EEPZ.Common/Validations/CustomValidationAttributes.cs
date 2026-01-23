using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.Validation
{
    /// <summary>
    /// Validates that meeting date is within acceptable range
    /// </summary>
    public class FutureDateAttribute : ValidationAttribute
    {
        private readonly bool _allowToday;

        public FutureDateAttribute(bool allowToday = true)
        {
            _allowToday = allowToday;
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is DateTime dateValue)
            {
                var compareDate = _allowToday ? DateTime.Today : DateTime.Today.AddDays(1);
                
                if (dateValue < compareDate)
                {
                    return new ValidationResult(
                        _allowToday 
                            ? "Date must be today or in the future" 
                            : "Date must be in the future");
                }
            }

            return ValidationResult.Success;
        }
    }

    /// <summary>
    /// Validates date range consistency (EndDate >= StartDate)
    /// </summary>
    public class DateRangeConsistencyAttribute : ValidationAttribute
    {
        private readonly string _startDateProperty;
        private readonly string _endDateProperty;

        public DateRangeConsistencyAttribute(string startDateProperty, string endDateProperty)
        {
            _startDateProperty = startDateProperty;
            _endDateProperty = endDateProperty;
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            var startDateProperty = validationContext.ObjectType.GetProperty(_startDateProperty);
            var endDateProperty = validationContext.ObjectType.GetProperty(_endDateProperty);

            if (startDateProperty == null || endDateProperty == null)
            {
                return ValidationResult.Success;
            }

            var startDateValue = startDateProperty.GetValue(validationContext.ObjectInstance) as DateTime?;
            var endDateValue = endDateProperty.GetValue(validationContext.ObjectInstance) as DateTime?;

            if (startDateValue.HasValue && endDateValue.HasValue && endDateValue < startDateValue)
            {
                return new ValidationResult("End date must be greater than or equal to start date");
            }

            return ValidationResult.Success;
        }
    }
}

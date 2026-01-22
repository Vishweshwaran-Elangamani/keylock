using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Common.Utils
{
    /// <summary>
    /// Helper class for timezone conversions - primarily IST (India Standard Time)
    /// </summary>
    public static class TimeZoneHelper
    {
        /// <summary>
        /// Get IST timezone (Asia/Kolkata, UTC +5:30)
        /// Cross-platform compatible (Linux/Windows)
        /// </summary>
        public static TimeZoneInfo GetIstTimeZone()
        {
            try
            {
                // Linux/macOS timezone ID
                return TimeZoneInfo.FindSystemTimeZoneById(TimeZoneConstants.IndiaStandardTimeLinux);
            }
            catch (TimeZoneNotFoundException)
            {
                try
                {
                    // Windows timezone ID
                    return TimeZoneInfo.FindSystemTimeZoneById(TimeZoneConstants.IndiaStandardTimeWindows);
                }
                catch (TimeZoneNotFoundException)
                {
                    // Fallback: Create custom timezone
                    return TimeZoneInfo.CreateCustomTimeZone(
                        TimeZoneConstants.IndiaStandardTimeShort,
                        TimeZoneConstants.IndiaStandardTimeOffset,
                        TimeZoneConstants.IndiaStandardTimeDisplayName,
                        TimeZoneConstants.IndiaStandardTimeShort);
                }
            }
        }

        /// <summary>
        /// Get current time in IST (Asia/Kolkata, UTC +5:30)
        /// </summary>
        public static DateTime GetIstNow()
        {
            var istZone = GetIstTimeZone();
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);
        }

        /// <summary>
        /// Convert UTC time to IST
        /// </summary>
        public static DateTime ConvertUtcToIst(DateTime utcTime)
        {
            var istZone = GetIstTimeZone();
            return TimeZoneInfo.ConvertTimeFromUtc(utcTime, istZone);
        }

        /// <summary>
        /// Convert IST time to UTC
        /// </summary>
        public static DateTime ConvertIstToUtc(DateTime istTime)
        {
            var istZone = GetIstTimeZone();
            return TimeZoneInfo.ConvertTimeToUtc(istTime, istZone);
        }

        /// <summary>
        /// Format IST datetime to standard string format
        /// </summary>
        public static string FormatIstTime(DateTime istTime, string format = "yyyy-MM-dd HH:mm:ss")
        {
            return istTime.ToString(format);
        }
    }
}

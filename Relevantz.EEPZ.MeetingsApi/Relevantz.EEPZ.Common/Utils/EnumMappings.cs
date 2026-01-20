using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using System;

namespace Relevantz.EEPZ.Common.Utils
{
    public static class EnumMappings
    {
        public static string ToDbValue(this RsvpStatus status) =>
            status switch
            {
                RsvpStatus.Pending => AppConstants.RsvpStatusValues.Pending,
                RsvpStatus.Accepted => AppConstants.RsvpStatusValues.Accepted,
                RsvpStatus.Declined => AppConstants.RsvpStatusValues.Declined,
                RsvpStatus.Tentative => AppConstants.RsvpStatusValues.Tentative,
                _ => throw new ArgumentOutOfRangeException(nameof(status), status, "Invalid RSVP status")
            };
    }
}

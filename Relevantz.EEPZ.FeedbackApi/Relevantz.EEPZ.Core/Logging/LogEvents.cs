using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Core.Logging
{
    public static class LogEvents
    {
        public static readonly EventId FormCreated = new(1000, "FormCreated");
        public static readonly EventId FormUpdated = new(1001, "FormUpdated");
        public static readonly EventId FormDeleted = new(1002, "FormDeleted");
        public static readonly EventId FormDistributed = new(1003, "FormDistributed");

        public static readonly EventId ResponseCreated = new(2000, "ResponseCreated");
        public static readonly EventId ResponseSubmitted = new(2001, "ResponseSubmitted");
        public static readonly EventId ResponseDeleted = new(2002, "ResponseDeleted");
        public static readonly EventId ResponseUpdated = new(2003, "ResponseUpdated");

        public static readonly EventId UnauthorizedAction = new(9000, "UnauthorizedAction");
        public static readonly EventId ValidationFailed = new(9001, "ValidationFailed");
    }
}

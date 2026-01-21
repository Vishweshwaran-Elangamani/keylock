namespace Relevantz.EEPZ.Common.Constants
{
    public static class MentorFeedbackConstants
    {
        public static class Status
        {
            public const string Submitted = "Submitted";
            public const string Acknowledged = "Acknowledged";
            public const string Reviewed = "Reviewed";
            public const string Archived = "Archived";
        }

        public static class Source
        {
            public const string Mentee = "Mentee";
            public const string HR = "HR";
            public const string Manager = "Manager";
        }

        public static readonly string[] ValidStatuses =
        {
            Status.Submitted,
            Status.Acknowledged,
            Status.Reviewed,
            Status.Archived
        };

        public static readonly string[] ValidSources =
        {
            Source.Mentee,
            Source.HR,
            Source.Manager
        };
    }
}

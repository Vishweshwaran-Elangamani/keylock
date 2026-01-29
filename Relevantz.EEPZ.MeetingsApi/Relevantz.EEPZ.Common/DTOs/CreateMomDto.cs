using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Common.DTOs
{
    public class CreateMomDto
    {
        public int MeetingId { get; set; }
        public string MeetingTitle { get; set; }
        public string MeetingType { get; set; }
        public DateTime MeetingDate { get; set; }
        public string? MeetingLink { get; set; }
        public string Attendees { get; set; }
        public string? CommentsObservations { get; set; }
      public ICollection<Momdiscussionpoint> DiscussionPoints { get; set; }
        public ICollection<Momactionitem> ActionItems { get; set; }
    }
}

namespace Relevantz.EEPZ.Common.DTOs
{
    public class PaginatedMeetingResponseDto
    {
        public List<MeetingResponseDto> Meetings { get; set; } = new();

        public int TotalCount { get; set; }

        public int PageNumber { get; set; }

        public int PageSize { get; set; }

        public int TotalPages { get; set; }

        public bool HasPreviousPage { get; set; }

        public bool HasNextPage { get; set; }
    }
}

namespace Relevantz.EEPZ.Common.DTOs.Response

{

    public class FormResponseDto

    {

        public int FormId { get; set; }

        public string Name { get; set; } = null!;

        public string Type { get; set; } = null!;

        public string DeliveryEnablement { get; set; } = null!;

        public int CreatedBy { get; set; }

        public string CreatedByName { get; set; } = null!;

        public DateTime? CreatedAt { get; set; }

        public int CompetencyCount { get; set; }

        public List<CompetencyResponseDto> Competencies { get; set; } = new List<CompetencyResponseDto>();

    }
 
    public class CompetencyResponseDto

    {

        public int CompetencyId { get; set; }

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public int DisplayOrder { get; set; }

    }

}

 
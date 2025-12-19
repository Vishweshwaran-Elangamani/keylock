using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Chatmessage
{
    public int MessageId { get; set; }

    public int ConversationId { get; set; }

    public string Message { get; set; } = null!;

    public bool IsUserMessage { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Chatactionlog> Chatactionlogs { get; set; } =
        new List<Chatactionlog>();

    public virtual Chatconversation Conversation { get; set; } = null!;
}

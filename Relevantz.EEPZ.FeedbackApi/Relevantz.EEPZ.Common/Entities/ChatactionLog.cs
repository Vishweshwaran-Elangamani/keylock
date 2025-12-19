using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Chatactionlog
{
    public int ActionLogId { get; set; }

    public int ConversationId { get; set; }

    public int MessageId { get; set; }

    public string ActionType { get; set; } = null!;

    public string? ActionDetails { get; set; }

    public DateTime ExecutedAt { get; set; }

    public virtual Chatconversation Conversation { get; set; } = null!;

    public virtual Chatmessage Message { get; set; } = null!;
}

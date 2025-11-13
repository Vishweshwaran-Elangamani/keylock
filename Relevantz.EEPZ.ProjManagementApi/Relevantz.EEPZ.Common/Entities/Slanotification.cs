using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Slanotification
{
    public int NotificationId { get; set; }

    public int Slaid { get; set; }

    public int EmployeeId { get; set; }

    public string NotificationType { get; set; } = null!;

    public string NotificationSubject { get; set; } = null!;

    public string NotificationBody { get; set; } = null!;

    public DateTime SentAt { get; set; }

    public string DeliveryStatus { get; set; } = null!;

    public DateTime? ReadAt { get; set; }

    public string Channel { get; set; } = null!;

    public virtual Employee Employee { get; set; } = null!;

    public virtual Sla Sla { get; set; } = null!;
}

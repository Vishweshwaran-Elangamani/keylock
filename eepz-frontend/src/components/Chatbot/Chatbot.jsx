import React, { useState, useEffect, useRef } from 'react';
import userService from '../../services/auth/userService';
import roleService from '../../services/auth/roleService';
import departmentService from '../../services/auth/departmentService';
import ChangeRequestService from '../../services/auth/changeRequestService';
import BulkOperationService from '../../services/auth/bulkOperationService';
import ExportService from '../../services/auth/exportService';
import './AdminChatbot.css';

const AdminChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cache, setCache] = useState({
    users: null,
    departments: null,
    roles: null,
    requests: null,
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: 'user',
        text,
        time: new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
  };

  const addBotMessage = (text, dataType = null, data = null) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        type: 'bot',
        text,
        dataType,
        data,
        time: new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
  };

  const fetchAllData = async () => {
    if (cache.users && cache.departments && cache.roles && cache.requests) {
      return cache;
    }

    try {
      const [usersRes, deptRes, roleRes, reqRes] = await Promise.all([
        userService.getAllUsers(),
        departmentService.getAllDepartments(),
        roleService.getAllRoles(),
        ChangeRequestService.getAllChangeRequests(),
      ]);

      const data = {
        users: usersRes.success ? usersRes.data : [],
        departments: deptRes.success ? deptRes.data : [],
        roles: roleRes.success ? roleRes.data : [],
        requests: reqRes.success ? reqRes.data : [],
      };

      setCache(data);
      return data;
    } catch (err) {
      console.error('Chatbot data load error:', err);
      return cache;
    }
  };

  const processQuery = async (query) => {
    const q = query.toLowerCase().trim();

    // Short greetings
    if (/^(hi|hello|hey)$/i.test(q)) {
      const replies = [
        'Ready to help with admin operations.',
        'How can the assistant support you now.',
        'Ask anything about users, departments, roles or requests.',
      ];
      addBotMessage(replies[Math.floor(Math.random() * replies.length)]);
      return;
    }

    // Exit
    if (/^(bye|close|exit)$/i.test(q)) {
      addBotMessage('Assistant will close now.');
      setTimeout(() => setIsOpen(false), 1000);
      return;
    }

    // Help
    if (/^(help|\?)$/i.test(q)) {
      addBotMessage(
        'MVP Admin Chatbot Features (data driven):\n' +
          '\nUsers:\n' +
          'list users, active users, inactive users, user stats, find user [name], users in [department], users with role [role], users without manager, recent users, list managers\n' +
          '\nDepartments:\n' +
          'list departments, active departments, inactive departments, dept hierarchy, root departments, child of [department], parent of [department], path of [department], hod of [department], departments without hod, dept stats, budget overview, largest department, smallest department, find department [name]\n' +
          '\nRoles:\n' +
          'list roles, system roles, role distribution\n' +
          '\nRequests:\n' +
          'pending requests, all requests, approved requests, rejected requests, request stats, recent requests\n' +
          '\nExports and Bulk:\n' +
          'export users, export departments, export roles, export all data, download template\n' +
          '\nMonitoring:\n' +
          'system health'
      );
      return;
    }

    // Refresh
    if (/refresh|reload data|update data|update cache/i.test(q)) {
      setIsTyping(true);
      setCache({ users: null, departments: null, roles: null, requests: null });
      await fetchAllData();
      setIsTyping(false);
      addBotMessage('Latest data loaded from services.');
      return;
    }

    setIsTyping(true);
    const data = await fetchAllData();
    setIsTyping(false);

    if (!data.users) {
      addBotMessage('Unable to use data now. Try again in a moment.');
      return;
    }

    try {
      // USERS
      if (/^list users$|^show users$|^all users$/i.test(q)) {
        addBotMessage(
          `Users: ${data.users.length} records.`,
          'users',
          data.users.slice(0, 20)
        );
        return;
      }

      if (/active users/i.test(q)) {
        const active = data.users.filter((u) => u.isActive);
        addBotMessage(
          `Active users: ${active.length}.`,
          'users',
          active.slice(0, 20)
        );
        return;
      }

      if (/inactive users/i.test(q)) {
        const inactive = data.users.filter((u) => !u.isActive);
        addBotMessage(
          `Inactive users: ${inactive.length}.`,
          'users',
          inactive.slice(0, 20)
        );
        return;
      }

      if (/user stat|user analytics|user count/i.test(q)) {
        const total = data.users.length;
        const active = data.users.filter((u) => u.isActive).length;

        const roleCount = {};
        data.users.forEach((u) => {
          roleCount[u.roleName] = (roleCount[u.roleName] || 0) + 1;
        });
        const topRole = Object.entries(roleCount).sort((a, b) => b[1] - a[1])[0];

        addBotMessage(
          'User statistics:\n' +
            `Total: ${total}\n` +
            `Active: ${active} (${((active / total) * 100).toFixed(0)}%)\n` +
            `Inactive: ${total - active}\n` +
            `Most common role: ${topRole ? `${topRole[0]} (${topRole[1]})` : 'not available'}`
        );
        return;
      }

      const userSearch = q.match(/(?:find|search) user (.+)/i);
      if (userSearch) {
        const term = userSearch[1].toLowerCase();
        const found = data.users.filter(
          (u) =>
            u.firstName.toLowerCase().includes(term) ||
            u.lastName.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            u.employeeCompanyId.toLowerCase().includes(term)
        );

        if (found.length === 0) {
          addBotMessage(`No user found for "${term}".`);
        } else {
          addBotMessage(
            `User search: ${found.length} match.`,
            'users',
            found.slice(0, 20)
          );
        }
        return;
      }

      const usersInDept = q.match(
        /users (?:in|from) (.+)|(.+) department users/i
      );
      if (usersInDept) {
        const deptTerm = (usersInDept[1] || usersInDept[2]).toLowerCase().trim();
        const filtered = data.users.filter(
          (u) =>
            u.departmentName &&
            u.departmentName.toLowerCase().includes(deptTerm)
        );

        if (filtered.length === 0) {
          addBotMessage(`No users found in "${deptTerm}".`);
        } else {
          addBotMessage(
            `Users in department: ${filtered.length}.`,
            'users',
            filtered.slice(0, 20)
          );
        }
        return;
      }

      const usersWithRole = q.match(/users with role (.+)|(.+) role users/i);
      if (usersWithRole) {
        const roleTerm = (usersWithRole[1] || usersWithRole[2])
          .toLowerCase()
          .trim();
        const filtered = data.users.filter(
          (u) =>
            u.roleName && u.roleName.toLowerCase().includes(roleTerm)
        );

        if (filtered.length === 0) {
          addBotMessage(`No users found with role "${roleTerm}".`);
        } else {
          addBotMessage(
            `Users with role: ${filtered.length}.`,
            'users',
            filtered.slice(0, 20)
          );
        }
        return;
      }

      if (/users without manager|no manager|unassigned users/i.test(q)) {
        const noManager = data.users.filter(
          (u) => !u.managerId || u.managerId === 0
        );
        addBotMessage(
          `Users without manager: ${noManager.length}.`,
          'users',
          noManager.slice(0, 20)
        );
        return;
      }

      if (/recent users|latest users|new users/i.test(q)) {
        const recent = [...data.users]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);
        addBotMessage('Recent users (10 latest).', 'users', recent);
        return;
      }

      if (/list managers|show managers/i.test(q)) {
        const managers = data.users.filter(
          (u) => u.roleName && u.roleName.toLowerCase().includes('manager')
        );
        addBotMessage(
          `Managers: ${managers.length}.`,
          'users',
          managers.slice(0, 20)
        );
        return;
      }

      // DEPARTMENTS
      if (/^list departments$|^show departments$|^all departments$/i.test(q)) {
        addBotMessage(
          `Departments: ${data.departments.length}.`,
          'departments',
          data.departments
        );
        return;
      }

      if (/active departments/i.test(q)) {
        const active = data.departments.filter((d) => d.status === 'Active');
        addBotMessage(
          `Active departments: ${active.length}.`,
          'departments',
          active
        );
        return;
      }

      if (/inactive departments/i.test(q)) {
        const inactive = data.departments.filter((d) => d.status === 'Inactive');
        addBotMessage(
          `Inactive departments: ${inactive.length}.`,
          'departments',
          inactive
        );
        return;
      }

      if (/dept hierarchy|department hierarchy|dept tree|org chart/i.test(q)) {
        const roots = data.departments.filter((d) => !d.parentDepartmentId);

        const buildTree = (parentId, level = 0) => {
          const children = data.departments.filter(
            (d) => d.parentDepartmentId === parentId
          );
          let text = '';
          children.forEach((d, index) => {
            const hod =
              d.hodEmployeeId &&
              data.users.find((u) => u.employeeId === d.hodEmployeeId);
            const mark =
              index === children.length - 1 ? '└─ ' : '├─ ';
            text +=
              `${'  '.repeat(level)}${mark}${d.departmentName}` +
              (hod ? ` [HOD: ${hod.firstName} ${hod.lastName}]` : '') +
              '\n';
            text += buildTree(d.departmentId, level + 1);
          });
          return text;
        };

        let output = 'Department hierarchy:\n\n';
        roots.forEach((root) => {
          const hod =
            root.hodEmployeeId &&
            data.users.find((u) => u.employeeId === root.hodEmployeeId);
          output +=
            `• ${root.departmentName}` +
            (hod ? ` [HOD: ${hod.firstName} ${hod.lastName}]` : '') +
            '\n';
          output += buildTree(root.departmentId, 1);
        });

        addBotMessage(output.trim());
        return;
      }

      if (/root departments|top level departments/i.test(q)) {
        const roots = data.departments.filter((d) => !d.parentDepartmentId);
        addBotMessage(
          `Root departments: ${roots.length}.`,
          'departments',
          roots
        );
        return;
      }

      const childMatch = q.match(
        /child(?:ren)? (?:of |departments of )?(.+)|(.+) children|(.+) sub departments/i
      );
      if (childMatch) {
        const name = (
          childMatch[1] ||
          childMatch[2] ||
          childMatch[3]
        ).toLowerCase().trim();
        const parent = data.departments.find((d) =>
          d.departmentName.toLowerCase().includes(name)
        );
        if (!parent) {
          addBotMessage(`Department "${name}" not found.`);
          return;
        }
        const children = data.departments.filter(
          (d) => d.parentDepartmentId === parent.departmentId
        );
        if (children.length === 0) {
          addBotMessage(`${parent.departmentName} has no child departments.`);
        } else {
          addBotMessage(
            `Child departments of ${parent.departmentName}: ${children.length}.`,
            'departments',
            children
          );
        }
        return;
      }

      const parentMatch = q.match(
        /parent (?:of |department of )?(.+)|(.+) parent/i
      );
      if (parentMatch) {
        const name = (parentMatch[1] || parentMatch[2]).toLowerCase().trim();
        const child = data.departments.find((d) =>
          d.departmentName.toLowerCase().includes(name)
        );
        if (!child) {
          addBotMessage(`Department "${name}" not found.`);
          return;
        }
        if (!child.parentDepartmentId) {
          addBotMessage(`${child.departmentName} is a root department.`);
          return;
        }
        const parent = data.departments.find(
          (d) => d.departmentId === child.parentDepartmentId
        );
        if (!parent) {
          addBotMessage('Parent department not available.');
          return;
        }
        const hod =
          parent.hodEmployeeId &&
          data.users.find((u) => u.employeeId === parent.hodEmployeeId);
        addBotMessage(
          'Parent department details:\n' +
            `Name: ${parent.departmentName}\n` +
            `Code: ${parent.departmentCode}\n` +
            `HOD: ${hod ? `${hod.firstName} ${hod.lastName}` : 'not assigned'}\n` +
            `Status: ${parent.status}`
        );
        return;
      }

      const pathMatch = q.match(
        /path (?:of |to |for )?(.+)|(.+) path|(.+) breadcrumb/i
      );
      if (pathMatch) {
        const name = (
          pathMatch[1] ||
          pathMatch[2] ||
          pathMatch[3]
        ).toLowerCase().trim();
        const target = data.departments.find((d) =>
          d.departmentName.toLowerCase().includes(name)
        );
        if (!target) {
          addBotMessage(`Department "${name}" not found.`);
          return;
        }

        const path = [];
        let current = target;
        while (current) {
          path.unshift(current);
          if (!current.parentDepartmentId) break;
          current = data.departments.find(
            (d) => d.departmentId === current.parentDepartmentId
          );
        }

        addBotMessage(
          'Department path:\n\n' +
            path.map((d) => d.departmentName).join(' → ') +
            `\n\nHierarchy level: ${path.length}`
        );
        return;
      }

      const hodMatch = q.match(
        /who is hod (?:of |for )?(.+)|hod (?:of |for )?(.+)|(.+) hod/i
      );
      if (hodMatch) {
        const name = (hodMatch[1] || hodMatch[2] || hodMatch[3])
          .toLowerCase()
          .trim();
        const dept = data.departments.find((d) =>
          d.departmentName.toLowerCase().includes(name)
        );
        if (!dept) {
          addBotMessage(`Department "${name}" not found.`);
          return;
        }
        if (!dept.hodEmployeeId) {
          addBotMessage(`${dept.departmentName} has no HOD.`);
          return;
        }
        const hod = data.users.find((u) => u.employeeId === dept.hodEmployeeId);
        if (!hod) {
          addBotMessage('HOD details not available.');
          return;
        }
        addBotMessage(
          'Head of department:\n' +
            `Department: ${dept.departmentName}\n` +
            `Name: ${hod.firstName} ${hod.lastName}\n` +
            `Email: ${hod.email}\n` +
            `Role: ${hod.roleName}\n` +
            `Status: ${hod.isActive ? 'Active' : 'Inactive'}`
        );
        return;
      }

      if (/departments without hod|no hod departments|unassigned hod/i.test(q)) {
        const noHod = data.departments.filter((d) => !d.hodEmployeeId);
        addBotMessage(
          `Departments without HOD: ${noHod.length}.`,
          'departments',
          noHod
        );
        return;
      }

      if (/dept stats|department stats|dept analytics/i.test(q)) {
        const active = data.departments.filter((d) => d.status === 'Active')
          .length;
        const withHod = data.departments.filter((d) => d.hodEmployeeId).length;
        const avgStaff = (
          data.users.length / data.departments.length || 0
        ).toFixed(1);

        const deptCount = {};
        data.users.forEach((u) => {
          const name = u.departmentName || 'Unassigned';
          deptCount[name] = (deptCount[name] || 0) + 1;
        });
        const top = Object.entries(deptCount).sort((a, b) => b[1] - a[1])[0];

        addBotMessage(
          'Department statistics:\n' +
            `Total: ${data.departments.length}\n` +
            `Active: ${active}\n` +
            `With HOD: ${withHod}\n` +
            `Average staff per department: ${avgStaff}\n` +
            `Largest by staff: ${top ? `${top[0]} (${top[1]} users)` : 'not available'}`
        );
        return;
      }

      if (/budget overview|department budget|budget allocation/i.test(q)) {
        const total = data.departments.reduce(
          (sum, d) => sum + (d.budgetAllocated || 0),
          0
        );
        const top = [...data.departments]
          .sort((a, b) => (b.budgetAllocated || 0) - (a.budgetAllocated || 0))
          .slice(0, 5);

        addBotMessage(
          'Department budget overview:\n' +
            `Total allocated: Rs ${total.toLocaleString()}\n\n` +
            'Top budgets:\n' +
            top
              .map(
                (d, index) =>
                  `${index + 1}. ${d.departmentName}: Rs ${(d.budgetAllocated ||
                    0).toLocaleString()}`
              )
              .join('\n')
        );
        return;
      }

      if (/largest department|biggest department/i.test(q)) {
        const deptCount = {};
        data.users.forEach((u) => {
          const name = u.departmentName || 'Unassigned';
          if (name !== 'Unassigned') {
            deptCount[name] = (deptCount[name] || 0) + 1;
          }
        });
        const largest = Object.entries(deptCount).sort(
          (a, b) => b[1] - a[1]
        )[0];
        addBotMessage(
          'Largest department by staff:\n' +
            `${largest[0]}: ${largest[1]} users`
        );
        return;
      }

      if (/smallest department|least staff department/i.test(q)) {
        const deptCount = {};
        data.users.forEach((u) => {
          const name = u.departmentName || 'Unassigned';
          if (name !== 'Unassigned') {
            deptCount[name] = (deptCount[name] || 0) + 1;
          }
        });
        const smallest = Object.entries(deptCount).sort(
          (a, b) => a[1] - b[1]
        )[0];
        addBotMessage(
          'Smallest department by staff:\n' +
            `${smallest[0]}: ${smallest[1]} users`
        );
        return;
      }

      const deptSearch = q.match(
        /(?:find|search) department (.+)|show department (.+)/i
      );
      if (deptSearch) {
        const term = (deptSearch[1] || deptSearch[2]).toLowerCase();
        const found = data.departments.filter(
          (d) =>
            d.departmentName.toLowerCase().includes(term) ||
            d.departmentCode.toLowerCase().includes(term)
        );
        if (found.length === 0) {
          addBotMessage(`No department found for "${term}".`);
        } else {
          addBotMessage(
            `Department search: ${found.length} match.`,
            'departments',
            found
          );
        }
        return;
      }

      // ROLES
      if (/^list roles$|^show roles$|^all roles$/i.test(q)) {
        addBotMessage(
          `Roles: ${data.roles.length}.`,
          'roles',
          data.roles
        );
        return;
      }

      if (/system roles/i.test(q)) {
        const system = data.roles.filter((r) => r.isSystemRole);
        addBotMessage(
          `System roles: ${system.length}.`,
          'roles',
          system
        );
        return;
      }

      if (/role distribution|users by role/i.test(q)) {
        const roleCount = {};
        data.users.forEach((u) => {
          roleCount[u.roleName] = (roleCount[u.roleName] || 0) + 1;
        });
        const sorted = Object.entries(roleCount).sort((a, b) => b[1] - a[1]);
        addBotMessage(
          'Role distribution:\n\n' +
            sorted
              .map(
                ([name, count]) =>
                  `${name}: ${count} users (${(
                    (count / data.users.length) *
                    100
                  ).toFixed(0)}%)`
              )
              .join('\n')
        );
        return;
      }

      // CHANGE REQUESTS
      if (/pending requests?/i.test(q)) {
        const pending = data.requests.filter(
          (r) => r.status === 'Pending'
        );
        addBotMessage(
          `Pending requests: ${pending.length}.`,
          'requests',
          pending.slice(0, 20)
        );
        return;
      }

      if (/all requests?|show requests?/i.test(q)) {
        addBotMessage(
          `Total requests: ${data.requests.length}.`,
          'requests',
          data.requests.slice(0, 20)
        );
        return;
      }

      if (/approved requests?/i.test(q)) {
        const approved = data.requests.filter(
          (r) => r.status === 'Approved'
        );
        addBotMessage(
          `Approved requests: ${approved.length}.`,
          'requests',
          approved.slice(0, 20)
        );
        return;
      }

      if (/rejected requests?|declined requests?/i.test(q)) {
        const rejected = data.requests.filter(
          (r) => r.status === 'Rejected'
        );
        addBotMessage(
          `Rejected requests: ${rejected.length}.`,
          'requests',
          rejected.slice(0, 20)
        );
        return;
      }

      if (/request stats?|request analytics/i.test(q)) {
        const pending = data.requests.filter(
          (r) => r.status === 'Pending'
        ).length;
        const approved = data.requests.filter(
          (r) => r.status === 'Approved'
        ).length;
        const rejected = data.requests.filter(
          (r) => r.status === 'Rejected'
        ).length;
        const rate =
          approved + rejected > 0
            ? ((approved / (approved + rejected)) * 100).toFixed(0)
            : 0;

        const fieldCount = {};
        data.requests.forEach((r) => {
          fieldCount[r.fieldName] = (fieldCount[r.fieldName] || 0) + 1;
        });
        const topField = Object.entries(fieldCount).sort(
          (a, b) => b[1] - a[1]
        )[0];

        addBotMessage(
          'Request statistics:\n' +
            `Pending: ${pending}\n` +
            `Approved: ${approved}\n` +
            `Rejected: ${rejected}\n` +
            `Total: ${data.requests.length}\n` +
            `Approval rate: ${rate}%\n` +
            `Most requested field: ${
              topField ? `${topField[0]} (${topField[1]} requests)` : 'not available'
            }`
        );
        return;
      }

      if (/recent requests|latest requests|new requests/i.test(q)) {
        const recent = [...data.requests]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);
        addBotMessage('Recent requests (10 latest).', 'requests', recent);
        return;
      }

      // EXPORTS AND BULK
      if (/export users|download users/i.test(q)) {
        setIsTyping(true);
        await ExportService.exportUsers();
        setIsTyping(false);
        addBotMessage('User export file downloaded.');
        return;
      }

      if (/export departments|download departments/i.test(q)) {
        setIsTyping(true);
        await ExportService.exportDepartments();
        setIsTyping(false);
        addBotMessage('Department export file downloaded.');
        return;
      }

      if (/export roles|download roles/i.test(q)) {
        setIsTyping(true);
        await ExportService.exportRoles();
        setIsTyping(false);
        addBotMessage('Role export file downloaded.');
        return;
      }

      if (/export all data|download all data/i.test(q)) {
        setIsTyping(true);
        await ExportService.exportAllData();
        setIsTyping(false);
        addBotMessage('Combined export file downloaded.');
        return;
      }

      if (/download template|import template|bulk template/i.test(q)) {
        setIsTyping(true);
        await BulkOperationService.downloadExcelTemplate();
        setIsTyping(false);
        addBotMessage('Bulk user import template downloaded.');
        return;
      }

      // SYSTEM HEALTH
      if (/system health|health check/i.test(q)) {
        const activeRate = (
          (data.users.filter((u) => u.isActive).length /
            data.users.length) *
          100
        ).toFixed(0);
        const activeDepts = data.departments.filter(
          (d) => d.status === 'Active'
        ).length;
        const pending = data.requests.filter(
          (r) => r.status === 'Pending'
        ).length;
        const status =
          activeRate > 80 && pending < 20 ? 'Healthy' : 'Needs attention';

        addBotMessage(
          'System health:\n' +
            `Status: ${status}\n` +
            `Users: ${data.users.length} (${activeRate}% active)\n` +
            `Departments: ${data.departments.length} (${activeDepts} active)\n` +
            `Roles: ${data.roles.length}\n` +
            `Pending requests: ${pending}`
        );
        return;
      }

      // Fallback
      const suggestions = [
        'Try user stats, dept stats, role distribution or system health.',
        'You can ask for pending requests, dept hierarchy or budget overview.',
        'You can export users, departments, roles or all data.',
      ];
      addBotMessage(
        suggestions[Math.floor(Math.random() * suggestions.length)]
      );
    } catch (err) {
      console.error('Chatbot error:', err);
      addBotMessage('There was a problem handling this request.');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const text = input.trim();
    addUserMessage(text);
    setInput('');
    await processQuery(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'User Stats', command: 'user stats' },
    { label: 'Active Users', command: 'active users' },
    { label: 'Dept Stats', command: 'dept stats' },
    { label: 'Hierarchy', command: 'dept hierarchy' },
    { label: 'Pending Requests', command: 'pending requests' },
    { label: 'Recent Users', command: 'recent users' },
    { label: 'Recent Requests', command: 'recent requests' },
    { label: 'Role Distribution', command: 'role distribution' },
    { label: 'Budget Overview', command: 'budget overview' },
    { label: 'System Health', command: 'system health' },
  ];

  const renderData = (msg) => {
    if (!msg.data || msg.data.length === 0) return null;

    if (msg.dataType === 'users') {
      return (
        <div className="cbba-data-list">
          {msg.data.map((u, index) => (
            <div key={index} className="cbba-data-item">
              <div className="cbba-item-main">
                <span className="cbba-item-title">
                  {u.firstName} {u.lastName}
                </span>
                <span
                  className={
                    'cbba-badge ' +
                    (u.isActive ? 'cbba-badge-green' : 'cbba-badge-red')
                  }
                >
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="cbba-item-sub">{u.email}</div>
              <div className="cbba-item-meta">
                {u.roleName} • {u.departmentName}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (msg.dataType === 'departments') {
      return (
        <div className="cbba-data-list">
          {msg.data.map((d, index) => (
            <div key={index} className="cbba-data-item">
              <div className="cbba-item-main">
                <span className="cbba-item-title">{d.departmentName}</span>
                <span
                  className={
                    'cbba-badge ' +
                    (d.status === 'Active'
                      ? 'cbba-badge-green'
                      : 'cbba-badge-gray')
                  }
                >
                  {d.status}
                </span>
              </div>
              <div className="cbba-item-sub">{d.departmentCode}</div>
              <div className="cbba-item-meta">
                Budget Rs {(d.budgetAllocated || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (msg.dataType === 'roles') {
      return (
        <div className="cbba-data-list">
          {msg.data.map((r, index) => (
            <div key={index} className="cbba-data-item">
              <div className="cbba-item-main">
                <span className="cbba-item-title">{r.roleName}</span>
                {r.isSystemRole && (
                  <span className="cbba-badge cbba-badge-purple">
                    System
                  </span>
                )}
              </div>
              <div className="cbba-item-sub">{r.roleCode}</div>
            </div>
          ))}
        </div>
      );
    }

    if (msg.dataType === 'requests') {
      return (
        <div className="cbba-data-list">
          {msg.data.map((r, index) => (
            <div key={index} className="cbba-data-item">
              <div className="cbba-item-main">
                <span className="cbba-item-title">
                  {r.userName || 'Request'}
                </span>
                <span
                  className={
                    'cbba-badge ' +
                    (r.status === 'Pending'
                      ? 'cbba-badge-amber'
                      : r.status === 'Approved'
                      ? 'cbba-badge-blue'
                      : 'cbba-badge-red')
                  }
                >
                  {r.status}
                </span>
              </div>
              <div className="cbba-item-sub">
                {r.fieldName}: {r.oldValue} → {r.newValue}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {!isOpen && (
        <button
          className="cbba-fab"
          type="button"
          onClick={() => setIsOpen(true)}
        >
          Chat
        </button>
      )}

      {isOpen && (
        <div className="cbba-window">
          <div className="cbba-header">
            <div className="cbba-header-left">
              <div className="cbba-header-avatar">A</div>
              <div className="cbba-header-text">
                <div className="cbba-header-title">Admin Operations</div>
                <div className="cbba-header-subtitle">
                  MVP Chatbot • Data driven
                </div>
              </div>
            </div>
            <button
              type="button"
              className="cbba-header-close"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="cbba-messages">
            {messages.length === 0 && (
              <div className="cbba-empty">
                <div className="cbba-empty-avatar">A</div>
                <div className="cbba-empty-title">Admin Chatbot</div>
                <div className="cbba-empty-sub">
                  Ask about users, departments, roles, requests or exports.
                </div>
                <div className="cbba-empty-tip">Type help to see commands.</div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  'cbba-message ' +
                  (msg.type === 'user'
                    ? 'cbba-message-user'
                    : 'cbba-message-bot')
                }
              >
                <div className="cbba-message-bubble">
                  <div className="cbba-message-text">{msg.text}</div>
                  {renderData(msg)}
                </div>
                <div className="cbba-message-time">{msg.time}</div>
              </div>
            ))}

            {isTyping && (
              <div className="cbba-message cbba-message-bot">
                <div className="cbba-message-bubble">
                  <div className="cbba-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="cbba-quick-row">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                type="button"
                className="cbba-quick"
                onClick={() => {
                  setInput(qa.command);
                  setTimeout(() => {
                    handleSend();
                  }, 40);
                }}
              >
                {qa.label}
              </button>
            ))}
          </div>

          <div className="cbba-input-row">
            <textarea
              className="cbba-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your query..."
              disabled={isTyping}
            />
            <button
              type="button"
              className="cbba-send"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminChatbot;

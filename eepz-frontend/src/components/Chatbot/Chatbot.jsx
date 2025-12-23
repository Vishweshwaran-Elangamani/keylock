import React, { useState, useEffect, useRef } from 'react';
import { chatbotService } from '../../services/chatbotService';
import userService from '../../services/auth/userService';
import roleService from '../../services/auth/roleService';
import departmentService from '../../services/auth/departmentService';
import ChangeRequestService from '../../services/auth/changeRequestService';
import bulkOperationService from '../../services/auth/bulkOperationService';
import { 
    generateSessionId, 
    STORAGE_KEYS,
} from '../../utils/chatbotHelpers';
import './Chatbot.css';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    
    const [cachedData, setCachedData] = useState({
        users: null,
        roles: null,
        departments: null,
        requests: null,
        lastFetch: null
    });
    
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        let storedSessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
        if (!storedSessionId) {
            storedSessionId = generateSessionId();
            localStorage.setItem(STORAGE_KEYS.SESSION_ID, storedSessionId);
        }
        setSessionId(storedSessionId);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const addMessage = (text, isUser = false, data = null) => {
        const newMessage = {
            id: Date.now(),
            text,
            isUser,
            timestamp: new Date(),
            data,
        };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    };

    const fetchAllData = async () => {
        try {
            const [usersRes, rolesRes, deptsRes, requestsRes] = await Promise.all([
                userService.getAllUsers(),
                roleService.getAllRoles(),
                departmentService.getAllDepartments(),
                ChangeRequestService.getAllChangeRequests()
            ]);

            const data = {
                users: usersRes.success ? usersRes.data : [],
                roles: rolesRes.success ? rolesRes.data : [],
                departments: deptsRes.success ? deptsRes.data : [],
                requests: requestsRes.success ? requestsRes.data : [],
                lastFetch: new Date()
            };

            setCachedData(data);
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    };

    const getData = async () => {
        if (cachedData.users && cachedData.lastFetch) {
            const timeDiff = new Date() - cachedData.lastFetch;
            if (timeDiff < 60000) {
                return cachedData;
            }
        }
        return await fetchAllData();
    };

    const getWelcomeMessage = () => {
        return `Welcome to EEPZ Admin Assistant

This is a conversational AI assistant for administrative operations.

──────────────────────────────────────────────────────────
AVAILABLE OPERATIONS
──────────────────────────────────────────────────────────

STATISTICS & ANALYTICS:
• User statistics and counts
• Department analytics and budgets
• Role distribution analysis
• Change request summaries
• System health monitoring

DATA OPERATIONS:
• List users, departments, roles
• Filter by status (active/inactive)
• Search by name, email, or ID
• View pending change requests
• Recent activity tracking

DEPARTMENT HIERARCHY:
• View department tree structure
• Find parent departments
• List child departments
• Display root departments
• Show department paths

ADVANCED QUERIES:
• Users by department or role
• Largest/smallest departments
• Department budget allocations
• Users without managers
• Approval rate analysis

DATA EXPORTS:
• Export users to Excel
• Export departments to Excel
• Export roles to Excel
• Download import templates

──────────────────────────────────────────────────────────

Type naturally or use quick action buttons below.
Type "help" for complete command reference.`;
    };

    // ==================== COMMAND PROCESSING ====================

    const processCommand = async (command) => {
        const lowerCommand = command.toLowerCase().trim();

        // Greetings
        if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(lowerCommand)) {
            addMessage('Hello. How may I assist you with EEPZ management today?', false);
            return;
        }

        // Goodbye
        if (/^(bye|goodbye|exit|quit|close)$/i.test(lowerCommand)) {
            addMessage('Thank you for using EEPZ Admin Assistant. Have a productive day.', false);
            setTimeout(() => setIsOpen(false), 1500);
            return;
        }

        // Help
        if (/^(help|\\?)$/i.test(lowerCommand)) {
            addMessage(getWelcomeMessage(), false);
            return;
        }

        // Refresh data
        if (/refresh data|reload data|update cache/i.test(lowerCommand)) {
            setIsLoading(true);
            const data = await fetchAllData();
            setIsLoading(false);
            if (data) {
                addMessage('Data refreshed successfully. All information is now up to date.', false);
            } else {
                addMessage('Failed to refresh data. Please try again.', false);
            }
            return;
        }

        setIsLoading(true);
        const data = await getData();
        setIsLoading(false);

        if (!data) {
            addMessage('Unable to fetch system data. Please try again later.', false);
            return;
        }

        // ==================== DEPARTMENT HIERARCHY OPERATIONS ====================

        // View department hierarchy tree
        if (/department tree|department hierarchy|show hierarchy|org chart/i.test(lowerCommand)) {
            const rootDepts = data.departments.filter(d => !d.parentDepartmentId || d.parentDepartmentId === null);
            
            if (rootDepts.length === 0) {
                addMessage('No department hierarchy found.', false);
                return;
            }

            const buildTree = (parentId = null, level = 0) => {
                const children = data.departments.filter(d => d.parentDepartmentId === parentId);
                let tree = '';
                children.forEach((dept, idx) => {
                    const prefix = '  '.repeat(level) + (idx === children.length - 1 ? '└─ ' : '├─ ');
                    const hodInfo = dept.hodEmployeeId ? 
                        data.users.find(u => u.employeeId === dept.hodEmployeeId) : null;
                    const hodName = hodInfo ? `[HOD: ${hodInfo.firstName} ${hodInfo.lastName}]` : '[No HOD]';
                    
                    tree += `${prefix}${dept.departmentName} (${dept.departmentCode}) ${hodName}\n`;
                    tree += buildTree(dept.departmentId, level + 1);
                });
                return tree;
            };

            let hierarchyText = 'DEPARTMENT HIERARCHY:\n\n';
            rootDepts.forEach(root => {
                const hodInfo = root.hodEmployeeId ? 
                    data.users.find(u => u.employeeId === root.hodEmployeeId) : null;
                const hodName = hodInfo ? `[HOD: ${hodInfo.firstName} ${hodInfo.lastName}]` : '[No HOD]';
                
                hierarchyText += `${root.departmentName} (${root.departmentCode}) ${hodName}\n`;
                hierarchyText += buildTree(root.departmentId, 1);
                hierarchyText += '\n';
            });

            addMessage(hierarchyText.trim(), false);
            return;
        }

        // Root departments
        if (/root departments|top level departments|parent departments/i.test(lowerCommand)) {
            const rootDepts = data.departments.filter(d => !d.parentDepartmentId || d.parentDepartmentId === null);
            
            if (rootDepts.length === 0) {
                addMessage('No root departments found.', false);
                return;
            }

            addMessage(
                `ROOT DEPARTMENTS (${rootDepts.length}):`,
                false,
                { type: 'departments', items: rootDepts }
            );
            return;
        }

        // Child departments
        const childDeptMatch = lowerCommand.match(/child(?:ren)? (?:of |departments of )?(.+)|(.+) children|(.+) sub departments/i);
        if (childDeptMatch) {
            const deptName = (childDeptMatch[1] || childDeptMatch[2] || childDeptMatch[3]).toLowerCase().trim();
            const parentDept = data.departments.find(d => 
                d.departmentName.toLowerCase().includes(deptName)
            );

            if (!parentDept) {
                addMessage(`Department "${deptName}" not found.`, false);
                return;
            }

            const childDepts = data.departments.filter(d => d.parentDepartmentId === parentDept.departmentId);

            if (childDepts.length === 0) {
                addMessage(`${parentDept.departmentName} has no child departments.`, false);
                return;
            }

            addMessage(
                `CHILD DEPARTMENTS OF ${parentDept.departmentName.toUpperCase()} (${childDepts.length}):`,
                false,
                { type: 'departments', items: childDepts }
            );
            return;
        }

        // Parent department
        const parentDeptMatch = lowerCommand.match(/parent (?:of |department of )?(.+)|(.+) parent/i);
        if (parentDeptMatch) {
            const deptName = (parentDeptMatch[1] || parentDeptMatch[2]).toLowerCase().trim();
            const childDept = data.departments.find(d => 
                d.departmentName.toLowerCase().includes(deptName)
            );

            if (!childDept) {
                addMessage(`Department "${deptName}" not found.`, false);
                return;
            }

            if (!childDept.parentDepartmentId) {
                addMessage(`${childDept.departmentName} is a root department with no parent.`, false);
                return;
            }

            const parentDept = data.departments.find(d => d.departmentId === childDept.parentDepartmentId);

            if (!parentDept) {
                addMessage(`Parent department not found for ${childDept.departmentName}.`, false);
                return;
            }

            const hodInfo = parentDept.hodEmployeeId ? 
                data.users.find(u => u.employeeId === parentDept.hodEmployeeId) : null;

            addMessage(
                `PARENT DEPARTMENT OF ${childDept.departmentName.toUpperCase()}:\n\n` +
                `Department: ${parentDept.departmentName}\n` +
                `Code: ${parentDept.departmentCode}\n` +
                `HOD: ${hodInfo ? `${hodInfo.firstName} ${hodInfo.lastName}` : 'Not assigned'}\n` +
                `Status: ${parentDept.status}`,
                false
            );
            return;
        }

        // Department path (breadcrumb)
        const pathMatch = lowerCommand.match(/path (?:of |to |for )?(.+)|(.+) path|(.+) breadcrumb/i);
        if (pathMatch) {
            const deptName = (pathMatch[1] || pathMatch[2] || pathMatch[3]).toLowerCase().trim();
            const targetDept = data.departments.find(d => 
                d.departmentName.toLowerCase().includes(deptName)
            );

            if (!targetDept) {
                addMessage(`Department "${deptName}" not found.`, false);
                return;
            }

            // Build path from root to target
            const buildPath = (dept) => {
                const path = [dept];
                let current = dept;
                
                while (current.parentDepartmentId) {
                    const parent = data.departments.find(d => d.departmentId === current.parentDepartmentId);
                    if (!parent) break;
                    path.unshift(parent);
                    current = parent;
                }
                
                return path;
            };

            const path = buildPath(targetDept);
            const pathString = path.map(d => d.departmentName).join(' > ');

            addMessage(
                `DEPARTMENT PATH:\n\n` +
                `${pathString}\n\n` +
                `Hierarchy Level: ${path.length}`,
                false
            );
            return;
        }

        // Department HOD
        const hodMatch = lowerCommand.match(/who is (?:the )?hod (?:of |for )?(.+)|hod (?:of |for )?(.+)|(.+) hod/i);
        if (hodMatch) {
            const deptName = (hodMatch[1] || hodMatch[2] || hodMatch[3]).toLowerCase().trim();
            const dept = data.departments.find(d => 
                d.departmentName.toLowerCase().includes(deptName)
            );

            if (!dept) {
                addMessage(`Department "${deptName}" not found.`, false);
                return;
            }

            if (!dept.hodEmployeeId) {
                addMessage(`${dept.departmentName} does not have an assigned HOD.`, false);
                return;
            }

            const hodInfo = data.users.find(u => u.employeeId === dept.hodEmployeeId);

            if (!hodInfo) {
                addMessage(`HOD information not found for ${dept.departmentName}.`, false);
                return;
            }

            addMessage(
                `HEAD OF DEPARTMENT - ${dept.departmentName.toUpperCase()}:\n\n` +
                `Name: ${hodInfo.firstName} ${hodInfo.lastName}\n` +
                `Email: ${hodInfo.email}\n` +
                `Employee ID: ${hodInfo.employeeCompanyId}\n` +
                `Role: ${hodInfo.roleName}\n` +
                `Status: ${hodInfo.isActive ? 'Active' : 'Inactive'}`,
                false
            );
            return;
        }

        // Departments without HOD
        if (/departments without hod|no hod|unassigned hod/i.test(lowerCommand)) {
            const deptsWithoutHOD = data.departments.filter(d => !d.hodEmployeeId);

            if (deptsWithoutHOD.length === 0) {
                addMessage('All departments have assigned HODs.', false);
                return;
            }

            addMessage(
                `DEPARTMENTS WITHOUT HOD (${deptsWithoutHOD.length}):`,
                false,
                { type: 'departments', items: deptsWithoutHOD }
            );
            return;
        }

        // Active/Inactive departments
        if (/active departments|departments active/i.test(lowerCommand)) {
            const activeDepts = data.departments.filter(d => d.status === 'Active');

            if (activeDepts.length === 0) {
                addMessage('No active departments found.', false);
                return;
            }

            addMessage(
                `ACTIVE DEPARTMENTS (${activeDepts.length}):`,
                false,
                { type: 'departments', items: activeDepts }
            );
            return;
        }

        if (/inactive departments|departments inactive/i.test(lowerCommand)) {
            const inactiveDepts = data.departments.filter(d => d.status === 'Inactive');

            if (inactiveDepts.length === 0) {
                addMessage('No inactive departments found.', false);
                return;
            }

            addMessage(
                `INACTIVE DEPARTMENTS (${inactiveDepts.length}):`,
                false,
                { type: 'departments', items: inactiveDepts }
            );
            return;
        }

        // ==================== EXPORT FUNCTIONALITY ====================

        if (/export users|download users/i.test(lowerCommand)) {
            addMessage(
                'To export users to Excel:\n\n' +
                '1. Navigate to Bulk Operations page\n' +
                '2. Click "Export Users to Excel"\n' +
                '3. File will download automatically\n\n' +
                'Or use the API endpoint: GET /api/BulkOperation/export/users',
                false
            );
            return;
        }

        if (/export departments|download departments/i.test(lowerCommand)) {
            addMessage(
                'To export departments to Excel:\n\n' +
                '1. Navigate to Bulk Operations page\n' +
                '2. Click "Export Departments to Excel"\n' +
                '3. File will download automatically\n\n' +
                'Or use the API endpoint: GET /api/BulkOperation/export/departments',
                false
            );
            return;
        }

        if (/export roles|download roles/i.test(lowerCommand)) {
            addMessage(
                'To export roles to Excel:\n\n' +
                '1. Navigate to Bulk Operations page\n' +
                '2. Click "Export Roles to Excel"\n' +
                '3. File will download automatically\n\n' +
                'Or use the API endpoint: GET /api/BulkOperation/export/roles',
                false
            );
            return;
        }

        if (/download template|import template|bulk template/i.test(lowerCommand)) {
            addMessage(
                'To download bulk user import template:\n\n' +
                '1. Navigate to Bulk Operations page\n' +
                '2. Click "Download Template"\n' +
                '3. Fill in user data\n' +
                '4. Upload filled template\n\n' +
                'Or use the API endpoint: GET /api/BulkOperation/download-template',
                false
            );
            return;
        }

        // ==================== COUNT QUERIES ====================

        if (/how many (total )?users|total (number of )?users|user count/i.test(lowerCommand)) {
            const activeCount = data.users.filter(u => u.isActive).length;
            const inactiveCount = data.users.filter(u => !u.isActive).length;
            addMessage(
                `USER STATISTICS:\n\n` +
                `Total Users: ${data.users.length}\n` +
                `Active: ${activeCount} (${((activeCount/data.users.length)*100).toFixed(1)}%)\n` +
                `Inactive: ${inactiveCount} (${((inactiveCount/data.users.length)*100).toFixed(1)}%)`,
                false
            );
            return;
        }

        if (/how many active users|active user count|total active/i.test(lowerCommand)) {
            const activeUsers = data.users.filter(u => u.isActive);
            addMessage(
                `ACTIVE USERS: ${activeUsers.length}\n\n` +
                `Representing ${((activeUsers.length/data.users.length)*100).toFixed(1)}% of total users.`,
                false
            );
            return;
        }

        if (/how many inactive users|inactive user count|total inactive/i.test(lowerCommand)) {
            const inactiveUsers = data.users.filter(u => !u.isActive);
            addMessage(
                `INACTIVE USERS: ${inactiveUsers.length}\n\n` +
                `Representing ${((inactiveUsers.length/data.users.length)*100).toFixed(1)}% of total users.`,
                false
            );
            return;
        }

        if (/how many departments|department count|total departments/i.test(lowerCommand)) {
            const activeDepts = data.departments.filter(d => d.status === 'Active').length;
            const inactiveDepts = data.departments.filter(d => d.status === 'Inactive').length;
            const rootDepts = data.departments.filter(d => !d.parentDepartmentId).length;
            
            addMessage(
                `DEPARTMENT STATISTICS:\n\n` +
                `Total Departments: ${data.departments.length}\n` +
                `Active: ${activeDepts}\n` +
                `Inactive: ${inactiveDepts}\n` +
                `Root Departments: ${rootDepts}`,
                false
            );
            return;
        }

        if (/how many roles|role count|total roles/i.test(lowerCommand)) {
            const systemRoles = data.roles.filter(r => r.isSystemRole).length;
            const customRoles = data.roles.filter(r => !r.isSystemRole).length;
            addMessage(
                `ROLE STATISTICS:\n\n` +
                `Total Roles: ${data.roles.length}\n` +
                `System Roles: ${systemRoles}\n` +
                `Custom Roles: ${customRoles}`,
                false
            );
            return;
        }

        if (/how many pending|pending count|total pending requests?/i.test(lowerCommand)) {
            const pending = data.requests.filter(r => r.status === 'Pending').length;
            const approved = data.requests.filter(r => r.status === 'Approved').length;
            const rejected = data.requests.filter(r => r.status === 'Rejected').length;
            addMessage(
                `CHANGE REQUEST STATISTICS:\n\n` +
                `Pending: ${pending}\n` +
                `Approved: ${approved}\n` +
                `Rejected: ${rejected}\n` +
                `Total: ${data.requests.length}`,
                false
            );
            return;
        }

        // ==================== ADVANCED ANALYTICS ====================

        if (/user (stats|statistics|analytics)|stats users|analyze users/i.test(lowerCommand)) {
            const activeUsers = data.users.filter(u => u.isActive);
            const roleBreakdown = {};
            const deptBreakdown = {};

            data.users.forEach(user => {
                roleBreakdown[user.roleName] = (roleBreakdown[user.roleName] || 0) + 1;
                deptBreakdown[user.departmentName] = (deptBreakdown[user.departmentName] || 0) + 1;
            });

            const topRole = Object.entries(roleBreakdown).sort((a, b) => b[1] - a[1])[0];
            const topDept = Object.entries(deptBreakdown).sort((a, b) => b[1] - a[1])[0];

            addMessage(
                `COMPREHENSIVE USER ANALYTICS:\n\n` +
                `OVERVIEW:\n` +
                `Total Users: ${data.users.length}\n` +
                `Active: ${activeUsers.length} (${((activeUsers.length/data.users.length)*100).toFixed(1)}%)\n` +
                `Inactive: ${data.users.length - activeUsers.length}\n\n` +
                `DISTRIBUTION:\n` +
                `Most Common Role: ${topRole[0]} (${topRole[1]} users)\n` +
                `Largest Department: ${topDept[0]} (${topDept[1]} users)`,
                false
            );
            return;
        }

        if (/department (stats|statistics|analytics|breakdown)|analyze departments/i.test(lowerCommand)) {
            const deptUserCount = {};
            data.users.forEach(user => {
                const dept = user.departmentName || 'Unassigned';
                deptUserCount[dept] = (deptUserCount[dept] || 0) + 1;
            });

            const sortedDepts = Object.entries(deptUserCount).sort((a, b) => b[1] - a[1]);
            const top5 = sortedDepts.slice(0, 5);

            const activeDepts = data.departments.filter(d => d.status === 'Active').length;
            const deptsWithHOD = data.departments.filter(d => d.hodEmployeeId).length;
            const avgStaff = (data.users.length / data.departments.length).toFixed(1);

            addMessage(
                `DEPARTMENT ANALYTICS:\n\n` +
                `Total Departments: ${data.departments.length}\n` +
                `Active: ${activeDepts}\n` +
                `With HOD: ${deptsWithHOD}\n` +
                `Average Staff per Department: ${avgStaff}\n\n` +
                `TOP 5 BY STAFF:\n` +
                top5.map(([dept, count], idx) => 
                    `${idx + 1}. ${dept}: ${count} users (${((count/data.users.length)*100).toFixed(1)}%)`
                ).join('\n'),
                false
            );
            return;
        }

        if (/request (stats|statistics|analytics|summary)|analyze requests/i.test(lowerCommand)) {
            const pending = data.requests.filter(r => r.status === 'Pending');
            const approved = data.requests.filter(r => r.status === 'Approved');
            const rejected = data.requests.filter(r => r.status === 'Rejected');

            const fieldTypes = {};
            data.requests.forEach(req => {
                fieldTypes[req.fieldName] = (fieldTypes[req.fieldName] || 0) + 1;
            });

            const topField = Object.entries(fieldTypes).sort((a, b) => b[1] - a[1])[0];
            const approvalRate = approved.length + rejected.length > 0 
                ? ((approved.length/(approved.length + rejected.length))*100).toFixed(1) 
                : 0;

            addMessage(
                `CHANGE REQUEST ANALYTICS:\n\n` +
                `STATUS BREAKDOWN:\n` +
                `Pending: ${pending.length}\n` +
                `Approved: ${approved.length}\n` +
                `Rejected: ${rejected.length}\n` +
                `Total: ${data.requests.length}\n\n` +
                `PERFORMANCE:\n` +
                `Approval Rate: ${approvalRate}%\n` +
                `Most Requested: ${topField ? `${topField[0]} (${topField[1]} requests)` : 'N/A'}`,
                false
            );
            return;
        }

        // ==================== ROLE DISTRIBUTION ====================

        if (/role distribution|users by role|role breakdown/i.test(lowerCommand)) {
            const roleBreakdown = {};
            data.users.forEach(user => {
                roleBreakdown[user.roleName] = (roleBreakdown[user.roleName] || 0) + 1;
            });

            const sorted = Object.entries(roleBreakdown).sort((a, b) => b[1] - a[1]);

            addMessage(
                `ROLE DISTRIBUTION:\n\n` +
                sorted.map(([role, count]) => 
                    `${role}: ${count} users (${((count/data.users.length)*100).toFixed(1)}%)`
                ).join('\n'),
                false
            );
            return;
        }

        // ==================== DEPARTMENT BUDGET ====================

        if (/department budget|budget (summary|allocation|overview)/i.test(lowerCommand)) {
            const totalBudget = data.departments.reduce((sum, d) => sum + (d.budgetAllocated || 0), 0);
            const topBudget = [...data.departments]
                .sort((a, b) => (b.budgetAllocated || 0) - (a.budgetAllocated || 0))
                .slice(0, 5);

            addMessage(
                `DEPARTMENT BUDGET SUMMARY:\n\n` +
                `Total Allocated: Rs${totalBudget.toLocaleString()}\n\n` +
                `TOP 5 BUDGETS:\n` +
                topBudget.map((d, idx) => 
                    `${idx + 1}. ${d.departmentName}: Rs${(d.budgetAllocated || 0).toLocaleString()}`
                ).join('\n'),
                false
            );
            return;
        }

        // ==================== LARGEST/SMALLEST DEPARTMENT ====================

        if (/largest department|biggest department|most staff/i.test(lowerCommand)) {
            const deptUserCount = {};
            data.users.forEach(user => {
                const dept = user.departmentName || 'Unassigned';
                deptUserCount[dept] = (deptUserCount[dept] || 0) + 1;
            });

            const largest = Object.entries(deptUserCount).sort((a, b) => b[1] - a[1])[0];

            addMessage(
                `LARGEST DEPARTMENT:\n\n` +
                `Department: ${largest[0]}\n` +
                `Staff Count: ${largest[1]} users\n` +
                `Percentage: ${((largest[1]/data.users.length)*100).toFixed(1)}% of workforce`,
                false
            );
            return;
        }

        if (/smallest department|least staff/i.test(lowerCommand)) {
            const deptUserCount = {};
            data.users.forEach(user => {
                const dept = user.departmentName || 'Unassigned';
                if (dept !== 'Unassigned') {
                    deptUserCount[dept] = (deptUserCount[dept] || 0) + 1;
                }
            });

            const smallest = Object.entries(deptUserCount).sort((a, b) => a[1] - b[1])[0];

            addMessage(
                `SMALLEST DEPARTMENT:\n\n` +
                `Department: ${smallest[0]}\n` +
                `Staff Count: ${smallest[1]} users\n` +
                `Percentage: ${((smallest[1]/data.users.length)*100).toFixed(1)}% of workforce`,
                false
            );
            return;
        }

        // ==================== RECENT DATA ====================

        if (/recent(ly)? (created )?users|new users|latest users/i.test(lowerCommand)) {
            const recentUsers = [...data.users]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10);

            if (recentUsers.length > 0) {
                addMessage(
                    `RECENTLY CREATED USERS (Last 10):`,
                    false,
                    { type: 'users', items: recentUsers }
                );
            } else {
                addMessage('No recent users found.', false);
            }
            return;
        }

        if (/recent requests|latest requests|new requests/i.test(lowerCommand)) {
            const recentRequests = [...data.requests]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10);

            if (recentRequests.length > 0) {
                addMessage(
                    `RECENT CHANGE REQUESTS (Last 10):`,
                    false,
                    { type: 'requests', items: recentRequests }
                );
            } else {
                addMessage('No recent change requests found.', false);
            }
            return;
        }

        // ==================== APPROVED/REJECTED REQUESTS ====================

        if (/approved requests|accepted requests/i.test(lowerCommand)) {
            const approved = data.requests.filter(r => r.status === 'Approved');
            if (approved.length > 0) {
                addMessage(
                    `APPROVED CHANGE REQUESTS (${approved.length}):`,
                    false,
                    { type: 'requests', items: approved }
                );
            } else {
                addMessage('No approved requests found.', false);
            }
            return;
        }

        if (/rejected requests|declined requests/i.test(lowerCommand)) {
            const rejected = data.requests.filter(r => r.status === 'Rejected');
            if (rejected.length > 0) {
                addMessage(
                    `REJECTED CHANGE REQUESTS (${rejected.length}):`,
                    false,
                    { type: 'requests', items: rejected }
                );
            } else {
                addMessage('No rejected requests found.', false);
            }
            return;
        }

        // ==================== LIST MANAGERS ====================

        if (/list managers|show managers|all managers/i.test(lowerCommand)) {
            const managers = data.users.filter(u => 
                u.roleName && u.roleName.toLowerCase().includes('manager')
            );

            if (managers.length > 0) {
                addMessage(
                    `MANAGERS (${managers.length}):`,
                    false,
                    { type: 'users', items: managers }
                );
            } else {
                addMessage('No managers found in the system.', false);
            }
            return;
        }

        // ==================== SYSTEM ROLES ====================

        if (/system roles|show system roles/i.test(lowerCommand)) {
            const systemRoles = data.roles.filter(r => r.isSystemRole);
            if (systemRoles.length > 0) {
                addMessage(
                    `SYSTEM ROLES (${systemRoles.length}):`,
                    false,
                    { type: 'roles', items: systemRoles }
                );
            } else {
                addMessage('No system roles found.', false);
            }
            return;
        }

        // ==================== USERS WITHOUT MANAGERS ====================

        if (/users without manager|unassigned users|no manager/i.test(lowerCommand)) {
            const usersWithoutManager = data.users.filter(u => !u.managerId || u.managerId === 0);
            if (usersWithoutManager.length > 0) {
                addMessage(
                    `USERS WITHOUT MANAGER (${usersWithoutManager.length}):`,
                    false,
                    { type: 'users', items: usersWithoutManager }
                );
            } else {
                addMessage('All users have assigned managers.', false);
            }
            return;
        }

        // ==================== USERS BY DEPARTMENT ====================

        const usersByDeptMatch = lowerCommand.match(/users in (.+)|users from (.+)|(.+) department users/i);
        if (usersByDeptMatch) {
            const deptName = (usersByDeptMatch[1] || usersByDeptMatch[2] || usersByDeptMatch[3]).toLowerCase();
            const usersInDept = data.users.filter(u => 
                u.departmentName && u.departmentName.toLowerCase().includes(deptName)
            );

            if (usersInDept.length > 0) {
                addMessage(
                    `USERS IN ${usersInDept[0].departmentName.toUpperCase()} (${usersInDept.length}):`,
                    false,
                    { type: 'users', items: usersInDept }
                );
            } else {
                addMessage(`No users found in department "${deptName}".`, false);
            }
            return;
        }

        // ==================== USERS BY ROLE ====================

        const usersByRoleMatch = lowerCommand.match(/users with role (.+)|(.+) role users/i);
        if (usersByRoleMatch) {
            const roleName = (usersByRoleMatch[1] || usersByRoleMatch[2]).toLowerCase();
            const usersWithRole = data.users.filter(u => 
                u.roleName && u.roleName.toLowerCase().includes(roleName)
            );

            if (usersWithRole.length > 0) {
                addMessage(
                    `USERS WITH ${usersWithRole[0].roleName.toUpperCase()} ROLE (${usersWithRole.length}):`,
                    false,
                    { type: 'users', items: usersWithRole }
                );
            } else {
                addMessage(`No users found with role "${roleName}".`, false);
            }
            return;
        }

        // ==================== SYSTEM HEALTH ====================

        if (/system health|health check|system status/i.test(lowerCommand)) {
            const activeRate = ((data.users.filter(u => u.isActive).length / data.users.length) * 100).toFixed(1);
            const pendingRequests = data.requests.filter(r => r.status === 'Pending').length;
            const activeDepts = data.departments.filter(d => d.status === 'Active').length;
            
            addMessage(
                `SYSTEM HEALTH CHECK:\n\n` +
                `USER HEALTH:\n` +
                `Total Users: ${data.users.length}\n` +
                `Active Rate: ${activeRate}%\n\n` +
                `DEPARTMENT HEALTH:\n` +
                `Total Departments: ${data.departments.length}\n` +
                `Active: ${activeDepts}\n\n` +
                `ROLE HEALTH:\n` +
                `Total Roles: ${data.roles.length}\n\n` +
                `REQUEST HEALTH:\n` +
                `Pending Requests: ${pendingRequests}\n` +
                `Total Requests: ${data.requests.length}\n\n` +
                `Overall Status: ${activeRate > 80 && pendingRequests < 20 ? 'HEALTHY' : 'NEEDS ATTENTION'}`,
                false
            );
            return;
        }

        // ==================== FILTERED VIEWS ====================

        if (/show active users|list active users|active users only/i.test(lowerCommand)) {
            const activeUsers = data.users.filter(u => u.isActive);
            if (activeUsers.length > 0) {
                addMessage(
                    `ACTIVE USERS (${activeUsers.length}):`,
                    false,
                    { type: 'users', items: activeUsers }
                );
            } else {
                addMessage('No active users found.', false);
            }
            return;
        }

        if (/show inactive users|list inactive users|inactive users only/i.test(lowerCommand)) {
            const inactiveUsers = data.users.filter(u => !u.isActive);
            if (inactiveUsers.length > 0) {
                addMessage(
                    `INACTIVE USERS (${inactiveUsers.length}):`,
                    false,
                    { type: 'users', items: inactiveUsers }
                );
            } else {
                addMessage('No inactive users found.', false);
            }
            return;
        }

        // ==================== SEARCH ====================

        const userSearchMatch = lowerCommand.match(/find user (.+)|search user (.+)|show user (.+)/i);
        if (userSearchMatch) {
            const searchTerm = (userSearchMatch[1] || userSearchMatch[2] || userSearchMatch[3]).toLowerCase();
            const foundUsers = data.users.filter(u => 
                u.firstName.toLowerCase().includes(searchTerm) ||
                u.lastName.toLowerCase().includes(searchTerm) ||
                u.email.toLowerCase().includes(searchTerm) ||
                u.employeeCompanyId.toLowerCase().includes(searchTerm)
            );

            if (foundUsers.length > 0) {
                addMessage(
                    `SEARCH RESULTS: Found ${foundUsers.length} user(s) matching "${searchTerm}"`,
                    false,
                    { type: 'users', items: foundUsers }
                );
            } else {
                addMessage(`No users found matching "${searchTerm}".`, false);
            }
            return;
        }

        const deptSearchMatch = lowerCommand.match(/find department (.+)|search department (.+)|show department (.+)/i);
        if (deptSearchMatch) {
            const searchTerm = (deptSearchMatch[1] || deptSearchMatch[2] || deptSearchMatch[3]).toLowerCase();
            const foundDepts = data.departments.filter(d => 
                d.departmentName.toLowerCase().includes(searchTerm) ||
                d.departmentCode.toLowerCase().includes(searchTerm)
            );

            if (foundDepts.length > 0) {
                addMessage(
                    `SEARCH RESULTS: Found ${foundDepts.length} department(s) matching "${searchTerm}"`,
                    false,
                    { type: 'departments', items: foundDepts }
                );
            } else {
                addMessage(`No departments found matching "${searchTerm}".`, false);
            }
            return;
        }

        const roleSearchMatch = lowerCommand.match(/find role (.+)|search role (.+)|show role (.+)/i);
        if (roleSearchMatch) {
            const searchTerm = (roleSearchMatch[1] || roleSearchMatch[2] || roleSearchMatch[3]).toLowerCase();
            const foundRoles = data.roles.filter(r => 
                r.roleName.toLowerCase().includes(searchTerm) ||
                r.roleCode.toLowerCase().includes(searchTerm)
            );

            if (foundRoles.length > 0) {
                addMessage(
                    `SEARCH RESULTS: Found ${foundRoles.length} role(s) matching "${searchTerm}"`,
                    false,
                    { type: 'roles', items: foundRoles }
                );
            } else {
                addMessage(`No roles found matching "${searchTerm}".`, false);
            }
            return;
        }

        const whoIsMatch = lowerCommand.match(/who is (.+)/i);
        if (whoIsMatch) {
            const searchTerm = whoIsMatch[1].toLowerCase();
            const foundUser = data.users.find(u => 
                u.firstName.toLowerCase().includes(searchTerm) ||
                u.lastName.toLowerCase().includes(searchTerm) ||
                u.email.toLowerCase().includes(searchTerm)
            );

            if (foundUser) {
                const manager = data.users.find(u => u.userId === foundUser.managerId);
                addMessage(
                    `USER PROFILE:\n\n` +
                    `Name: ${foundUser.firstName} ${foundUser.lastName}\n` +
                    `Email: ${foundUser.email}\n` +
                    `Employee ID: ${foundUser.employeeCompanyId}\n` +
                    `Role: ${foundUser.roleName}\n` +
                    `Department: ${foundUser.departmentName}\n` +
                    `Manager: ${manager ? `${manager.firstName} ${manager.lastName}` : 'Not assigned'}\n` +
                    `Status: ${foundUser.isActive ? 'Active' : 'Inactive'}`,
                    false
                );
            } else {
                addMessage(`User "${searchTerm}" not found.`, false);
            }
            return;
        }

        // ==================== FULL LISTINGS ====================

        if (/^(list|show|display) (all )?users?$/i.test(lowerCommand)) {
            addMessage(
                `USER DIRECTORY (${data.users.length} total):`,
                false,
                { type: 'users', items: data.users }
            );
            return;
        }

        if (/^(list|show|display) (all )?departments?$/i.test(lowerCommand)) {
            addMessage(
                `DEPARTMENT DIRECTORY (${data.departments.length} total):`,
                false,
                { type: 'departments', items: data.departments }
            );
            return;
        }

        if (/^(list|show|display) (all )?roles?$/i.test(lowerCommand)) {
            addMessage(
                `ROLE DIRECTORY (${data.roles.length} total):`,
                false,
                { type: 'roles', items: data.roles }
            );
            return;
        }

        if (/^(show|list|display) pending requests?$/i.test(lowerCommand)) {
            const pending = data.requests.filter(r => r.status === 'Pending');
            if (pending.length > 0) {
                addMessage(
                    `PENDING CHANGE REQUESTS (${pending.length}):`,
                    false,
                    { type: 'requests', items: pending }
                );
            } else {
                addMessage('No pending requests at this time.', false);
            }
            return;
        }

        if (/^(show|list|display) all requests?$/i.test(lowerCommand)) {
            addMessage(
                `ALL CHANGE REQUESTS (${data.requests.length}):`,
                false,
                { type: 'requests', items: data.requests }
            );
            return;
        }

        // Default fallback
        addMessage(
            `I did not understand that query. Try:\n\n` +
            `• "How many users?"\n` +
            `• "Show active departments"\n` +
            `• "Department hierarchy"\n` +
            `• "Users in IT"\n` +
            `• "Recent requests"\n` +
            `• "System health check"\n\n` +
            `Type "help" for all capabilities.`,
            false
        );
    };

    const sendMessage = async () => {
        const trimmedMessage = inputMessage.trim();
        if (!trimmedMessage || isLoading) return;

        addMessage(trimmedMessage, true);
        setInputMessage('');
        
        await processCommand(trimmedMessage);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        const newSessionId = generateSessionId();
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
        setSessionId(newSessionId);
        setMessages([]);
        addMessage(getWelcomeMessage(), false);
    };

    const handleQuickAction = (action) => {
        setInputMessage(action);
        setTimeout(() => {
            sendMessage();
        }, 50);
    };

    const renderDataTable = (data) => {
        if (!data || !data.items || data.items.length === 0) return null;

        switch (data.type) {
            case 'departments':
                return (
                    <div className="chatbot-data-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th>Code</th>
                                    <th>HOD</th>
                                    <th>Status</th>
                                    <th>Budget</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.slice(0, 10).map((dept, idx) => {
                                    const hodInfo = dept.hodEmployeeId ? 
                                        cachedData.users?.find(u => u.employeeId === dept.hodEmployeeId) : null;
                                    
                                    return (
                                        <tr key={idx}>
                                            <td><strong>{dept.departmentName}</strong></td>
                                            <td>{dept.departmentCode}</td>
                                            <td>{hodInfo ? `${hodInfo.firstName} ${hodInfo.lastName}` : 'Not assigned'}</td>
                                            <td>
                                                <span className={`status-badge ${dept.status.toLowerCase()}`}>
                                                    {dept.status}
                                                </span>
                                            </td>
                                            <td>Rs{(dept.budgetAllocated || 0).toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {data.items.length > 10 && (
                            <p className="chatbot-table-footer">Showing 10 of {data.items.length} departments</p>
                        )}
                    </div>
                );

            case 'users':
                return (
                    <div className="chatbot-data-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.slice(0, 10).map((user, idx) => (
                                    <tr key={idx}>
                                        <td><strong>{user.firstName} {user.lastName}</strong></td>
                                        <td>{user.email}</td>
                                        <td>{user.roleName}</td>
                                        <td>{user.departmentName}</td>
                                        <td>
                                            <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.items.length > 10 && (
                            <p className="chatbot-table-footer">Showing 10 of {data.items.length} users</p>
                        )}
                    </div>
                );

            case 'roles':
                return (
                    <div className="chatbot-data-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Role Name</th>
                                    <th>Role Code</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((role, idx) => (
                                    <tr key={idx}>
                                        <td><strong>{role.roleName}</strong></td>
                                        <td>{role.roleCode}</td>
                                        <td>
                                            {role.isSystemRole ? (
                                                <span className="status-badge system">System</span>
                                            ) : (
                                                <span className="status-badge custom">Custom</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'requests':
                return (
                    <div className="chatbot-data-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Field</th>
                                    <th>Change</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.slice(0, 10).map((req, idx) => (
                                    <tr key={idx}>
                                        <td><strong>{req.userName || req.requestedByName}</strong></td>
                                        <td>{req.fieldName}</td>
                                        <td>
                                            <span className="value-change">
                                                {req.oldValue} to {req.newValue}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${req.status.toLowerCase()}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.items.length > 10 && (
                            <p className="chatbot-table-footer">Showing 10 of {data.items.length} requests</p>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            {!isOpen && (
                <button 
                    className="ai-chat-button" 
                    onClick={() => {
                        setIsOpen(true);
                        if (messages.length === 0) {
                            clearChat();
                        }
                    }}
                    aria-label="Open Admin Assistant"
                >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </button>
            )}

            {isOpen && (
                <div className="ai-chat-container">
                    <div className="ai-chat-header">
                        <div className="ai-chat-title">
                            <div className="ai-logo-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <div>
                                <h3>EEPZ Admin Assistant</h3>
                                <span className="ai-status">System Online</span>
                            </div>
                        </div>
                        <div className="ai-header-actions">
                            <button onClick={clearChat} title="New Conversation" className="ai-close-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="1 4 1 10 7 10" />
                                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                </svg>
                            </button>
                            <button onClick={() => setIsOpen(false)} title="Close" className="ai-close-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="ai-chat-messages">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`ai-message ${msg.isUser ? 'user' : 'bot'}`}>
                                <div className="ai-message-content">
                                    {!msg.isUser && (
                                        <div className="ai-avatar">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="ai-message-bubble">
                                        <div className="ai-message-text">
                                            {msg.text}
                                        </div>
                                        {msg.data && renderDataTable(msg.data)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="ai-message bot">
                                <div className="ai-message-content">
                                    <div className="ai-avatar">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                        </svg>
                                    </div>
                                    <div className="ai-typing">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-quick-questions">
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('User statistics')}>User Stats</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Department analytics')}>Dept Analytics</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Department tree')}>Dept Hierarchy</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Root departments')}>Root Depts</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Active departments')}>Active Depts</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Departments without HOD')}>No HOD</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Request summary')}>Requests</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Pending requests')}>Pending</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Role distribution')}>Roles</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Recent users')}>Recent Users</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('System health')}>Health Check</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Department budget')}>Budgets</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('List managers')}>Managers</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Largest department')}>Largest Dept</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Approved requests')}>Approved</button>
                        <button className="ai-quick-btn" onClick={() => handleQuickAction('Refresh data')}>Refresh</button>
                    </div>

                    <div className="ai-chat-input">
                        <textarea
                            ref={textareaRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your query here..."
                            rows="1"
                            disabled={isLoading}
                            maxLength={500}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!inputMessage.trim() || isLoading}
                            className="ai-send-btn"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;

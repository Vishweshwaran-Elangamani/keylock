// src/pages/ProjectManagement/ProjectList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, ArrowLeft, Edit, Trash2, UserCog, Users, Search, Filter, Calendar, Building, Briefcase, AlertCircle, CheckCircle, X, ChevronLeft, ChevronRight, Info, Home } from 'lucide-react';
import projectService from '../../services/project_management/projectService';

const ProjectList = () => {
  const navigate = useNavigate();

  // Main state
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Data
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);

  // Form states
  const [editFormData, setEditFormData] = useState({});
  
  // Manager modal states
  const [selectedResourceOwner, setSelectedResourceOwner] = useState(null);
  const [selectedL1Approver, setSelectedL1Approver] = useState(null);
  const [selectedL2Approver, setSelectedL2Approver] = useState(null);
  const [managerSearchTerm, setManagerSearchTerm] = useState('');
  const [managerFilterRole, setManagerFilterRole] = useState('All');
  const [managerFilterDepartment, setManagerFilterDepartment] = useState('All');
  const [activeManagerTab, setActiveManagerTab] = useState('resource');

  // Employee mapping states
  const [mappedEmployees, setMappedEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [primaryEmployeeIds, setPrimaryEmployeeIds] = useState([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [employeeFilterRole, setEmployeeFilterRole] = useState('All');
  const [employeeFilterDepartment, setEmployeeFilterDepartment] = useState('All');
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState('All');

  // Manager modal pagination
  const [managerCurrentPage, setManagerCurrentPage] = useState(1);
  const managerItemsPerPage = 10;

  // Initial data load
  useEffect(() => {
    fetchProjects();
    fetchStaticDropdownData();
  }, []);

  useEffect(() => {
    filterProjectsList();
  }, [searchTerm, filterStatus, projects]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    setManagerCurrentPage(1);
  }, [managerSearchTerm, managerFilterRole, managerFilterDepartment]);

  const fetchStaticDropdownData = async () => {
    try {
      const [employeesRes, deptRes, buRes] = await Promise.all([
        projectService.getAllEmployees(),
        projectService.getAllDepartments(),
        projectService.getAllBusinessUnits()
      ]);

      if (employeesRes.success && employeesRes.data) {
        setAllEmployees(employeesRes.data);
      }
      
      if (deptRes.success) setDepartments(deptRes.data || []);
      if (buRes.success) setBusinessUnits(buRes.data || []);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectService.getAllProjects();
      if (response.success && response.data) {
        setProjects(response.data);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjectsList = () => {
    let filtered = [...projects];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.projectName?.toLowerCase().includes(term) ||
        project.department?.toLowerCase().includes(term) ||
        project.businessUnit?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter(project => project.status === filterStatus);
    }

    setFilteredProjects(filtered);
  };

  // Get filtered managers (ALL employees, no role restriction)
  const getFilteredManagers = () => {
    return allEmployees.filter(emp => {
      const searchMatch = managerSearchTerm === '' || 
        `${emp.firstName} ${emp.lastName} ${emp.roleName} ${emp.departmentName}`
          .toLowerCase()
          .includes(managerSearchTerm.toLowerCase());
      
      const roleMatch = managerFilterRole === 'All' || emp.roleName === managerFilterRole;
      const deptMatch = managerFilterDepartment === 'All' || emp.departmentName === managerFilterDepartment;
      
      return searchMatch && roleMatch && deptMatch;
    });
  };

  // Get unique roles for manager filtering
  const getUniqueManagerRoles = () => {
    const roles = [...new Set(allEmployees.map(emp => emp.roleName))];
    return roles.sort();
  };

  // Get unique departments for manager filtering
  const getUniqueManagerDepartments = () => {
    const depts = [...new Set(allEmployees.map(emp => emp.departmentName))];
    return depts.sort();
  };

  // Manager pagination
  const filteredManagers = getFilteredManagers();
  const managerTotalPages = Math.ceil(filteredManagers.length / managerItemsPerPage);
  const managerStartIndex = (managerCurrentPage - 1) * managerItemsPerPage;
  const managerEndIndex = managerStartIndex + managerItemsPerPage;
  const paginatedManagers = filteredManagers.slice(managerStartIndex, managerEndIndex);

  const goToManagerPage = (page) => {
    setManagerCurrentPage(Math.max(1, Math.min(page, managerTotalPages)));
  };

  const getManagerPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (managerTotalPages <= maxPagesToShow) {
      for (let i = 1; i <= managerTotalPages; i++) pages.push(i);
    } else {
      if (managerCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(managerTotalPages);
      } else if (managerCurrentPage >= managerTotalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = managerTotalPages - 3; i <= managerTotalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = managerCurrentPage - 1; i <= managerCurrentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(managerTotalPages);
      }
    }
    return pages;
  };

  // Get project manager IDs to exclude from employee list
  const getProjectManagerIds = () => {
    if (!selectedProject) return [];
    
    const managerIds = [];
    if (selectedProject.resourceOwner?.employeeMasterId) {
      managerIds.push(selectedProject.resourceOwner.employeeMasterId);
    }
    if (selectedProject.l1Approver?.employeeMasterId) {
      managerIds.push(selectedProject.l1Approver.employeeMasterId);
    }
    if (selectedProject.l2Approver?.employeeMasterId) {
      managerIds.push(selectedProject.l2Approver.employeeMasterId);
    }
    return managerIds;
  };

  const getFilteredEmployees = () => {
    const managerIds = getProjectManagerIds();
    
    return allEmployees.filter(emp => {
      if (managerIds.includes(emp.employeeMasterId)) return false;

      const isMapped = mappedEmployees.some(m => m.employeeMasterId === emp.employeeMasterId);
      
      const searchMatch = employeeSearchTerm === '' || 
        `${emp.firstName} ${emp.lastName} ${emp.roleName} ${emp.departmentName}`
          .toLowerCase().includes(employeeSearchTerm.toLowerCase());
      
      const roleMatch = employeeFilterRole === 'All' || emp.roleName === employeeFilterRole;
      const deptMatch = employeeFilterDepartment === 'All' || emp.departmentName === employeeFilterDepartment;
      const statusMatch = 
        employeeFilterStatus === 'All' || 
        (employeeFilterStatus === 'Mapped' && isMapped) ||
        (employeeFilterStatus === 'Unmapped' && !isMapped);
      
      return searchMatch && roleMatch && deptMatch && statusMatch;
    });
  };

  const getUniqueRoles = () => {
    const managerIds = getProjectManagerIds();
    const availableEmployees = allEmployees.filter(emp => !managerIds.includes(emp.employeeMasterId));
    const roles = [...new Set(availableEmployees.map(emp => emp.roleName))];
    return roles.sort();
  };

  const getUniqueDepartments = () => {
    const managerIds = getProjectManagerIds();
    const availableEmployees = allEmployees.filter(emp => !managerIds.includes(emp.employeeMasterId));
    const depts = [...new Set(availableEmployees.map(emp => emp.departmentName))];
    return depts.sort();
  };

  // ✅ FIXED: Show ALL employees without pagination
  const filteredEmployees = getFilteredEmployees();
  // Do NOT slice - show all employees
  const employeeTotalPages = 1;

  // Project pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleViewClick = (projectId) => {
    navigate(`/hr/dashboard/projectmgmt/view/${projectId}`);
  };

  const handleEditClick = (project) => {
    setSelectedProject(project);
    setEditFormData({
      projectId: project.projectId,
      projectName: project.projectName || '',
      description: project.description || '',
      businessUnit: project.businessUnit || '',
      department: project.department || '',
      engagementModel: project.engagementModel || '',
      status: project.status || 'Active',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
    setModalMessage(null);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalMessage(null);

    try {
      const projectData = {
        ...editFormData,
        startDate: new Date(editFormData.startDate).toISOString(),
        endDate: editFormData.endDate ? new Date(editFormData.endDate).toISOString() : null
      };

      const response = await projectService.updateProject(editFormData.projectId, projectData);

      if (response.success) {
        setModalMessage({ type: 'success', text: 'Project updated successfully!' });
        setTimeout(() => {
          setShowEditModal(false);
          fetchProjects();
        }, 1500);
      }
    } catch (error) {
      setModalMessage({ type: 'error', text: error.message || 'Failed to update project' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerClick = (project) => {
    setSelectedProject(project);
    setSelectedResourceOwner(project.resourceOwner || null);
    setSelectedL1Approver(project.l1Approver || null);
    setSelectedL2Approver(project.l2Approver || null);
    setActiveManagerTab('resource');
    setManagerSearchTerm('');
    setManagerFilterRole('All');
    setManagerFilterDepartment('All');
    setManagerCurrentPage(1);
    setShowManagerModal(true);
    setModalMessage(null);
  };

  const handleManagerSelect = (employee) => {
    if (activeManagerTab === 'resource') {
      setSelectedResourceOwner(prev => 
        prev?.employeeMasterId === employee.employeeMasterId ? null : employee
      );
    } else if (activeManagerTab === 'l1') {
      setSelectedL1Approver(prev => 
        prev?.employeeMasterId === employee.employeeMasterId ? null : employee
      );
    } else if (activeManagerTab === 'l2') {
      setSelectedL2Approver(prev => 
        prev?.employeeMasterId === employee.employeeMasterId ? null : employee
      );
    }
  };

  const handleUpdateManagers = async () => {
    setIsSubmitting(true);
    setModalMessage(null);

    try {
      const managersData = {
        projectId: selectedProject.projectId,
        resourceOwnerEmployeeId: selectedResourceOwner?.employeeMasterId || null,
        l1ApproverEmployeeId: selectedL1Approver?.employeeMasterId || null,
        l2ApproverEmployeeId: selectedL2Approver?.employeeMasterId || null
      };

      const response = await projectService.updateReportingManagers(selectedProject.projectId, managersData);

      if (response.success) {
        setModalMessage({ type: 'success', text: 'Reporting managers updated successfully!' });
        setTimeout(() => {
          setShowManagerModal(false);
          fetchProjects();
        }, 1500);
      }
    } catch (error) {
      setModalMessage({ type: 'error', text: error.message || 'Failed to update managers' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployeeClick = async (project) => {
    setSelectedProject(project);
    setSelectedEmployeeIds([]);
    setPrimaryEmployeeIds([]);
    setEmployeeSearchTerm('');
    setEmployeeFilterRole('All');
    setEmployeeFilterDepartment('All');
    setEmployeeFilterStatus('All');
    setShowEmployeeModal(true);
    setModalMessage(null);

    setIsLoadingModalData(true);
    try {
      const projectResponse = await projectService.getProjectById(project.projectId);
      if (projectResponse.success && projectResponse.data) {
        setMappedEmployees(projectResponse.data.mappedEmployees || []);
        
        const primaryEmps = projectResponse.data.mappedEmployees?.filter(emp => emp.isPrimary).map(emp => emp.employeeMasterId) || [];
        setPrimaryEmployeeIds(primaryEmps);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      setModalMessage({ type: 'error', text: 'Failed to load employee data' });
    } finally {
      setIsLoadingModalData(false);
    }
  };

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployeeIds(prev => {
      if (prev.includes(employeeId)) {
        if (primaryEmployeeIds.includes(employeeId)) {
          setPrimaryEmployeeIds(prevPrimary => prevPrimary.filter(id => id !== employeeId));
        }
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handlePrimaryToggle = (employeeId) => {
    if (!selectedEmployeeIds.includes(employeeId)) {
      setModalMessage({ type: 'error', text: 'Please select the employee first before marking as primary' });
      setTimeout(() => setModalMessage(null), 3000);
      return;
    }
    
    setPrimaryEmployeeIds(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSelectAllEmployees = () => {
    const visibleEmployees = filteredEmployees;  // ✅ Use all filtered employees
    const allVisible = visibleEmployees.every(emp => selectedEmployeeIds.includes(emp.employeeMasterId));
    
    if (allVisible && visibleEmployees.length > 0) {
      const idsToRemove = visibleEmployees.map(emp => emp.employeeMasterId);
      setSelectedEmployeeIds(prev => prev.filter(id => !idsToRemove.includes(id)));
      
      setPrimaryEmployeeIds(prev => prev.filter(id => !idsToRemove.includes(id)));
    } else {
      const newIds = visibleEmployees.map(emp => emp.employeeMasterId);
      setSelectedEmployeeIds(prev => [...new Set([...prev, ...newIds])]);
    }
  };

  const handleMapEmployees = async () => {
    const employeesToMap = selectedEmployeeIds.filter(id => 
      !mappedEmployees.some(m => m.employeeMasterId === id)
    );

    if (employeesToMap.length === 0) {
      setModalMessage({ type: 'error', text: 'Please select at least one unmapped employee' });
      setTimeout(() => setModalMessage(null), 3000);
      return;
    }

    setIsSubmitting(true);
    setModalMessage(null);

    try {
      const employeesWithPrimary = employeesToMap.map(employeeId => ({
        employeeId: employeeId,
        isPrimary: primaryEmployeeIds.includes(employeeId)
      }));

      console.log('Mapping payload:', {
        projectId: selectedProject.projectId,
        employees: employeesWithPrimary
      });

      const response = await projectService.mapEmployees(selectedProject.projectId, employeesWithPrimary);

      if (response.success) {
        const primaryCount = employeesWithPrimary.filter(e => e.isPrimary).length;
        setModalMessage({ 
          type: 'success', 
          text: `${employeesToMap.length} employee(s) mapped successfully! ${primaryCount > 0 ? `(${primaryCount} marked as primary)` : ''}` 
        });
        setSelectedEmployeeIds([]);
        setPrimaryEmployeeIds([]);

        setTimeout(async () => {
          const projectResponse = await projectService.getProjectById(selectedProject.projectId);
          if (projectResponse.success && projectResponse.data) {
            setMappedEmployees(projectResponse.data.mappedEmployees || []);
            
            const primaryEmps = projectResponse.data.mappedEmployees?.filter(emp => emp.isPrimary).map(emp => emp.employeeMasterId) || [];
            setPrimaryEmployeeIds(primaryEmps);
          }
          fetchProjects();
          setModalMessage(null);
        }, 1500);
      }
    } catch (error) {
      setModalMessage({ type: 'error', text: error.message || 'Failed to map employees' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnmapEmployees = async () => {
    const employeesToUnmap = selectedEmployeeIds.filter(id => 
      mappedEmployees.some(m => m.employeeMasterId === id)
    );

    if (employeesToUnmap.length === 0) {
      setModalMessage({ type: 'error', text: 'Please select at least one mapped employee' });
      setTimeout(() => setModalMessage(null), 3000);
      return;
    }

    setIsSubmitting(true);
    setModalMessage(null);

    try {
      const response = await projectService.unmapEmployees(selectedProject.projectId, employeesToUnmap);

      if (response.success) {
        setModalMessage({ type: 'success', text: `${employeesToUnmap.length} employee(s) unmapped successfully!` });
        setSelectedEmployeeIds([]);
        
        setPrimaryEmployeeIds(prev => prev.filter(id => !employeesToUnmap.includes(id)));

        setTimeout(async () => {
          const projectResponse = await projectService.getProjectById(selectedProject.projectId);
          if (projectResponse.success && projectResponse.data) {
            setMappedEmployees(projectResponse.data.mappedEmployees || []);
            
            const primaryEmps = projectResponse.data.mappedEmployees?.filter(emp => emp.isPrimary).map(emp => emp.employeeMasterId) || [];
            setPrimaryEmployeeIds(primaryEmps);
          }
          fetchProjects();
          setModalMessage(null);
        }, 1500);
      }
    } catch (error) {
      setModalMessage({ type: 'error', text: error.message || 'Failed to unmap employees' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await projectService.deleteProject(projectId);
      if (response.success) {
        fetchProjects();
      }
    } catch (error) {
      alert('Failed to delete project: ' + (error.message || 'Unknown error'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Active': 'bg-success',
      'On Hold': 'bg-warning text-dark',
      'Completed': 'bg-info',
      'Cancelled': 'bg-danger'
    };
    return statusColors[status] || 'bg-secondary';
  };

  const hasSelectedMappedEmployees = () => {
    return selectedEmployeeIds.some(id => mappedEmployees.some(m => m.employeeMasterId === id));
  };

  const hasSelectedUnmappedEmployees = () => {
    return selectedEmployeeIds.some(id => !mappedEmployees.some(m => m.employeeMasterId === id));
  };

  const getMappedCount = () => {
    return selectedEmployeeIds.filter(id => mappedEmployees.some(m => m.employeeMasterId === id)).length;
  };

  const getUnmappedCount = () => {
    return selectedEmployeeIds.filter(id => !mappedEmployees.some(m => m.employeeMasterId === id)).length;
  };

  return (
    <div className="h-100 d-flex flex-column">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol 
          className="breadcrumb mb-0 p-3 rounded" 
          style={{
            backgroundColor: 'rgba(151, 36, 126, 0.05)',
            fontSize: '0.875rem'
          }}
        >
          <li className="breadcrumb-item">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); navigate('/hr/dashboard/projectmgmt'); }}
              style={{
                color: 'var(--color-primary-3)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Home size={14} />
              Dashboard
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <span style={{ color: 'var(--color-primary-1)', fontWeight: 600 }}>
              All Projects
            </span>
          </li>
        </ol>
      </nav>

      {/* Page Header with Resource Pool Button */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <button 
            className="btn btn-link text-decoration-none p-0" 
            onClick={() => navigate('/hr/dashboard/projectmgmt')}
          >
            <ArrowLeft size={24} />
          </button>
          <FolderKanban size={36} className="text-primary" />
          <div>
            <h2 className="mb-0 fw-bold">All Projects</h2>
            <p className="text-muted mb-0 small">View and manage all projects</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary d-flex align-items-center gap-2" 
            onClick={() => navigate('/hr/dashboard/projectmgmt/resourcepool')}
          >
            <Users size={20} />
            Resource Pool
          </button>
          <button 
            className="btn btn-primary d-flex align-items-center gap-2" 
            onClick={() => navigate('/hr/dashboard/projectmgmt/create')}
          >
            <Plus size={20} />
            Create Project
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white"><Search size={18} /></span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search projects..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white"><Filter size={18} /></span>
                <select 
                  className="form-select" 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="col-md-3 d-flex align-items-center justify-content-end">
              <span className="text-muted small"><strong>{filteredProjects.length}</strong> of <strong>{projects.length}</strong> projects</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="text-center">
            <div 
              className="spinner-border text-primary" 
              role="status" 
              style={{ width: '3rem', height: '3rem' }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3">Loading projects...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Projects Table */}
      {!isLoading && !error && (
        <>
          <div className="card border-0 shadow-sm flex-grow-1">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th className="px-4 py-3">Project Name</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Business Unit</th>
                      <th className="py-3">Department</th>
                      <th className="py-3">Start Date</th>
                      <th className="py-3">Resource Owner</th>
                      <th className="py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProjects.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5">
                          <div className="text-muted">
                            <FolderKanban size={64} className="mb-3 opacity-25" />
                            <p className="mb-0 fs-5">No projects found</p>
                            <p className="small">Try adjusting your search or filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedProjects.map((project) => (
                        <tr key={project.projectId}>
                          <td className="px-4 py-3">
                            <div>
                              <div 
                                className="fw-semibold text-primary" 
                                style={{ cursor: 'pointer' }} 
                                onClick={() => handleViewClick(project.projectId)}
                              >
                                {project.projectName}
                              </div>
                              <small className="text-muted">{project.engagementModel || 'N/A'}</small>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`badge ${getStatusBadge(project.status)}`}>
                              {project.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <Building size={16} className="text-muted" />
                              <span>{project.businessUnit || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <Briefcase size={16} className="text-muted" />
                              <span>{project.department || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <Calendar size={16} className="text-muted" />
                              <span>{formatDate(project.startDate)}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            {project.resourceOwner ? (
                              <div>
                                <div>{project.resourceOwner.firstName} {project.resourceOwner.lastName}</div>
                                <small className="text-muted">{project.resourceOwner.roleName}</small>
                              </div>
                            ) : (
                              <span className="text-muted fst-italic">Not Assigned</span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="d-flex gap-2 justify-content-center flex-wrap">
                              <button 
                                className="btn btn-sm btn-outline-primary" 
                                onClick={() => handleEditClick(project)} 
                                title="Edit Project"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-warning" 
                                onClick={() => handleManagerClick(project)} 
                                title="Edit Managers"
                              >
                                <UserCog size={16} />
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-info" 
                                onClick={() => handleEmployeeClick(project)} 
                                title="Map/Unmap Employees"
                              >
                                <Users size={16} />
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleDeleteProject(project.projectId)} 
                                title="Delete Project"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card border-0 shadow-sm mt-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length} entries
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(currentPage - 1)} 
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft size={16} />
                        </button>
                      </li>
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <li key={`ellipsis-${index}`} className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        ) : (
                          <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => goToPage(page)}>
                              {page}
                            </button>
                          </li>
                        )
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(currentPage + 1)} 
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </li>
                    </ul>
                  </nav>
                  <div className="text-muted small">Page {currentPage} of {totalPages}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <Edit size={24} />
                  Edit Project
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <form onSubmit={handleUpdateProject}>
                <div className="modal-body">
                  {modalMessage && (
                    <div className={`alert alert-${modalMessage.type === 'success' ? 'success' : 'danger'} d-flex align-items-center gap-2`}>
                      {modalMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                      <span>{modalMessage.text}</span>
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Project Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editFormData.projectName || ''} 
                        onChange={(e) => setEditFormData({ ...editFormData, projectName: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Status *</label>
                      <select 
                        className="form-select" 
                        value={editFormData.status || 'Active'} 
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })} 
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea 
                        className="form-control" 
                        rows="3" 
                        value={editFormData.description || ''} 
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      ></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Business Unit *</label>
                      <select 
                        className="form-select" 
                        value={editFormData.businessUnit || ''} 
                        onChange={(e) => setEditFormData({ ...editFormData, businessUnit: e.target.value })} 
                        required
                      >
                        <option value="">Select Business Unit</option>
                        {businessUnits.map((bu, idx) => (
                          <option key={idx} value={bu}>{bu}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department *</label>
                      <select 
                        className="form-select" 
                        value={editFormData.department || ''} 
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })} 
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.departmentId} value={dept.departmentName}>
                            {dept.departmentName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Engagement Model *</label>
                      <select 
                        className="form-select" 
                        value={editFormData.engagementModel || ''} 
                        onChange={(e) => setEditFormData({ ...editFormData, engagementModel: e.target.value })} 
                        required
                      >
                        <option value="">Select Model</option>
                        <option value="Fixed Price">Fixed Price</option>
                        <option value="Time and Materials">Time and Materials</option>
                        <option value="Agile - Scrum">Agile - Scrum</option>
                        <option value="Agile - Kanban">Agile - Kanban</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Retainer">Retainer</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Start Date *</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={editFormData.startDate || ''} 
                        onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">End Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={editFormData.endDate || ''} 
                        onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Updating...
                      </>
                    ) : (
                      'Update Project'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Managers Modal */}
      {showManagerModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <UserCog size={24} />
                  Edit Reporting Managers - {selectedProject?.projectName}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowManagerModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {modalMessage && (
                  <div className={`alert alert-${modalMessage.type === 'success' ? 'success' : 'danger'} d-flex align-items-center gap-2`}>
                    {modalMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{modalMessage.text}</span>
                  </div>
                )}

                {/* Manager Tabs */}
                <ul className="nav nav-tabs mb-3">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeManagerTab === 'resource' ? 'active' : ''}`} 
                      onClick={() => setActiveManagerTab('resource')}
                    >
                      Resource Owner {selectedResourceOwner && <span className="badge bg-success ms-2">Selected</span>}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeManagerTab === 'l1' ? 'active' : ''}`} 
                      onClick={() => setActiveManagerTab('l1')}
                    >
                      L1 Approver {selectedL1Approver && <span className="badge bg-success ms-2">Selected</span>}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeManagerTab === 'l2' ? 'active' : ''}`} 
                      onClick={() => setActiveManagerTab('l2')}
                    >
                      L2 Approver {selectedL2Approver && <span className="badge bg-success ms-2">Selected</span>}
                    </button>
                  </li>
                </ul>

                {/* Current Selection Display */}
                <div className="alert alert-info d-flex align-items-start gap-2 mb-3">
                  <Info size={18} className="flex-shrink-0 mt-1" />
                  <div>
                    <strong>Current Selection:</strong>
                    {activeManagerTab === 'resource' && (
                      <div className="mt-1">
                        {selectedResourceOwner ? (
                          <span className="badge bg-success">
                            {selectedResourceOwner.firstName} {selectedResourceOwner.lastName} - {selectedResourceOwner.roleName}
                          </span>
                        ) : (
                          <span className="text-muted">None selected</span>
                        )}
                      </div>
                    )}
                    {activeManagerTab === 'l1' && (
                      <div className="mt-1">
                        {selectedL1Approver ? (
                          <span className="badge bg-success">
                            {selectedL1Approver.firstName} {selectedL1Approver.lastName} - {selectedL1Approver.roleName}
                          </span>
                        ) : (
                          <span className="text-muted">None selected</span>
                        )}
                      </div>
                    )}
                    {activeManagerTab === 'l2' && (
                      <div className="mt-1">
                        {selectedL2Approver ? (
                          <span className="badge bg-success">
                            {selectedL2Approver.firstName} {selectedL2Approver.lastName} - {selectedL2Approver.roleName}
                          </span>
                        ) : (
                          <span className="text-muted">None selected</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text bg-white"><Search size={18} /></span>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search by name..." 
                        value={managerSearchTerm} 
                        onChange={(e) => setManagerSearchTerm(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <select 
                      className="form-select" 
                      value={managerFilterRole} 
                      onChange={(e) => setManagerFilterRole(e.target.value)}
                    >
                      <option value="All">All Roles</option>
                      {getUniqueManagerRoles().map((role, idx) => (
                        <option key={idx} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select 
                      className="form-select" 
                      value={managerFilterDepartment} 
                      onChange={(e) => setManagerFilterDepartment(e.target.value)}
                    >
                      <option value="All">All Departments</option>
                      {getUniqueManagerDepartments().map((dept, idx) => (
                        <option key={idx} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Manager List Table */}
                <div className="table-responsive" style={{ minHeight: '350px' }}>
                  <table className="table table-sm table-hover">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th style={{ width: '50px' }}>Select</th>
                        <th>Employee Name</th>
                        <th>Role</th>
                        <th>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedManagers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-muted">
                            No employees found
                          </td>
                        </tr>
                      ) : (
                        paginatedManagers.map((emp) => {
                          let isSelected = false;
                          if (activeManagerTab === 'resource') 
                            isSelected = selectedResourceOwner?.employeeMasterId === emp.employeeMasterId;
                          else if (activeManagerTab === 'l1') 
                            isSelected = selectedL1Approver?.employeeMasterId === emp.employeeMasterId;
                          else if (activeManagerTab === 'l2') 
                            isSelected = selectedL2Approver?.employeeMasterId === emp.employeeMasterId;

                          return (
                            <tr 
                              key={emp.employeeMasterId} 
                              className={isSelected ? 'table-active' : ''} 
                              style={{ cursor: 'pointer' }} 
                              onClick={() => handleManagerSelect(emp)}
                            >
                              <td onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="radio" 
                                  className="form-check-input" 
                                  name={`manager-${activeManagerTab}`}
                                  checked={isSelected} 
                                  onChange={() => handleManagerSelect(emp)}
                                />
                              </td>
                              <td>{emp.firstName} {emp.lastName}</td>
                              <td>{emp.roleName}</td>
                              <td>{emp.departmentName}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Manager Pagination */}
                {managerTotalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                    <div className="text-muted small">
                      Showing {managerStartIndex + 1} to {Math.min(managerEndIndex, filteredManagers.length)} of {filteredManagers.length} employees
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${managerCurrentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setManagerCurrentPage(managerCurrentPage - 1)} 
                            disabled={managerCurrentPage === 1}
                          >
                            <ChevronLeft size={14} />
                          </button>
                        </li>
                        {getManagerPageNumbers().map((page, index) => (
                          page === '...' ? (
                            <li key={`mgr-ellipsis-${index}`} className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          ) : (
                            <li key={`mgr-${page}`} className={`page-item ${managerCurrentPage === page ? 'active' : ''}`}>
                              <button className="page-link" onClick={() => goToManagerPage(page)}>
                                {page}
                              </button>
                            </li>
                          )
                        ))}
                        <li className={`page-item ${managerCurrentPage === managerTotalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setManagerCurrentPage(managerCurrentPage + 1)} 
                            disabled={managerCurrentPage === managerTotalPages}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </li>
                      </ul>
                    </nav>
                    <div className="text-muted small">
                      Page {managerCurrentPage} of {managerTotalPages}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowManagerModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleUpdateManagers} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Managers'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map/Unmap Employees Modal */}
      {showEmployeeModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <Users size={24} />
                  Map/Unmap Employees - {selectedProject?.projectName}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEmployeeModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {modalMessage && (
                  <div className={`alert alert-${modalMessage.type === 'success' ? 'success' : 'danger'} d-flex align-items-center gap-2`}>
                    {modalMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{modalMessage.text}</span>
                  </div>
                )}

                {getProjectManagerIds().length > 0 && (
                  <div className="alert alert-info d-flex align-items-start gap-2 mb-3">
                    <Info size={20} className="flex-shrink-0 mt-1" />
                    <div>
                      <strong>Note:</strong> The following employees are automatically associated with this project as managers:
                      <ul className="mb-0 mt-2">
                        {selectedProject.resourceOwner && (
                          <li>
                            <strong>Resource Owner:</strong> {selectedProject.resourceOwner.firstName} {selectedProject.resourceOwner.lastName}
                          </li>
                        )}
                        {selectedProject.l1Approver && (
                          <li>
                            <strong>L1 Approver:</strong> {selectedProject.l1Approver.firstName} {selectedProject.l1Approver.lastName}
                          </li>
                        )}
                        {selectedProject.l2Approver && (
                          <li>
                            <strong>L2 Approver:</strong> {selectedProject.l2Approver.firstName} {selectedProject.l2Approver.lastName}
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {isLoadingModalData ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-2 text-muted">Loading employees...</p>
                  </div>
                ) : (
                  <>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <div className="input-group">
                          <span className="input-group-text bg-white"><Search size={18} /></span>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search employees..." 
                            value={employeeSearchTerm} 
                            onChange={(e) => setEmployeeSearchTerm(e.target.value)} 
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <select 
                          className="form-select" 
                          value={employeeFilterRole} 
                          onChange={(e) => setEmployeeFilterRole(e.target.value)}
                        >
                          <option value="All">All Roles</option>
                          {getUniqueRoles().map((role, idx) => (
                            <option key={idx} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <select 
                          className="form-select" 
                          value={employeeFilterDepartment} 
                          onChange={(e) => setEmployeeFilterDepartment(e.target.value)}
                        >
                          <option value="All">All Departments</option>
                          {getUniqueDepartments().map((dept, idx) => (
                            <option key={idx} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <select 
                          className="form-select" 
                          value={employeeFilterStatus} 
                          onChange={(e) => setEmployeeFilterStatus(e.target.value)}
                        >
                          <option value="All">All Status</option>
                          <option value="Mapped">Mapped</option>
                          <option value="Unmapped">Unmapped</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <div>
                        <span className="badge bg-info me-2">{selectedEmployeeIds.length} Selected</span>
                        <span className="badge bg-success me-2">Mapped: {getMappedCount()}</span>
                        <span className="badge bg-warning text-dark">Unmapped: {getUnmappedCount()}</span>
                        {primaryEmployeeIds.length > 0 && (
                          <span className="badge bg-primary ms-2">{primaryEmployeeIds.length} Primary Set</span>
                        )}
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-secondary" 
                        onClick={handleSelectAllEmployees}
                      >
                        Select/Deselect All
                      </button>
                    </div>

                    <div className="alert alert-warning d-flex align-items-start gap-2 mb-3">
                      <Info size={18} className="flex-shrink-0 mt-1" />
                      <div>
                        <strong>Primary Project:</strong> You can select multiple employees and mark multiple as primary for this project. 
                        Employees must be selected first before marking as primary. Your backend will automatically manage conflicts.
                      </div>
                    </div>

                    {/* ✅ FIXED: Show ALL employees without pagination */}
                    <div className="table-responsive" style={{ minHeight: '350px', maxHeight: '600px', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover mb-0">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th style={{ width: '50px' }}>Select</th>
                            <th>Employee Name</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th style={{ width: '100px' }}>Status</th>
                            <th style={{ width: '120px' }}>Primary Project</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEmployees.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-4 text-muted">
                                No employees match the filters
                              </td>
                            </tr>
                          ) : (
                            // ✅ FIXED: Use filteredEmployees directly (ALL employees, not paginated)
                            filteredEmployees.map((emp) => {
                              const isMapped = mappedEmployees.some(m => m.employeeMasterId === emp.employeeMasterId);
                              const isSelected = selectedEmployeeIds.includes(emp.employeeMasterId);
                              const isPrimary = primaryEmployeeIds.includes(emp.employeeMasterId);
                              const currentlyMappedAsPrimary = mappedEmployees.find(m => m.employeeMasterId === emp.employeeMasterId)?.isPrimary;

                              return (
                                <tr key={emp.employeeMasterId} className={isSelected ? 'table-active' : ''}>
                                  <td onClick={(e) => e.stopPropagation()}>
                                    <input 
                                      type="checkbox" 
                                      className="form-check-input" 
                                      checked={isSelected} 
                                      onChange={() => handleEmployeeSelect(emp.employeeMasterId)} 
                                    />
                                  </td>
                                  <td>{emp.firstName} {emp.lastName}</td>
                                  <td>{emp.roleName}</td>
                                  <td>{emp.departmentName}</td>
                                  <td>
                                    {isMapped ? (
                                      <span className="badge bg-success">
                                        Mapped {currentlyMappedAsPrimary && '★'}
                                      </span>
                                    ) : (
                                      <span className="badge bg-secondary">Unmapped</span>
                                    )}
                                  </td>
                                  <td onClick={(e) => e.stopPropagation()}>
                                    <input 
                                      type="checkbox" 
                                      className="form-check-input" 
                                      checked={isPrimary}
                                      disabled={!isSelected}
                                      onChange={() => handlePrimaryToggle(emp.employeeMasterId)}
                                      title={!isSelected ? "Select employee first" : "Mark as primary"}
                                    />
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowEmployeeModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleMapEmployees} 
                  disabled={!hasSelectedUnmappedEmployees() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Mapping...
                    </>
                  ) : (
                    <>Map Selected ({getUnmappedCount()})</>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleUnmapEmployees} 
                  disabled={!hasSelectedMappedEmployees() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Unmapping...
                    </>
                  ) : (
                    <>Unmap Selected ({getMappedCount()})</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;

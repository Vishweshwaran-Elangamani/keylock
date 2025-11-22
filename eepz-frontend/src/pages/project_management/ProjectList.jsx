// src/pages/ProjectManagement/ProjectList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, ArrowLeft, Edit, Trash2, UserCog, Users, Search, Filter, Calendar, Building, Briefcase, AlertCircle, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { toast } from 'sonner';
import projectService from '../../services/project_management/projectService';
import '../../styles/projectmanagement/ProjectList.css'

// Import the separated modal components
import EditProjectModal from '../../components/project_management_components/modals/EditProjectModal'
import ManagerSelectionModal from '../../components/project_management_components/modals/ManagerSelectionModal'
import EmployeeMappingModal from '../../components/project_management_components/modals/EmployeeMappingModal'
import DeleteConfirmationModal from '../../components/project_management_components/modals/DeleteConfirmationModal'

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

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
      toast.error('Failed to load dropdown data');
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
        toast.error('Failed to load projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
      toast.error('Failed to load projects. Please try again.');
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

  const filteredEmployees = getFilteredEmployees();

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
        toast.success('Project updated successfully!');
        setTimeout(() => {
          setShowEditModal(false);
          fetchProjects();
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to update project';
      setModalMessage({ type: 'error', text: errorMessage });
      toast.error(errorMessage);
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
        toast.success('Reporting managers updated successfully!');
        setTimeout(() => {
          setShowManagerModal(false);
          fetchProjects();
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to update managers';
      setModalMessage({ type: 'error', text: errorMessage });
      toast.error(errorMessage);
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
      const errorMessage = 'Failed to load employee data';
      setModalMessage({ type: 'error', text: errorMessage });
      toast.error(errorMessage);
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
      const errorMessage = 'Please select the employee first before marking as primary';
      setModalMessage({ type: 'error', text: errorMessage });
      toast.warning(errorMessage);
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
    const visibleEmployees = filteredEmployees;
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
      const errorMessage = 'Please select at least one unmapped employee';
      setModalMessage({ type: 'error', text: errorMessage });
      toast.warning(errorMessage);
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

      const response = await projectService.mapEmployees(selectedProject.projectId, employeesWithPrimary);

      if (response.success) {
        const primaryCount = employeesWithPrimary.filter(e => e.isPrimary).length;
        const successMessage = `${employeesToMap.length} employee(s) mapped successfully! ${primaryCount > 0 ? `(${primaryCount} marked as primary)` : ''}`;
        setModalMessage({ type: 'success', text: successMessage });
        toast.success(successMessage);
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
      const errorMessage = error.message || 'Failed to map employees';
      setModalMessage({ type: 'error', text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnmapEmployees = async () => {
    const employeesToUnmap = selectedEmployeeIds.filter(id => 
      mappedEmployees.some(m => m.employeeMasterId === id)
    );

    if (employeesToUnmap.length === 0) {
      const errorMessage = 'Please select at least one mapped employee';
      setModalMessage({ type: 'error', text: errorMessage });
      toast.warning(errorMessage);
      setTimeout(() => setModalMessage(null), 3000);
      return;
    }

    setIsSubmitting(true);
    setModalMessage(null);

    try {
      const response = await projectService.unmapEmployees(selectedProject.projectId, employeesToUnmap);

      if (response.success) {
        const successMessage = `${employeesToUnmap.length} employee(s) unmapped successfully!`;
        setModalMessage({ type: 'success', text: successMessage });
        toast.success(successMessage);
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
      const errorMessage = error.message || 'Failed to unmap employees';
      setModalMessage({ type: 'error', text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeletingProject(true);
    try {
      const response = await projectService.deleteProject(projectToDelete.projectId);
      
      if (response.success) {
        toast.success('Project deleted successfully!');
        setShowDeleteModal(false);
        setProjectToDelete(null);
        fetchProjects();
      } else {
        // Handle error response from backend
        const errorMessage = response.message || 'Failed to delete project';
        toast.error(errorMessage, {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      
      // Check if error has the response structure from backend
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          'Failed to delete project. Please try again.';
      
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
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
          <div className="card border-0 shadow-sm flex-grow-1 table-card-rounded">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 custom-project-table">
                  <thead className="project-table-header">
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
                                onClick={() => handleDeleteClick(project)} 
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

      {/* Modals */}
      <EditProjectModal 
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleUpdateProject}
        isSubmitting={isSubmitting}
        message={modalMessage}
        departments={departments}
        businessUnits={businessUnits}
      />

      <ManagerSelectionModal 
        show={showManagerModal}
        onClose={() => setShowManagerModal(false)}
        project={selectedProject}
        selectedResourceOwner={selectedResourceOwner}
        selectedL1Approver={selectedL1Approver}
        selectedL2Approver={selectedL2Approver}
        onManagerSelect={handleManagerSelect}
        onUpdate={handleUpdateManagers}
        isSubmitting={isSubmitting}
        message={modalMessage}
        activeTab={activeManagerTab}
        setActiveTab={setActiveManagerTab}
        searchTerm={managerSearchTerm}
        setSearchTerm={setManagerSearchTerm}
        filterRole={managerFilterRole}
        setFilterRole={setManagerFilterRole}
        filterDepartment={managerFilterDepartment}
        setFilterDepartment={setManagerFilterDepartment}
        currentPage={managerCurrentPage}
        setCurrentPage={setManagerCurrentPage}
        paginatedManagers={paginatedManagers}
        totalPages={managerTotalPages}
        startIndex={managerStartIndex}
        endIndex={managerEndIndex}
        totalCount={filteredManagers.length}
        getPageNumbers={getManagerPageNumbers}
        goToPage={goToManagerPage}
        uniqueRoles={getUniqueManagerRoles()}
        uniqueDepartments={getUniqueManagerDepartments()}
      />

      <EmployeeMappingModal 
        show={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        project={selectedProject}
        filteredEmployees={filteredEmployees}
        mappedEmployees={mappedEmployees}
        selectedEmployeeIds={selectedEmployeeIds}
        primaryEmployeeIds={primaryEmployeeIds}
        onEmployeeSelect={handleEmployeeSelect}
        onPrimaryToggle={handlePrimaryToggle}
        onSelectAll={handleSelectAllEmployees}
        onMap={handleMapEmployees}   
        onUnmap={handleUnmapEmployees} 
        isSubmitting={isSubmitting}
        message={modalMessage}
        isLoadingData={isLoadingModalData}
        searchTerm={employeeSearchTerm}
        setSearchTerm={setEmployeeSearchTerm}
        filterRole={employeeFilterRole}
        setFilterRole={setEmployeeFilterRole}
        filterDepartment={employeeFilterDepartment}
        setFilterDepartment={setEmployeeFilterDepartment}
        filterStatus={employeeFilterStatus}
        setFilterStatus={setEmployeeFilterStatus}
        uniqueRoles={getUniqueRoles()}
        uniqueDepartments={getUniqueDepartments()}
        getMappedCount={getMappedCount}
        getUnmappedCount={getUnmappedCount}
        hasSelectedMapped={hasSelectedMappedEmployees}
        hasSelectedUnmapped={hasSelectedUnmappedEmployees}
      />

      <DeleteConfirmationModal 
        show={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        project={projectToDelete}
        isDeleting={isDeletingProject}
      />
    </div>
  );
};

export default ProjectList;
